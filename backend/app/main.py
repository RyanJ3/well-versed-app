# filename: app/main.py
# FastAPI application entry point

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.api import router

# Create database tables (comment this out if using migrations)
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bible Tracker API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Bible Tracker API is running"}