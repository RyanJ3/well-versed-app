# backend/app/cli.py
import click
import logging
from app.database import engine, Base
from app.scripts.load_bible_data import load_bible_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@click.group()
def cli():
    """Well Versed CLI tools"""
    pass

@cli.command()
def init_db():
    """Initialize database tables"""
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Tables created successfully")

@cli.command()
def import_bible_data():
    """Import Bible data into database"""
    logger.info("Importing Bible data...")
    load_bible_data()
    logger.info("Import complete")

if __name__ == "__main__":
    cli()