"""
Authentication Factory
======================
Factory pattern for creating the appropriate authentication
provider based on environment configuration.
"""

import os
from typing import Optional
from .interface import AuthInterface
from .config import Environment, EnvVars, AuthMode
from ..local.auth_simple import SimpleLocalAuth
from ..cognito.auth import CognitoAuth


class AuthFactory:
    """
    Factory for creating authentication providers.
    
    Selects the appropriate auth implementation based on
    environment configuration.
    """
    
    _instance: Optional[AuthInterface] = None
    
    @classmethod
    def get_auth_provider(cls) -> AuthInterface:
        """
        Get the configured authentication provider.
        
        Returns a singleton instance of the auth provider.
        """
        if cls._instance is None:
            cls._instance = cls._create_auth_provider()
        return cls._instance
    
    @classmethod
    def _create_auth_provider(cls) -> AuthInterface:
        """
        Create the appropriate auth provider based on environment.
        """
        env_str = os.environ.get(EnvVars.ENVIRONMENT.value, "local")
        auth_mode_str = os.environ.get(EnvVars.AUTH_MODE.value, "local")
        
        environment = Environment.from_string(env_str)
        auth_mode = AuthMode.from_string(auth_mode_str)
        
        print(f"Creating auth provider for environment: {environment.value}, mode: {auth_mode.value}")
        
        # Force local auth in local/development environments
        if environment.is_local or auth_mode == AuthMode.LOCAL:
            print("Using SimpleLocalAuth provider (development mode)")
            return SimpleLocalAuth()
        
        # Use Cognito for production/staging
        elif auth_mode == AuthMode.COGNITO or environment.is_production:
            print("Using CognitoAuth provider (production mode)")
            try:
                return CognitoAuth()
            except ValueError as e:
                print(f"Failed to initialize Cognito: {e}")
                print("Falling back to SimpleLocalAuth")
                return SimpleLocalAuth()
        
        # Default to local auth if unclear
        else:
            print(f"Unknown configuration, defaulting to SimpleLocalAuth")
            return SimpleLocalAuth()
    
    @classmethod
    def reset(cls):
        """
        Reset the singleton instance.
        Useful for testing or switching providers.
        """
        cls._instance = None