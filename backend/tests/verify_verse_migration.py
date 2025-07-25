import requests
import json


def compare_endpoints(user_id=1):
    old_url = f"http://localhost:8000/api/user-verses/{user_id}"
    new_url = f"http://localhost:8000/api/v2/user-verses/{user_id}"

    old_response = requests.get(old_url).json()
    new_response = requests.get(new_url).json()

    old_sorted = sorted(old_response, key=lambda x: x['verse']['verse_id'])
    new_sorted = sorted(new_response, key=lambda x: x['verse']['verse_id'])

    assert json.dumps(old_sorted) == json.dumps(new_sorted), "Responses don't match!"
    print("\u2713 Endpoints return identical data")


if __name__ == "__main__":
    compare_endpoints()
