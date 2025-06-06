#!/usr/bin/env python3
"""
setup_database.py - Database setup script for Well Versed
Handles schema creation, Bible data population, and verification
"""
import psycopg2
from psycopg2.extras import execute_values
import json
import logging
import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime

# Terminal colors
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

# Load environment variables
def load_env():
    """Load environment variables from backend/.env"""
    backend_env_path = Path(__file__).parent.parent / 'backend' / '.env'
    if not backend_env_path.exists():
        print(f"{Colors.RED}Error: backend/.env not found!{Colors.RESET}")
        print("Please copy backend/.env.example to backend/.env and configure it.")
        sys.exit(1)
    
    load_dotenv(backend_env_path)
    
    # Verify required environment variables
    required_vars = ['DATABASE_HOST', 'DATABASE_NAME', 'DATABASE_USER', 'DATABASE_PASSWORD']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"{Colors.RED}Error: Missing required environment variables: {', '.join(missing_vars)}{Colors.RESET}")
        print("Please check your backend/.env file.")
        sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

# Custom logger that adds color
class ColoredLogger:
    @staticmethod
    def info(msg, color=Colors.BLUE):
        logging.info(f"{color}{msg}{Colors.RESET}")
    
    @staticmethod
    def success(msg):
        logging.info(f"{Colors.GREEN}✓ {msg}{Colors.RESET}")
    
    @staticmethod
    def warning(msg):
        logging.info(f"{Colors.YELLOW}⚠ {msg}{Colors.RESET}")
    
    @staticmethod
    def error(msg):
        logging.info(f"{Colors.RED}✗ {msg}{Colors.RESET}")

logger = ColoredLogger()

# SQL files in execution order
SQL_FILES = [
    {
        'file': '01-drop-schema.sql',
        'description': 'Drop existing schema',
        'require_flag': True  # Only run with --drop flag
    },
    {
        'file': '02-create-core-tables.sql',
        'description': 'Create core tables (users, bible_books, bible_verses, user_verses)'
    },
    {
        'file': '03-create-decks.sql',
        'description': 'Create deck system (decks, saved_decks, tags)'
    },
    {
        'file': '04-create-deck-cards.sql',
        'description': 'Create flashcard system (deck_cards, card_verses)'
    },
    {
        'file': '05-create-confidence-tracking.sql',
        'description': 'Create confidence tracking system'
    },
    {
        'file': '06-populate-test-data.sql',
        'description': 'Insert test data',
        'skip_on_production': True  # Can be skipped with --no-test-data
    },
    {
        'file': '07-create-feature-requests.sql',
        'description': 'Create feature request tables'
    },
    {
        'file': '08-create-workflows.sql',
        'description': 'Create workflow and lesson tables'
    }
]

