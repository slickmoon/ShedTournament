from sqlalchemy.orm import Session
from typing import List
from .. import base

class AuditLogService:
    @staticmethod
    def create_log(db: Session, log: str) -> base.AuditLog:
        audit_log = base.AuditLog(log=log)
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        return audit_log

    @staticmethod
    def get_logs(db: Session, limit: int = 100) -> List[base.AuditLog]:
        return db.query(base.AuditLog)\
            .order_by(base.AuditLog.timestamp.desc())\
            .limit(limit)\
            .all() 