# backend/app/__init__.py
from fastapi import FastAPI

app = FastAPI()

from .api.routes import router as api_router

app.include_router(api_router)