from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create the app first
app = FastAPI(
    title="Angular-PostgreSQL API",
    description="API for connecting Angular to AWS RDS Aurora PostgreSQL",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # Angular default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import AFTER creating the app to avoid circular imports
from app.api.endpoints import router

# Include API routes
app.include_router(router, prefix="/api")

# Add a root endpoint
@app.get("/")
async def root():
    return {"message": "API is running"}