from fastapi import FastAPI
from app.config import settings
from app.api import api_router  # Import the api_router

app = FastAPI(title="Bible Tracker API")

app.include_router(api_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Bible Tracker API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.DB_HOST, port=8000)