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
	print("[test] GET /health")
	res = requests.get(_url("/health"))
	data = assert_ok(res)
	assert data.get("status") == "healthy"
	print("[pass] /health")


def test_user_lifecycle():
	username = f"user_{uuid.uuid4().hex[:8]}"
	password = "secret123"

	# Create user
	print(f"[test] POST /accounts ({username})")
	res = requests.post(_url("/accounts"), json={"username": username, "password": password})
	assert_ok(res, expected=201)
	print("[pass] create user")

	# Get user
	print(f"[test] GET /accounts/{username}")
	res = requests.get(_url(f"/accounts/{username}"))
	data = assert_ok(res)
	assert data.get("_id") == username
	print("[pass] fetch user")

	# Login valid
	print("[test] POST /auth/login valid")
	res = requests.post(_url("/auth/login"), json={"username": username, "password": password})
	data = assert_ok(res)
	assert data.get("valid") is True
	print("[pass] login valid")

	# Login invalid password
	print("[test] POST /auth/login invalid password")
	res = requests.post(_url("/auth/login"), json={"username": username, "password": "bad"})
	if res.status_code != 401:
		raise AssertionError(f"Expected 401 for bad password, got {res.status_code}: {res.text}")
	print("[pass] login invalid rejected")


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
	print(f"[test] POST /recipes ({recipe_id})")
	res = requests.post(_url("/recipes"), json=recipe)
	assert_ok(res, expected=201)
	print("[pass] create recipe")

	# Get all
	print("[test] GET /recipes (list)")
	res = requests.get(_url("/recipes"))
	data = assert_ok(res)
	assert any(doc.get("_id") == recipe_id for doc in data), "created recipe not found in list"
	print("[pass] list includes recipe")

	# Get one
	print(f"[test] GET /recipes/{recipe_id}")
	res = requests.get(_url(f"/recipes/{recipe_id}"))
	data = assert_ok(res)
	assert data.get("_id") == recipe_id
	print("[pass] fetch recipe")

	# Update
	print(f"[test] PUT /recipes/{recipe_id}")
	updated = {**recipe, "description": "Updated description"}
	res = requests.put(_url(f"/recipes/{recipe_id}"), json=updated)
	assert_ok(res)
	print("[pass] update recipe")

	# Delete
	print(f"[test] DELETE /recipes/{recipe_id}")
	res = requests.delete(_url(f"/recipes/{recipe_id}"))
	assert_ok(res)
	print("[pass] delete recipe")

	# Verify gone
	print(f"[test] GET /recipes/{recipe_id} after delete")
	res = requests.get(_url(f"/recipes/{recipe_id}"))
	if res.status_code != 404:
		raise AssertionError(f"Expected 404 after delete, got {res.status_code}: {res.text}")
	print("[pass] recipe not found after delete")


def run_all():
	test_health()
	test_user_lifecycle()
	test_recipe_lifecycle()
	print("All route smoke tests passed.")


if __name__ == "__main__":
	run_all()
