from __future__ import annotations

import argparse
import csv
import json
import logging
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Any

import requests

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

DEFAULT_API_BASE = os.getenv("PAC_API_BASE", "https://dashboard-energie-api.onrender.com")
DEFAULT_PERIOD_SECONDS = max(60, int(os.getenv("PAC_PERIOD_SECONDS", "300")))
DEFAULT_TIMEOUT_SECONDS = max(5, int(os.getenv("PAC_TIMEOUT_SECONDS", "15")))
DEFAULT_OUTBOX_PATH = DATA_DIR / "pac_agent_outbox.jsonl"

CSV_HEADER = [
    "Timestamp",
    "P_SUM_kW",
    "Q_SUM_kvar",
    "S_SUM_kVA",
    "PF_SUM",
    "V_AVG_V",
    "I_AVG_A",
    "FREQ_Hz",
]

PAC_SITES = {
    "MEGRINE": {
        "url": "http://172.16.1.2/data.json",
        "csv": DATA_DIR / "energy_MEGRINE.csv",
        "source_ip": "172.16.1.2",
    },
    "ELKHADHRA": {
        "url": "http://172.22.0.140/data.json",
        "csv": DATA_DIR / "energy_ELKHADHRA.csv",
        "source_ip": "172.22.0.140",
    },
    "NAASSEN": {
        "url": "http://172.19.0.140/data.json",
        "csv": DATA_DIR / "energy_NAASSEN.csv",
        "source_ip": "172.19.0.140",
    },
}


def configure_logging(verbose: bool) -> None:
    logging.basicConfig(
        level=logging.DEBUG if verbose else logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Read PAC2200 local endpoints and push measurements to the dashboard backend."
    )
    parser.add_argument(
        "--api-base",
        default=DEFAULT_API_BASE,
        help=f"Backend base URL (default: {DEFAULT_API_BASE})",
    )
    parser.add_argument(
        "--period",
        type=int,
        default=DEFAULT_PERIOD_SECONDS,
        help=f"Polling period in seconds (default: {DEFAULT_PERIOD_SECONDS})",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=DEFAULT_TIMEOUT_SECONDS,
        help=f"HTTP timeout in seconds (default: {DEFAULT_TIMEOUT_SECONDS})",
    )
    parser.add_argument(
        "--site",
        action="append",
        choices=sorted(PAC_SITES.keys()),
        help="Limit the run to one or more sites (repeatable).",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Run only one polling cycle, then exit.",
    )
    parser.add_argument(
        "--skip-csv",
        action="store_true",
        help="Do not mirror fresh measurements to local CSV files.",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logs.",
    )
    return parser.parse_args()


def selected_pacs(site_filters: list[str] | None) -> dict[str, dict[str, Any]]:
    if not site_filters:
        return PAC_SITES
    return {site: PAC_SITES[site] for site in site_filters}


def read_inst_value(inst_values: dict[str, Any], key: str) -> float:
    raw = inst_values.get(key, {})
    value = raw.get("value") if isinstance(raw, dict) else raw
    return float(value)


