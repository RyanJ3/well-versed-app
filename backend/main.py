# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
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

    # TODO undo this test skip
    # Test API.Bible on startup (skip in local mode)
    if os.getenv("ENVIRONMENT") != "local" and os.getenv("SKIP_API_BIBLE_CHECK") != "true":
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
    else:
        logger.info("Skipping API.Bible check in local mode")

    yield

    # Shutdown
    logger.info("Shutting down FastAPI application...")
    if db_pool.db_pool:
        db_pool.db_pool.closeall()
        logger.info("Database connections closed")


# Create FastAPI app
app = FastAPI(title="Well Versed API", version="1.0.0", lifespan=lifespan)

# Configure CORS with strict security settings
allowed_origins = []

# Add allowed origins based on environment
if os.getenv("ENVIRONMENT") == "local":
    # Local development origins
    allowed_origins.extend([
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ])
elif os.getenv("ENVIRONMENT") == "development":
    allowed_origins.extend([
        Config.FRONTEND_URL,
        "http://localhost:4200"  # Allow local frontend to connect to dev backend
    ])
elif os.getenv("ENVIRONMENT") == "production":
    # Only add specific production domains
    production_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
    allowed_origins.extend([origin.strip() for origin in production_origins if origin.strip()])
    if not allowed_origins:
        # Fallback to FRONTEND_URL if no specific origins configured
        allowed_origins.append(Config.FRONTEND_URL)

# Log configured origins for transparency
logger.info(f"CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,  # Required for cookies/auth
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],  # Allow all headers including Authorization
    expose_headers=["*"],  # Expose all headers to the client
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Import routers after app creation to avoid circular imports
from api.routes import users, books, verses, cross_references, topical_verses
from api.auth_routes import router as auth_router
from routers import user_verses, atlas, config, bibles, monitoring
from api.endpoints import decks as decks_api, feature_requests, courses as courses_api

# Include routers
app.include_router(auth_router, prefix="/api", tags=["authentication"])
app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(books.router, prefix="/api", tags=["books"])
app.include_router(verses.router, prefix="/api", tags=["verses"])
app.include_router(cross_references.router, prefix="/api", tags=["cross-references"])
app.include_router(topical_verses.router, prefix="/api", tags=["topical-verses"])
app.include_router(user_verses.router, prefix="/api/user-verses", tags=["verses-old"])
app.include_router(decks_api.router, prefix="/api/decks", tags=["decks"])
app.include_router(feature_requests.router, prefix="/api/feature-requests", tags=["feature_requests"])
app.include_router(courses_api.router, prefix="/api/courses", tags=["courses-new"])
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
