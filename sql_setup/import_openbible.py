#!/usr/bin/env python3
"""
import_openbible.py - Import OpenBible topics and cross-references
"""
import psycopg2
from psycopg2.extras import execute_values
import csv
import os
import sys

# Get database connection
def get_db_connection():
    conn_params = {
        'host': os.getenv('DATABASE_HOST', '127.0.0.1'),
        'port': os.getenv('DATABASE_PORT', '5432'),
        'database': os.getenv('DATABASE_NAME', 'wellversed01DEV'),
        'user': os.getenv('DATABASE_USER', 'wellversed01'),
        'password': os.getenv('DATABASE_PASSWORD', 'wellversed01')
    }
    
    print(f"Connecting to {conn_params['host']}:{conn_params['port']}/{conn_params['database']}...")
    conn = psycopg2.connect(**conn_params)
    print("✓ Connected")
    return conn

def create_tables(conn):
    """Create the cross-references and topics tables"""
    print("\nCreating tables...")
    
    cur = conn.cursor()
    cur.execute("SET search_path TO wellversed01DEV")
    
    # Read and execute the SQL file
    with open('09-create-cross-references-topics.sql', 'r') as f:
        sql = f.read()
    
    try:
        cur.execute(sql)
        conn.commit()
        print("✓ Tables created successfully")
        return True
    except psycopg2.Error as e:
        if "already exists" in str(e):
            print("✓ Tables already exist")
            conn.rollback()
            return True
        else:
            print(f"✗ Error creating tables: {e}")
            conn.rollback()
            return False
    finally:
        cur.close()

def import_topics(conn):
    """Import topic-verse mappings from OpenBible data"""
    print("\n=== Importing Topics ===")
    
    topics_file = 'bible-verse-scores/topic_scores.txt'
    if not os.path.exists(topics_file):
        print(f"✗ {topics_file} not found")
        return False
    
    cur = conn.cursor()
    cur.execute("SET search_path TO wellversed01DEV")
    
    try:
        topics_cache = {}
        batch_mappings = []
        lines_processed = 0
        
        with open(topics_file, 'r', encoding='utf-8') as f:
            # Skip header
            next(f)
            
            for line in f:
                parts = line.strip().split('\t')
                if len(parts) < 3:
                    continue
                
                topic_name = parts[0].strip()
                osis_ref = parts[1].strip()
                votes = int(parts[2]) if parts[2].strip() else 0
                
                # Get or create topic
                if topic_name not in topics_cache:
                    cur.execute("""
                        INSERT INTO topics (topic_name) 
                        VALUES (%s) 
                        ON CONFLICT (topic_name) DO UPDATE 
                        SET topic_name = EXCLUDED.topic_name
                        RETURNING topic_id
                    """, (topic_name,))
                    topics_cache[topic_name] = cur.fetchone()[0]
                
                topic_id = topics_cache[topic_name]
                
                # Get verse IDs for the OSIS reference
                cur.execute("SELECT * FROM get_osis_verse_range(%s)", (osis_ref,))
                verse_ids = cur.fetchall()
                
                # Add mappings
                for verse_row in verse_ids:
                    verse_id = verse_row[0] if verse_row else None
                    if verse_id:
                        confidence = min(votes / 300.0, 1.0)
                        batch_mappings.append((verse_id, topic_id, votes, confidence))
                
                lines_processed += 1
                
                # Insert in batches
                if len(batch_mappings) >= 1000:
                    execute_values(
                        cur,
                        """
                        INSERT INTO verse_topics (verse_id, topic_id, votes, confidence_score)
                        VALUES %s
                        ON CONFLICT (verse_id, topic_id) DO UPDATE
                        SET votes = EXCLUDED.votes,
                            confidence_score = EXCLUDED.confidence_score
                        """,
                        batch_mappings,
                        template="(%s, %s, %s, %s)"
                    )
                    conn.commit()
                    print(f"  Processed {lines_processed} lines, {len(batch_mappings)} mappings...")
                    batch_mappings = []
        
        # Insert remaining
        if batch_mappings:
            execute_values(
                cur,
                """
                INSERT INTO verse_topics (verse_id, topic_id, votes, confidence_score)
                VALUES %s
                ON CONFLICT (verse_id, topic_id) DO UPDATE
                SET votes = EXCLUDED.votes,
                    confidence_score = EXCLUDED.confidence_score
                """,
                batch_mappings,
                template="(%s, %s, %s, %s)"
            )
            conn.commit()
        
        print(f"✓ Imported {len(topics_cache)} topics with {lines_processed} lines")
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"✗ Error importing topics: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        cur.close()