def build_measurement(site_code: str, config: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    inst_values = payload["INST_VALUES"]
    timestamp = datetime.now().isoformat(timespec="seconds")
    return {
        "site": site_code,
        "Timestamp": timestamp,
        "measuredAt": timestamp,
        "P_SUM_kW": read_inst_value(inst_values, "P_SUM"),
        "Q_SUM_kvar": read_inst_value(inst_values, "VARQ1_SUM"),
        "S_SUM_kVA": read_inst_value(inst_values, "VA_SUM"),
        "PF_SUM": read_inst_value(inst_values, "PF_SUM"),
        "V_AVG_V": read_inst_value(inst_values, "V_LN_AVG"),
        "I_AVG_A": read_inst_value(inst_values, "I_AVG"),
        "FREQ_Hz": read_inst_value(inst_values, "FREQ"),
        "source_ip": config["source_ip"],
        "source_file": str(config["csv"]),
    }


def fetch_site_measurement(
    session: requests.Session,
    site_code: str,
    config: dict[str, Any],
    timeout_seconds: int,
) -> dict[str, Any]:
    response = session.get(config["url"], timeout=timeout_seconds)
    response.raise_for_status()
    return build_measurement(site_code, config, response.json())


def append_csv_row(csv_path: Path, measurement: dict[str, Any]) -> None:
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    file_exists = csv_path.exists()
    with csv_path.open("a", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        if not file_exists:
            writer.writerow(CSV_HEADER)
        writer.writerow([measurement.get(column) for column in CSV_HEADER])


def load_outbox(outbox_path: Path) -> list[dict[str, Any]]:
    if not outbox_path.exists():
        return []
    items: list[dict[str, Any]] = []
    with outbox_path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                parsed = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(parsed, dict):
                items.append(parsed)
    return items


def save_outbox(outbox_path: Path, items: list[dict[str, Any]]) -> None:
    if not items:
        outbox_path.unlink(missing_ok=True)
        return
    outbox_path.parent.mkdir(parents=True, exist_ok=True)
    with outbox_path.open("w", encoding="utf-8") as handle:
        for item in items:
            handle.write(json.dumps(item, ensure_ascii=False) + "\n")


def push_batch(
    session: requests.Session,
    api_base: str,
    batch: list[dict[str, Any]],
    timeout_seconds: int,
) -> int:
    response = session.post(
        f"{api_base.rstrip('/')}/api/pac-measurements/bulk",
        json=batch,
        timeout=timeout_seconds,
    )
    response.raise_for_status()
    data = response.json() if response.content else {}
    return int(data.get("imported", len(batch)))


def execute_cycle(
    session: requests.Session,
    api_base: str,
    pacs: dict[str, dict[str, Any]],
    timeout_seconds: int,
    skip_csv: bool,
    outbox_path: Path,
) -> None:
    logger = logging.getLogger("pac-agent")
    pending = load_outbox(outbox_path)
    fresh_measurements: list[dict[str, Any]] = []

    for site_code, config in pacs.items():
        try:
            measurement = fetch_site_measurement(session, site_code, config, timeout_seconds)
            fresh_measurements.append(measurement)
            if not skip_csv:
                append_csv_row(config["csv"], measurement)
            logger.info(
                "[%s] %s | P=%.3f kW | Q=%.3f kvar | S=%.3f kVA | PF=%.3f",
                site_code,
                measurement["Timestamp"],
                measurement["P_SUM_kW"],
                measurement["Q_SUM_kvar"],
                measurement["S_SUM_kVA"],
                measurement["PF_SUM"],
            )
        except Exception as exc:
            logger.warning("[%s] read failed: %s", site_code, exc)

    batch = pending + fresh_measurements
    if not batch:
        logger.warning("No PAC measurement was read during this cycle.")
        return

    try:
        imported = push_batch(session, api_base, batch, timeout_seconds)
        save_outbox(outbox_path, [])
        logger.info("Pushed %s measurement(s) to %s", imported, api_base)
    except Exception as exc:
        save_outbox(outbox_path, batch)
        logger.error(
            "Upload failed, %s measurement(s) kept in outbox %s: %s",
            len(batch),
            outbox_path,
            exc,
        )


def main() -> int:
    args = parse_args()
    configure_logging(args.verbose)
    logger = logging.getLogger("pac-agent")
    pacs = selected_pacs(args.site)

    logger.info("PAC agent started")
    logger.info("Sites: %s", ", ".join(pacs.keys()))
    logger.info("API base: %s", args.api_base)
    logger.info("Period: %ss", args.period)
    logger.info("CSV mirror: %s", "disabled" if args.skip_csv else "enabled")
    logger.info("Outbox: %s", DEFAULT_OUTBOX_PATH)

    session = requests.Session()

    if args.once:
        execute_cycle(
            session=session,
            api_base=args.api_base,
            pacs=pacs,
            timeout_seconds=args.timeout,
            skip_csv=args.skip_csv,
            outbox_path=DEFAULT_OUTBOX_PATH,
        )
        return 0

    while True:
        cycle_started_at = time.time()
        execute_cycle(
            session=session,
            api_base=args.api_base,
            pacs=pacs,
            timeout_seconds=args.timeout,
            skip_csv=args.skip_csv,
            outbox_path=DEFAULT_OUTBOX_PATH,
        )
        elapsed = time.time() - cycle_started_at
        time.sleep(max(1, args.period - elapsed))


if __name__ == "__main__":
    raise SystemExit(main())
