from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from pathlib import Path
import requests
from dotenv import load_dotenv

load_dotenv()

from setup_db import ensure_databases

COUCHDB_URL = os.getenv('COUCHDB_URL')
USERNAME = os.getenv('USERNAME')
PASSWORD = os.getenv('PASSWORD')

RECIPES_PATH = 'recipes'
USERS_PATH = 'users'


BASE_DIR = Path(__file__).resolve().parent
# ensure_databases({
#     RECIPES_PATH: None,
#     USERS_PATH: None,
# })


def validate_recipe_payload(payload):
    """Validate recipe shape: name, description, ingredients[]."""
    if not isinstance(payload, dict):
        return False, 'Payload must be a JSON object'

    name = payload.get('name')
    if not name or not isinstance(name, str):
        return False, 'name is required and must be a string'

    description = payload.get('description')
    if description is not None and not isinstance(description, str):
        return False, 'description must be a string if provided'

    ingredients = payload.get('ingredients', [])
    if ingredients is None:
        ingredients = []
    if not isinstance(ingredients, list):
        return False, 'ingredients must be a list'

    for idx, ingredient in enumerate(ingredients):
        if not isinstance(ingredient, dict):
            return False, f'ingredients[{idx}] must be an object'

        in_name = ingredient.get('name')
        unit = ingredient.get('unit')
        amount = ingredient.get('amount')

        if not in_name or not isinstance(in_name, str):
            return False, f'ingredients[{idx}].name is required and must be a string'
        if not unit or not isinstance(unit, str):
            return False, f'ingredients[{idx}].unit is required and must be a string'
        if not isinstance(amount, (int, float)):
            return False, f'ingredients[{idx}].amount is required and must be a number'
        if amount < 0:
            return False, f'ingredients[{idx}].amount must be non-negative'

    return True, None


app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

@app.route('/', methods=['GET'])
def home():
    """Default test route"""
    return jsonify({
        'message': 'Welcome to the CouchDB API Server',
        'status': 'running',
        'version': '1.0.0'
    })

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'couchdb-api'
    })


#region Recipe Routes
@app.route('/recipes', methods=['GET'])
def get_all_recipes():
    """Get all recipes from CouchDB"""
    try:
        url = f"{COUCHDB_URL}/{RECIPES_PATH}/_all_docs?include_docs=true"
        response = requests.get(url, auth=(USERNAME, PASSWORD))
        response.raise_for_status()

        data = response.json()
        return jsonify([recipe['doc'] for recipe in data.get('rows', [])])
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to retrieve recipes', 'details': str(e)}), 500
    
@app.route('/recipes/<recipe_id>', methods=['GET'])
def get_recipe(recipe_id):
    """Get a specific recipe by ID"""
    try:
        url = f"{COUCHDB_URL}/{RECIPES_PATH}/{recipe_id}"
        response = requests.get(url, auth=(USERNAME, PASSWORD))
        
        if response.status_code == 404:
            return jsonify({'error': 'Recipe not found'}), 404
        
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to retrieve recipe', 'details': str(e)}), 500

@app.route('/recipes', methods=['POST'])
def post_recipe():
    """Create a new recipe in the DB"""
    try:
        recipe_data = request.get_json()
        
        if not recipe_data:
            return jsonify({'error': 'No data provided'}), 400

        is_valid, error = validate_recipe_payload(recipe_data)
        if not is_valid:
            return jsonify({'error': error}), 400
        
        url = f"{COUCHDB_URL}/{RECIPES_PATH}"
        response = requests.post(url, json=recipe_data, auth=(USERNAME, PASSWORD))
        response.raise_for_status()
        
        return jsonify(response.json()), 201
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to create recipe', 'details': str(e)}), 500

