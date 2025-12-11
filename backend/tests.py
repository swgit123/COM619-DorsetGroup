import os
import uuid
from typing import Any, Dict

import requests
from dotenv import load_dotenv

load_dotenv()


BASE_URL = os.getenv("SERVER_URL", "http://localhost:5000")


def _url(path: str) -> str:
	return f"{BASE_URL.rstrip('/')}{path}"


def assert_ok(response: requests.Response, expected: int = 200) -> Dict[str, Any]:
	if response.status_code != expected:
		raise AssertionError(
			f"Expected {expected} but got {response.status_code}: {response.text}"
		)
	return response.json() if response.content else {}


def test_health():
	res = requests.get(_url("/health"))
	data = assert_ok(res)
	assert data.get("status") == "healthy"


def test_user_lifecycle():
	username = f"user_{uuid.uuid4().hex[:8]}"
	password = "secret123"

	# Create user
	res = requests.post(_url("/users"), json={"username": username, "password": password})
	assert_ok(res, expected=201)

	# Get user
	res = requests.get(_url(f"/users/{username}"))
	data = assert_ok(res)
	assert data.get("_id") == username

	# Login valid
	res = requests.post(_url("/auth/login"), json={"username": username, "password": password})
	data = assert_ok(res)
	assert data.get("valid") is True

	# Login invalid password
	res = requests.post(_url("/auth/login"), json={"username": username, "password": "bad"})
	if res.status_code != 401:
		raise AssertionError(f"Expected 401 for bad password, got {res.status_code}: {res.text}")


def test_recipe_lifecycle():
	recipe_id = f"recipe_{uuid.uuid4().hex[:8]}"
	recipe = {
		"_id": recipe_id,
		"name": "Example Recipe",
		"description": "Example Description",
		"ingredients": [
			{"name": "Ingredient 1", "unit": "ml", "amount": 200}
		],
	}

	# Create
	res = requests.post(_url("/recipes"), json=recipe)
	assert_ok(res, expected=201)

	# Get all
	res = requests.get(_url("/recipes"))
	data = assert_ok(res)
	assert any(doc.get("_id") == recipe_id for doc in data), "created recipe not found in list"

	# Get one
	res = requests.get(_url(f"/recipes/{recipe_id}"))
	data = assert_ok(res)
	assert data.get("_id") == recipe_id

	# Update
	updated = {**recipe, "description": "Updated description"}
	res = requests.put(_url(f"/recipes/{recipe_id}"), json=updated)
	assert_ok(res)

	# Delete
	res = requests.delete(_url(f"/recipes/{recipe_id}"))
	assert_ok(res)

	# Verify gone
	res = requests.get(_url(f"/recipes/{recipe_id}"))
	if res.status_code != 404:
		raise AssertionError(f"Expected 404 after delete, got {res.status_code}: {res.text}")


def run_all():
	test_health()
	test_user_lifecycle()
	test_recipe_lifecycle()
	print("All route smoke tests passed.")


if __name__ == "__main__":
	run_all()
