from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(
    os.getenv("APP_DATA_DIR", "").strip()
    or os.getenv("RENDER_DISK_PATH", "").strip()
    or (BASE_DIR / "data").as_posix()
)
DATA_DIR.mkdir(exist_ok=True)

FRONTEND_CANDIDATES = [
    BASE_DIR / "dist",
    Path.cwd() / "dist",
    BASE_DIR.parent / "dist",
]


def resolve_frontend_dist() -> Path:
    return next(
        (candidate for candidate in FRONTEND_CANDIDATES if (candidate / "index.html").exists()),
        FRONTEND_CANDIDATES[0],
    )


FRONTEND_DIST = resolve_frontend_dist()


def env_flag(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def normalize_database_url(url: str) -> str:
    normalized = url.strip()
    if normalized.startswith("mysql://"):
        return normalized.replace("mysql://", "mysql+pymysql://", 1)
    return normalized


def build_database_url() -> str:
    explicit_url = (
        os.getenv("DATABASE_URL")
        or os.getenv("MYSQL_DATABASE_URL")
        or os.getenv("SQLALCHEMY_DATABASE_URI")
        or ""
    ).strip()
    if explicit_url:
        return normalize_database_url(explicit_url)

    mysql_host = os.getenv("MYSQL_HOST", "").strip()
    mysql_port = os.getenv("MYSQL_PORT", "3306").strip() or "3306"
    mysql_user = os.getenv("MYSQL_USER", "").strip()
    mysql_password = os.getenv("MYSQL_PASSWORD", "").strip()
    mysql_database = os.getenv("MYSQL_DATABASE", "").strip()

    if mysql_host and mysql_user and mysql_database:
        return (
            f"mysql+pymysql://{mysql_user}:{mysql_password}"
            f"@{mysql_host}:{mysql_port}/{mysql_database}"
        )

    return f"sqlite:///{(DATA_DIR / 'app.db').as_posix()}"


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "italcar-energy-secret")
    SQLALCHEMY_DATABASE_URI = build_database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 280,
    }
    LEGACY_FALLBACK_ENABLED = env_flag("LEGACY_FALLBACK_ENABLED", True)
