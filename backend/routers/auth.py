# backend/routers/auth.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import logging
from services.aws_cognito import CognitoService

logger = logging.getLogger(__name__)
router = APIRouter()
cognito = CognitoService()

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup")
async def sign_up(req: SignUpRequest):
    try:
        resp = cognito.sign_up(req.email, req.password)
        return {"user_sub": resp["UserSub"]}
    except Exception as e:
        logger.error(f"Sign up failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/login")
async def login(req: LoginRequest):
    try:
        tokens = cognito.sign_in(req.email, req.password)
        return tokens
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

