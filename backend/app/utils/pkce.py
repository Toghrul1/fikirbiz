"""
FikirBiz Backend — PKCE Utility.

OAuth 2.0 Authorization Code Flow with Proof Key for Code Exchange (PKCE)
üçün code_verifier, code_challenge və state generasiyası.

Canva Connect API rəsmi sənədlərinə uyğun:
https://www.canva.dev/docs/connect/authentication/
"""

import hashlib
import secrets
import base64


def generate_code_verifier() -> str:
    """
    High-entropy cryptographically random code_verifier generasiya edir.

    Canva tələbləri:
    - 43-128 simvol uzunluğunda
    - Yalnız ASCII hərfləri, rəqəmlər və -, ., _, ~ simvolları
    - Hər sorğu üçün unikal olmalıdır

    Return: base64url encoded string (128 simvol)
    """
    return secrets.token_urlsafe(96)


def generate_code_challenge(code_verifier: str) -> str:
    """
    code_verifier-dən code_challenge generasiya edir.

    Canva tələbi: SHA-256 hash, sonra base64url encoding.

    Args:
        code_verifier: PKCE code verifier string

    Return: base64url encoded SHA-256 hash
    """
    digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")


def generate_state() -> str:
    """
    CSRF qorunması üçün high-entropy random state generasiya edir.

    Canva tələbi: High-entropy random string, hər sorğu üçün unikal.

    Return: base64url encoded string (128 simvol)
    """
    return secrets.token_urlsafe(96)
