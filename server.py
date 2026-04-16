from __future__ import annotations

import csv
import json
import logging
import os
import re
from datetime import datetime
from pathlib import Path
from threading import Lock
from typing import Any

import pandas as pd
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

FRONTEND_CANDIDATES = [
    BASE_DIR / "dist",
    Path.cwd() / "dist",
    BASE_DIR.parent / "dist",
]

FRONTEND_DIST = next(
    (p for p in FRONTEND_CANDIDATES if (p / "index.html").exists()),
    FRONTEND_CANDIDATES[0],
)

LEGACY_ENERGY_CSV = BASE_DIR / "energy_monitoring_detailed.csv"
if not LEGACY_ENERGY_CSV.exists():
    LEGACY_ENERGY_CSV = DATA_DIR / "energy_monitoring_detailed.csv"

PAC_SITES = {
    "MEGRINE": {
        "ip": "172.16.1.2",
        "files": [BASE_DIR / "energy_MEGRINE.csv", DATA_DIR / "energy_MEGRINE.csv", LEGACY_ENERGY_CSV],
    },
    "ELKHADHRA": {
        "ip": "172.22.0.140",
        "files": [BASE_DIR / "energy_ELKHADHRA.csv", DATA_DIR / "energy_ELKHADHRA.csv"],
    },
    "NAASSEN": {
        "ip": "172.19.0.140",
        "files": [BASE_DIR / "energy_NAASSEN.csv", DATA_DIR / "energy_NAASSEN.csv"],
    },
}

BILLING_CSV = DATA_DIR / "billing_data.csv"
COLLECTIONS_DIR = DATA_DIR / "collections"
COLLECTIONS_DIR.mkdir(exist_ok=True)

MAX_ENERGY_ROWS = 5000
TRIM_COUNT = 1000
DEFAULT_HISTORY_LIMIT = 20
DEFAULT_BILLING_LIMIT = 100

ALLOWED_COLLECTIONS = {"users", "air_logs", "site_history"}
JSON_COLLECTIONS = {name: COLLECTIONS_DIR / f"{name}.json" for name in ALLOWED_COLLECTIONS}
SITE_HISTORY_XLSX = DATA_DIR / "site_history.xlsx"
SITE_HISTORY_COLUMNS = ["historyId", "site", "year", "months", "temperature", "grid", "pvProd", "pvExport", "_createdAt"]

BILLING_SITE_HISTORY_KEYS = {
    "1": "MEGRINE",
    "2": "ELKHADHRA",
    "3": "NAASSEN",
    "4": "LAC",
    "5": "AZUR",
    "6": "CARTHAGE",
    "7": "CHARGUEYAA",
}

file_lock = Lock()
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("energy-backend")


def resolve_cors_origins() -> list[str]:
    origins = {
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
    }

    env_values = [
        os.getenv("FRONTEND_ORIGIN", ""),
        os.getenv("FRONTEND_URL", ""),
        os.getenv("RENDER_EXTERNAL_URL", ""),
    ]

    vercel_url = os.getenv("VERCEL_URL", "").strip()
    if vercel_url:
        env_values.extend([f"https://{vercel_url}", f"http://{vercel_url}"])

    for raw_value in env_values:
        if not raw_value:
            continue
        for item in str(raw_value).split(","):
            origin = item.strip().rstrip("/")
            if origin:
                origins.add(origin)

    return sorted(origins)


def json_response(payload: Any, status: int = 200):
    return jsonify(payload), status


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def safe_float(value: Any) -> Any:
    if value in (None, "", "null"):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return value


