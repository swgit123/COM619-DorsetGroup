# couch_db.py
import json
import requests

COUCHDB_URL = "http://127.0.0.1:5984"
DB_NAME = "recipes"
USERNAME = "admin"
PASSWORD = "password"
RECIPES_FILE = "FoodData_Central_foundation_food_json_2025-04-24.json"
INGREDIENTS_FILE = "ingredients.json"

def create_database():
    url = f"{COUCHDB_URL}/{DB_NAME}"
    response = requests.put(url, auth=(USERNAME, PASSWORD))
    if response.status_code in (201, 412):
        print(f"Database '{DB_NAME}' ready.")
    else:
        print(f"Error creating database: {response.text}")

def push_recipes(json_file):
    with open(json_file, "r") as f:
        recipes = json.load(f)

    for recipe in recipes:
        response = requests.post(
            f"{COUCHDB_URL}/{DB_NAME}",
            auth=(USERNAME, PASSWORD),
            headers={"Content-Type": "application/json"},
            json=recipe
        )
        if response.status_code == 201:
            print(f"Pushed recipe: {recipe.get('name', 'Unnamed')}")
        else:
            print(f"Error pushing recipe: {response.text}")

def push_ingredients(json_file):
    with open(json_file, "r") as f:
        ingredients = json.load(f)
        
    for ingredient in ingredients:
        doc = {"Name" : ingredient}
        response = requests.post(
            f"{COUCHDB_URL}/{DB_NAME}",
            auth=(USERNAME, PASSWORD),
            headers={"Content-Type": "application/json"},
            json=doc
        )
        if response.status_code == 201:
            print(f"Pushed ingredient: {ingredient}")
        else:
            print(f"Error pushing recipe: {response.text}")

if __name__ == "__main__":
    create_database()
    push_ingredients(INGREDIENTS_FILE)