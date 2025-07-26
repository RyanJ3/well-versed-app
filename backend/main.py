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

    # Test API.Bible on startup
    try:
        from services.api_bible import APIBibleService
        logger.info("Testing API.Bible connection...")
        service = APIBibleService(Config.API_BIBLE_KEY, Config.DEFAULT_BIBLE_ID)
        bibles = service.get_available_bibles()
        
        if not bibles:
            raise Exception("API.Bible returned no Bibles. Check your API key.")
        
        logger.info(f"✓ API.Bible connection successful: {len(bibles)} Bibles available")
    except Exception as e:
        logger.error(f"✗ API.Bible connection FAILED: {e}")
        logger.error("Please check your API_BIBLE_KEY in .bashrc file")
        raise Exception(f"API.Bible startup check failed: {e}")

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
from api.routes import users, books, verses
from routers import user_verses, feature_requests, courses, atlas, config, bibles, monitoring
from api.endpoints import decks as decks_api
from api.endpoints import verses as verses_api

# Include routers
app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(books.router, prefix="/api", tags=["books"])
app.include_router(verses.router, prefix="/api", tags=["verses"])
app.include_router(user_verses.router, prefix="/api/user-verses", tags=["verses"])
app.include_router(verses_api.router, prefix="/api/v2/user-verses", tags=["verses-v2"])
app.include_router(decks_api.router, prefix="/api/decks", tags=["decks"])
app.include_router(
    feature_requests.router, prefix="/api/feature-requests", tags=["feature_requests"]
)
app.include_router(courses.router, prefix="/api/courses", tags=["courses"])
app.include_router(atlas.router, prefix="/api/atlas", tags=["atlas"])
app.include_router(config.router, prefix="/api", tags=["config"])
app.include_router(bibles.router, prefix="/api/bibles", tags=["bibles"])
app.include_router(monitoring.router, prefix="/api/monitoring", tags=["monitoring"])

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

    # Test API.Bible connection
    api_bible_status = "healthy"
    api_bible_error = None
    try:
        from services.api_bible import APIBibleService
        service = APIBibleService(Config.API_BIBLE_KEY, Config.DEFAULT_BIBLE_ID)
        bibles = service.get_available_bibles()
        
        if not bibles:
            api_bible_status = "unhealthy"
            api_bible_error = "No Bibles returned from API.Bible"
            logger.error("API.Bible health check failed: No Bibles returned")
        else:
            logger.info(f"API.Bible health check passed: {len(bibles)} Bibles available")
    except Exception as e:
        api_bible_status = "unhealthy"
        api_bible_error = str(e)
        logger.error(f"API.Bible health check failed: {e}")

    # Overall status
    overall_status = "healthy"
    if db_status == "unhealthy" or api_bible_status == "unhealthy":
        overall_status = "unhealthy"

    response = {
        "status": overall_status,
        "database": db_status,
        "api_bible": api_bible_status,
    }
    
    if api_bible_error:
        response["api_bible_error"] = api_bible_error

    return response


@app.get("/")
async def root():
    """Root endpoint"""
    logger.debug("Root endpoint accessed")
    return {"message": "Well Versed API", "version": "1.0.0"}