def sanitize_value(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: sanitize_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [sanitize_value(v) for v in value]
    if pd.isna(value):
        return None
    if isinstance(value, (pd.Timestamp, datetime)):
        return value.isoformat()
    return value


def read_json_collection(name: str) -> list[dict[str, Any]]:
    path = JSON_COLLECTIONS[name]
    if not path.exists():
        return []

    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except Exception as exc:
        logger.exception("Failed to read collection %s: %s", name, exc)
        return []


def write_json_collection(name: str, rows: list[dict[str, Any]]) -> None:
    path = JSON_COLLECTIONS[name]
    with path.open("w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)


def get_site_key(site: str | None) -> str:
    key = str(site or "MEGRINE").strip().upper()
    return key if key in PAC_SITES else "MEGRINE"


def get_energy_csv_path(site: str | None = None) -> Path | None:
    site_key = get_site_key(site)
    for candidate in PAC_SITES[site_key]["files"]:
        if candidate.exists():
            return candidate
    return PAC_SITES[site_key]["files"][0]


def trim_energy_csv_if_needed(site: str | None = None) -> None:
    csv_path = get_energy_csv_path(site)
    if not csv_path or not csv_path.exists():
        return

    df = pd.read_csv(csv_path, on_bad_lines="skip")
    if len(df) >= MAX_ENERGY_ROWS:
        df = df.iloc[TRIM_COUNT:]
        df.to_csv(csv_path, index=False)
        logger.info("Energy CSV trimmed for %s from %s rows", get_site_key(site), len(df) + TRIM_COUNT)


def read_energy_csv(site: str | None = None) -> pd.DataFrame | None:
    csv_path = get_energy_csv_path(site)
    if not csv_path or not csv_path.exists():
        return None

    with file_lock:
        trim_energy_csv_if_needed(site)
        df = pd.read_csv(csv_path, on_bad_lines="skip")

    if df.empty:
        return None

    expected_cols = [
        "Timestamp",
        "P_SUM_kW",
        "Q_SUM_kvar",
        "S_SUM_kVA",
        "PF_SUM",
        "V_AVG_V",
        "I_AVG_A",
        "FREQ_Hz",
    ]

    for col in expected_cols:
        if col not in df.columns:
            df[col] = None

    return df


def validate_billing_payload(data: dict[str, Any]) -> tuple[bool, str | None]:
    required = ["id", "recordDate", "siteId", "siteName", "siteType", "newIndex"]
    for field in required:
        if field not in data:
            return False, f"Champ obligatoire manquant: {field}"
    return True, None


BILLING_COLUMNS = [
    "id", "recordDate", "timestamp", "siteId", "siteName", "siteType", "date",
    "lastIndex", "newIndex", "lastIndexPv", "newIndexPv", "previousBalance",
    "cosPhi", "reactiveCons", "maxPower", "lateFees", "relanceFees", "adjustment",
    "type", "consumptionGrid", "productionPv", "currentMonthBalance", "prevBalance",
    "totalBalance", "billedKwh", "newCarryOver", "consoAmountHT", "fixedAmountHT",
    "totalTTC", "contributionCL", "fteElec", "fteGaz", "netToPay", "totalFinalTTC",
    "totalHT", "energyRecorded", "loadLosses", "baseEnergyAmountHT", "adjustmentRate",
    "adjustmentType", "cosPhiAdjustmentAmount", "total1_TTC", "total1_HT",
    "powerPremium", "total2_HT", "total2_TTC", "municipalTax", "powerOverrun",
    "powerOverrunAmount", "subPower", "_createdAt",
]


def normalize_billing_row(data: dict[str, Any]) -> dict[str, Any]:
    row: dict[str, Any] = {col: None for col in BILLING_COLUMNS}
    row.update({k: sanitize_value(v) for k, v in data.items()})
    row["_createdAt"] = now_iso()

    numeric_fields = {
        "siteId", "lastIndex", "newIndex", "lastIndexPv", "newIndexPv", "previousBalance",
        "cosPhi", "reactiveCons", "maxPower", "lateFees", "relanceFees", "adjustment",
        "consumptionGrid", "productionPv", "currentMonthBalance", "prevBalance", "totalBalance",
        "billedKwh", "newCarryOver", "consoAmountHT", "fixedAmountHT", "totalTTC",
        "contributionCL", "fteElec", "fteGaz", "netToPay", "totalFinalTTC", "totalHT",
        "energyRecorded", "loadLosses", "baseEnergyAmountHT", "adjustmentRate",
        "cosPhiAdjustmentAmount", "total1_TTC", "total1_HT", "powerPremium", "total2_HT",
        "total2_TTC", "municipalTax", "powerOverrun", "powerOverrunAmount", "subPower"
    }
    for field in numeric_fields:
        row[field] = safe_float(row.get(field))

    return {k: sanitize_value(v) for k, v in row.items()}


def append_billing_row(row: dict[str, Any]) -> None:
    BILLING_CSV.parent.mkdir(exist_ok=True)
    file_exists = BILLING_CSV.exists()

    with file_lock, BILLING_CSV.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=BILLING_COLUMNS, extrasaction="ignore")
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)


