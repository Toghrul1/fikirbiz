"""
FikirBiz — Admin hesabını yarat / şifrəsini bərpa et.

İstifadə:
    python -m scripts.create_admin --email admin@fikirbiz.com --password 'Admin123!'

Variantlar:
    # Şifrəni unutmuşsan — mövcud hesabın şifrəsini yenilə
    python -m scripts.create_admin --email admin@fikirbiz.com --password 'Yeni123!' --reset

Parol verilməzsə ADMIN_PASSWORD env dəyəri istifadə olunur.
"""

import argparse
import asyncio
import sys
from pathlib import Path

# `python -m scripts.create_admin` işlədəndə repo kökünü path-ə əlavə et.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select  # noqa: E402

from app.core.bootstrap_admin import count_admins, ensure_admin_user  # noqa: E402
from app.core.database import async_session_factory  # noqa: E402
from app.models.user import User  # noqa: E402
from app.services.password_service import PasswordService  # noqa: E402


async def main() -> int:
    p = argparse.ArgumentParser(description="FikirBiz admin hesabını yarat/bərpa et")
    p.add_argument("--email", required=True, help="Admin e-poçt ünvanı")
    p.add_argument("--password", default=None, help="Şifrə (verilməzsə ADMIN_PASSWORD)")
    p.add_argument("--first-name", default=None)
    p.add_argument("--last-name", default=None)
    p.add_argument(
        "--reset",
        action="store_true",
        help="Mövcud hesabın şifrəsini/rolunu yenilə",
    )
    args = p.parse_args()

    async with async_session_factory() as session:
        existing = await session.execute(
            select(User).where(User.email == args.email.strip().lower())
        )
        existed = existing.scalar_one_or_none() is not None

    if existed and not args.reset:
        print(
            f"Bu e-poçt ilə hesab artıq mövcuddur: {args.email}\n"
            "Şifrəni yeniləmək üçün --reset bayrağından istifadə edin."
        )
        return 1

    user = await ensure_admin_user(
        async_session_factory,
        email=args.email,
        password=args.password,
        first_name=args.first_name,
        last_name=args.last_name,
        reset_password=args.reset,
    )

    if user is None:
        print("Admin yaradıla bilmədi — parol verilmədi və ya şifrə tələblərinə uyğun gəlmir.")
        return 1

    # Yekun yoxlama: həqiqətən giriş edə bilərmi?
    ok = PasswordService.verify_password(args.password, user.password_hash) if args.password else None

    print("-" * 60)
    print(f"Email     : {user.email}")
    print(f"Ad        : {user.first_name} {user.last_name}")
    print(f"Rol       : {user.role}")
    print(f"Aktiv     : {user.is_active}")
    print(f"Təsdiqləndi: {user.is_approved}")
    if ok is not None:
        print(f"Şifrə yoxlaması: {'UĞURLU' if ok else 'UĞURSUZ'}")
    print(f"Cəmi admin sayı: {await count_admins(async_session_factory)}")
    print("-" * 60)
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))