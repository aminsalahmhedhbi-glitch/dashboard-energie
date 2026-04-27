from __future__ import annotations

import csv
import json
import logging
import re
from datetime import datetime
from pathlib import Path
from threading import Lock
from typing import Any

import pandas as pd

from .config import BASE_DIR, DATA_DIR

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
SITE_HISTORY_XLSX = DATA_DIR / "site_history.xlsx"

MAX_ENERGY_ROWS = 5000
TRIM_COUNT = 1000
DEFAULT_HISTORY_LIMIT = 20
DEFAULT_BILLING_LIMIT = 100

ALLOWED_COLLECTIONS = {"users", "air_logs", "site_history"}
JSON_COLLECTIONS = {name: COLLECTIONS_DIR / f"{name}.json" for name in ALLOWED_COLLECTIONS}
SITE_HISTORY_COLUMNS = [
    "historyId",
    "site",
    "year",
    "months",
    "temperature",
    "grid",
    "pvProd",
    "pvExport",
    "_createdAt",
]

BILLING_COLUMNS = [
    "id",
    "recordDate",
    "timestamp",
    "siteId",
    "siteName",
    "siteType",
    "date",
    "lastIndex",
    "newIndex",
    "lastIndexPv",
    "newIndexPv",
    "previousBalance",
    "cosPhi",
    "reactiveCons",
    "maxPower",
    "lateFees",
    "relanceFees",
    "adjustment",
    "type",
    "consumptionGrid",
    "productionPv",
    "currentMonthBalance",
    "prevBalance",
    "totalBalance",
    "billedKwh",
    "newCarryOver",
    "consoAmountHT",
    "fixedAmountHT",
    "totalTTC",
    "contributionCL",
    "fteElec",
    "fteGaz",
    "netToPay",
    "totalFinalTTC",
    "totalHT",
    "energyRecorded",
    "loadLosses",
    "baseEnergyAmountHT",
    "adjustmentRate",
    "adjustmentType",
    "cosPhiAdjustmentAmount",
    "total1_TTC",
    "total1_HT",
    "powerPremium",
    "total2_HT",
    "total2_TTC",
    "municipalTax",
    "powerOverrun",
    "powerOverrunAmount",
    "subPower",
    "_createdAt",
]

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
logger = logging.getLogger("energy-backend")


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
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        return data if isinstance(data, list) else []
    except Exception as exc:
        logger.exception("Failed to read collection %s: %s", name, exc)
        return []


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


def normalize_billing_row(data: dict[str, Any]) -> dict[str, Any]:
    row: dict[str, Any] = {col: None for col in BILLING_COLUMNS}
    row.update({k: sanitize_value(v) for k, v in data.items()})
    row["_createdAt"] = row.get("_createdAt") or now_iso()

    numeric_fields = {
        "siteId",
        "lastIndex",
        "newIndex",
        "lastIndexPv",
        "newIndexPv",
        "previousBalance",
        "cosPhi",
        "reactiveCons",
        "maxPower",
        "lateFees",
        "relanceFees",
        "adjustment",
        "consumptionGrid",
        "productionPv",
        "currentMonthBalance",
        "prevBalance",
        "totalBalance",
        "billedKwh",
        "newCarryOver",
        "consoAmountHT",
        "fixedAmountHT",
        "totalTTC",
        "contributionCL",
        "fteElec",
        "fteGaz",
        "netToPay",
        "totalFinalTTC",
        "totalHT",
        "energyRecorded",
        "loadLosses",
        "baseEnergyAmountHT",
        "adjustmentRate",
        "cosPhiAdjustmentAmount",
        "total1_TTC",
        "total1_HT",
        "powerPremium",
        "total2_HT",
        "total2_TTC",
        "municipalTax",
        "powerOverrun",
        "powerOverrunAmount",
        "subPower",
    }

    for field in numeric_fields:
        row[field] = safe_float(row.get(field))

    return {key: sanitize_value(value) for key, value in row.items()}


def read_billing_rows() -> list[dict[str, Any]]:
    if not BILLING_CSV.exists():
        return []

    with file_lock:
        df = pd.read_csv(BILLING_CSV, on_bad_lines="skip")

    if df.empty:
        return []

    return [sanitize_value(row) for row in df.to_dict(orient="records")]


def write_billing_rows(rows: list[dict[str, Any]]) -> None:
    BILLING_CSV.parent.mkdir(exist_ok=True)
    normalized_rows = [normalize_billing_row(row) for row in rows]
    normalized_rows.sort(
        key=lambda row: (
            str(row.get("recordDate") or row.get("date") or ""),
            str(row.get("timestamp") or row.get("_createdAt") or ""),
            str(row.get("id") or ""),
        ),
        reverse=True,
    )

    with file_lock:
        with BILLING_CSV.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=BILLING_COLUMNS, extrasaction="ignore")
            writer.writeheader()
            for row in normalized_rows:
                writer.writerow({column: sanitize_value(row.get(column)) for column in BILLING_COLUMNS})


def upsert_local_billing_row(data: dict[str, Any]) -> dict[str, Any]:
    normalized = normalize_billing_row(data)
    rows = read_billing_rows()
    by_id = {str(row.get("id") or ""): normalize_billing_row(row) for row in rows if row.get("id")}
    by_id[str(normalized.get("id") or "")] = normalized
    write_billing_rows(list(by_id.values()))
    return normalized


def delete_local_billing_row(item_id: str) -> bool:
    rows = read_billing_rows()
    kept_rows = [row for row in rows if str(row.get("id") or "") != str(item_id)]
    if len(kept_rows) == len(rows):
        return False
    write_billing_rows(kept_rows)
    return True


def serialize_excel_cell(value: Any) -> Any:
    if isinstance(value, (list, dict)):
        return json.dumps(value, ensure_ascii=False)
    return sanitize_value(value)


def deserialize_excel_cell(value: Any) -> Any:
    if value in (None, "", "null"):
        return None
    if isinstance(value, str):
        stripped = value.strip()
        if (stripped.startswith("[") and stripped.endswith("]")) or (
            stripped.startswith("{") and stripped.endswith("}")
        ):
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
        pd.DataFrame(columns=SITE_HISTORY_COLUMNS).to_excel(
            writer,
            index=False,
            sheet_name="README",
        )


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

    rows.sort(key=lambda row: str(row.get("_createdAt") or row.get("historyId") or ""), reverse=True)
    return rows


def normalize_month_array(value: Any) -> list[Any]:
    parsed = deserialize_excel_cell(value)
    if isinstance(parsed, list):
        items = list(parsed[:12])
        if len(items) < 12:
            items.extend([""] * (12 - len(items)))
        return items
    return [""] * 12


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
        "showroom chargueia": "CHARGUEYAA",
        "charguia": "CHARGUEYAA",
        "chargueya": "CHARGUEYAA",
        "chargueyaa": "CHARGUEYAA",
        "chagueya": "CHARGUEYAA",
    }
    for key, value in fallback_map.items():
        if key in site_name:
            return value
    return None


def iter_legacy_pac_measurements() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for site_code in PAC_SITES:
        df = read_energy_csv(site_code)
        if df is None:
            continue
        for row in df.to_dict(orient="records"):
            payload = sanitize_value(row)
            payload["site"] = site_code
            rows.append(payload)
    return rows