def read_billing_rows() -> list[dict[str, Any]]:
    if not BILLING_CSV.exists():
        return []

    with file_lock:
        df = pd.read_csv(BILLING_CSV, on_bad_lines="skip")

    if df.empty:
        return []

    rows = df.to_dict(orient="records")
    return [sanitize_value(row) for row in rows]


def serialize_excel_cell(value: Any) -> Any:
    if isinstance(value, (list, dict)):
        return json.dumps(value, ensure_ascii=False)
    return sanitize_value(value)


def deserialize_excel_cell(value: Any) -> Any:
    if value in (None, "", "null"):
        return None
    if isinstance(value, str):
        stripped = value.strip()
        if (stripped.startswith("[") and stripped.endswith("]")) or (stripped.startswith("{") and stripped.endswith("}")):
            try:
                return json.loads(stripped)
            except Exception:
                return value
    return sanitize_value(value)


def ensure_site_history_workbook() -> None:
    SITE_HISTORY_XLSX.parent.mkdir(exist_ok=True)
    if SITE_HISTORY_XLSX.exists():
        return

    with pd.ExcelWriter(SITE_HISTORY_XLSX, engine="openpyxl") as writer:
        pd.DataFrame(columns=SITE_HISTORY_COLUMNS).to_excel(writer, index=False, sheet_name="README")


def read_site_history_excel() -> list[dict[str, Any]]:
    ensure_site_history_workbook()
    rows: list[dict[str, Any]] = []

    try:
        with file_lock:
            workbook = pd.read_excel(SITE_HISTORY_XLSX, sheet_name=None, engine="openpyxl")
    except Exception as exc:
        logger.exception("Failed to read site history workbook: %s", exc)
        return []

    for sheet_name, df in workbook.items():
        if sheet_name == "README" or df is None or df.empty:
            continue

        for _, row in df.iterrows():
            item = {}
            for col in SITE_HISTORY_COLUMNS:
                item[col] = deserialize_excel_cell(row[col]) if col in df.columns else None

            item.setdefault("site", sheet_name)
            if not item.get("historyId") and item.get("site") and item.get("year") is not None:
                item["historyId"] = f"{item['site']}_{item['year']}"
            rows.append(sanitize_value(item))

    rows.sort(key=lambda r: str(r.get("_createdAt") or r.get("historyId") or ""), reverse=True)
    return rows



def get_site_history_key_from_billing(row: dict[str, Any]) -> str | None:
    site_id = str(row.get("siteId") or "").strip()
    if site_id in BILLING_SITE_HISTORY_KEYS:
        return BILLING_SITE_HISTORY_KEYS[site_id]

    site_name = str(row.get("siteName") or "").strip().lower()
    fallback_map = {
        "mégrine": "MEGRINE",
        "megrine": "MEGRINE",
        "el khadhra": "ELKHADHRA",
        "naassen": "NAASSEN",
        "showroom lac": "LAC",
        "lac": "LAC",
        "azur city": "AZUR",
        "avenue de carthage": "CARTHAGE",
        "rue de carthage": "CARTHAGE",
        "showroom charguia": "CHARGUEYAA",
        "charguia": "CHARGUEYAA",
        "chargueyaa": "CHARGUEYAA",
    }
    for key, value in fallback_map.items():
        if key in site_name:
            return value
    return None


def normalize_month_array(value: Any) -> list[Any]:
    parsed = deserialize_excel_cell(value)
    if isinstance(parsed, list):
        items = list(parsed[:12])
        if len(items) < 12:
            items.extend([""] * (12 - len(items)))
        return items
    return [""] * 12


