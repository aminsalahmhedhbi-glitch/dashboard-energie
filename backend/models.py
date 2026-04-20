from __future__ import annotations

from datetime import date, datetime, time

from .extensions import db


def iso_datetime(value: datetime | None) -> str | None:
    return value.isoformat(timespec="seconds") if value else None


def iso_date(value: date | None) -> str | None:
    return value.isoformat() if value else None


def iso_time(value: time | None) -> str | None:
    return value.strftime("%H:%M") if value else None


class TimestampMixin:
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class User(TimestampMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(64), primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False, default="EQUIPE_ENERGIE")
    full_name = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    def to_dict(self, include_password: bool = False) -> dict:
        data = {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "fullName": self.full_name,
            "_createdAt": iso_datetime(self.created_at),
            "_updatedAt": iso_datetime(self.updated_at),
        }
        if include_password:
            data["password"] = self.password
        return data


class PacMeasurement(TimestampMixin, db.Model):
    __tablename__ = "pac_measurements"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    site_code = db.Column(db.String(32), nullable=False, index=True)
    measured_at = db.Column(db.DateTime, nullable=False, index=True)
    p_sum_kw = db.Column(db.Float)
    q_sum_kvar = db.Column(db.Float)
    s_sum_kva = db.Column(db.Float)
    pf_sum = db.Column(db.Float)
    v_avg_v = db.Column(db.Float)
    i_avg_a = db.Column(db.Float)
    freq_hz = db.Column(db.Float)
    source_ip = db.Column(db.String(64))
    source_file = db.Column(db.String(255))
    payload = db.Column(db.JSON, nullable=False, default=dict)

    __table_args__ = (
        db.UniqueConstraint("site_code", "measured_at", name="uq_pac_site_measured_at"),
    )

    def to_measurement_dict(self) -> dict:
        return {
            "id": self.id,
            "site": self.site_code,
            "Timestamp": iso_datetime(self.measured_at),
            "P_SUM_kW": self.p_sum_kw,
            "Q_SUM_kvar": self.q_sum_kvar,
            "S_SUM_kVA": self.s_sum_kva,
            "PF_SUM": self.pf_sum,
            "V_AVG_V": self.v_avg_v,
            "I_AVG_A": self.i_avg_a,
            "FREQ_Hz": self.freq_hz,
            "source_ip": self.source_ip,
            "source_file": self.source_file,
            "_createdAt": iso_datetime(self.created_at),
            **(self.payload or {}),
        }


class BillingRecord(TimestampMixin, db.Model):
    __tablename__ = "billing_records"

    id = db.Column(db.String(64), primary_key=True)
    record_date = db.Column(db.String(16), nullable=False, index=True)
    billing_timestamp = db.Column(db.String(32))
    site_id = db.Column(db.String(32), nullable=False, index=True)
    site_name = db.Column(db.String(255), nullable=False)
    site_type = db.Column(db.String(32), nullable=False, index=True)
    billed_kwh = db.Column(db.Float)
    consumption_grid = db.Column(db.Float)
    production_pv = db.Column(db.Float)
    current_month_balance = db.Column(db.Float)
    previous_balance = db.Column(db.Float)
    total_balance = db.Column(db.Float)
    total_final_ttc = db.Column(db.Float)
    net_to_pay = db.Column(db.Float)
    max_power = db.Column(db.Float)
    cos_phi = db.Column(db.Float)
    power_overrun = db.Column(db.Float)
    power_overrun_amount = db.Column(db.Float)
    payload = db.Column(db.JSON, nullable=False, default=dict)

    def to_dict(self) -> dict:
        data = dict(self.payload or {})
        data.update(
            {
                "id": self.id,
                "recordDate": self.record_date,
                "timestamp": self.billing_timestamp,
                "siteId": self.site_id,
                "siteName": self.site_name,
                "siteType": self.site_type,
                "billedKwh": self.billed_kwh,
                "consumptionGrid": self.consumption_grid,
                "productionPv": self.production_pv,
                "currentMonthBalance": self.current_month_balance,
                "previousBalance": self.previous_balance,
                "totalBalance": self.total_balance,
                "totalFinalTTC": self.total_final_ttc,
                "netToPay": self.net_to_pay,
                "maxPower": self.max_power,
                "cosPhi": self.cos_phi,
                "powerOverrun": self.power_overrun,
                "powerOverrunAmount": self.power_overrun_amount,
                "_createdAt": iso_datetime(self.created_at),
                "_updatedAt": iso_datetime(self.updated_at),
            }
        )
        return data

    def to_facture_dict(self, site_key: str | None = None) -> dict:
        consommation = (
            self.billed_kwh
            if self.billed_kwh is not None
            else self.consumption_grid
        )
        pmax = self.max_power
        cos_phi = self.cos_phi
        prix = self.net_to_pay if self.net_to_pay is not None else self.total_final_ttc

        data = self.to_dict()
        data.update(
            {
                "site": site_key or self.site_name,
                "siteKey": site_key,
                "date": self.record_date,
                "consommationKwh": consommation,
                "consommation_kwh": consommation,
                "pmaxKva": pmax,
                "pmax_kva": pmax,
                "cosPhi": cos_phi,
                "cos_phi": cos_phi,
                "prixDt": prix,
                "prix_dt": prix,
            }
        )
        return data


