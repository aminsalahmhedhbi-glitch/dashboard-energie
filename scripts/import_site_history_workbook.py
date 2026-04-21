from __future__ import annotations

import argparse
import json
import unicodedata
from pathlib import Path
from typing import Any
from urllib import error, request

import pandas as pd

DEFAULT_API_BASE = "https://dashboard-energie-api.onrender.com"
MONTH_COLUMNS = [
    "janvier",
    "fevrier",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "aout",
    "septembre ",
    "octobre",
    "novembre",
    "decembre",
]
SITE_KEY_MAP = {
    "megrine": "MEGRINE",
    "khadhra": "ELKHADHRA",
    "naassen": "NAASSEN",
    "lac": "LAC",
    "charguia": "CHARGUEYAA",
    "azur": "AZUR",
    "av. carthage": "CARTHAGE",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Importe un historique de facturation Excel dans la collection site_history via l'API backend.",
    )
    parser.add_argument(
        "--file",
        default=r"C:\Users\ITALCAR\Downloads\Book1.xlsx",
        help="Chemin du fichier Excel à importer.",
    )
    parser.add_argument(
        "--api-base",
        default=DEFAULT_API_BASE,
        help="Base URL du backend cible.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Affiche les lignes préparées sans les envoyer au backend.",
    )
    return parser.parse_args()


def normalize_site_key(raw_site: Any) -> str:
    site = str(raw_site or "").strip().lower()
    site_key = SITE_KEY_MAP.get(site)
    if not site_key:
        raise ValueError(f"Site non reconnu dans le classeur: {raw_site!r}")
    return site_key


def normalize_year(raw_year: Any, current_year: str | None) -> str:
    text = str(raw_year).strip() if raw_year is not None and not pd.isna(raw_year) else ""
    if text:
        lowered = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii").lower()
        if "ref" in lowered:
            return "REF"
        return text.split(".")[0]
    if current_year is None:
        raise ValueError("Le fichier commence par une ligne sans année.")
    return current_year


def normalize_month_value(value: Any) -> str:
    if value is None or pd.isna(value):
        return ""
    text = str(value).strip()
    if text in {"", "-", "nan"}:
        return ""
    try:
        numeric = float(text.replace(",", "."))
    except ValueError:
        return text
    if numeric.is_integer():
        return str(int(numeric))
    return f"{numeric:.2f}".rstrip("0").rstrip(".")


def api_json(method: str, url: str, payload: dict[str, Any] | None = None) -> Any:
    headers = {"Accept": "application/json"}
    data = None
    if payload is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(payload).encode("utf-8")

    req = request.Request(url, data=data, headers=headers, method=method.upper())
    with request.urlopen(req, timeout=60) as response:
        body = response.read().decode("utf-8")
        return json.loads(body) if body else None


def fetch_existing_site_history(api_base: str) -> dict[str, dict[str, Any]]:
    url = f"{api_base.rstrip('/')}/api/data/site_history"
    rows = api_json("GET", url)
    return {
        str(item.get("historyId")): item
        for item in (rows or [])
        if isinstance(item, dict) and item.get("historyId")
    }


def build_payloads(workbook_path: Path, existing_rows: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    df = pd.read_excel(workbook_path)
    current_year: str | None = None
    payloads: list[dict[str, Any]] = []

    for _, row in df.iterrows():
        year = normalize_year(row.iloc[0], current_year)
        current_year = year
        site_key = normalize_site_key(row.iloc[1])
        history_id = f"{site_key}_{year}"
        month_values = [normalize_month_value(row.get(col)) for col in MONTH_COLUMNS]

        existing = existing_rows.get(history_id, {})
        payload = {
            "historyId": history_id,
            "site": site_key,
            "year": year,
            "months": existing.get("months") or [""] * 12,
            "temperature": existing.get("temperature") or [""] * 12,
            "grid": existing.get("grid") or [""] * 12,
            "pvProd": existing.get("pvProd") or [""] * 12,
            "pvExport": existing.get("pvExport") or [""] * 12,
        }

        if site_key == "LAC":
            payload["grid"] = month_values
        else:
            payload["months"] = month_values

        payloads.append(payload)

    return payloads


def post_site_history(api_base: str, payloads: list[dict[str, Any]]) -> None:
    url = f"{api_base.rstrip('/')}/api/data/site_history"
    for payload in payloads:
        api_json("POST", url, payload)
        print(f"Importé: {payload['historyId']}")


def main() -> None:
    args = parse_args()
    workbook_path = Path(args.file)
    if not workbook_path.exists():
        raise FileNotFoundError(f"Fichier introuvable: {workbook_path}")

    existing_rows = fetch_existing_site_history(args.api_base)
    payloads = build_payloads(workbook_path, existing_rows)

    print(f"Classeur: {workbook_path}")
    print(f"API cible: {args.api_base}")
    print(f"Lignes préparées: {len(payloads)}")

    if args.dry_run:
        for payload in payloads[:5]:
            print(payload)
        return

    post_site_history(args.api_base, payloads)
    print("Import terminé avec succès.")


if __name__ == "__main__":
    main()