def sync_site_history_from_billing(row: dict[str, Any]) -> dict[str, Any] | None:
    site_key = get_site_history_key_from_billing(row)
    record_date = str(row.get("recordDate") or "").strip()

    if not site_key or not re.match(r"^\d{4}-\d{2}$", record_date):
        return None

    year_str, month_str = record_date.split("-")
    month_idx = max(0, min(11, int(month_str) - 1))

    consumption = row.get("billedKwh")
    if consumption in (None, ""):
        consumption = row.get("consumptionGrid")
    if consumption in (None, ""):
        consumption = row.get("energyRecorded")
    consumption_value = safe_float(consumption)
    if consumption_value in (None, ""):
        return None

    history_id = f"{site_key}_{year_str}"
    existing_rows = read_site_history_excel()
    existing_item = next((r for r in existing_rows if str(r.get("historyId")) == history_id), None)

    if existing_item is None:
        existing_item = {
            "historyId": history_id,
            "site": site_key,
            "year": year_str,
            "months": [""] * 12,
            "temperature": [""] * 12,
            "grid": [""] * 12,
            "pvProd": [""] * 12,
            "pvExport": [""] * 12,
        }

    if site_key == "LAC":
        series = normalize_month_array(existing_item.get("grid"))
        series[month_idx] = consumption_value
        existing_item["grid"] = series
    else:
        series = normalize_month_array(existing_item.get("months"))
        series[month_idx] = consumption_value
        existing_item["months"] = series

    return upsert_site_history_excel(existing_item)


def upsert_site_history_excel(data: dict[str, Any]) -> dict[str, Any]:
    ensure_site_history_workbook()

    item = {k: sanitize_value(v) for k, v in data.items()}
    history_id = str(item.get("historyId", "")).strip()
    if not history_id or "_" not in history_id:
        raise ValueError("historyId invalide. Format attendu: SITE_ANNEE")

    site, year = history_id.split("_", 1)
    item["site"] = site
    item["year"] = year
    item["_createdAt"] = now_iso()

    with file_lock:
        try:
            workbook = pd.read_excel(SITE_HISTORY_XLSX, sheet_name=None, engine="openpyxl")
        except Exception:
            workbook = {}

        existing_df = workbook.get(site)
        if existing_df is None or existing_df.empty:
            existing_df = pd.DataFrame(columns=SITE_HISTORY_COLUMNS)

        for col in SITE_HISTORY_COLUMNS:
            if col not in existing_df.columns:
                existing_df[col] = None

        row_dict = {col: serialize_excel_cell(item.get(col)) for col in SITE_HISTORY_COLUMNS}

        if "historyId" in existing_df.columns and existing_df["historyId"].astype(str).eq(history_id).any():
            idx = existing_df.index[existing_df["historyId"].astype(str) == history_id][0]
            for col, value in row_dict.items():
                existing_df.at[idx, col] = value
        else:
            existing_df = pd.concat([existing_df, pd.DataFrame([row_dict])], ignore_index=True)

        workbook[site] = existing_df[SITE_HISTORY_COLUMNS]

        with pd.ExcelWriter(SITE_HISTORY_XLSX, engine="openpyxl") as writer:
            pd.DataFrame(columns=SITE_HISTORY_COLUMNS).to_excel(writer, index=False, sheet_name="README")
            for sheet, df in workbook.items():
                if sheet == "README":
                    continue
                clean_df = df if isinstance(df, pd.DataFrame) else pd.DataFrame(df)
                for col in SITE_HISTORY_COLUMNS:
                    if col not in clean_df.columns:
                        clean_df[col] = None
                clean_df[SITE_HISTORY_COLUMNS].to_excel(writer, index=False, sheet_name=str(sheet)[:31])

    return item


def delete_site_history_excel(item_id: str) -> bool:
    ensure_site_history_workbook()

    with file_lock:
        try:
            workbook = pd.read_excel(SITE_HISTORY_XLSX, sheet_name=None, engine="openpyxl")
        except Exception:
            return False

        changed = False
        new_workbook = {"README": pd.DataFrame(columns=SITE_HISTORY_COLUMNS)}

        for sheet, df in workbook.items():
            if sheet == "README":
                continue
            if df is None or df.empty:
                continue

            if "historyId" not in df.columns:
                new_workbook[sheet] = df
                continue

            filtered = df[df["historyId"].astype(str) != str(item_id)].copy()
            if len(filtered) != len(df):
                changed = True

            if not filtered.empty:
                for col in SITE_HISTORY_COLUMNS:
                    if col not in filtered.columns:
                        filtered[col] = None
                new_workbook[sheet] = filtered[SITE_HISTORY_COLUMNS]

        if not changed:
            return False

        with pd.ExcelWriter(SITE_HISTORY_XLSX, engine="openpyxl") as writer:
            for sheet, df in new_workbook.items():
                df.to_excel(writer, index=False, sheet_name=str(sheet)[:31])

    return True


