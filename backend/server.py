from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from pathlib import Path
import requests

from setup_db import ensure_databases

COUCHDB_URL = os.getenv('COUCHDB_URL')
USERNAME = os.getenv('USERNAME')
PASSWORD = os.getenv('PASSWORD')

RECIPES_PATH = 'recipes'
USERS_PATH = 'users'


BASE_DIR = Path(__file__).resolve().parent
ensure_databases({
    RECIPES_PATH: BASE_DIR / 'demo.json',
    USERS_PATH: None,
})


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
        
        # Validate required fields
        if 'recipe_name' not in recipe_data:
            return jsonify({'error': 'recipe_name is required'}), 400
        
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


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