class SiteHistory(TimestampMixin, db.Model):
    __tablename__ = "site_histories"

    id = db.Column(db.String(64), primary_key=True)
    site_code = db.Column(db.String(32), nullable=False, index=True)
    year_label = db.Column(db.String(16), nullable=False, index=True)
    months = db.Column(db.JSON, nullable=False, default=list)
    temperature = db.Column(db.JSON, nullable=False, default=list)
    grid = db.Column(db.JSON, nullable=False, default=list)
    pv_prod = db.Column(db.JSON, nullable=False, default=list)
    pv_export = db.Column(db.JSON, nullable=False, default=list)

    def to_dict(self) -> dict:
        return {
            "historyId": self.id,
            "site": self.site_code,
            "year": self.year_label,
            "months": self.months or [],
            "temperature": self.temperature or [],
            "grid": self.grid or [],
            "pvProd": self.pv_prod or [],
            "pvExport": self.pv_export or [],
            "_createdAt": iso_datetime(self.created_at),
            "_updatedAt": iso_datetime(self.updated_at),
        }


class AirLogEntry(TimestampMixin, db.Model):
    __tablename__ = "air_logs"

    id = db.Column(db.String(64), primary_key=True)
    entry_type = db.Column(db.String(64), index=True)
    week_label = db.Column(db.String(32), index=True)
    asset_name = db.Column(db.String(255))
    payload = db.Column(db.JSON, nullable=False, default=dict)

    def to_dict(self) -> dict:
        data = dict(self.payload or {})
        data.update(
            {
                "id": self.id,
                "type": self.entry_type or data.get("type"),
                "week": self.week_label or data.get("week"),
                "compName": self.asset_name or data.get("compName"),
                "_createdAt": iso_datetime(self.created_at),
                "_updatedAt": iso_datetime(self.updated_at),
            }
        )
        return data


class ModuleState(TimestampMixin, db.Model):
    __tablename__ = "module_states"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    module_key = db.Column(db.String(120), nullable=False, unique=True, index=True)
    data = db.Column(db.JSON, nullable=False, default=dict)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "moduleKey": self.module_key,
            "data": self.data or {},
            "_createdAt": iso_datetime(self.created_at),
            "_updatedAt": iso_datetime(self.updated_at),
        }


class Meeting(TimestampMixin, db.Model):
    __tablename__ = "meetings"

    id = db.Column(db.String(64), primary_key=True)
    meeting_type = db.Column(db.String(120), nullable=False)
    meeting_date = db.Column(db.Date, nullable=False, index=True)
    start_time = db.Column(db.Time)
    end_time = db.Column(db.Time)
    location = db.Column(db.String(255))
    site = db.Column(db.String(120))
    agenda = db.Column(db.Text)
    status = db.Column(db.String(50), nullable=False, default="PLANIFIED")
    created_by = db.Column(db.String(64), db.ForeignKey("users.id"))

    minutes = db.relationship(
        "MeetingMinute",
        back_populates="meeting",
        cascade="all, delete-orphan",
        uselist=False,
    )
    actions = db.relationship("ActionItem", back_populates="meeting", lazy="select")

    def to_dict(self, include_minutes: bool = False) -> dict:
        data = {
            "id": self.id,
            "type": self.meeting_type,
            "date": iso_date(self.meeting_date),
            "heureDebut": iso_time(self.start_time),
            "heureFin": iso_time(self.end_time),
            "lieu": self.location,
            "site": self.site,
            "ordreJour": self.agenda,
            "status": self.status,
            "_createdAt": iso_datetime(self.created_at),
            "_updatedAt": iso_datetime(self.updated_at),
        }
        if include_minutes and self.minutes:
            data["pv"] = self.minutes.to_dict()
        return data


