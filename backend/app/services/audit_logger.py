"""
FikirBiz — Audit Logger Service.

Admin əməliyyatlarını audit_logs cədvəlinə qeyd edir.
"""

import json
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


class AuditLogger:
    """Admin əməliyyatlarının qeydiyyatı xidməti."""

    # Əməliyyat sabitleri
    DEACTIVATE = "DEACTIVATE"
    REACTIVATE = "REACTIVATE"
    ROLE_CHANGE = "ROLE_CHANGE"
    DELETE = "DELETE"

    @staticmethod
    async def log_action(
        db: AsyncSession,
        actor_id: str,
        action: str,
        target_id: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> AuditLog:
        """
        Admin əməliyyatını audit log-a qeyd edir.

        actor_id: Əməliyyatı edən admin
        action: Əməliyyat növü (DEACTIVATE, REACTIVATE, ROLE_CHANGE, DELETE)
        target_id: Əməliyyat edilən istifadəçi
        metadata: Əlavə kontekst
        """
        log = AuditLog(
            actor_id=actor_id,
            action=action,
            target_id=target_id,
            metadata_json=json.dumps(metadata) if metadata else None,
        )
        db.add(log)
        await db.flush()
        return log