@app.route('/recipes/<recipe_id>', methods=['PUT'])
def update_recipe(recipe_id):
    """Update a specific recipe by ID"""
    try:
        recipe_data = request.get_json()
        
        if not recipe_data:
            return jsonify({'error': 'No data provided'}), 400

        is_valid, error = validate_recipe_payload(recipe_data)
        if not is_valid:
            return jsonify({'error': error}), 400
        
        # Get the current document to retrieve the _rev
        get_url = f"{COUCHDB_URL}/{RECIPES_PATH}/{recipe_id}"
        get_response = requests.get(get_url, auth=(USERNAME, PASSWORD))
        
        if get_response.status_code == 404:
            return jsonify({'error': 'Recipe not found'}), 404
        
        get_response.raise_for_status()
        current_doc = get_response.json()
        
        # Merge the update with the current revision
        recipe_data['_id'] = recipe_id
        recipe_data['_rev'] = current_doc['_rev']
        
        # Update the document
        put_url = f"{COUCHDB_URL}/{RECIPES_PATH}/{recipe_id}"
        put_response = requests.put(put_url, json=recipe_data, auth=(USERNAME, PASSWORD))
        put_response.raise_for_status()
        
        return jsonify(put_response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to update recipe', 'details': str(e)}), 500

@app.route('/recipes/<recipe_id>', methods=['DELETE'])
def delete_recipe(recipe_id):
    """Delete a specific recipe by ID"""
    try:
        # Get the current document to retrieve the _rev (required for deletion)
        get_url = f"{COUCHDB_URL}/{RECIPES_PATH}/{recipe_id}"
        get_response = requests.get(get_url, auth=(USERNAME, PASSWORD))
        
        if get_response.status_code == 404:
            return jsonify({'error': 'Recipe not found'}), 404
        
        get_response.raise_for_status()
        current_doc = get_response.json()
        
        # Delete the document using the _rev
        delete_url = f"{COUCHDB_URL}/{RECIPES_PATH}/{recipe_id}?rev={current_doc['_rev']}"
        delete_response = requests.delete(delete_url, auth=(USERNAME, PASSWORD))
        delete_response.raise_for_status()
        
        return jsonify({'message': 'Recipe deleted successfully', 'id': recipe_id})
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to delete recipe', 'details': str(e)}), 500


#region User Routes
@app.route('/users', methods=['POST'])
def create_user():
    """Create a new user document keyed by username."""
    try:
        payload = request.get_json() or {}
        username = payload.get('username')
        password = payload.get('password')

        if not username or not password:
            return jsonify({'error': 'username and password are required'}), 400

        user_doc = {
            '_id': username,
            'username': username,
            'password': password, # TODO: I'm going to add hash encryption in a bit
        }

        url = f"{COUCHDB_URL}/{USERS_PATH}/{username}"
        response = requests.put(url, json=user_doc, auth=(USERNAME, PASSWORD))

        if response.status_code == 409:
            return jsonify({'error': 'User already exists'}), 409

        response.raise_for_status()
        return jsonify(response.json()), 201
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to create user', 'details': str(e)}), 500


@app.route('/users/<username>', methods=['GET'])
def get_user(username):
    """Fetch a user document by username."""
    try:
        url = f"{COUCHDB_URL}/{USERS_PATH}/{username}"
        response = requests.get(url, auth=(USERNAME, PASSWORD))

        if response.status_code == 404:
            return jsonify({'error': 'User not found'}), 404

        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to retrieve user', 'details': str(e)}), 500


@app.route('/auth/login', methods=['POST'])
def validate_credentials():
    """Check whether a username/password combination is valid."""
    try:
        payload = request.get_json() or {}
        username = payload.get('username')
        password = payload.get('password')

        if not username or not password:
            return jsonify({'error': 'username and password are required'}), 400

        url = f"{COUCHDB_URL}/{USERS_PATH}/{username}"
        response = requests.get(url, auth=(USERNAME, PASSWORD))

        if response.status_code == 404:
            return jsonify({'valid': False, 'reason': 'User not found'}), 404

        response.raise_for_status()
        user_doc = response.json()

        if user_doc.get('password') == password:
            return jsonify({'valid': True, 'username': username}), 200

        return jsonify({'valid': False, 'reason': 'Invalid password'}), 401
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to validate credentials', 'details': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