class MeetingMinute(TimestampMixin, db.Model):
    __tablename__ = "meeting_minutes"

    id = db.Column(db.String(64), primary_key=True)
    meeting_id = db.Column(db.String(64), db.ForeignKey("meetings.id"), nullable=False, unique=True)
    title = db.Column(db.String(255))
    summary = db.Column(db.Text)
    decisions = db.Column(db.JSON, nullable=False, default=list)
    attendees = db.Column(db.JSON, nullable=False, default=list)
    content = db.Column(db.Text, nullable=False, default="")

    meeting = db.relationship("Meeting", back_populates="minutes")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "meetingId": self.meeting_id,
            "title": self.title,
            "summary": self.summary,
            "decisions": self.decisions or [],
            "attendees": self.attendees or [],
            "content": self.content,
            "_createdAt": iso_datetime(self.created_at),
            "_updatedAt": iso_datetime(self.updated_at),
        }


class Audit(TimestampMixin, db.Model):
    __tablename__ = "audits"

    id = db.Column(db.String(64), primary_key=True)
    ref = db.Column(db.String(120), unique=True, nullable=False, index=True)
    internal_ref = db.Column(db.String(120))
    audit_type = db.Column(db.String(50), nullable=False, index=True)
    scope = db.Column(db.Text, nullable=False)
    site = db.Column(db.String(120), nullable=False, index=True)
    planned_date = db.Column(db.Date)
    actual_date = db.Column(db.Date)
    objective = db.Column(db.Text)
    team = db.Column(db.JSON, nullable=False, default=list)
    documents = db.Column(db.JSON, nullable=False, default=list)

    findings = db.relationship(
        "AuditFinding",
        back_populates="audit",
        cascade="all, delete-orphan",
        lazy="select",
    )
    actions = db.relationship("ActionItem", back_populates="audit", lazy="select")

    def to_dict(self, include_findings: bool = True) -> dict:
        data = {
            "id": self.id,
            "ref": self.ref,
            "refInterne": self.internal_ref,
            "type": self.audit_type,
            "champ": self.scope,
            "site": self.site,
            "datePrevue": iso_date(self.planned_date),
            "dateReelle": iso_date(self.actual_date),
            "objectif": self.objective,
            "equipe": self.team or [],
            "documents": self.documents or [],
            "_createdAt": iso_datetime(self.created_at),
            "_updatedAt": iso_datetime(self.updated_at),
        }
        if include_findings:
            data["constats"] = [finding.to_dict() for finding in self.findings]
        return data


class ActionItem(TimestampMixin, db.Model):
    __tablename__ = "actions"

    id = db.Column(db.String(64), primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    source_type = db.Column(db.String(50), nullable=False, default="MANUAL", index=True)
    action_type = db.Column(db.String(50), nullable=False, default="Corrective")
    owner_name = db.Column(db.String(255))
    progress = db.Column(db.Integer, nullable=False, default=0)
    status = db.Column(db.String(50), nullable=False, default="OPEN")
    due_date = db.Column(db.Date)
    notes = db.Column(db.Text)
    audit_id = db.Column(db.String(64), db.ForeignKey("audits.id"))
    meeting_id = db.Column(db.String(64), db.ForeignKey("meetings.id"))

    audit = db.relationship("Audit", back_populates="actions")
    meeting = db.relationship("Meeting", back_populates="actions")
    findings = db.relationship("AuditFinding", back_populates="linked_action", lazy="select")

    def to_dict(self) -> dict:
        source_label = {
            "AUDIT": "Audit",
            "MEETING": "Réunion",
            "MANUAL": "Manuel",
        }.get((self.source_type or "MANUAL").upper(), self.source_type)
        return {
            "id": self.id,
            "designation": self.title,
            "source": source_label,
            "sourceType": self.source_type,
            "type": self.action_type,
            "responsable": self.owner_name,
            "avancement": self.progress,
            "status": self.status,
            "dueDate": iso_date(self.due_date),
            "notes": self.notes,
            "auditId": self.audit_id,
            "meetingId": self.meeting_id,
            "_createdAt": iso_datetime(self.created_at),
            "_updatedAt": iso_datetime(self.updated_at),
        }


class AuditFinding(TimestampMixin, db.Model):
    __tablename__ = "audit_findings"

    id = db.Column(db.String(64), primary_key=True)
    audit_id = db.Column(db.String(64), db.ForeignKey("audits.id"), nullable=False, index=True)
    title = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(50), nullable=False, default="Mineure")
    action_label = db.Column(db.String(255))
    follow_up = db.Column(db.String(50), default="0%")
    notes = db.Column(db.Text)
    linked_action_id = db.Column(db.String(64), db.ForeignKey("actions.id"))

    audit = db.relationship("Audit", back_populates="findings")
    linked_action = db.relationship("ActionItem", back_populates="findings")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "objet": self.title,
            "gravite": self.severity,
            "action": self.action_label,
            "suivi": self.follow_up,
            "notes": self.notes,
            "linkedActionId": self.linked_action_id,
            "_createdAt": iso_datetime(self.created_at),
            "_updatedAt": iso_datetime(self.updated_at),
        }
