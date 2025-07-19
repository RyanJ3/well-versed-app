# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager
import psycopg2
from psycopg2.pool import SimpleConnectionPool
from database import DatabaseConnection
from config import Config
import db_pool

# Configure logging
logging.basicConfig(
    level=Config.LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up FastAPI application...")
    Config.log_config()

    try:
        db_pool.db_pool = SimpleConnectionPool(
            1,
            20,
            host=Config.DATABASE_HOST,
            database=Config.DATABASE_NAME,
            user=Config.DATABASE_USER,
            password=Config.DATABASE_PASSWORD,
            port=Config.DATABASE_PORT,
        )
        logger.info("Database connection pool created successfully")
    except Exception as e:
        logger.error(f"Failed to create database pool: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down FastAPI application...")
    if db_pool.db_pool:
        db_pool.db_pool.closeall()
        logger.info("Database connections closed")


# Create FastAPI app
app = FastAPI(title="Well Versed API", version="1.0.0", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[Config.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers after app creation to avoid circular imports
from routers import users, user_verses, decks, feature_requests, courses, atlas, config, bibles

# Include routers
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(user_verses.router, prefix="/api/user-verses", tags=["verses"])
app.include_router(decks.router, prefix="/api/decks", tags=["decks"])
app.include_router(
    feature_requests.router, prefix="/api/feature-requests", tags=["feature_requests"]
)
app.include_router(courses.router, prefix="/api/courses", tags=["courses"])
app.include_router(atlas.router, prefix="/api/atlas", tags=["atlas"])
app.include_router(config.router, prefix="/api", tags=["config"])
app.include_router(bibles.router, prefix="/api/bibles", tags=["bibles"])

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    logger.info("Health check requested")

    # Test database connection
    try:
        conn = db_pool.db_pool.getconn()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
        db_pool.db_pool.putconn(conn)
        db_status = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "unhealthy"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
    }


@app.get("/")
async def root():
    """Root endpoint"""
    logger.debug("Root endpoint accessed")
    return {"message": "Well Versed API", "version": "1.0.0"}