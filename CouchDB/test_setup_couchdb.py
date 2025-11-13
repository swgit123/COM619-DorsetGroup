# test_couchdb_pytest.py
import json
import requests
import pytest

COUCHDB_URL = "http://127.0.0.1:5984"
DB_NAME = "recipes"
USERNAME = "admin"
PASSWORD = "password"
INGREDIENTS_FILE = "ingredients.json"

def get_all_ingredients():
    """Fetch all ingredient names from CouchDB."""
    url = f"{COUCHDB_URL}/{DB_NAME}/_all_docs?include_docs=true"
    response = requests.get(url, auth=(USERNAME, PASSWORD))
    response.raise_for_status()  # will raise HTTPError if the request failed

    data = response.json()
    return [ingredient['doc']['Name'] for ingredient in data.get('rows', [])]

def get_file_ingredients():
    """Load ingredients from the JSON file."""
    with open(INGREDIENTS_FILE, "r") as f:
        return json.load(f)

@pytest.fixture
def db_ingredients():
    return get_all_ingredients()

@pytest.fixture
def file_ingredients():
    return get_file_ingredients()

def test_ingredient_count(db_ingredients, file_ingredients):
    """Test that the number of ingredients in the file matches the DB."""
    assert len(db_ingredients) == len(file_ingredients), (
        f"Ingredient count mismatch: File={len(file_ingredients)}, DB={len(db_ingredients)}"
    )