def import_cross_references(conn):
    """Import cross-references from OpenBible data"""
    print("\n=== Importing Cross-References ===")
    
    refs_file = 'bible-verse-scores/cross_references.txt'
    if not os.path.exists(refs_file):
        print(f"✗ {refs_file} not found")
        return False
    
    cur = conn.cursor()
    cur.execute("SET search_path TO wellversed01DEV")
    
    try:
        batch_refs = []
        lines_processed = 0
        skipped = 0
        
        with open(refs_file, 'r', encoding='utf-8') as f:
            # Skip header
            next(f)
            
            for line in f:
                parts = line.strip().split('\t')
                if len(parts) < 3:
                    continue
                
                from_verse = parts[0].strip()
                to_verse = parts[1].strip()
                votes = int(parts[2]) if parts[2].strip() else 0
                
                if from_verse and to_verse:
                    # Get verse IDs
                    cur.execute("SELECT get_verse_id_from_osis(%s)", (from_verse,))
                    from_result = cur.fetchone()
                    from_id = from_result[0] if from_result else None
                    
                    cur.execute("SELECT get_verse_id_from_osis(%s)", (to_verse,))
                    to_result = cur.fetchone()
                    to_id = to_result[0] if to_result else None
                    
                    if from_id and to_id and from_id != to_id:
                        confidence = min(votes / 100.0, 1.0)
                        batch_refs.append((from_id, to_id, votes, confidence))
                    else:
                        skipped += 1
                
                lines_processed += 1
                
                # Insert in batches
                if len(batch_refs) >= 1000:
                    execute_values(
                        cur,
                        """
                        INSERT INTO cross_references (from_verse_id, to_verse_id, votes, confidence_score)
                        VALUES %s
                        ON CONFLICT (from_verse_id, to_verse_id) DO UPDATE
                        SET votes = EXCLUDED.votes,
                            confidence_score = EXCLUDED.confidence_score
                        """,
                        batch_refs,
                        template="(%s, %s, %s, %s)"
                    )
                    conn.commit()
                    print(f"  Processed {lines_processed} lines, {len(batch_refs)} references...")
                    batch_refs = []
        
        # Insert remaining
        if batch_refs:
            execute_values(
                cur,
                """
                INSERT INTO cross_references (from_verse_id, to_verse_id, votes, confidence_score)
                VALUES %s
                ON CONFLICT (from_verse_id, to_verse_id) DO UPDATE
                SET votes = EXCLUDED.votes,
                    confidence_score = EXCLUDED.confidence_score
                """,
                batch_refs,
                template="(%s, %s, %s, %s)"
            )
            conn.commit()
        
        print(f"✓ Imported {lines_processed - skipped} cross-references ({skipped} skipped)")
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"✗ Error importing cross-references: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        cur.close()

def verify_import(conn):
    """Verify the imported data"""
    print("\n=== Verification ===")
    
    cur = conn.cursor()
    cur.execute("SET search_path TO wellversed01DEV")
    
    try:
        cur.execute("SELECT COUNT(*) FROM topics")
        topic_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM verse_topics")
        verse_topic_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM cross_references")
        cross_ref_count = cur.fetchone()[0]
        
        print(f"  Topics: {topic_count}")
        print(f"  Verse-topic mappings: {verse_topic_count}")
        print(f"  Cross-references: {cross_ref_count}")
        
        # Sample data
        print("\nSample topics:")
        cur.execute("""
            SELECT t.topic_name, COUNT(*) as verse_count
            FROM topics t
            JOIN verse_topics vt ON t.topic_id = vt.topic_id
            GROUP BY t.topic_id, t.topic_name
            ORDER BY verse_count DESC
            LIMIT 5
        """)
        for topic, count in cur.fetchall():
            print(f"  - {topic}: {count} verses")
        
        print("\nSample verse with most cross-references:")
        cur.execute("""
            SELECT bb.book_name || ' ' || bv.chapter_number || ':' || bv.verse_number as ref,
                   COUNT(*) as ref_count
            FROM bible_verses bv
            JOIN bible_books bb ON bv.book_id = bb.book_id
            JOIN cross_references cr ON (bv.id = cr.from_verse_id OR bv.id = cr.to_verse_id)
            GROUP BY bv.id, bb.book_name, bv.chapter_number, bv.verse_number
            ORDER BY ref_count DESC
            LIMIT 5
        """)
        for ref, count in cur.fetchall():
            print(f"  - {ref}: {count} cross-references")
        
    except Exception as e:
        print(f"✗ Error during verification: {e}")
    finally:
        cur.close()

def main():
    """Main function"""
    print("\n=== OpenBible Data Import ===\n")
    
    conn = get_db_connection()
    
    try:
        # Create tables
        if not create_tables(conn):
            print("Failed to create tables, aborting")
            return
        
        # Import data
        import_topics(conn)
        import_cross_references(conn)
        
        # Verify
        verify_import(conn)
        
        print("\n✓ Import complete!")
        
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    main()