"""
FikirBiz — Password Service.

bcrypt hashing (cost factor 12), şifrə validasiyası.
"""

import re
from enum import Enum

from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


class PasswordValidationError(str, Enum):
    TOO_SHORT = "TOO_SHORT"
    NO_UPPERCASE = "NO_UPPERCASE"
    NO_DIGIT = "NO_DIGIT"
    NO_SPECIAL_CHAR = "NO_SPECIAL_CHAR"


SPECIAL_CHARS = set("!@#$%^&*")


class PasswordService:
    """Şifrə hashing və validasiya xidməti."""

    @staticmethod
    def hash_password(plain: str) -> str:
        """Şifrəni bcrypt ilə hash edir (cost factor 12)."""
        return pwd_context.hash(plain)

    @staticmethod
    def verify_password(plain: str, hashed: str) -> bool:
        """Şifrəni hash ilə müqayisə edir."""
        return pwd_context.verify(plain, hashed)

    @staticmethod
    def validate_password_strength(password: str) -> list[PasswordValidationError]:
        """
        Şifrə tələblərini ayrı-ayrı yoxlayır:
        - Minimum 8 simvol
        - Ən azı bir böyük hərf
        - Ən azı bir rəqəm
        - Ən azı bir xüsusi simvol (!@#$%^&*)

        Pozulan tələblərin siyahısını qaytarır. Boş siyahı = etibarlı.
        """
        errors: list[PasswordValidationError] = []

        if len(password) < 8:
            errors.append(PasswordValidationError.TOO_SHORT)

        if not any(c.isupper() for c in password):
            errors.append(PasswordValidationError.NO_UPPERCASE)

        if not any(c.isdigit() for c in password):
            errors.append(PasswordValidationError.NO_DIGIT)

        if not any(c in SPECIAL_CHARS for c in password):
            errors.append(PasswordValidationError.NO_SPECIAL_CHAR)

        return errors
