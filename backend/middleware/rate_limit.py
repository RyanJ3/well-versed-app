# backend/middleware/rate_limit.py
import os
import time
import hashlib
import json
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from datetime import datetime, timedelta
import logging
import redis
from redis.exceptions import ConnectionError as RedisConnectionError

logger = logging.getLogger(__name__)

class RateLimiter:
    """Advanced rate limiter with Redis backend and account lockout"""
    
    def __init__(self):
        self.redis_client = self._get_redis_client()
        self.enabled = self.redis_client is not None
        
        # Configure limits - strict 3 attempts only
        self.login_attempts_limit = 3  # Max login attempts (reduced from 5)
        self.login_window = 900  # 15 minutes window (increased from 5)
        self.lockout_duration = 1800  # 30 minutes lockout (increased from 15)
        
        # Create slowapi limiter for general rate limiting
        self.limiter = Limiter(
            key_func=self._get_identifier,
            default_limits=["100/minute"],
            enabled=self.enabled
        )
        
    def _get_redis_client(self) -> Optional[redis.Redis]:
        """Initialize Redis client if available"""
        try:
            # Check if Redis is configured
            redis_host = os.getenv("REDIS_HOST", "localhost")
            redis_port = int(os.getenv("REDIS_PORT", 6379))
            redis_db = int(os.getenv("REDIS_DB", 0))
            
            # Don't use Redis in local development unless explicitly configured
            if os.getenv("ENVIRONMENT") == "local" and not os.getenv("USE_REDIS"):
                logger.info("Rate limiting disabled in local environment (no Redis)")
                return None
                
            client = redis.Redis(
                host=redis_host,
                port=redis_port,
                db=redis_db,
                decode_responses=True,
                socket_connect_timeout=1
            )
            
            # Test connection
            client.ping()
            logger.info(f"Redis connected for rate limiting at {redis_host}:{redis_port}")
            return client
            
        except (RedisConnectionError, Exception) as e:
            logger.warning(f"Redis not available for rate limiting: {e}")
            return None
    
    def _get_identifier(self, request: Request) -> str:
        """Get unique identifier for rate limiting (IP + User Agent hash)"""
        ip = get_remote_address(request)
        user_agent = request.headers.get("User-Agent", "")
        
        # Create a hash of IP + User Agent for better tracking
        identifier = f"{ip}:{hashlib.md5(user_agent.encode()).hexdigest()[:8]}"
        return identifier
    
    async def check_login_attempt(self, request: Request, username: str) -> Dict[str, Any]:
        """Check if login attempt is allowed and track failed attempts"""
        if not self.enabled:
            return {"allowed": True, "attempts_remaining": self.login_attempts_limit}
            
        identifier = self._get_identifier(request)
        
        # Check if account is locked
        lockout_key = f"lockout:{username}"
        if self.redis_client.exists(lockout_key):
            lockout_expires = self.redis_client.ttl(lockout_key)
            minutes_remaining = (lockout_expires + 59) // 60  # Round up to nearest minute
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account locked due to too many failed attempts. Try again in {minutes_remaining} minute{'s' if minutes_remaining != 1 else ''}.",
                headers={"X-RateLimit-Remaining": "0", "X-RateLimit-Reset": str(lockout_expires)}
            )
        
        # Check IP-based rate limit
        ip_key = f"login_attempts:ip:{identifier}"
        ip_attempts = self.redis_client.get(ip_key)
        ip_count = int(ip_attempts) if ip_attempts else 0
        
        if ip_count >= self.login_attempts_limit:
            ttl = self.redis_client.ttl(ip_key)
            minutes_remaining = (ttl + 59) // 60  # Round up to nearest minute
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Maximum login attempts (3) exceeded. Try again in {minutes_remaining} minute{'s' if minutes_remaining != 1 else ''}.",
                headers={"X-RateLimit-Remaining": "0", "X-RateLimit-Reset": str(ttl)}
            )
        
        # Return remaining attempts
        attempts_remaining = self.login_attempts_limit - ip_count
        return {"allowed": True, "attempts_remaining": attempts_remaining}
    
    async def record_failed_login(self, request: Request, username: str) -> None:
        """Record failed login attempt"""
        if not self.enabled:
            return
            
        identifier = self._get_identifier(request)
        
        # Track attempts by username
        user_key = f"login_attempts:user:{username}"
        user_attempts = self.redis_client.incr(user_key)
        self.redis_client.expire(user_key, self.login_window)
        
        # Track attempts by IP
        ip_key = f"login_attempts:ip:{identifier}"
        ip_attempts = self.redis_client.incr(ip_key)
        self.redis_client.expire(ip_key, self.login_window)
        
        # Lock account if too many attempts
        if user_attempts >= self.login_attempts_limit:
            lockout_key = f"lockout:{username}"
            self.redis_client.setex(lockout_key, self.lockout_duration, "locked")
            
            # Log security event
            self._log_security_event({
                "event": "account_locked",
                "username": username,
                "ip": identifier,
                "attempts": user_attempts,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account locked after 3 failed attempts. Try again in {self.lockout_duration // 60} minutes.",
                headers={"X-RateLimit-Remaining": "0"}
            )
    
    async def record_successful_login(self, request: Request, username: str) -> None:
        """Clear failed attempts on successful login"""
        if not self.enabled:
            return
            
        identifier = self._get_identifier(request)
        
        # Clear failed attempt counters
        self.redis_client.delete(f"login_attempts:user:{username}")
        self.redis_client.delete(f"login_attempts:ip:{identifier}")
        self.redis_client.delete(f"lockout:{username}")
        
        # Log successful login
        self._log_security_event({
            "event": "login_success",
            "username": username,
            "ip": identifier,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    def _log_security_event(self, event: Dict[str, Any]) -> None:
        """Log security events for audit trail"""
        if not self.enabled:
            return
            
        # Store in Redis list for recent events
        event_json = json.dumps(event)
        self.redis_client.lpush("security_events", event_json)
        self.redis_client.ltrim("security_events", 0, 9999)  # Keep last 10000 events
        
        # Also log to application logs
        logger.info(f"Security Event: {event_json}")
    
    def get_limiter(self):
        """Get the slowapi limiter instance"""
        return self.limiter

# Global rate limiter instance
rate_limiter = RateLimiter()

def get_rate_limiter() -> RateLimiter:
    """Get rate limiter instance"""
    return rate_limiter