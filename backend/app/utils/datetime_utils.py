"""
FikirBiz — Date/Time Utils.

SQLite `DateTime(timezone=True)` timezone məlumatını saxlamır və
`datetime` obyektini **naive** qaytarır. PostgreSQL isə timezone-aware
qaytarır. Eyni kod hər iki bazada işləməlidir, ona görə DB-dən gələn
vaxtları burada normallaşdırıb, `datetime.now(timezone.utc)` ilə
müqayisə edə bilərik.
"""

from datetime import datetime, timezone


def as_utc(value: datetime | None) -> datetime | None:
    """DB-dən gələn datetime-ı timezone-aware UTC-ya çevirir."""
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)