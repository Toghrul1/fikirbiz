"""
FikirBiz Backend — Rate Limiter.

slowapi ilə rate limiting (IP və user bazlı).
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
