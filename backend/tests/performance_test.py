import time
import requests


def test_endpoint_performance(endpoint: str, name: str):
    start = time.time()
    response = requests.get(f"http://localhost:8000{endpoint}")
    end = time.time()
    print(f"{name}:")
    print(f"  Status: {response.status_code}")
    print(f"  Time: {end - start:.3f} seconds")
    print(f"  Items: {len(response.json().get('requests', []))}")
    print()


if __name__ == "__main__":
    print("Testing API Performance\n" + "=" * 50 + "\n")
    test_endpoint_performance("/api/feature-requests", "Feature Requests")
    test_endpoint_performance("/api/decks/user/1", "User Decks")
    test_endpoint_performance("/api/courses/enrolled/1", "Enrolled Courses")
