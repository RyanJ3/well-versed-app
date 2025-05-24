from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import router as api_router
from app.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; lock down in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Well Versed API"}