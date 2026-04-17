from __future__ import annotations

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend import create_app
from backend.app import (
    upsert_action,
    upsert_audit,
    upsert_billing_record,
    upsert_meeting,
    upsert_pac_measurement,
    upsert_site_history,
)
from backend.extensions import db
from backend.legacy_store import (
    iter_legacy_pac_measurements,
    read_billing_rows,
    read_json_collection,
    read_site_history_excel,
)
from backend.models import ActionItem, AirLogEntry, Audit, BillingRecord, Meeting, PacMeasurement, SiteHistory, User

DEFAULT_MEETINGS = [
    {
        "id": "REU-001",
        "type": "Revue de direction",
        "date": "2026-04-20",
        "heureDebut": "09:00",
        "heureFin": "12:00",
        "lieu": "Salle A",
        "site": "Siège",
        "ordreJour": "Bilan S1, Indicateurs Énergie",
    }
]

DEFAULT_AUDITS = [
    {
        "id": "AUD-2026-01",
        "ref": "AUD-INT-01",
        "refInterne": "AFNOR-INT-01",
        "type": "Interne",
        "champ": "Air comprimé",
        "site": "Usine Nord",
        "datePrevue": "2026-04-10",
        "dateReelle": "",
        "objectif": "Réduire les pertes sur le réseau d’air comprimé.",
        "equipe": ["Sarah Mansour", "Ahmed Ben Ali"],
        "documents": ["Plan d’audit", "Checklist air comprimé"],
        "constats": [],
    },
    {
        "id": "AUD-2026-02",
        "ref": "AUD-GLB-01",
        "refInterne": "AFNOR-01",
        "type": "Globale",
        "champ": "Système complet ISO 50001",
        "site": "Global",
        "datePrevue": "2026-06-15",
        "dateReelle": "",
        "objectif": "Préparer le renouvellement et valider la maturité globale.",
        "equipe": ["Direction QSE", "Équipe énergie"],
        "documents": ["Programme d’audit", "Matrice conformité"],
        "constats": [],
    },
]

DEFAULT_ACTIONS = [
    {
        "id": "ACT-2026-001",
        "designation": "Mise à jour des variateurs",
        "source": "Audit",
        "type": "Amélioration",
        "responsable": "Jean Dupont",
        "avancement": 80,
    },
    {
        "id": "ACT-2026-002",
        "designation": "Formation ISO 50001",
        "source": "Réunion",
        "type": "Corrective",
        "responsable": "Marie RH",
        "avancement": 100,
    },
]


def import_users() -> int:
    if User.query.count() > 0:
        return 0

    count = 0
    for payload in read_json_collection("users"):
        user = User(
            id=str(payload.get("id")),
            username=payload.get("username", ""),
            password=payload.get("password", ""),
            role=payload.get("role", "EQUIPE_ENERGIE"),
        )
        db.session.add(user)
        count += 1
    return count


def import_air_logs() -> int:
    if AirLogEntry.query.count() > 0:
        return 0

    count = 0
    for payload in read_json_collection("air_logs"):
        entry = AirLogEntry(
            id=str(payload.get("id")),
            entry_type=payload.get("type"),
            week_label=payload.get("week"),
            asset_name=payload.get("compName"),
            payload=payload,
        )
        db.session.add(entry)
        count += 1
    return count


def import_pac_measurements() -> int:
    if PacMeasurement.query.count() > 0:
        return 0

    count = 0
    for payload in iter_legacy_pac_measurements():
        upsert_pac_measurement(payload)
        count += 1
    return count


def import_billing_records() -> int:
    if BillingRecord.query.count() > 0:
        return 0

    count = 0
    for payload in read_billing_rows():
        upsert_billing_record(payload)
        count += 1
    return count


def import_site_histories() -> int:
    if SiteHistory.query.count() > 0:
        return 0

    count = 0
    for payload in read_site_history_excel():
        upsert_site_history(payload)
        count += 1
    return count


def seed_meetings() -> int:
    if Meeting.query.count() > 0:
        return 0
    for payload in DEFAULT_MEETINGS:
        upsert_meeting(payload)
    return len(DEFAULT_MEETINGS)


def seed_audits() -> int:
    if Audit.query.count() > 0:
        return 0
    for payload in DEFAULT_AUDITS:
        upsert_audit(payload)
    return len(DEFAULT_AUDITS)


def seed_actions() -> int:
    if ActionItem.query.count() > 0:
        return 0
    for payload in DEFAULT_ACTIONS:
        upsert_action(payload)
    return len(DEFAULT_ACTIONS)


def main() -> None:
    app = create_app()
    with app.app_context():
        imported = {
            "users": import_users(),
            "air_logs": import_air_logs(),
            "pac_measurements": import_pac_measurements(),
            "billing_records": import_billing_records(),
            "site_histories": import_site_histories(),
            "meetings": seed_meetings(),
            "audits": seed_audits(),
            "actions": seed_actions(),
        }
        db.session.commit()

    print("Import terminé :")
    for key, value in imported.items():
        print(f"- {key}: {value}")


if __name__ == "__main__":
    main()
