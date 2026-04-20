from __future__ import annotations

import logging
import os
from datetime import date, datetime, time
from typing import Any

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from sqlalchemy import inspect, text

from .config import BASE_DIR, Config, FRONTEND_DIST
from .extensions import db
from .legacy_store import (
    ALLOWED_COLLECTIONS,
    DEFAULT_BILLING_LIMIT,
    DEFAULT_HISTORY_LIMIT,
    PAC_SITES,
    get_energy_csv_path,
    get_site_history_key_from_billing,
    get_site_key,
    normalize_billing_row,
    normalize_month_array,
    now_iso,
    read_billing_rows,
    read_energy_csv,
    read_json_collection,
    read_site_history_excel,
    safe_float,
    sanitize_value,
    validate_billing_payload,
)
from .models import (
    ActionItem,
    AirLogEntry,
    Audit,
    AuditFinding,
    BillingRecord,
    Meeting,
    MeetingMinute,
    ModuleState,
    PacMeasurement,
    SiteHistory,
    User,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("energy-backend")


def json_response(payload: Any, status: int = 200):
    return jsonify(payload), status


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


def parse_datetime_value(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value

    string_value = str(value).strip()
    candidates = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
    ]
    for fmt in candidates:
        try:
            return datetime.strptime(string_value, fmt)
        except ValueError:
            continue

    try:
        return datetime.fromisoformat(string_value.replace("Z", "+00:00"))
    except ValueError:
        return None


def parse_date_value(value: Any) -> date | None:
    parsed = parse_datetime_value(value)
    return parsed.date() if parsed else None


def parse_time_value(value: Any) -> time | None:
    if not value:
        return None
    if isinstance(value, time):
        return value

    string_value = str(value).strip()
    for fmt in ("%H:%M:%S", "%H:%M"):
        try:
            return datetime.strptime(string_value, fmt).time()
        except ValueError:
            continue
    return None


def make_string_id(prefix: str) -> str:
    return f"{prefix}{int(datetime.utcnow().timestamp() * 1000)}"


def merge_payload_dict(payload: dict[str, Any], **updates: Any) -> dict[str, Any]:
    merged = dict(payload or {})
    merged.update({key: value for key, value in updates.items() if value is not None})
    return merged


def upsert_pac_measurement(payload: dict[str, Any], site_override: str | None = None) -> PacMeasurement:
    site_code = get_site_key(site_override or payload.get("site") or payload.get("siteCode"))
    measured_at = (
        parse_datetime_value(payload.get("measuredAt"))
        or parse_datetime_value(payload.get("Timestamp"))
        or parse_datetime_value(payload.get("timestamp"))
        or datetime.utcnow()
    )

    measurement = PacMeasurement.query.filter_by(site_code=site_code, measured_at=measured_at).first()
    if measurement is None:
        measurement = PacMeasurement(site_code=site_code, measured_at=measured_at)
        db.session.add(measurement)

    measurement.p_sum_kw = safe_float(payload.get("P_SUM_kW"))
    measurement.q_sum_kvar = safe_float(payload.get("Q_SUM_kvar"))
    measurement.s_sum_kva = safe_float(payload.get("S_SUM_kVA"))
    measurement.pf_sum = safe_float(payload.get("PF_SUM"))
    measurement.v_avg_v = safe_float(payload.get("V_AVG_V"))
    measurement.i_avg_a = safe_float(payload.get("I_AVG_A"))
    measurement.freq_hz = safe_float(payload.get("FREQ_Hz"))
    measurement.source_ip = payload.get("source_ip") or PAC_SITES.get(site_code, {}).get("ip")
    measurement.source_file = payload.get("source_file") or str(get_energy_csv_path(site_code))
    measurement.payload = merge_payload_dict(
        payload,
        site=site_code,
        Timestamp=measured_at.isoformat(timespec="seconds"),
    )
    return measurement


def upsert_billing_record(payload: dict[str, Any]) -> BillingRecord:
    normalized = normalize_billing_row(payload)
    record_id = str(normalized.get("id") or make_string_id("BILL-"))
    record = db.session.get(BillingRecord, record_id)
    if record is None:
        record = BillingRecord(id=record_id)
        db.session.add(record)

    record.record_date = str(normalized.get("recordDate") or "")
    record.billing_timestamp = normalized.get("timestamp")
    record.site_id = str(normalized.get("siteId") or "")
    record.site_name = str(normalized.get("siteName") or "")
    record.site_type = str(normalized.get("siteType") or normalized.get("type") or "")
    record.billed_kwh = safe_float(normalized.get("billedKwh"))
    record.consumption_grid = safe_float(normalized.get("consumptionGrid"))
    record.production_pv = safe_float(normalized.get("productionPv"))
    record.current_month_balance = safe_float(normalized.get("currentMonthBalance"))
    record.previous_balance = safe_float(
        normalized.get("previousBalance", normalized.get("prevBalance"))
    )
    record.total_balance = safe_float(normalized.get("totalBalance"))
    record.total_final_ttc = safe_float(normalized.get("totalFinalTTC"))
    record.net_to_pay = safe_float(normalized.get("netToPay"))
    record.max_power = safe_float(normalized.get("maxPower", normalized.get("Pmax")))
    record.cos_phi = safe_float(normalized.get("cosPhi"))
    record.power_overrun = safe_float(normalized.get("powerOverrun"))
    record.power_overrun_amount = safe_float(normalized.get("powerOverrunAmount"))
    record.payload = normalized
    return record


def upsert_site_history(payload: dict[str, Any]) -> SiteHistory:
    history_id = str(payload.get("historyId") or "").strip()
    if not history_id or "_" not in history_id:
        raise ValueError("historyId invalide. Format attendu: SITE_ANNEE")

    site_code, year_label = history_id.split("_", 1)
    history = db.session.get(SiteHistory, history_id)
    if history is None:
        history = SiteHistory(id=history_id)
        db.session.add(history)

    history.site_code = site_code
    history.year_label = year_label
    history.months = normalize_month_array(payload.get("months"))
    history.temperature = normalize_month_array(payload.get("temperature"))
    history.grid = normalize_month_array(payload.get("grid"))
    history.pv_prod = normalize_month_array(payload.get("pvProd"))
    history.pv_export = normalize_month_array(payload.get("pvExport"))
    return history


def sync_site_history_from_billing(payload: dict[str, Any]) -> SiteHistory | None:
    site_key = get_site_history_key_from_billing(payload)
    record_date = str(payload.get("recordDate") or "").strip()

    if not site_key or not record_date or len(record_date.split("-")) != 2:
        return None

    year_str, month_str = record_date.split("-")
    month_idx = max(0, min(11, int(month_str) - 1))

    consumption = payload.get("billedKwh")
    if consumption in (None, ""):
        consumption = payload.get("consumptionGrid")
    if consumption in (None, ""):
        consumption = payload.get("energyRecorded")
    consumption_value = safe_float(consumption)
    if consumption_value in (None, ""):
        return None

    history_id = f"{site_key}_{year_str}"
    history = db.session.get(SiteHistory, history_id)
    if history is None:
        history = SiteHistory(
            id=history_id,
            site_code=site_key,
            year_label=year_str,
            months=[""] * 12,
            temperature=[""] * 12,
            grid=[""] * 12,
            pv_prod=[""] * 12,
            pv_export=[""] * 12,
        )
        db.session.add(history)

    if site_key == "LAC":
        values = normalize_month_array(history.grid)
        values[month_idx] = consumption_value
        history.grid = values
    else:
        values = normalize_month_array(history.months)
        values[month_idx] = consumption_value
        history.months = values

    return history


def upsert_meeting(payload: dict[str, Any], meeting: Meeting | None = None) -> Meeting:
    meeting = meeting or Meeting(id=str(payload.get("id") or make_string_id("REU-")))
    meeting.meeting_type = str(payload.get("type") or "Réunion")
    meeting.meeting_date = parse_date_value(payload.get("date")) or datetime.utcnow().date()
    meeting.start_time = parse_time_value(payload.get("heureDebut"))
    meeting.end_time = parse_time_value(payload.get("heureFin"))
    meeting.location = payload.get("lieu")
    meeting.site = payload.get("site")
    meeting.agenda = payload.get("ordreJour")
    meeting.status = str(payload.get("status") or "PLANIFIED")
    if meeting not in db.session:
        db.session.add(meeting)
    return meeting


def upsert_meeting_minutes(meeting_id: str, payload: dict[str, Any]) -> MeetingMinute:
    minutes = MeetingMinute.query.filter_by(meeting_id=meeting_id).first()
    if minutes is None:
        minutes = MeetingMinute(id=str(payload.get("id") or make_string_id("PV-")), meeting_id=meeting_id)
        db.session.add(minutes)

    minutes.title = payload.get("title")
    minutes.summary = payload.get("summary")
    minutes.decisions = payload.get("decisions") or []
    minutes.attendees = payload.get("attendees") or []
    minutes.content = payload.get("content") or ""
    return minutes


def sync_audit_findings(audit: Audit, findings: list[dict[str, Any]]) -> None:
    existing = {finding.id: finding for finding in audit.findings}
    incoming_ids = set()

    for payload in findings or []:
        finding_id = str(payload.get("id") or make_string_id("CST-"))
        incoming_ids.add(finding_id)
        finding = existing.get(finding_id)
        if finding is None:
            finding = AuditFinding(id=finding_id, audit=audit)
            db.session.add(finding)

        finding.title = payload.get("objet") or "Constat"
        finding.severity = payload.get("gravite") or "Mineure"
        finding.action_label = payload.get("action")
        finding.follow_up = payload.get("suivi") or "0%"
        finding.notes = payload.get("notes")
        finding.linked_action_id = payload.get("linkedActionId")

    for finding in list(audit.findings):
        if finding.id not in incoming_ids:
            db.session.delete(finding)


def upsert_audit(payload: dict[str, Any], audit: Audit | None = None) -> Audit:
    audit = audit or Audit(id=str(payload.get("id") or make_string_id("AUD-")))
    audit.ref = str(payload.get("ref") or audit.id)
    audit.internal_ref = payload.get("refInterne")
    audit.audit_type = str(payload.get("type") or "Interne")
    audit.scope = payload.get("champ") or ""
    audit.site = payload.get("site") or ""
    audit.planned_date = parse_date_value(payload.get("datePrevue"))
    audit.actual_date = parse_date_value(payload.get("dateReelle"))
    audit.objective = payload.get("objectif")
    audit.team = payload.get("equipe") or []
    audit.documents = payload.get("documents") or []
    if audit not in db.session:
        db.session.add(audit)
    sync_audit_findings(audit, payload.get("constats") or [])
    return audit


def upsert_action(payload: dict[str, Any], action: ActionItem | None = None) -> ActionItem:
    action = action or ActionItem(id=str(payload.get("id") or make_string_id("ACT-")))
    source_type = str(payload.get("sourceType") or payload.get("source") or "MANUAL").strip().upper()
    source_type = {
        "AUDIT": "AUDIT",
        "RÉUNION": "MEETING",
        "REUNION": "MEETING",
        "MEETING": "MEETING",
        "MANUAL": "MANUAL",
        "MANUEL": "MANUAL",
    }.get(source_type, source_type)

    action.title = payload.get("designation") or payload.get("title") or "Nouvelle action"
    action.source_type = source_type
    action.action_type = payload.get("type") or "Corrective"
    action.owner_name = payload.get("responsable") or payload.get("ownerName")
    action.progress = int(payload.get("avancement") or payload.get("progress") or 0)
    action.status = payload.get("status") or ("DONE" if action.progress >= 100 else "OPEN")
    action.due_date = parse_date_value(payload.get("dueDate"))
    action.notes = payload.get("notes")
    action.audit_id = payload.get("auditId")
    action.meeting_id = payload.get("meetingId")
    if action not in db.session:
        db.session.add(action)
    return action


def legacy_collection_response(collection: str) -> list[dict[str, Any]]:
    if collection == "site_history":
        return read_site_history_excel()
    return read_json_collection(collection)


def ensure_schema() -> None:
    inspector = inspect(db.engine)
    existing_tables = set(inspector.get_table_names())
    for table in db.metadata.sorted_tables:
        if table.name not in existing_tables:
            table.create(bind=db.engine, checkfirst=False)
            existing_tables.add(table.name)


def create_app() -> Flask:
    app = Flask(__name__, static_folder=str(FRONTEND_DIST), static_url_path="")
    app.config.from_object(Config)

    db.init_app(app)
    with app.app_context():
        ensure_schema()

    cors_origins = resolve_cors_origins()
    CORS(app, resources={r"/api/*": {"origins": cors_origins}})

    logger.info("Backend base directory: %s", BASE_DIR)
    logger.info("Frontend dist directory: %s", FRONTEND_DIST)
    logger.info("Frontend build detected: %s", (FRONTEND_DIST / "index.html").exists())
    logger.info("Allowed CORS origins: %s", ", ".join(cors_origins))
    logger.info("Database dialect: %s", app.config["SQLALCHEMY_DATABASE_URI"].split(":", 1)[0])

    def legacy_enabled() -> bool:
        return bool(app.config.get("LEGACY_FALLBACK_ENABLED", True))

    @app.get("/api/health")
    def health():
        db_status = "ok"
        try:
            db.session.execute(text("SELECT 1"))
        except Exception as exc:
            logger.exception("Database health check failed: %s", exc)
            db_status = "error"

        return json_response(
            {
                "status": "ok",
                "service": "energy-dashboard-backend",
                "time": now_iso(),
                "database": {
                    "status": db_status,
                    "dialect": app.config["SQLALCHEMY_DATABASE_URI"].split(":", 1)[0],
                },
                "legacyFallback": legacy_enabled(),
                "energy_files": {site: str(get_energy_csv_path(site)) for site in PAC_SITES},
                "frontend_dist": str(FRONTEND_DIST),
                "index_exists": (FRONTEND_DIST / "index.html").exists(),
            }
        )

    @app.get("/api/db-summary")
    def db_summary():
        table_map = {
            "users": User,
            "pac_measurements": PacMeasurement,
            "billing_records": BillingRecord,
            "site_histories": SiteHistory,
            "air_logs": AirLogEntry,
            "meetings": Meeting,
            "meeting_minutes": MeetingMinute,
            "audits": Audit,
            "audit_findings": AuditFinding,
            "actions": ActionItem,
            "module_states": ModuleState,
        }

        counts: dict[str, int] = {}
        samples: dict[str, Any] = {}

        for table_name, model in table_map.items():
            counts[table_name] = model.query.count()

        first_user = User.query.order_by(User.created_at.asc()).first()
        first_meeting = Meeting.query.order_by(Meeting.created_at.asc()).first()
        first_audit = Audit.query.order_by(Audit.created_at.asc()).first()
        first_action = ActionItem.query.order_by(ActionItem.created_at.asc()).first()
        first_billing = BillingRecord.query.order_by(BillingRecord.created_at.asc()).first()

        if first_user:
            user_payload = first_user.to_dict()
            user_payload.pop("password", None)
            samples["firstUser"] = user_payload
        if first_meeting:
            samples["firstMeeting"] = first_meeting.to_dict()
        if first_audit:
            samples["firstAudit"] = first_audit.to_dict(include_findings=False)
        if first_action:
            samples["firstAction"] = first_action.to_dict()
        if first_billing:
            billing_payload = first_billing.to_dict()
            samples["firstBillingRecord"] = {
                "id": billing_payload.get("id"),
                "recordDate": billing_payload.get("recordDate"),
                "siteName": billing_payload.get("siteName"),
                "totalFinalTTC": billing_payload.get("totalFinalTTC"),
            }

        return json_response(
            {
                "status": "ok",
                "database": {
                    "dialect": app.config["SQLALCHEMY_DATABASE_URI"].split(":", 1)[0],
                },
                "counts": counts,
                "samples": samples,
            }
        )

    @app.get("/api/pac-measurements")
    def list_pac_measurements():
        site = get_site_key(request.args.get("site"))
        limit = max(1, min(request.args.get("limit", DEFAULT_HISTORY_LIMIT, type=int), 2000))
        query = PacMeasurement.query.filter_by(site_code=site).order_by(PacMeasurement.measured_at.desc())
        rows = [item.to_measurement_dict() for item in query.limit(limit).all()]
        if rows:
            return json_response(rows)

        if legacy_enabled():
            df = read_energy_csv(site)
            if df is None:
                return json_response([])
            legacy_rows = [sanitize_value(row) for row in df.tail(limit).to_dict(orient="records")]
            for row in legacy_rows:
                row["site"] = site
            return json_response(legacy_rows)

        return json_response([])

    @app.post("/api/pac-measurements")
    def save_pac_measurement():
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return json_response({"error": "Payload JSON invalide"}, 400)
        measurement = upsert_pac_measurement(payload, request.args.get("site"))
        db.session.commit()
        return json_response({"message": "Mesure PAC enregistrée", "saved": measurement.to_measurement_dict()}, 201)

    @app.get("/api/energy")
    def get_live_energy():
        site = get_site_key(request.args.get("site", "MEGRINE"))
        measurement = PacMeasurement.query.filter_by(site_code=site).order_by(PacMeasurement.measured_at.desc()).first()
        if measurement:
            return json_response(measurement.to_measurement_dict())

        if legacy_enabled():
            df = read_energy_csv(site)
            if df is None:
                return json_response({"error": f"Aucune donnée énergétique disponible pour {site}"}, 404)
            row = sanitize_value(df.iloc[-1].to_dict())
            row["site"] = site
            row["source_file"] = str(get_energy_csv_path(site))
            return json_response(row)

        return json_response({"error": f"Aucune donnée énergétique disponible pour {site}"}, 404)

    @app.get("/api/history")
    def get_energy_history():
        site = get_site_key(request.args.get("site", "MEGRINE"))
        limit = max(1, min(request.args.get("limit", DEFAULT_HISTORY_LIMIT, type=int), 1000))
        records = (
            PacMeasurement.query.filter_by(site_code=site)
            .order_by(PacMeasurement.measured_at.desc())
            .limit(limit)
            .all()
        )
        if records:
            return json_response([record.to_measurement_dict() for record in reversed(records)])

        if legacy_enabled():
            df = read_energy_csv(site)
            if df is None:
                return json_response([])
            rows = [sanitize_value(row) for row in df.tail(limit).to_dict(orient="records")]
            for row in rows:
                row["site"] = site
            return json_response(rows)

        return json_response([])

    @app.post("/api/save-billing")
    def save_billing():
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return json_response({"error": "Payload JSON invalide"}, 400)

        is_valid, error_message = validate_billing_payload(payload)
        if not is_valid:
            return json_response({"error": error_message}, 400)

        record = upsert_billing_record(payload)
        synced_history = sync_site_history_from_billing(payload)
        db.session.commit()
        return json_response(
            {
                "message": "Relevé de facturation enregistré",
                "saved": record.to_dict(),
                "siteHistorySync": synced_history.to_dict() if synced_history else None,
            },
            201,
        )

    @app.get("/api/billing-history")
    def billing_history():
        limit = max(1, min(request.args.get("limit", DEFAULT_BILLING_LIMIT, type=int), 1000))
        site_id = request.args.get("siteId")
        site_type = request.args.get("siteType")
        record_date = request.args.get("recordDate")

        query = BillingRecord.query
        if site_id is not None:
            query = query.filter(BillingRecord.site_id == str(site_id))
        if site_type:
            query = query.filter(BillingRecord.site_type == site_type)
        if record_date:
            query = query.filter(BillingRecord.record_date == record_date)

        rows = [item.to_dict() for item in query.order_by(BillingRecord.created_at.desc()).limit(limit).all()]
        if rows:
            return json_response(rows)

        if legacy_enabled():
            legacy_rows = read_billing_rows()
            if site_id is not None:
                legacy_rows = [row for row in legacy_rows if str(row.get("siteId")) == str(site_id)]
            if site_type:
                legacy_rows = [row for row in legacy_rows if str(row.get("siteType")) == site_type]
            if record_date:
                legacy_rows = [row for row in legacy_rows if str(row.get("recordDate")) == record_date]
            legacy_rows.sort(key=lambda row: (str(row.get("recordDate") or ""), str(row.get("id") or "")), reverse=True)
            return json_response(legacy_rows[:limit])

        return json_response([])

    @app.delete("/api/billing/<item_id>")
    def delete_billing(item_id: str):
        record = db.session.get(BillingRecord, item_id)
        if record is None:
            return json_response({"error": "Facture introuvable"}, 404)
        db.session.delete(record)
        db.session.commit()
        return json_response({"message": "Facture supprimée"})

    @app.get("/api/data/<collection>")
    def get_collection(collection: str):
        if collection not in ALLOWED_COLLECTIONS:
            return json_response({"error": f"Collection non autorisée: {collection}"}, 404)

        if collection == "users":
            rows = [user.to_dict() for user in User.query.order_by(User.created_at.desc()).all()]
            if rows:
                return json_response(rows)
        elif collection == "air_logs":
            rows = [entry.to_dict() for entry in AirLogEntry.query.order_by(AirLogEntry.created_at.desc()).all()]
            if rows:
                return json_response(rows)
        elif collection == "site_history":
            rows = [item.to_dict() for item in SiteHistory.query.order_by(SiteHistory.created_at.desc()).all()]
            if rows:
                return json_response(rows)

        if legacy_enabled():
            rows = legacy_collection_response(collection)
            rows.sort(key=lambda row: str(row.get("_createdAt") or row.get("id") or row.get("historyId") or ""), reverse=True)
            return json_response(rows)

        return json_response([])

    @app.post("/api/data/<collection>")
    def save_collection_item(collection: str):
        if collection not in ALLOWED_COLLECTIONS:
            return json_response({"error": f"Collection non autorisée: {collection}"}, 404)

        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return json_response({"error": "Payload JSON invalide"}, 400)

        if collection == "users":
            user_id = str(payload.get("id") or make_string_id("USR-"))
            user = db.session.get(User, user_id)
            if user is None:
                user = User(id=user_id)
                db.session.add(user)
            user.username = str(payload.get("username") or "").strip()
            user.password = str(payload.get("password") or "").strip()
            user.role = str(payload.get("role") or "EQUIPE_ENERGIE")
            user.full_name = payload.get("fullName")
            db.session.commit()
            return json_response({"message": "Enregistré", "saved": user.to_dict(include_password=True)}, 201)

        if collection == "air_logs":
            entry_id = str(payload.get("id") or make_string_id("AIR-"))
            entry = db.session.get(AirLogEntry, entry_id)
            if entry is None:
                entry = AirLogEntry(id=entry_id)
                db.session.add(entry)
            entry.entry_type = payload.get("type")
            entry.week_label = payload.get("week")
            entry.asset_name = payload.get("compName")
            entry.payload = sanitize_value(payload)
            db.session.commit()
            return json_response({"message": "Enregistré", "saved": entry.to_dict()}, 201)

        if collection == "site_history":
            try:
                item = upsert_site_history(payload)
            except ValueError as exc:
                return json_response({"error": str(exc)}, 400)
            db.session.commit()
            return json_response({"message": "Enregistré", "saved": item.to_dict()}, 201)

        return json_response({"error": "Collection non gérée"}, 400)

    @app.delete("/api/data/<collection>/<item_id>")
    def delete_collection_item(collection: str, item_id: str):
        if collection not in ALLOWED_COLLECTIONS:
            return json_response({"error": f"Collection non autorisée: {collection}"}, 404)

        model_map = {"users": User, "air_logs": AirLogEntry, "site_history": SiteHistory}
        item = db.session.get(model_map[collection], item_id)
        if item is None:
            return json_response({"error": "Élément introuvable"}, 404)
        db.session.delete(item)
        db.session.commit()
        return json_response({"message": "Supprimé"})

    @app.post("/api/auth/login")
    def login():
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return json_response({"error": "Payload JSON invalide"}, 400)

        username = str(payload.get("username", "")).strip()
        password = str(payload.get("password", "")).strip()
        user = User.query.filter_by(username=username, password=password, is_active=True).first()
        if user:
            return json_response({"user": user.to_dict()})

        if legacy_enabled():
            rows = read_json_collection("users")
            found = next((row for row in rows if row.get("username") == username and row.get("password") == password), None)
            if found:
                return json_response({"user": {key: value for key, value in found.items() if key != "password"}})

        return json_response({"error": "Utilisateur inconnu ou mot de passe incorrect"}, 401)

    @app.get("/api/module-states/<module_key>")
    def get_module_state(module_key: str):
        record = ModuleState.query.filter_by(module_key=module_key).first()
        if record is None:
            return json_response({"error": "Etat de module introuvable"}, 404)
        return json_response(record.to_dict())

    @app.put("/api/module-states/<module_key>")
    @app.post("/api/module-states/<module_key>")
    def save_module_state(module_key: str):
        payload = request.get_json(silent=True)
        if not isinstance(payload, (dict, list)):
            return json_response({"error": "Payload JSON invalide"}, 400)

        state_payload = payload.get("data") if "data" in payload else payload
        if not isinstance(state_payload, (dict, list)):
            return json_response({"error": "Le contenu data doit etre un objet ou un tableau JSON"}, 400)

        record = ModuleState.query.filter_by(module_key=module_key).first()
        if record is None:
            record = ModuleState(module_key=module_key)
            db.session.add(record)

        record.data = sanitize_value(state_payload)
        db.session.commit()
        return json_response(record.to_dict(), 201 if payload.get("create") else 200)

    @app.get("/api/meetings")
    def list_meetings():
        rows = Meeting.query.order_by(Meeting.meeting_date.desc(), Meeting.start_time.desc()).all()
        return json_response([meeting.to_dict(include_minutes=True) for meeting in rows])

    @app.post("/api/meetings")
    def create_meeting():
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return json_response({"error": "Payload JSON invalide"}, 400)
        meeting = upsert_meeting(payload)
        db.session.commit()
        return json_response(meeting.to_dict(include_minutes=True), 201)

    @app.get("/api/meetings/<meeting_id>")
    def get_meeting(meeting_id: str):
        meeting = db.session.get(Meeting, meeting_id)
        if meeting is None:
            return json_response({"error": "Réunion introuvable"}, 404)
        return json_response(meeting.to_dict(include_minutes=True))

    @app.put("/api/meetings/<meeting_id>")
    @app.patch("/api/meetings/<meeting_id>")
    def update_meeting(meeting_id: str):
        meeting = db.session.get(Meeting, meeting_id)
        if meeting is None:
            return json_response({"error": "Réunion introuvable"}, 404)
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return json_response({"error": "Payload JSON invalide"}, 400)
        upsert_meeting(payload, meeting)
        db.session.commit()
        return json_response(meeting.to_dict(include_minutes=True))

    @app.delete("/api/meetings/<meeting_id>")
    def delete_meeting(meeting_id: str):
        meeting = db.session.get(Meeting, meeting_id)
        if meeting is None:
            return json_response({"error": "Réunion introuvable"}, 404)
        db.session.delete(meeting)
        db.session.commit()
        return json_response({"message": "Réunion supprimée"})

    @app.get("/api/meetings/<meeting_id>/minutes")
    def get_meeting_minutes(meeting_id: str):
        minutes = MeetingMinute.query.filter_by(meeting_id=meeting_id).first()
        if minutes is None:
            return json_response({"error": "PV introuvable"}, 404)
        return json_response(minutes.to_dict())

    @app.post("/api/meetings/<meeting_id>/minutes")
    @app.put("/api/meetings/<meeting_id>/minutes")
    def save_meeting_minutes(meeting_id: str):
        meeting = db.session.get(Meeting, meeting_id)
        if meeting is None:
            return json_response({"error": "Réunion introuvable"}, 404)
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return json_response({"error": "Payload JSON invalide"}, 400)
        minutes = upsert_meeting_minutes(meeting_id, payload)
        db.session.commit()
        return json_response(minutes.to_dict(), 201)

    @app.get("/api/audits")
    def list_audits():
        rows = Audit.query.order_by(Audit.planned_date.desc(), Audit.created_at.desc()).all()
        return json_response([audit.to_dict() for audit in rows])

    @app.post("/api/audits")
    def create_audit():
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return json_response({"error": "Payload JSON invalide"}, 400)
        audit = upsert_audit(payload)
        db.session.commit()
        return json_response(audit.to_dict(), 201)

    @app.get("/api/audits/<audit_id>")
    def get_audit(audit_id: str):
        audit = db.session.get(Audit, audit_id)
        if audit is None:
            return json_response({"error": "Audit introuvable"}, 404)
        return json_response(audit.to_dict())

    @app.put("/api/audits/<audit_id>")
    @app.patch("/api/audits/<audit_id>")
    def update_audit(audit_id: str):
        audit = db.session.get(Audit, audit_id)
        if audit is None:
            return json_response({"error": "Audit introuvable"}, 404)
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return json_response({"error": "Payload JSON invalide"}, 400)
        upsert_audit(payload, audit)
        db.session.commit()
        return json_response(audit.to_dict())

    @app.delete("/api/audits/<audit_id>")
    def delete_audit(audit_id: str):
        audit = db.session.get(Audit, audit_id)
        if audit is None:
            return json_response({"error": "Audit introuvable"}, 404)
        db.session.delete(audit)
        db.session.commit()
        return json_response({"message": "Audit supprimé"})

    @app.get("/api/actions")
    def list_actions():
        rows = ActionItem.query.order_by(ActionItem.created_at.desc()).all()
        return json_response([action.to_dict() for action in rows])

    @app.post("/api/actions")
    def create_action():
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return json_response({"error": "Payload JSON invalide"}, 400)
        action = upsert_action(payload)
        db.session.commit()
        return json_response(action.to_dict(), 201)

    @app.get("/api/actions/<action_id>")
    def get_action(action_id: str):
        action = db.session.get(ActionItem, action_id)
        if action is None:
            return json_response({"error": "Action introuvable"}, 404)
        return json_response(action.to_dict())

    @app.put("/api/actions/<action_id>")
    @app.patch("/api/actions/<action_id>")
    def update_action(action_id: str):
        action = db.session.get(ActionItem, action_id)
        if action is None:
            return json_response({"error": "Action introuvable"}, 404)
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return json_response({"error": "Payload JSON invalide"}, 400)
        upsert_action(payload, action)
        db.session.commit()
        return json_response(action.to_dict())

    @app.delete("/api/actions/<action_id>")
    def delete_action(action_id: str):
        action = db.session.get(ActionItem, action_id)
        if action is None:
            return json_response({"error": "Action introuvable"}, 404)
        db.session.delete(action)
        db.session.commit()
        return json_response({"message": "Action supprimée"})

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
