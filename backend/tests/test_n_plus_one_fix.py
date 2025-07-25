import time
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()


def count_queries_old_way(conn):
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    start_time = time.time()
    query_count = 0
    cursor.execute(
        """
        SELECT request_id as id, title 
        FROM feature_requests 
        LIMIT 20
        """
    )
    requests = cursor.fetchall()
    query_count += 1

    for request in requests:
        cursor.execute(
            """
            SELECT t.tag_name 
            FROM feature_request_tag_map m
            JOIN feature_request_tags t ON m.tag_id = t.tag_id
            WHERE m.request_id = %s
            """,
            (request["id"],),
        )
        cursor.fetchall()
        query_count += 1

    end_time = time.time()
    return {
        "query_count": query_count,
        "time_taken": end_time - start_time,
        "requests_fetched": len(requests),
    }


def count_queries_new_way(conn):
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    start_time = time.time()
    query_count = 0
    cursor.execute("SELECT COUNT(*) FROM feature_requests")
    query_count += 1
    cursor.execute(
        """
        SELECT request_id as id, title 
        FROM feature_requests 
        LIMIT 20
        """
    )
    requests = cursor.fetchall()
    query_count += 1

    if requests:
        request_ids = [r["id"] for r in requests]
        cursor.execute(
            """
            SELECT m.request_id, t.tag_name
            FROM feature_request_tag_map m
            JOIN feature_request_tags t ON m.tag_id = t.tag_id
            WHERE m.request_id = ANY(%s)
            """,
            (request_ids,),
        )
        query_count += 1
        cursor.fetchall()

    end_time = time.time()
    return {
        "query_count": query_count,
        "time_taken": end_time - start_time,
        "requests_fetched": len(requests),
    }


if __name__ == "__main__":
    conn = psycopg2.connect(
        host=os.getenv("DATABASE_HOST"),
        database=os.getenv("DATABASE_NAME"),
        user=os.getenv("DATABASE_USER"),
        password=os.getenv("DATABASE_PASSWORD"),
    )
    conn.cursor().execute("SET search_path TO wellversed01DEV")

    print("Testing N+1 Query Fix\n" + "=" * 50)
    old_results = count_queries_old_way(conn)
    print("Old Way (N+1 Problem):")
    print(f"  - Queries executed: {old_results['query_count']}")
    print(f"  - Time taken: {old_results['time_taken']:.4f} seconds")
    print(f"  - Requests fetched: {old_results['requests_fetched']}")
    print()
    new_results = count_queries_new_way(conn)
    print("New Way (Optimized):")
    print(f"  - Queries executed: {new_results['query_count']}")
    print(f"  - Time taken: {new_results['time_taken']:.4f} seconds")
    print(f"  - Requests fetched: {new_results['requests_fetched']}")
    print()
    print("Improvement:")
    print(
        f"  - Queries reduced by: {old_results['query_count'] - new_results['query_count']}"
    )
    if new_results["time_taken"]:
        print(
            f"  - Speed improvement: {old_results['time_taken'] / new_results['time_taken']:.2f}x faster"
        )
    conn.close()
