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
USERNAME = os.getenv('USER_NAME')
PASSWORD = os.getenv('PASSWORD')

RECIPES_PATH = 'recipes'
ACCOUNTS_PATH = 'accounts'


BASE_DIR = Path(__file__).resolve().parent
ensure_databases({
    RECIPES_PATH: None,
    ACCOUNTS_PATH: None,
})


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
        # Get username from query params for authorization
        username = request.args.get('username')
        
        # Get the current document to retrieve the _rev (required for deletion)
        get_url = f"{COUCHDB_URL}/{RECIPES_PATH}/{recipe_id}"
        get_response = requests.get(get_url, auth=(USERNAME, PASSWORD))
        
        if get_response.status_code == 404:
            return jsonify({'error': 'Recipe not found'}), 404
        
        get_response.raise_for_status()
        current_doc = get_response.json()
        
        # Check if the user is the owner of the recipe
        recipe_author_id = current_doc.get('authorId') or current_doc.get('author')
        if username and recipe_author_id and recipe_author_id != username:
            return jsonify({'error': 'Unauthorized: You can only delete your own recipes'}), 403
        
        # Delete the document using the _rev
        delete_url = f"{COUCHDB_URL}/{RECIPES_PATH}/{recipe_id}?rev={current_doc['_rev']}"
        delete_response = requests.delete(delete_url, auth=(USERNAME, PASSWORD))
        delete_response.raise_for_status()
        
        return jsonify({'message': 'Recipe deleted successfully', 'id': recipe_id})
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to delete recipe', 'details': str(e)}), 500


#region User Routes
@app.route('/accounts', methods=['POST'])
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

        url = f"{COUCHDB_URL}/{ACCOUNTS_PATH}/{username}"
        response = requests.put(url, json=user_doc, auth=(USERNAME, PASSWORD))

        if response.status_code == 409:
            return jsonify({'error': 'User already exists'}), 409

        response.raise_for_status()
        return jsonify(response.json()), 201
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to create user', 'details': str(e)}), 500


@app.route('/accounts/<username>', methods=['GET'])
def get_user(username):
    """Fetch a user document by username."""
    try:
        url = f"{COUCHDB_URL}/{ACCOUNTS_PATH}/{username}"
        response = requests.get(url, auth=(USERNAME, PASSWORD))

        if response.status_code == 404:
            return jsonify({'error': 'User not found'}), 404

        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to retrieve user', 'details': str(e)}), 500


@app.route('/accounts/<username>', methods=['PATCH'])
def update_user_profile(username):
    """Update user profile image."""
    try:
        payload = request.get_json() or {}
        profile_image = payload.get('profileImage')

        if not profile_image:
            return jsonify({'error': 'profileImage is required'}), 400

        # Get current user document
        url = f"{COUCHDB_URL}/{ACCOUNTS_PATH}/{username}"
        response = requests.get(url, auth=(USERNAME, PASSWORD))

        if response.status_code == 404:
            return jsonify({'error': 'User not found'}), 404

        response.raise_for_status()
        user_doc = response.json()

        # Update profile image
        user_doc['profileImage'] = profile_image

        # Save updated document
        put_response = requests.put(url, json=user_doc, auth=(USERNAME, PASSWORD))
        put_response.raise_for_status()

        return jsonify({'message': 'Profile image updated successfully'})
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to update profile image', 'details': str(e)}), 500


@app.route('/accounts/<username>/username', methods=['PATCH'])
def update_username(username):
    """Update username (creates new document with new username)."""
    try:
        payload = request.get_json() or {}
        new_username = payload.get('newUsername')

        if not new_username:
            return jsonify({'error': 'newUsername is required'}), 400

        # Get current user document
        old_url = f"{COUCHDB_URL}/{ACCOUNTS_PATH}/{username}"
        response = requests.get(old_url, auth=(USERNAME, PASSWORD))

        if response.status_code == 404:
            return jsonify({'error': 'User not found'}), 404

        response.raise_for_status()
        user_doc = response.json()

        # Check if new username already exists
        new_url = f"{COUCHDB_URL}/{ACCOUNTS_PATH}/{new_username}"
        check_response = requests.get(new_url, auth=(USERNAME, PASSWORD))
        if check_response.status_code == 200:
            return jsonify({'error': 'Username already taken'}), 409

        # Create new document with new username
        new_doc = {
            '_id': new_username,
            'username': new_username,
            'password': user_doc.get('password'),
            'profileImage': user_doc.get('profileImage'),
            'favourites': user_doc.get('favourites', []),
            'likes': user_doc.get('likes', []),
        }

        put_response = requests.put(new_url, json=new_doc, auth=(USERNAME, PASSWORD))
        put_response.raise_for_status()

        # Update all recipes by this author
        try:
            # Get all recipes
            recipes_url = f"{COUCHDB_URL}/{RECIPES_PATH}/_all_docs?include_docs=true"
            recipes_response = requests.get(recipes_url, auth=(USERNAME, PASSWORD))
            recipes_response.raise_for_status()
            recipes_data = recipes_response.json()

            # Update recipes where authorId matches the old username
            for row in recipes_data.get('rows', []):
                recipe = row.get('doc', {})
                # Check if this recipe belongs to the user (by authorId or author field)
                if recipe.get('authorId') == username or (not recipe.get('authorId') and recipe.get('author') == username):
                    # Update the author display name
                    recipe['author'] = new_username
                    # Ensure authorId is set (for backward compatibility)
                    if not recipe.get('authorId'):
                        recipe['authorId'] = username
                    
                    # Update the recipe
                    recipe_update_url = f"{COUCHDB_URL}/{RECIPES_PATH}/{recipe['_id']}"
                    requests.put(recipe_update_url, json=recipe, auth=(USERNAME, PASSWORD))
        except Exception as e:
            print(f"Warning: Failed to update some recipes: {str(e)}")
            # Continue anyway - username change succeeded

        # Delete old document
        delete_url = f"{old_url}?rev={user_doc['_rev']}"
        requests.delete(delete_url, auth=(USERNAME, PASSWORD))

        return jsonify({'message': 'Username updated successfully', 'newUsername': new_username})
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to update username', 'details': str(e)}), 500


