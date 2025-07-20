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
import sys

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

    # Create database pool
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

    # Validate API.Bible connection on startup
    try:
        from services.api_bible import APIBibleService
        logger.info("Testing API.Bible connection...")
        
        # Check if API key is configured
        if not Config.API_BIBLE_KEY:
            raise Exception("API_BIBLE_KEY is not configured in environment variables")
        
        if Config.API_BIBLE_KEY == "your_api_key_here" or len(Config.API_BIBLE_KEY) < 10:
            raise Exception("API_BIBLE_KEY appears to be a placeholder. Please set a valid API key.")
        
        # Test the connection
        service = APIBibleService(Config.API_BIBLE_KEY, Config.DEFAULT_BIBLE_ID)
        bibles = service.get_available_bibles()
        
        if not bibles:
            raise Exception(
                "API.Bible returned no Bibles. This usually means:\n"
                "1. Your API key is invalid or expired\n"
                "2. The API.Bible service is down\n"
                "3. Network connectivity issues\n"
                "Please verify your API_BIBLE_KEY and try again."
            )
        
        # Additional validation - check if we have reasonable data
        if len(bibles) < 10:  # API.Bible typically has hundreds of Bibles
            logger.warning(f"API.Bible returned only {len(bibles)} Bibles - this seems unusually low")
        
        logger.info(f"✓ API.Bible connection successful: {len(bibles)} Bibles available")
        
        # Log some sample Bibles for verification
        sample_bibles = bibles[:3]
        for bible in sample_bibles:
            logger.info(f"  - {bible.get('name', 'Unknown')} ({bible.get('language', {}).get('name', 'Unknown')})")
            
    except Exception as e:
        logger.error("=" * 60)
        logger.error("API.BIBLE STARTUP CHECK FAILED")
        logger.error("=" * 60)
        logger.error(f"Error: {e}")
        logger.error("")
        logger.error("To fix this:")
        logger.error("1. Get a free API key from: https://scripture.api.bible/")
        logger.error("2. Add to your .bashrc file: API_BIBLE_KEY=your_actual_key_here")
        logger.error("3. Restart the backend")
        logger.error("=" * 60)
        
        # Exit with error code to prevent the server from starting
        sys.exit(1)

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
    """Health check endpoint with detailed API.Bible status"""
    logger.info("Health check requested")

    # Test database connection
    db_status = "healthy"
    db_error = None
    try:
        conn = db_pool.db_pool.getconn()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
        db_pool.db_pool.putconn(conn)
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "unhealthy"
        db_error = str(e)

    # Test API.Bible connection with detailed diagnostics
    api_bible_status = "healthy"
    api_bible_error = None
    api_bible_details = {}
    
    try:
        from services.api_bible import APIBibleService
        
        # Check API key configuration
        if not Config.API_BIBLE_KEY:
            raise Exception("API_BIBLE_KEY not configured")
        
        if Config.API_BIBLE_KEY == "your_api_key_here":
            raise Exception("API_BIBLE_KEY is still set to placeholder value")
            
        api_bible_details["key_configured"] = True
        api_bible_details["key_length"] = len(Config.API_BIBLE_KEY)
        
        # Test API connection
        service = APIBibleService(Config.API_BIBLE_KEY, Config.DEFAULT_BIBLE_ID)
        bibles = service.get_available_bibles()
        
        if not bibles:
            api_bible_status = "unhealthy"
            api_bible_error = "API returned no Bibles - likely invalid API key"
            api_bible_details["bible_count"] = 0
        else:
            api_bible_details["bible_count"] = len(bibles)
            api_bible_details["sample_bible"] = bibles[0].get("name", "Unknown") if bibles else None
            api_bible_details["languages_available"] = len(set(b.get("language", {}).get("id", "") for b in bibles))
            
            # Warn if unusually low number of Bibles
            if len(bibles) < 10:
                api_bible_details["warning"] = f"Only {len(bibles)} Bibles returned - this seems low"
                
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
        "database": {
            "status": db_status,
            "error": db_error
        },
        "api_bible": {
            "status": api_bible_status,
            "error": api_bible_error,
            "details": api_bible_details
        }
    }

    # Return appropriate status code
    if overall_status == "unhealthy":
        raise HTTPException(status_code=503, detail=response)
    
    return response


@app.get("/")
async def root():
    """Root endpoint"""
    logger.debug("Root endpoint accessed")
    return {"message": "Well Versed API", "version": "1.0.0"}