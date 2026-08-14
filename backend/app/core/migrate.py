"""
FikirBiz Backend — Alembic Migration Helper.

Production-da (DEBUG=false) verilənlər bazası cədvəlləri avtomatik
olaraq migrationlar vasitəsilə hazırlanır.

Bəzi mühitlərdə cədvəllər əl ilə (migration olmadan) yaradılıb —
bu halda mövcud cədvəllər "baseline" kimi stamp edilir və yalnız
çatışmayan migrationlar icra olunur.
"""

import asyncio
import traceback
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings

_BACKEND_DIR = Path(__file__).resolve().parents[2]
_ALEMBIC_INI = _BACKEND_DIR / "alembic.ini"
_ALEMBIC_DIR = _BACKEND_DIR / "alembic"

# İlk migration (6e4758be9f4f) tərəfindən yaradılan cədvəllər
_M1_TABLES = {
    "users",
    "refresh_tokens",
    "password_resets",
    "audit_logs",
    "canva_connections",
}

_BASELINE_REVISION = "6e4758be9f4f"


def _db_has_manual_schema() -> bool:
    """alembic_version cədvəli yoxdursa, lakin ilk migration-ın bütün
    cədvəlləri varsa, DB əl ilə yaradılıb (stamp tələb olunur)."""
    async def check() -> bool:
        engine = create_async_engine(settings.DATABASE_URL)
        try:
            async with engine.connect() as conn:
                r = await conn.execute(text(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
                ))
                tables = {row[0] for row in r.fetchall()}
                r = await conn.execute(text(
                    "SELECT to_regclass('public.alembic_version')"
                ))
                alembic_version_exists = r.fetchone()[0] is not None
                return (not alembic_version_exists) and _M1_TABLES.issubset(tables)
        except Exception as e:
            print(f"[DB] Schema check failed: {e}")
            return False
        finally:
            await engine.dispose()

    return asyncio.run(check())


def run_migrations() -> None:
    """Gözləyən bütün migrationları icra edir (idempotent).

    Xəta baş verərsə tam traceback çap olunur ki, Render log-da
    aydın görünsün.
    """
    try:
        cfg = Config(str(_ALEMBIC_INI))
        cfg.set_main_option("script_location", str(_ALEMBIC_DIR))

        if _db_has_manual_schema():
            print("[DB] Existing manual schema detected — stamping baseline revision")
            command.stamp(cfg, _BASELINE_REVISION)

        command.upgrade(cfg, "head")
        print("[DB] Migrations applied successfully")
    except Exception:
        print("[DB] Migration failed with the following traceback:")
        traceback.print_exc()
        raise
