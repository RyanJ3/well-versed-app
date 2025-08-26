"""
Authentication Factory
======================
Factory pattern for creating the appropriate authentication
provider based on environment configuration.
"""

import os
from typing import Optional
from .auth_interface import AuthInterface
from .local_auth import LocalAuth
from .cognito_auth import CognitoAuth


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
        environment = os.environ.get("ENVIRONMENT", "local")
        auth_mode = os.environ.get("AUTH_MODE", "local").lower()
        
        print(f"Creating auth provider for environment: {environment}, mode: {auth_mode}")
        
        # Force local auth in local/development environments
        if environment in ["local", "development", "test"] or auth_mode == "local":
            print("Using LocalAuth provider (development mode)")
            return LocalAuth()
        
        # Use Cognito for production/staging
        elif auth_mode == "cognito" or environment in ["production", "staging", "prod"]:
            print("Using CognitoAuth provider (production mode)")
            try:
                return CognitoAuth()
            except ValueError as e:
                print(f"Failed to initialize Cognito: {e}")
                print("Falling back to LocalAuth")
                return LocalAuth()
        
        # Default to local auth if unclear
        else:
            print(f"Unknown auth mode '{auth_mode}', defaulting to LocalAuth")
            return LocalAuth()
    
    @classmethod
    def reset(cls):
        """
        Reset the singleton instance.
        Useful for testing or switching providers.
        """
        cls._instance = None