def create_app() -> Flask:
    app = Flask(__name__, static_folder=str(FRONTEND_DIST), static_url_path="")
    cors_origins = resolve_cors_origins()
    CORS(app, resources={r"/api/*": {"origins": cors_origins}})

    logger.info("Backend base directory: %s", BASE_DIR)
    logger.info("Frontend dist directory: %s", FRONTEND_DIST)
    logger.info("Frontend build detected: %s", (FRONTEND_DIST / "index.html").exists())
    logger.info("Allowed CORS origins: %s", ", ".join(cors_origins))

    @app.get("/api/health")
    def health():
        return json_response(
            {
                "status": "ok",
                "service": "energy-dashboard-backend",
                "time": now_iso(),
                "energy_files": {site: str(get_energy_csv_path(site)) for site in PAC_SITES},
                "pac_sites": PAC_SITES,
                "billing_file": str(BILLING_CSV),
                "frontend_dist": str(FRONTEND_DIST),
                "index_exists": (FRONTEND_DIST / "index.html").exists(),
            }
        )

    @app.get("/api/energy")
    def get_live_energy():
        site = get_site_key(request.args.get("site", "MEGRINE"))
        df = read_energy_csv(site)
        if df is None:
            return json_response({"error": f"Aucune donnée énergétique disponible pour {site}"}, 404)
        last = sanitize_value(df.iloc[-1].to_dict())
        last["site"] = site
        last["source_file"] = str(get_energy_csv_path(site))
        return json_response(last)

    @app.get("/api/history")
    def get_energy_history():
        site = get_site_key(request.args.get("site", "MEGRINE"))
        limit = request.args.get("limit", default=DEFAULT_HISTORY_LIMIT, type=int)
        limit = max(1, min(limit, 1000))
        df = read_energy_csv(site)
        if df is None:
            return json_response([])
        rows = [sanitize_value(r) for r in df.tail(limit).to_dict(orient="records")]
        for row in rows:
            row["site"] = site
        return json_response(rows)

    @app.post("/api/save-billing")
    def save_billing():
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return json_response({"error": "Payload JSON invalide"}, 400)

        is_valid, error_message = validate_billing_payload(data)
        if not is_valid:
            return json_response({"error": error_message}, 400)

        row = normalize_billing_row(data)
        append_billing_row(row)

        synced_history = None
        try:
            synced_history = sync_site_history_from_billing(row)
        except Exception as exc:
            logger.exception("Failed to sync site_history from billing: %s", exc)

        logger.info("Billing row saved for site %s (%s)", row.get("siteName"), row.get("recordDate"))
        return json_response({
            "message": "Relevé de facturation enregistré",
            "saved": row,
            "siteHistorySync": synced_history
        }, 201)

    @app.get("/api/billing-history")
    def billing_history():
        limit = request.args.get("limit", default=DEFAULT_BILLING_LIMIT, type=int)
        site_id = request.args.get("siteId")
        site_type = request.args.get("siteType")
        record_date = request.args.get("recordDate")

        rows = read_billing_rows()
        if site_id is not None:
            rows = [r for r in rows if str(r.get("siteId")) == str(site_id)]
        if site_type:
            rows = [r for r in rows if str(r.get("siteType")) == site_type]
        if record_date:
            rows = [r for r in rows if str(r.get("recordDate")) == record_date]

        rows.sort(key=lambda r: (str(r.get("recordDate") or ""), str(r.get("id") or "")), reverse=True)
        return json_response(rows[: max(1, min(limit, 1000))])

    @app.delete("/api/billing/<item_id>")
    def delete_billing(item_id: str):
        rows = read_billing_rows()
        if not rows:
            return json_response({"error": "Aucune facture disponible"}, 404)

        remaining = [r for r in rows if str(r.get("id")) != item_id]
        if len(remaining) == len(rows):
            return json_response({"error": "Facture introuvable"}, 404)

        BILLING_CSV.parent.mkdir(exist_ok=True)
        with file_lock, BILLING_CSV.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=BILLING_COLUMNS, extrasaction="ignore")
            writer.writeheader()
            for row in remaining:
                writer.writerow({k: row.get(k) for k in BILLING_COLUMNS})

        return json_response({"message": "Facture supprimée"})

    @app.get("/api/data/<collection>")
    def get_collection(collection: str):
        if collection not in ALLOWED_COLLECTIONS:
            return json_response({"error": f"Collection non autorisée: {collection}"}, 404)

        if collection == "site_history":
            rows = read_site_history_excel()
            return json_response(rows)

        rows = read_json_collection(collection)
        rows.sort(key=lambda r: str(r.get("_createdAt") or r.get("id") or ""), reverse=True)
        return json_response(rows)

    @app.post("/api/data/<collection>")
    def save_collection_item(collection: str):
        if collection not in ALLOWED_COLLECTIONS:
            return json_response({"error": f"Collection non autorisée: {collection}"}, 404)

        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return json_response({"error": "Payload JSON invalide"}, 400)

        if collection == "site_history":
            try:
                item = upsert_site_history_excel(data)
            except ValueError as exc:
                return json_response({"error": str(exc)}, 400)
            except Exception as exc:
                logger.exception("Failed to save site_history to Excel: %s", exc)
                return json_response({"error": "Erreur enregistrement Excel"}, 500)

            logger.info("Item saved to Excel workbook for site_history: %s", item.get("historyId"))
            return json_response({"message": "Enregistré dans Excel", "saved": item}, 201)

        item = {k: sanitize_value(v) for k, v in data.items()}
        item.setdefault("id", int(datetime.now().timestamp() * 1000))
        item["_createdAt"] = now_iso()

        with file_lock:
            rows = read_json_collection(collection)
            rows.append(item)
            write_json_collection(collection, rows)

        logger.info("Item saved to collection %s", collection)
        return json_response({"message": "Enregistré", "saved": item}, 201)

    @app.delete("/api/data/<collection>/<item_id>")
    def delete_collection_item(collection: str, item_id: str):
        if collection not in ALLOWED_COLLECTIONS:
            return json_response({"error": f"Collection non autorisée: {collection}"}, 404)

        if collection == "site_history":
            deleted = delete_site_history_excel(item_id)
            if not deleted:
                return json_response({"error": "Élément introuvable"}, 404)
            return json_response({"message": "Supprimé dans Excel"})

        with file_lock:
            rows = read_json_collection(collection)
            initial_count = len(rows)
            rows = [r for r in rows if str(r.get("id")) != item_id]
            if len(rows) == initial_count:
                return json_response({"error": "Élément introuvable"}, 404)
            write_json_collection(collection, rows)

        return json_response({"message": "Supprimé"})

    @app.post("/api/auth/login")
    def login():
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return json_response({"error": "Payload JSON invalide"}, 400)

        username = str(data.get("username", "")).strip()
        password = str(data.get("password", "")).strip()
        users = read_json_collection("users")
        found = next((u for u in users if u.get("username") == username and u.get("password") == password), None)
        if not found:
            return json_response({"error": "Utilisateur inconnu ou mot de passe incorrect"}, 401)

        return json_response({"user": {k: v for k, v in found.items() if k != "password"}})

    @app.get("/")
    def serve_index():
        index_file = FRONTEND_DIST / "index.html"
        if not index_file.exists():
            return json_response(
                {
                    "status": "ok",
                    "service": "energy-dashboard-backend",
                    "message": "Frontend dist absent sur ce service. Deployez le frontend sur Vercel.",
                    "health": "/api/health",
                }
            )
        return send_from_directory(str(FRONTEND_DIST), "index.html")

    @app.get("/<path:path>")
    def serve_frontend(path: str):
        if path.startswith("api/"):
            return json_response({"error": "Route introuvable"}, 404)

        requested = FRONTEND_DIST / path
        if requested.exists() and requested.is_file():
            return send_from_directory(str(FRONTEND_DIST), path)

        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return send_from_directory(str(FRONTEND_DIST), "index.html")

        return json_response({"error": "Route introuvable"}, 404)

    @app.errorhandler(404)
    def not_found(_):
        return json_response({"error": "Route introuvable"}, 404)

    @app.errorhandler(500)
    def internal_error(error):
        logger.exception("Unhandled server error: %s", error)
        return json_response({"error": "Erreur interne du serveur"}, 500)

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "1").strip().lower() in {"1", "true", "yes", "on"}
    app.run(host="0.0.0.0", port=port, debug=debug)
