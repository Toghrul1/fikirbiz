"""
FikirBiz — İlk Admin Bootstrap.

Yeni (boş) verilenlər bazasında admin panelinə giris mumkun olmur, cunki
`users` cədvəlinde admin rolu olan istifadəci yoxdur. SQL skriptləri yalniz
MOVCUD istifadəcini admin edir — yenisini yaratmir.

Bu modul startup zamaninda **idempotent** formada işleyir:
  * e-poct ile istifadəci artiq yoxdursa -> hec ney etmir (sifre EZILMIR)
  * yoxdursa -> ADMIN_FIRST_NAME / ADMIN_EMAIL / ADMIN_PASSWORD ile admin yaradir
  * movcud admin varsa ve ADMIN_EMAIL bos deyilsa -> yalniz eyni e-poct yoxlanir

Parol env dəyərindən oxunur (heç vaxt repoya yazılmır) və şifrə tələbləri
yoxlanılır.
"""

import logging
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import settings
from app.models.user import User
from app.services.password_service import PasswordService

logger = logging.getLogger(__name__)


async def ensure_admin_user(
    session_factory: async_sessionmaker,
    *,
    email: str | None = None,
    password: str | None = None,
    first_name: str | None = None,
    last_name: str | None = None,
    reset_password: bool = False,
) -> User | None:
    """
    Admin istifadəçisini təmin edir. Mövcud olsa onu qaytarır.

    reset_password=True və istifadəci mövcuddursa — şifrə yenilənir
    (unudulmuş şifrə bərpası üçün).
    """
    email = (email or settings.ADMIN_EMAIL or "").strip().lower()
    password = password if password is not None else settings.ADMIN_PASSWORD

    if not email:
        logger.info("[ADMIN] ADMIN_EMAIL təyin edilmədi — bootstrap atlandı.")
        return None

    if not password:
        logger.warning("[ADMIN] ADMIN_EMAIL var, amma ADMIN_PASSWORD yoxdur — bootstrap atlandı.")
        return None

    errors = PasswordService.validate_password_strength(password)
    if errors:
        logger.error(
            "[ADMIN] ADMIN_PASSWORD şifrə tələblərinə cavab vermir: %s — bootstrap atlandı.",
            ", ".join(str(e.value) for e in errors),
        )
        return None

    async with session_factory() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user:
            if reset_password:
                user.password_hash = PasswordService.hash_password(password)
                user.role = "admin"
                user.is_active = True
                user.is_approved = True
                user.failed_attempts = 0
                user.locked_until = None
                user.updated_at = datetime.now(timezone.utc)
                await session.commit()
                logger.info("[ADMIN] Mövcud admin hesabının şifrəsi yeniləndi: %s", email)
            return user

        # Heç bir admin yoxdursa yeni admin yaradılır.
        # (Admin artıq varsa amma bu e-poçt yoxdursa da yaradılır — çoxlu admin mümkündür.)
        user = User(
            first_name=(first_name or settings.ADMIN_FIRST_NAME or "Admin").strip(),
            last_name=(last_name or settings.ADMIN_LAST_NAME or "User").strip(),
            email=email,
            password_hash=PasswordService.hash_password(password),
            role="admin",
            plan="pro",
            is_active=True,
            is_approved=True,
            failed_attempts=0,
        )
        session.add(user)
        await session.commit()

    logger.info("[ADMIN] İlk admin istifadəçisi yaradıldı: %s", email)
    return user


async def count_admins(session_factory: async_sessionmaker) -> int:
    """Admin rolu olan istifadəçilərin sayı (diaqnostika üçün)."""
    async with session_factory() as session:
        result = await session.execute(
            select(func.count()).select_from(User).where(User.role == "admin")
        )
        return int(result.scalar_one())