from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

# Le script cherche d'abord dans le dossier courant, puis dans /data
BILLING_CANDIDATES = [
    BASE_DIR / "billing_data.csv",
    DATA_DIR / "billing_data.csv",
]
SITE_HISTORY_CANDIDATES = [
    BASE_DIR / "site_history.xlsx",
    DATA_DIR / "site_history.xlsx",
]

BILLING_FILE = next((p for p in BILLING_CANDIDATES if p.exists()), BILLING_CANDIDATES[0])
SITE_HISTORY_FILE = next((p for p in SITE_HISTORY_CANDIDATES if p.exists()), SITE_HISTORY_CANDIDATES[0])

SITE_MAP = {
    1: "MEGRINE",
    2: "ELKHADHRA",
    3: "NAASSEN",
    4: "LAC",
    5: "AZUR",
    6: "CARTHAGE",
    7: "CHARGUEYAA",
}

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

YEARS_TO_KEEP = ["REF", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"]


def parse_list_cell(value):
    if isinstance(value, list):
        data = value[:12]
    elif isinstance(value, str) and value.strip():
        try:
            parsed = json.loads(value)
            data = parsed if isinstance(parsed, list) else []
        except Exception:
            data = []
    else:
        data = []

    data = list(data[:12])
    if len(data) < 12:
        data.extend([""] * (12 - len(data)))
    return data


def serialize_list_cell(value):
    return json.dumps(parse_list_cell(value), ensure_ascii=False)


def load_billing():
    if not BILLING_FILE.exists():
        raise FileNotFoundError(f"billing_data.csv introuvable: {BILLING_FILE}")
    df = pd.read_csv(BILLING_FILE)
    return df


def load_existing_workbook():
    if not SITE_HISTORY_FILE.exists():
        return {}

    workbook = pd.read_excel(SITE_HISTORY_FILE, sheet_name=None, engine="openpyxl")
    clean_workbook = {}

    for sheet_name, df in workbook.items():
        if df is None:
            continue
        if sheet_name == "README":
            clean_workbook[sheet_name] = pd.DataFrame(columns=SITE_HISTORY_COLUMNS)
            continue

        for col in SITE_HISTORY_COLUMNS:
            if col not in df.columns:
                df[col] = None

        clean_workbook[sheet_name] = df[SITE_HISTORY_COLUMNS].copy()

    return clean_workbook


def ensure_row(df: pd.DataFrame, site_key: str, year: str) -> pd.DataFrame:
    history_id = f"{site_key}_{year}"
    if "historyId" in df.columns and df["historyId"].astype(str).eq(history_id).any():
        return df

    row = {
        "historyId": history_id,
        "site": site_key,
        "year": year,
        "months": serialize_list_cell([""] * 12),
        "temperature": serialize_list_cell([""] * 12),
        "grid": serialize_list_cell([""] * 12),
        "pvProd": serialize_list_cell([""] * 12),
        "pvExport": serialize_list_cell([""] * 12),
        "_createdAt": pd.Timestamp.now().isoformat(timespec="seconds"),
    }
    return pd.concat([df, pd.DataFrame([row])], ignore_index=True)


def update_from_billing(df_billing: pd.DataFrame, workbook: dict):
    if "README" not in workbook:
        workbook["README"] = pd.DataFrame(columns=SITE_HISTORY_COLUMNS)

    for site_key in set(SITE_MAP.values()):
        site_df = workbook.get(site_key, pd.DataFrame(columns=SITE_HISTORY_COLUMNS)).copy()

        for col in SITE_HISTORY_COLUMNS:
            if col not in site_df.columns:
                site_df[col] = None

        for year in YEARS_TO_KEEP:
            if year != "REF":
                site_df = ensure_row(site_df, site_key, str(year))

        workbook[site_key] = site_df[SITE_HISTORY_COLUMNS]

    updated_count = 0

    for _, row in df_billing.iterrows():
        site_id_raw = row.get("siteId")
        record_date = str(row.get("recordDate") or "").strip()

        if pd.isna(site_id_raw) or not record_date or len(record_date) < 7:
            continue

        try:
            site_id = int(float(site_id_raw))
        except Exception:
            continue

        site_key = SITE_MAP.get(site_id)
        if not site_key:
            continue

        year, month = record_date.split("-")[:2]
        if not year.isdigit() or not month.isdigit():
            continue

        month_idx = int(month) - 1
        if month_idx < 0 or month_idx > 11:
            continue

        conso = row.get("billedKwh")
        if pd.isna(conso):
            conso = row.get("consumptionGrid")
        if pd.isna(conso):
            conso = row.get("energyRecorded")
        if pd.isna(conso):
            continue

        try:
            conso_value = float(conso)
        except Exception:
            continue

        site_df = workbook[site_key]
        history_id = f"{site_key}_{year}"
        mask = site_df["historyId"].astype(str) == history_id
        if not mask.any():
            site_df = ensure_row(site_df, site_key, str(year))
            mask = site_df["historyId"].astype(str) == history_id

        idx = site_df.index[mask][0]

        if site_key == "LAC":
            arr = parse_list_cell(site_df.at[idx, "grid"])
            arr[month_idx] = conso_value
            site_df.at[idx, "grid"] = serialize_list_cell(arr)
        else:
            arr = parse_list_cell(site_df.at[idx, "months"])
            arr[month_idx] = conso_value
            site_df.at[idx, "months"] = serialize_list_cell(arr)

        site_df.at[idx, "site"] = site_key
        site_df.at[idx, "year"] = str(year)
        site_df.at[idx, "_createdAt"] = pd.Timestamp.now().isoformat(timespec="seconds")

        workbook[site_key] = site_df[SITE_HISTORY_COLUMNS]
        updated_count += 1

    return workbook, updated_count


def save_workbook(workbook: dict):
    SITE_HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)

    with pd.ExcelWriter(SITE_HISTORY_FILE, engine="openpyxl") as writer:
        pd.DataFrame(columns=SITE_HISTORY_COLUMNS).to_excel(writer, index=False, sheet_name="README")

        for sheet_name, df in workbook.items():
            if sheet_name == "README":
                continue

            clean_df = df.copy()
            for col in SITE_HISTORY_COLUMNS:
                if col not in clean_df.columns:
                    clean_df[col] = None

            # garder REF en premier, puis les années croissantes
            def sort_key(v):
                v = str(v)
                if v == "REF":
                    return (-1, v)
                try:
                    return (int(v), v)
                except Exception:
                    return (9999, v)

            if "year" in clean_df.columns:
                clean_df["__sort"] = clean_df["year"].astype(str).map(sort_key)
                clean_df = clean_df.sort_values("__sort").drop(columns="__sort")

            clean_df[SITE_HISTORY_COLUMNS].to_excel(writer, index=False, sheet_name=str(sheet_name)[:31])


def main():
    print(f"Lecture facturation : {BILLING_FILE}")
    print(f"Lecture / écriture historique site : {SITE_HISTORY_FILE}")

    df_billing = load_billing()
    workbook = load_existing_workbook()
    workbook, updated_count = update_from_billing(df_billing, workbook)
    save_workbook(workbook)

    print(f"✅ Reconstruction terminée. Lignes facturation traitées : {updated_count}")
    print("✅ Les feuilles REF ont été conservées.")
    print("✅ Les années ont été mises à jour depuis billing_data.csv.")


if __name__ == "__main__":
    main()