@app.route('/accounts/<username>/password', methods=['PATCH'])
def update_password(username):
    """Update user password."""
    try:
        payload = request.get_json() or {}
        current_password = payload.get('currentPassword')
        new_password = payload.get('newPassword')

        if not current_password or not new_password:
            return jsonify({'error': 'currentPassword and newPassword are required'}), 400

        # Get current user document
        url = f"{COUCHDB_URL}/{ACCOUNTS_PATH}/{username}"
        response = requests.get(url, auth=(USERNAME, PASSWORD))

        if response.status_code == 404:
            return jsonify({'error': 'User not found'}), 404

        response.raise_for_status()
        user_doc = response.json()

        # Verify current password
        if user_doc.get('password') != current_password:
            return jsonify({'error': 'Current password is incorrect'}), 401

        # Update password
        user_doc['password'] = new_password

        # Save updated document
        put_response = requests.put(url, json=user_doc, auth=(USERNAME, PASSWORD))
        put_response.raise_for_status()

        return jsonify({'message': 'Password updated successfully'})
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to update password', 'details': str(e)}), 500


@app.route('/recipes/migrate-author-ids', methods=['POST'])
def migrate_recipe_author_ids():
    """Migration endpoint: Add authorId to recipes that don't have it."""
    try:
        # Get all recipes
        recipes_url = f"{COUCHDB_URL}/{RECIPES_PATH}/_all_docs?include_docs=true"
        recipes_response = requests.get(recipes_url, auth=(USERNAME, PASSWORD))
        recipes_response.raise_for_status()
        recipes_data = recipes_response.json()

        updated_count = 0
        for row in recipes_data.get('rows', []):
            recipe = row.get('doc', {})
            # Skip design documents
            if recipe.get('_id', '').startswith('_design'):
                continue
            
            # If recipe has author but no authorId, set authorId to author
            if recipe.get('author') and not recipe.get('authorId'):
                recipe['authorId'] = recipe['author']
                
                # Update the recipe
                recipe_update_url = f"{COUCHDB_URL}/{RECIPES_PATH}/{recipe['_id']}"
                update_response = requests.put(recipe_update_url, json=recipe, auth=(USERNAME, PASSWORD))
                if update_response.status_code in [200, 201]:
                    updated_count += 1

        return jsonify({
            'message': 'Migration completed',
            'updated_count': updated_count
        })
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Migration failed', 'details': str(e)}), 500


@app.route('/auth/login', methods=['POST'])
def validate_credentials():
    """Check whether a username/password combination is valid."""
    try:
        payload = request.get_json() or {}
        username = payload.get('username')
        password = payload.get('password')
        
        print(f'{username} | {password}')

        if not username or not password:
            return jsonify({'error': 'username and password are required'}), 400

        url = f"{COUCHDB_URL}/{ACCOUNTS_PATH}/{username}"
        print(url)
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


#region Favourites Routes
@app.route('/accounts/<username>/favourites', methods=['GET'])
def get_user_favourites(username):
    """Get all favourite recipe IDs for a specific user."""
    try:
        url = f"{COUCHDB_URL}/{ACCOUNTS_PATH}/{username}"
        response = requests.get(url, auth=(USERNAME, PASSWORD))

        if response.status_code == 404:
            return jsonify({'error': 'User not found'}), 404

        response.raise_for_status()
        user_doc = response.json()
        
        # Return favourites array, or empty array if not present
        favourites = user_doc.get('favourites', [])
        return jsonify({'favourites': favourites})
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to retrieve favourites', 'details': str(e)}), 500


