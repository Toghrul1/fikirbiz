"""
FikirBiz Backend — Alembic Migration Helper.

Production-da (DEBUG=false) verilənlər bazası cədvəlləri avtomatik
olaraq migrationlar vasitəsilə hazırlanır.
"""

from pathlib import Path

from alembic import command
from alembic.config import Config

from app.core.config import settings

_BACKEND_DIR = Path(__file__).resolve().parents[2]
_ALEMBIC_INI = _BACKEND_DIR / "alembic.ini"
_ALEMBIC_DIR = _BACKEND_DIR / "alembic"


def run_migrations() -> None:
    """Gözləyən bütün migrationları icra edir (idempotent)."""
    cfg = Config(str(_ALEMBIC_INI))
    cfg.set_main_option("script_location", str(_ALEMBIC_DIR))
    command.upgrade(cfg, "head")
    print("[DB] Migrations applied successfully")
