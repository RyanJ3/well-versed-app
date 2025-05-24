import psycopg2
import json
import time

# Configurable connection details
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'dbname': 'my-db',  # Replace with actual name
    'user': 'my-user',  # Replace with actual user
    'password': 'my-password'  # Replace with actual password
}

# SQL script file paths
SQL_SCRIPTS = [
    '01_create_schema.sql',
    '02_populate_books.sql',
    '03_populate_apocrypha.sql',
    '04_create_test_data.sql',
    '05_helper_functions.sql'
]

# JSON file path
BIBLE_JSON = 'bible_base_data.json'

# Step 1: Connect to PostgreSQL
def get_connection():
    print("Connecting to the PostgreSQL database...")
    return psycopg2.connect(**DB_CONFIG)

# Step 2: Execute SQL scripts
def execute_sql_scripts(cursor):
    for script in SQL_SCRIPTS:
        print(f"Reading script: {script}")
        with open(script, 'r', encoding='utf-8') as f:
            sql = f.read()
        print(f"Executing script: {script}")
        cursor.execute(sql)
        print(f"Finished executing {script}")

# Step 3: Create bible_verses table
def create_bible_verses_table(cursor):
    print("Dropping and creating bible_verses table...")
    cursor.execute("""
        DROP TABLE IF EXISTS bible_verses CASCADE;
        CREATE TABLE bible_verses (
            id SERIAL PRIMARY KEY,
            book_id SMALLINT NOT NULL,
            chapter_number SMALLINT NOT NULL,
            verse_number SMALLINT NOT NULL,
            text TEXT,
            FOREIGN KEY (book_id) REFERENCES books(book_id)
        );
    """)
    print("bible_verses table created successfully.")

# Step 4: Populate bible_verses from JSON
def populate_bible_verses(cursor):
    print(f"Loading data from {BIBLE_JSON}...")
    with open(BIBLE_JSON, 'r', encoding='utf-8') as f:
        data = json.load(f)

    book_index = data['bookIndex']
    total_inserted = 0
    for book in data['books']:
        book_id = book_index.get(book['name'])
        if not book_id:
            print(f"Warning: book_id not found for book '{book['name']}'")
            continue

        print(f"Processing book: {book['name']} (ID: {book_id})")
        for chapter_number, verse_count in enumerate(book['chapters'], start=1):
            for verse_number in range(1, verse_count + 1):
                cursor.execute(
                    """
                    INSERT INTO bible_verses (book_id, chapter_number, verse_number, text)
                    VALUES (%s, %s, %s, %s);
                    """,
                    (book_id, chapter_number, verse_number, None)  # Placeholder for verse text
                )
                total_inserted += 1
            print(f"  Inserted chapter {chapter_number} with {verse_count} verses")
        print(f"Finished book: {book['name']}")
    print(f"Total verses inserted: {total_inserted}")

# Run setup
def main():
    start_time = time.time()
    conn = get_connection()
    conn.autocommit = True
    try:
        with conn.cursor() as cursor:
            print("Starting SQL script execution...")
            execute_sql_scripts(cursor)
            print("All SQL scripts executed.")

            print("Creating bible_verses table...")
            create_bible_verses_table(cursor)

            print("Populating bible_verses table...")
            populate_bible_verses(cursor)
            print("bible_verses population complete.")
    finally:
        conn.close()
        print(f"Database connection closed. Total setup time: {time.time() - start_time:.2f} seconds")

if __name__ == '__main__':
    main()
