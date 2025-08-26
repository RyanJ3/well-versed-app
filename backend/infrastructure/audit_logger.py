# backend/infrastructure/audit_logger.py
import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from enum import Enum
import hashlib

logger = logging.getLogger(__name__)

class AuditEventType(Enum):
    """Types of audit events"""
    # Authentication events
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    TOKEN_REFRESH = "token_refresh"
    TOKEN_REFRESH_FAILED = "token_refresh_failed"
    
    # Security events
    ACCOUNT_LOCKED = "account_locked"
    ACCOUNT_UNLOCKED = "account_unlocked"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    
    # Authorization events
    ACCESS_GRANTED = "access_granted"
    ACCESS_DENIED = "access_denied"
    PERMISSION_CHANGED = "permission_changed"
    
    # User management
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    PASSWORD_CHANGED = "password_changed"
    PASSWORD_RESET = "password_reset"

class AuditLogger:
    """Comprehensive audit logging for security events"""
    
    def __init__(self):
        self.enabled = os.getenv("AUDIT_LOGGING", "true").lower() == "true"
        self.log_file = os.getenv("AUDIT_LOG_FILE", "/var/log/wellversed/audit.log")
        self.include_pii = os.getenv("AUDIT_LOG_PII", "false").lower() == "true"
        
        # Setup dedicated audit logger
        self.audit_logger = self._setup_audit_logger()
        
    def _setup_audit_logger(self) -> logging.Logger:
        """Setup dedicated logger for audit events"""
        audit_logger = logging.getLogger("audit")
        audit_logger.setLevel(logging.INFO)
        
        # Create formatter with structured output
        formatter = logging.Formatter(
            '%(asctime)s - AUDIT - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        # Console handler (always enabled)
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        audit_logger.addHandler(console_handler)
        
        # File handler (if path is writable)
        try:
            os.makedirs(os.path.dirname(self.log_file), exist_ok=True)
            file_handler = logging.FileHandler(self.log_file)
            file_handler.setFormatter(formatter)
            audit_logger.addHandler(file_handler)
        except (OSError, PermissionError) as e:
            logger.warning(f"Cannot write to audit log file {self.log_file}: {e}")
        
        return audit_logger
    
    def _sanitize_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Remove or hash sensitive data"""
        if not data:
            return {}
            
        sanitized = data.copy()
        
        # List of sensitive fields to remove or hash
        sensitive_fields = ['password', 'token', 'refresh_token', 'access_token', 
                           'id_token', 'secret', 'api_key', 'private_key']
        
        for field in sensitive_fields:
            if field in sanitized:
                # Remove completely or hash based on settings
                if self.include_pii:
                    # Hash sensitive data instead of removing
                    sanitized[field] = hashlib.sha256(
                        str(sanitized[field]).encode()
                    ).hexdigest()[:8] + "..."
                else:
                    sanitized[field] = "[REDACTED]"
        
        # Handle email addresses
        if 'email' in sanitized and not self.include_pii:
            email = sanitized['email']
            if '@' in email:
                name, domain = email.split('@')
                sanitized['email'] = f"{name[:2]}***@{domain}"
        
        # Handle IP addresses
        if 'ip_address' in sanitized and not self.include_pii:
            ip = sanitized['ip_address']
            if '.' in ip:  # IPv4
                parts = ip.split('.')
                sanitized['ip_address'] = f"{parts[0]}.{parts[1]}.xxx.xxx"
            elif ':' in ip:  # IPv6
                sanitized['ip_address'] = ip[:10] + "..."
                
        return sanitized
    
    def log_event(
        self,
        event_type: AuditEventType,
        user_id: Optional[str] = None,
        username: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        success: bool = True,
        details: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None
    ) -> None:
        """Log an audit event"""
        if not self.enabled:
            return
        
        # Build audit entry
        audit_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type.value,
            "success": success,
            "user_id": user_id,
            "username": username,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "environment": os.getenv("ENVIRONMENT", "unknown")
        }
        
        # Add optional fields
        if details:
            audit_entry["details"] = self._sanitize_data(details)
        
        if error_message:
            audit_entry["error"] = error_message
        
        # Calculate risk score for certain events
        risk_score = self._calculate_risk_score(event_type, success, details)
        if risk_score > 0:
            audit_entry["risk_score"] = risk_score
        
        # Log as JSON for easy parsing
        self.audit_logger.info(json.dumps(audit_entry))
        
        # Alert on high-risk events
        if risk_score >= 80:
            self._send_security_alert(audit_entry)
    
    def _calculate_risk_score(
        self, 
        event_type: AuditEventType, 
        success: bool,
        details: Optional[Dict[str, Any]]
    ) -> int:
        """Calculate risk score for security events (0-100)"""
        score = 0
        
        # Failed authentication attempts
        if event_type == AuditEventType.LOGIN_FAILED:
            score = 30
            if details and details.get("attempts", 0) > 3:
                score = 60
            if details and details.get("attempts", 0) > 5:
                score = 80
        
        # Account locked
        elif event_type == AuditEventType.ACCOUNT_LOCKED:
            score = 70
        
        # Rate limiting
        elif event_type == AuditEventType.RATE_LIMIT_EXCEEDED:
            score = 50
        
        # Suspicious activity
        elif event_type == AuditEventType.SUSPICIOUS_ACTIVITY:
            score = 90
        
        # Access denied to sensitive resources
        elif event_type == AuditEventType.ACCESS_DENIED:
            score = 40
            if details and "admin" in str(details.get("resource", "")):
                score = 60
        
        return score
    
    def _send_security_alert(self, audit_entry: Dict[str, Any]) -> None:
        """Send alert for high-risk security events"""
        # In production, this would send to:
        # - Security monitoring system (e.g., Datadog, Splunk)
        # - Email/SMS to security team
        # - Slack/Teams channel
        
        logger.critical(f"HIGH RISK SECURITY EVENT: {json.dumps(audit_entry)}")
        
        # TODO: Implement actual alerting mechanism
        # Examples:
        # - AWS SNS
        # - SendGrid for email
        # - Twilio for SMS
        # - Webhook to monitoring service
    
    def get_recent_events(
        self, 
        user_id: Optional[str] = None,
        event_type: Optional[AuditEventType] = None,
        limit: int = 100
    ) -> list:
        """Retrieve recent audit events (would query from database in production)"""
        # In production, this would query from:
        # - Elasticsearch
        # - PostgreSQL audit table
        # - CloudWatch Logs
        # - Splunk
        
        # For now, just return empty list
        logger.info(f"Audit log query: user_id={user_id}, type={event_type}, limit={limit}")
        return []

# Global audit logger instance
audit_logger = AuditLogger()

def get_audit_logger() -> AuditLogger:
    """Get audit logger instance"""
    return audit_logger