def get_db_connection():
    """Create a database connection with retry logic"""
    max_retries = 3
    retry_delay = 2
    
    conn_params = {
        'host': os.getenv('DATABASE_HOST', 'localhost'),
        'port': os.getenv('DATABASE_PORT', '5432'),
        'database': os.getenv('DATABASE_NAME', 'wellversed01DEV'),
        'user': os.getenv('DATABASE_USER'),
        'password': os.getenv('DATABASE_PASSWORD')
    }
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Connecting to {conn_params['host']}:{conn_params['port']}/{conn_params['database']}...")
            conn = psycopg2.connect(**conn_params)
            logger.success("Database connection established")
            return conn
        except psycopg2.Error as e:
            if attempt < max_retries - 1:
                logger.warning(f"Connection failed, retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                logger.error(f"Failed to connect after {max_retries} attempts: {e}")
                sys.exit(1)

def execute_sql_file(conn, filepath, description):
    """Execute a SQL file with proper error handling"""
    if not os.path.exists(filepath):
        logger.warning(f"File {filepath} not found, skipping...")
        return False
    
    logger.info(f"\nExecuting: {description}")
    logger.info(f"File: {filepath}", Colors.RESET)
    
    with open(filepath, 'r') as f:
        sql = f.read()
    
    cur = conn.cursor()
    try:
        # Execute SQL
        cur.execute(sql)
        conn.commit()
        
        # Get row count if applicable
        if cur.rowcount > 0:
            logger.success(f"Completed - {cur.rowcount} rows affected")
        else:
            logger.success("Completed")
        
        return True
    except psycopg2.Error as e:
        conn.rollback()
        logger.error(f"SQL Error: {e}")
        # Show the problematic line if possible
        if hasattr(e, 'diag') and e.diag.context:
            logger.error(f"Context: {e.diag.context}")
        return False
    finally:
        cur.close()

def populate_bible_data(conn):
    """Populate Bible books and verses"""
    logger.info("\n" + "="*50)
    logger.info("Populating Bible Data", Colors.BOLD)
    logger.info("="*50)
    
    bible_data_path = 'bible_base_data.json'
    if not os.path.exists(bible_data_path):
        logger.error(f"{bible_data_path} not found!")
        return False
    
    with open(bible_data_path, 'r') as f:
        bible_data = json.load(f)
    
    cur = conn.cursor()
    
    try:
        # Set schema
        cur.execute("SET search_path TO wellversed01DEV")
        
        # Book ID mappings (showing first few for brevity)
        book_id_map = {
            # Old Testament
            'Genesis': 1, 'Exodus': 2, 'Leviticus': 3, 'Numbers': 4, 'Deuteronomy': 5,
            'Joshua': 6, 'Judges': 7, 'Ruth': 8, '1 Samuel': 9, '2 Samuel': 10,
            '1 Kings': 11, '2 Kings': 12, '1 Chronicles': 13, '2 Chronicles': 14,
            'Ezra': 15, 'Nehemiah': 16, 'Esther': 17, 'Job': 18, 'Psalms': 19,
            'Proverbs': 20, 'Ecclesiastes': 21, 'Song of Solomon': 22, 'Isaiah': 23,
            'Jeremiah': 24, 'Lamentations': 25, 'Ezekiel': 26, 'Daniel': 27,
            'Hosea': 28, 'Joel': 29, 'Amos': 30, 'Obadiah': 31, 'Jonah': 32,
            'Micah': 33, 'Nahum': 34, 'Habakkuk': 35, 'Zephaniah': 36,
            'Haggai': 37, 'Zechariah': 38, 'Malachi': 39,
            # New Testament
            'Matthew': 40, 'Mark': 41, 'Luke': 42, 'John': 43, 'Acts': 44, 'Romans': 45,
            '1 Corinthians': 46, '2 Corinthians': 47, 'Galatians': 48,
            'Ephesians': 49, 'Philippians': 50, 'Colossians': 51,
            '1 Thessalonians': 52, '2 Thessalonians': 53, '1 Timothy': 54,
            '2 Timothy': 55, 'Titus': 56, 'Philemon': 57, 'Hebrews': 58,
            'James': 59, '1 Peter': 60, '2 Peter': 61, '1 John': 62,
            '2 John': 63, '3 John': 64, 'Jude': 65, 'Revelation': 66,
            # Apocryphal books
            'Tobit': 67, 'Judith': 68, '1 Maccabees': 69, '2 Maccabees': 70,
            'Wisdom of Solomon': 71, 'Sirach': 72, 'Baruch': 73,
            '1 Esdras': 74, '3 Maccabees': 75, 'Prayer of Manasseh': 76
        }
        
        # Book codes mapping
        book_code_3_map = {
            'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM',
            'Deuteronomy': 'DEU', 'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT',
            '1 Samuel': '1SA', '2 Samuel': '2SA', '1 Kings': '1KI', '2 Kings': '2KI',
            '1 Chronicles': '1CH', '2 Chronicles': '2CH', 'Ezra': 'EZR', 'Nehemiah': 'NEH',
            'Esther': 'EST', 'Job': 'JOB', 'Psalms': 'PSA', 'Proverbs': 'PRO',
            'Ecclesiastes': 'ECC', 'Song of Solomon': 'SOS', 'Isaiah': 'ISA',
            'Jeremiah': 'JER', 'Lamentations': 'LAM', 'Ezekiel': 'EZE', 'Daniel': 'DAN',
            'Hosea': 'HOS', 'Joel': 'JOE', 'Amos': 'AMO', 'Obadiah': 'OBA',
            'Jonah': 'JON', 'Micah': 'MIC', 'Nahum': 'NAH', 'Habakkuk': 'HAB',
            'Zephaniah': 'ZEP', 'Haggai': 'HAG', 'Zechariah': 'ZEC', 'Malachi': 'MAL',
            'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN',
            'Acts': 'ACT', 'Romans': 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO',
            'Galatians': 'GAL', 'Ephesians': 'EPH', 'Philippians': 'PHP', 'Colossians': 'COL',
            '1 Thessalonians': '1TH', '2 Thessalonians': '2TH', '1 Timothy': '1TI',
            '2 Timothy': '2TI', 'Titus': 'TIT', 'Philemon': 'PHM', 'Hebrews': 'HEB',
            'James': 'JAS', '1 Peter': '1PE', '2 Peter': '2PE', '1 John': '1JN',
            '2 John': '2JN', '3 John': '3JN', 'Jude': 'JDE', 'Revelation': 'REV',
            'Tobit': 'TOB', 'Judith': 'JDT', '1 Maccabees': '1MA', '2 Maccabees': '2MA',
            'Wisdom of Solomon': 'WIS', 'Sirach': 'SIR', 'Baruch': 'BAR',
            '1 Esdras': '1ES', '3 Maccabees': '3MA', 'Prayer of Manasseh': 'MAN'
        }
        
        # Prepare data
        books_to_insert = []
        verses_to_insert = []
        
        logger.info("\nProcessing Bible books...")
        
        for book in bible_data['books']:
            book_name = book['name']
            
            # Skip books with canonicalAffiliation NONE
            if book.get('canonicalAffiliation') == 'NONE':
                continue
            
            book_id = book_id_map.get(book_name)
            if not book_id:
                logger.warning(f"No book ID found for {book_name}, skipping...")
                continue
            
            book_code_3 = book_code_3_map.get(book_name, book_name[:3].upper())
            testament = book['testament']
            book_group = book['bookGroup']
            canonical_affiliation = book.get('canonicalAffiliation', 'All')
            chapter_count = len(book['chapters'])
            
            books_to_insert.append((
                book_id, book_name, book_code_3, None,
                testament, book_group, canonical_affiliation, chapter_count
            ))
            
            # Create verses for this book
            total_verses = 0
            for chapter_num, verse_count in enumerate(book['chapters'], 1):
                for verse_num in range(1, verse_count + 1):
                    verse_code = f"{book_id}-{chapter_num}-{verse_num}"
                    is_apocryphal = canonical_affiliation in ['Catholic', 'Eastern Orthodox']
                    
                    verses_to_insert.append((
                        verse_code, book_id, chapter_num, verse_num, is_apocryphal
                    ))
                    total_verses += 1
            
            # Progress indicator
            sys.stdout.write(f"\r  Processing: {book_name} ({total_verses} verses)...")
            sys.stdout.flush()
        
        print()  # New line after progress
        
        # Insert books
        logger.info("\nInserting Bible books...")
        execute_values(
            cur,
            """INSERT INTO bible_books (book_id, book_name, book_code_3, book_code_4,
                                       testament, book_group, canonical_affiliation, chapter_count)
               VALUES %s ON CONFLICT (book_id) DO NOTHING""",
            books_to_insert,
            template="(%s, %s, %s, %s, %s, %s, %s, %s)"
        )
        logger.success(f"Inserted {len(books_to_insert)} Bible books")
        
        # Insert verses in batches with progress
        logger.info("\nInserting Bible verses...")
        batch_size = 1000
        total_batches = (len(verses_to_insert) + batch_size - 1) // batch_size
        
        for i in range(0, len(verses_to_insert), batch_size):
            batch = verses_to_insert[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            
            execute_values(
                cur,
                """INSERT INTO bible_verses (verse_code, book_id, chapter_number, verse_number, is_apocryphal)
                   VALUES %s ON CONFLICT (verse_code) DO NOTHING""",
                batch,
                template="(%s, %s, %s, %s, %s)"
            )
            
            # Progress bar
            progress = batch_num / total_batches
            bar_length = 40
            filled_length = int(bar_length * progress)
            bar = '█' * filled_length + '░' * (bar_length - filled_length)
            sys.stdout.write(f'\r  Progress: [{bar}] {batch_num}/{total_batches} batches')
            sys.stdout.flush()
        
        print()  # New line after progress bar
        logger.success(f"Inserted {len(verses_to_insert)} Bible verses")
        
        conn.commit()
        return True
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Error populating Bible data: {e}")
        return False
    finally:
        cur.close()

def verify_setup(conn):
    """Verify the database setup"""
    logger.info("\n" + "="*50)
    logger.info("Database Verification", Colors.BOLD)
    logger.info("="*50)
    
    cur = conn.cursor()
    cur.execute("SET search_path TO wellversed01DEV")
    
    # Tables to verify
    tables = [
        ('users', 'Users'),
        ('bible_books', 'Bible Books'),
        ('bible_verses', 'Bible Verses'),
        ('user_verses', 'User Verses'),
        ('decks', 'Decks'),
        ('saved_decks', 'Saved Decks'),
        ('deck_cards', 'Deck Cards'),
        ('card_verses', 'Card Verses'),
        ('user_verse_confidence', 'Confidence Tracking'),
        ('deck_tags', 'Deck Tags'),
        ('deck_tag_map', 'Deck Tag Mappings'),
        ('feature_requests', 'Feature Requests'),
        ('workflow_tags', 'Workflow Tags'),
        ('workflow_tag_map', 'Workflow Tag Map'),
        ('workflows', 'Workflows'),
        ('workflow_lessons', 'Workflow Lessons')
    ]
    
    logger.info("\nTable Status:")
    logger.info("-" * 50)
    
    all_good = True
    for table_name, display_name in tables:
        try:
            cur.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cur.fetchone()[0]
            
            # Format the output nicely
            status = f"{Colors.GREEN}✓{Colors.RESET}" if count > 0 or table_name.endswith('_map') else f"{Colors.YELLOW}○{Colors.RESET}"
            logger.info(f"  {status} {display_name:.<35} {count:>6} rows")
        except psycopg2.Error:
            logger.error(f"  ✗ {display_name:.<35} NOT FOUND")
            all_good = False
    
    # Check for specific important data
    logger.info("\nData Verification:")
    logger.info("-" * 50)
    
    # Check for test user
    cur.execute("SELECT COUNT(*) FROM users WHERE email = 'test@example.com'")
    test_user_count = cur.fetchone()[0]
    if test_user_count > 0:
        logger.success("Test user exists")
    else:
        logger.warning("Test user not found")
    
    # Check Bible data
    cur.execute("SELECT COUNT(DISTINCT book_id) FROM bible_verses")
    book_count = cur.fetchone()[0]
    logger.info(f"  Bible books with verses: {book_count}")
    
    # Sample verses
    cur.execute("""
        SELECT bb.book_name, COUNT(*) as verse_count
        FROM bible_verses bv
        JOIN bible_books bb ON bv.book_id = bb.book_id
        GROUP BY bb.book_id, bb.book_name
        ORDER BY bb.book_id
        LIMIT 5
    """)
    
    logger.info("\n  Sample books:")
    for book_name, verse_count in cur.fetchall():
        logger.info(f"    - {book_name}: {verse_count} verses")
    
    cur.close()
    return all_good

def print_usage():
    """Print usage information"""
    print(f"\n{Colors.BOLD}Usage:{Colors.RESET}")
    print(f"  python3 setup_database.py [options]")
    print(f"\n{Colors.BOLD}Options:{Colors.RESET}")
    print(f"  --drop            Drop existing schema before setup")
    print(f"  --no-test-data    Skip inserting test data")
    print(f"  --verify-only     Only verify existing setup")
    print(f"  --help            Show this help message")
    print()

def main():
    """Main setup function"""
    # Parse command line arguments
    args = sys.argv[1:]
    
    if '--help' in args or '-h' in args:
        print_usage()
        return
    
    # Header
    print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'Well Versed Database Setup':^60}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*60}{Colors.RESET}\n")
    
    # Load environment
    load_env()
    
    # Get database connection
    conn = get_db_connection()
    
    try:
        # Verify only mode
        if '--verify-only' in args:
            verify_setup(conn)
            return
        
        # Check for drop flag
        drop_schema = '--drop' in args or '-d' in args
        skip_test_data = '--no-test-data' in args
        
        if drop_schema:
            print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠️  WARNING: This will DROP the existing schema!{Colors.RESET}")
            print(f"{Colors.YELLOW}All data will be lost. This cannot be undone.{Colors.RESET}")
            response = input(f"\nType 'yes' to confirm, or anything else to cancel: ")
            if response.lower() != 'yes':
                logger.warning("Setup cancelled by user")
                return
            print()
        
        # Track success
        all_successful = True
        
        # Execute SQL files
        logger.info(f"{Colors.BOLD}Executing SQL files...{Colors.RESET}\n")
        
        for sql_info in SQL_FILES:
            sql_file = sql_info['file']
            description = sql_info['description']
            
            # Skip drop schema if flag not provided
            if sql_info.get('require_flag') and not drop_schema:
                logger.info(f"Skipping {sql_file} (use --drop flag to execute)")
                continue
            
            # Skip test data if requested
            if sql_info.get('skip_on_production') and skip_test_data:
                logger.info(f"Skipping {sql_file} (--no-test-data flag provided)")
                continue
            
            success = execute_sql_file(conn, sql_file, description)
            if not success:
                all_successful = False
                # Ask if user wants to continue
                response = input(f"\n{Colors.YELLOW}Error occurred. Continue anyway? (y/n): {Colors.RESET}")
                if response.lower() != 'y':
                    logger.error("Setup aborted due to error")
                    return
        
        # Populate Bible data
        if all_successful:
            success = populate_bible_data(conn)
            if not success:
                all_successful = False
        
        # Verify setup
        if all_successful:
            verify_setup(conn)
        
        # Summary
        print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
        if all_successful:
            logger.success(f"{Colors.BOLD}Database setup completed successfully!{Colors.RESET}")
            print(f"\n{Colors.GREEN}Next steps:{Colors.RESET}")
            print(f"  1. Start the backend: cd backend && python3 main.py")
            print(f"  2. Start the frontend: cd frontend && ng serve")
            print(f"  3. Access the API at: http://localhost:8000/docs")
        else:
            logger.error(f"{Colors.BOLD}Database setup completed with errors{Colors.RESET}")
            print(f"\n{Colors.YELLOW}Please check the error messages above.{Colors.RESET}")
        
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Setup interrupted by user{Colors.RESET}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)
    finally:
        conn.close()
        print()

if __name__ == "__main__":
    main()