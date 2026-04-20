from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from typing import Any
from urllib import error, request

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.legacy_store import iter_legacy_pac_measurements, read_billing_rows, read_json_collection, read_site_history_excel
from scripts.import_legacy_to_db import DEFAULT_ACTIONS, DEFAULT_AUDITS, DEFAULT_MEETINGS

API_BASE = "https://dashboard-energie-api.onrender.com"
PAC_BATCH_SIZE = 1000
REQUEST_TIMEOUT = 120


def api_request(path: str, method: str = "GET", payload: Any = None) -> Any:
    url = f"{API_BASE}{path}"
    data = None
    headers = {"Accept": "application/json"}

    if payload is not None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = request.Request(url, data=data, headers=headers, method=method)
    try:
        with request.urlopen(req, timeout=REQUEST_TIMEOUT) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {path} failed: {exc.code} {detail}") from exc


def chunked(items: list[dict[str, Any]], size: int) -> list[list[dict[str, Any]]]:
    return [items[index : index + size] for index in range(0, len(items), size)]


def import_small_collection(
    current_count: int,
    name: str,
    rows: list[dict[str, Any]],
    path_builder,
) -> int:
    if current_count > 0:
        print(f"- {name}: deja present ({current_count}), import saute")
        return 0

    imported = 0
    for row in rows:
        api_request(path_builder(row), method="POST", payload=row)
        imported += 1
    print(f"- {name}: {imported} element(s) importes")
    return imported


def main() -> None:
    summary = api_request("/api/db-summary")
    counts = summary.get("counts", {})

    print("Verification cible Render :")
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    print("\nImport en cours...")

    import_small_collection(
        counts.get("users", 0),
        "users",
        read_json_collection("users"),
        lambda _row: "/api/data/users",
    )

    import_small_collection(
        counts.get("air_logs", 0),
        "air_logs",
        read_json_collection("air_logs"),
        lambda _row: "/api/data/air_logs",
    )

    import_small_collection(
        counts.get("site_histories", 0),
        "site_histories",
        read_site_history_excel(),
        lambda _row: "/api/data/site_history",
    )

    import_small_collection(
        counts.get("billing_records", 0),
        "billing_records",
        read_billing_rows(),
        lambda _row: "/api/save-billing",
    )

    import_small_collection(
        counts.get("meetings", 0),
        "meetings",
        DEFAULT_MEETINGS,
        lambda _row: "/api/meetings",
    )

    import_small_collection(
        counts.get("audits", 0),
        "audits",
        DEFAULT_AUDITS,
        lambda _row: "/api/audits",
    )

    import_small_collection(
        counts.get("actions", 0),
        "actions",
        DEFAULT_ACTIONS,
        lambda _row: "/api/actions",
    )

    if counts.get("pac_measurements", 0) > 0:
        print(f"- pac_measurements: deja present ({counts.get('pac_measurements', 0)}), import saute")
    else:
        pac_rows = iter_legacy_pac_measurements()
        batches = chunked(pac_rows, PAC_BATCH_SIZE)
        print(f"- pac_measurements: {len(pac_rows)} mesure(s) a importer en {len(batches)} lot(s)")
        imported = 0
        for index, batch in enumerate(batches, start=1):
            response = api_request("/api/pac-measurements/bulk", method="POST", payload=batch)
            imported += int(response.get("imported", 0))
            print(f"  lot {index}/{len(batches)} -> +{response.get('imported', 0)}")
            time.sleep(0.1)
        print(f"- pac_measurements: {imported} mesure(s) importees")

    final_summary = api_request("/api/db-summary")
    print("\nVerification finale :")
    print(json.dumps(final_summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