@app.route('/accounts/<username>/likes', methods=['GET'])
def get_user_likes(username):
    """Get all liked recipe IDs for a specific user."""
    try:
        url = f"{COUCHDB_URL}/{ACCOUNTS_PATH}/{username}"
        response = requests.get(url, auth=(USERNAME, PASSWORD))

        if response.status_code == 404:
            return jsonify({'error': 'User not found'}), 404

        response.raise_for_status()
        user_doc = response.json()
        
        # Return likes array, or empty array if not present
        likes = user_doc.get('likes', [])
        return jsonify({'likes': likes})
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to retrieve likes', 'details': str(e)}), 500


@app.route('/accounts/<username>/favourites', methods=['POST'])
def add_favourite(username):
    """Add a recipe to user's favourites."""
    try:
        payload = request.get_json() or {}
        recipe_id = payload.get('recipeId')

        if not recipe_id:
            return jsonify({'error': 'recipeId is required'}), 400

        # Get current user document
        url = f"{COUCHDB_URL}/{ACCOUNTS_PATH}/{username}"
        response = requests.get(url, auth=(USERNAME, PASSWORD))

        if response.status_code == 404:
            return jsonify({'error': 'User not found'}), 404

        response.raise_for_status()
        user_doc = response.json()

        # Add recipe to favourites if not already present
        favourites = user_doc.get('favourites', [])
        if recipe_id not in favourites:
            favourites.append(recipe_id)
            user_doc['favourites'] = favourites

            # Update user document
            put_response = requests.put(url, json=user_doc, auth=(USERNAME, PASSWORD))
            put_response.raise_for_status()

        return jsonify({'message': 'Favourite added', 'favourites': favourites})
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to add favourite', 'details': str(e)}), 500


@app.route('/accounts/<username>/favourites/<recipe_id>', methods=['DELETE'])
def remove_favourite(username, recipe_id):
    """Remove a recipe from user's favourites."""
    try:
        # Get current user document
        url = f"{COUCHDB_URL}/{ACCOUNTS_PATH}/{username}"
        response = requests.get(url, auth=(USERNAME, PASSWORD))

        if response.status_code == 404:
            return jsonify({'error': 'User not found'}), 404

        response.raise_for_status()
        user_doc = response.json()

        # Remove recipe from favourites
        favourites = user_doc.get('favourites', [])
        if recipe_id in favourites:
            favourites.remove(recipe_id)
            user_doc['favourites'] = favourites

            # Update user document
            put_response = requests.put(url, json=user_doc, auth=(USERNAME, PASSWORD))
            put_response.raise_for_status()

        return jsonify({'message': 'Favourite removed', 'favourites': favourites})
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to remove favourite', 'details': str(e)}), 500


@app.route('/accounts/<username>/likes', methods=['POST'])
def add_like(username):
    """Add a recipe to user's likes."""
    try:
        payload = request.get_json() or {}
        recipe_id = payload.get('recipeId')

        if not recipe_id:
            return jsonify({'error': 'recipeId is required'}), 400

        # Get current user document
        url = f"{COUCHDB_URL}/{ACCOUNTS_PATH}/{username}"
        response = requests.get(url, auth=(USERNAME, PASSWORD))

        if response.status_code == 404:
            return jsonify({'error': 'User not found'}), 404

        response.raise_for_status()
        user_doc = response.json()

        # Add recipe to likes if not already present
        likes = user_doc.get('likes', [])
        if recipe_id not in likes:
            likes.append(recipe_id)
            user_doc['likes'] = likes

            # Update user document
            put_response = requests.put(url, json=user_doc, auth=(USERNAME, PASSWORD))
            put_response.raise_for_status()

        return jsonify({'message': 'Like added', 'likes': likes})
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to add like', 'details': str(e)}), 500


@app.route('/accounts/<username>/likes/<recipe_id>', methods=['DELETE'])
def remove_like(username, recipe_id):
    """Remove a recipe from user's likes."""
    try:
        # Get current user document
        url = f"{COUCHDB_URL}/{ACCOUNTS_PATH}/{username}"
        response = requests.get(url, auth=(USERNAME, PASSWORD))

        if response.status_code == 404:
            return jsonify({'error': 'User not found'}), 404

        response.raise_for_status()
        user_doc = response.json()

        # Remove recipe from likes
        likes = user_doc.get('likes', [])
        if recipe_id in likes:
            likes.remove(recipe_id)
            user_doc['likes'] = likes

            # Update user document
            put_response = requests.put(url, json=user_doc, auth=(USERNAME, PASSWORD))
            put_response.raise_for_status()

        return jsonify({'message': 'Like removed', 'likes': likes})
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to remove like', 'details': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
