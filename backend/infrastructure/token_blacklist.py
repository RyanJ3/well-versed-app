# backend/infrastructure/token_blacklist.py
import os
import json
import redis
from typing import Optional
from datetime import datetime, timedelta
import logging
from jose import jwt, JWTError
from redis.exceptions import ConnectionError as RedisConnectionError

logger = logging.getLogger(__name__)

class TokenBlacklist:
    """Token blacklist management for secure logout and token revocation"""
    
    def __init__(self):
        self.redis_client = self._get_redis_client()
        self.enabled = self.redis_client is not None
        
    def _get_redis_client(self) -> Optional[redis.Redis]:
        """Initialize Redis client for token blacklisting"""
        try:
            # Check if Redis is configured
            redis_host = os.getenv("REDIS_HOST", "localhost")
            redis_port = int(os.getenv("REDIS_PORT", 6379))
            redis_db = int(os.getenv("REDIS_BLACKLIST_DB", 1))  # Use different DB for blacklist
            
            # Don't use Redis in local development unless explicitly configured
            if os.getenv("ENVIRONMENT") == "local" and not os.getenv("USE_REDIS"):
                logger.info("Token blacklisting disabled in local environment (no Redis)")
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
            logger.info(f"Redis connected for token blacklisting at {redis_host}:{redis_port} (db={redis_db})")
            return client
            
        except (RedisConnectionError, Exception) as e:
            logger.warning(f"Redis not available for token blacklisting: {e}")
            return None
    
    def blacklist_token(self, token: str, token_type: str = "access") -> bool:
        """
        Add a token to the blacklist
        
        Args:
            token: The JWT token to blacklist
            token_type: Type of token (access, refresh, id)
            
        Returns:
            True if successfully blacklisted, False otherwise
        """
        if not self.enabled:
            logger.debug("Token blacklisting disabled - Redis not available")
            return False
        
        try:
            # Decode token to get expiration
            # Note: We're not verifying the token here, just reading the exp claim
            unverified_payload = jwt.get_unverified_claims(token)
            exp = unverified_payload.get('exp')
            jti = unverified_payload.get('jti')  # JWT ID if available
            sub = unverified_payload.get('sub')  # User ID
            
            if not exp:
                logger.error("Token has no expiration claim")
                return False
            
            # Calculate TTL (time until token expires)
            current_time = datetime.utcnow().timestamp()
            ttl = int(exp - current_time)
            
            if ttl <= 0:
                logger.debug("Token already expired, not blacklisting")
                return False
            
            # Create blacklist entry
            blacklist_key = f"blacklist:{token_type}:{token[:50]}"  # Use first 50 chars as key
            blacklist_data = {
                "token": token,
                "type": token_type,
                "user_id": sub,
                "jti": jti,
                "blacklisted_at": datetime.utcnow().isoformat(),
                "expires_at": datetime.fromtimestamp(exp).isoformat()
            }
            
            # Store in Redis with TTL
            self.redis_client.setex(
                blacklist_key,
                ttl,
                json.dumps(blacklist_data)
            )
            
            # Also maintain a set of blacklisted tokens for the user
            if sub:
                user_blacklist_key = f"user_blacklist:{sub}"
                self.redis_client.sadd(user_blacklist_key, blacklist_key)
                self.redis_client.expire(user_blacklist_key, ttl)
            
            logger.info(f"Token blacklisted: type={token_type}, user={sub}, ttl={ttl}s")
            return True
            
        except (JWTError, Exception) as e:
            logger.error(f"Failed to blacklist token: {e}")
            return False
    
    def is_blacklisted(self, token: str, token_type: str = "access") -> bool:
        """
        Check if a token is blacklisted
        
        Args:
            token: The JWT token to check
            token_type: Type of token (access, refresh, id)
            
        Returns:
            True if token is blacklisted, False otherwise
        """
        if not self.enabled:
            # If Redis is not available, we can't check blacklist
            # In production, this should fail closed (deny access)
            return False
        
        try:
            blacklist_key = f"blacklist:{token_type}:{token[:50]}"
            exists = self.redis_client.exists(blacklist_key)
            
            if exists:
                logger.debug(f"Token found in blacklist: {token_type}")
                return True
                
            return False
            
        except Exception as e:
            logger.error(f"Failed to check token blacklist: {e}")
            # Fail open in development, fail closed in production
            return os.getenv("ENVIRONMENT") == "production"
    
    def revoke_all_user_tokens(self, user_id: str) -> int:
        """
        Revoke all tokens for a specific user
        
        Args:
            user_id: The user ID whose tokens should be revoked
            
        Returns:
            Number of tokens revoked
        """
        if not self.enabled:
            return 0
        
        try:
            # Get all blacklisted tokens for the user
            user_blacklist_key = f"user_blacklist:{user_id}"
            blacklisted_tokens = self.redis_client.smembers(user_blacklist_key)
            
            # In production, you would also:
            # 1. Query all active sessions for the user
            # 2. Invalidate refresh tokens in Cognito
            # 3. Force re-authentication on all devices
            
            # For now, we'll create a user-wide revocation entry
            revocation_key = f"user_revoked:{user_id}"
            self.redis_client.setex(
                revocation_key,
                86400,  # 24 hours - should be longer than any token lifetime
                datetime.utcnow().isoformat()
            )
            
            logger.info(f"All tokens revoked for user: {user_id}")
            return len(blacklisted_tokens)
            
        except Exception as e:
            logger.error(f"Failed to revoke user tokens: {e}")
            return 0
    
    def is_user_revoked(self, user_id: str) -> bool:
        """
        Check if all tokens for a user have been revoked
        
        Args:
            user_id: The user ID to check
            
        Returns:
            True if user's tokens are revoked, False otherwise
        """
        if not self.enabled:
            return False
        
        try:
            revocation_key = f"user_revoked:{user_id}"
            return self.redis_client.exists(revocation_key)
            
        except Exception as e:
            logger.error(f"Failed to check user revocation: {e}")
            return False
    
    def cleanup_expired(self) -> int:
        """
        Clean up expired blacklist entries (Redis TTL should handle this automatically)
        
        Returns:
            Number of entries cleaned
        """
        # Redis automatically removes expired keys
        # This method is here for manual cleanup if needed
        logger.debug("Redis automatically handles expired key cleanup via TTL")
        return 0

# Global token blacklist instance
token_blacklist = TokenBlacklist()

def get_token_blacklist() -> TokenBlacklist:
    """Get token blacklist instance"""
    return token_blacklist