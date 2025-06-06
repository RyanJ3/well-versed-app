import boto3
import logging
from config import Config

logger = logging.getLogger(__name__)

class CognitoService:
    """Helper for interacting with Amazon Cognito"""

    def __init__(self):
        self.client = boto3.client("cognito-idp", region_name=Config.AWS_REGION)

    def sign_up(self, email: str, password: str):
        """Register a new user"""
        return self.client.sign_up(
            ClientId=Config.COGNITO_APP_CLIENT_ID,
            Username=email,
            Password=password,
            UserAttributes=[{"Name": "email", "Value": email}],
        )

    def confirm_sign_up(self, email: str, code: str):
        """Confirm a new user's email"""
        return self.client.confirm_sign_up(
            ClientId=Config.COGNITO_APP_CLIENT_ID,
            Username=email,
            ConfirmationCode=code,
        )

    def sign_in(self, email: str, password: str):
        """Authenticate a user and return tokens"""
        resp = self.client.initiate_auth(
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={"USERNAME": email, "PASSWORD": password},
            ClientId=Config.COGNITO_APP_CLIENT_ID,
        )
        return resp.get("AuthenticationResult", {})

