import csv
import os
import time
from datetime import datetime
from pathlib import Path

import requests

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

PACS = {
    "MEGRINE": {
        "url": "http://172.16.1.2/data.json",
        "csv": DATA_DIR / "energy_MEGRINE.csv",
    },
    "ELKHADHRA": {
        "url": "http://172.22.0.140/data.json",
        "csv": DATA_DIR / "energy_ELKHADHRA.csv",
    },
    "NAASSEN": {
        "url": "http://172.19.0.140/data.json",
        "csv": DATA_DIR / "energy_NAASSEN.csv",
    },
}

PERIOD = 5  # seconds

HEADER = [
    "Timestamp",
    "P_SUM_kW",
    "Q_SUM_kvar",
    "S_SUM_kVA",
    "PF_SUM",
    "V_AVG_V",
    "I_AVG_A",
    "FREQ_Hz",
]


def get_data_from_pac(url: str):
    response = requests.get(url, timeout=5)
    response.raise_for_status()
    data = response.json()
    inst = data["INST_VALUES"]

    return [
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        float(inst["P_SUM"]["value"]),
        float(inst["VARQ1_SUM"]["value"]),
        float(inst["VA_SUM"]["value"]),
        float(inst["PF_SUM"]["value"]),
        float(inst["V_LN_AVG"]["value"]),
        float(inst["I_AVG"]["value"]),
        float(inst["FREQ"]["value"]),
    ]


def save_to_csv(csv_file: Path, row):
    file_exists = csv_file.exists()

    with csv_file.open("a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)

        if not file_exists:
            writer.writerow(HEADER)

        writer.writerow(row)


def poll_site(site_name: str, site_config: dict):
    row = get_data_from_pac(site_config["url"])
    save_to_csv(site_config["csv"], row)
    print(f"✔ [{site_name}] Saved: {row}")


if __name__ == "__main__":
    print("▶ PAC Multi-Sites Monitoring Started")
    print("Sites configurés:")
    for site_name, cfg in PACS.items():
        print(f"  - {site_name}: {cfg['url']} -> {cfg['csv']}")

    while True:
        for site_name, cfg in PACS.items():
            try:
                poll_site(site_name, cfg)
            except Exception as e:
                print(f"Error [{site_name}]: {e}")

        time.sleep(PERIOD)
