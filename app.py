import os
import logging
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from config import Config
from services.spoonacular import (
    search_recipes, get_recipe_info, generate_meal_plan, 
    generate_shopping_list, get_recipe_nutrition_widget, get_recipe_videos
)
from services.openrouter import get_ai_response as get_openrouter_response
try:
    from services.openai import get_ai_response as get_openai_response
    OPENAI_AVAILABLE = True
except (ImportError, ValueError):
    OPENAI_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", Config.SECRET_KEY)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('query', '')
    diet = request.args.get('diet', '')
    intolerances = request.args.get('intolerances', '')
    
    if not query:
        return render_template('index.html')
    
    try:
        results = search_recipes(query, diet, intolerances)
        return render_template('index.html', recipes=results, search_query=query)
    except Exception as e:
        logging.error(f"Error searching recipes: {e}")
        error_message = "An error occurred while searching for recipes."
        
        # Check if it's an API limit error (402 Payment Required)
        if "402" in str(e) and "Payment Required" in str(e):
            error_message = "The recipe service has reached its daily request limit. Please try again tomorrow or contact support for assistance."
        
        return render_template('index.html', error=error_message)

@app.route('/recipe/<int:recipe_id>')
def recipe(recipe_id):
    try:
        recipe_data = get_recipe_info(recipe_id)
        
        # Add recipe to session for potential shopping list addition
        if 'viewed_recipes' not in session:
            session['viewed_recipes'] = []
            
        # Only add if not already in the list
        recipe_summary = {
            'id': recipe_data['id'],
            'title': recipe_data['title'],
            'image': recipe_data.get('image', '')
        }
        
        viewed_recipes = session['viewed_recipes']
        if recipe_summary not in viewed_recipes:
            viewed_recipes.append(recipe_summary)
            session['viewed_recipes'] = viewed_recipes
            
        return render_template('recipe.html', recipe=recipe_data)
    except Exception as e:
        logging.error(f"Error getting recipe info: {e}")
        error_message = "Could not retrieve recipe information. Please try again."
        
        # Check if it's an API limit error (402 Payment Required)
        if "402" in str(e) and "Payment Required" in str(e):
            error_message = "The recipe service has reached its daily request limit. Please try again tomorrow or contact support for assistance."
        
        return render_template('index.html', error=error_message)

@app.route('/chat')
def chat():
    # Pass AI provider information to the template
    return render_template('chat.html', openai_available=OPENAI_AVAILABLE)

@app.route('/api/chat', methods=['POST'])
def api_chat():
    data = request.json
    user_message = data.get('message', '')
    chat_history = data.get('history', [])
    provider = data.get('provider', 'openrouter')  # Default to OpenRouter
    
    if not user_message:
        return jsonify({"error": "No message provided"}), 400
    
    try:
        # Use OpenAI if available and requested
        if provider == 'openai' and OPENAI_AVAILABLE:
            response = get_openai_response(user_message, chat_history)
        else:
            # Fall back to OpenRouter
            response = get_openrouter_response(user_message, chat_history)
        
        return jsonify({"response": response, "provider": provider})
    except Exception as e:
        logging.error(f"Error getting AI response from {provider}: {e}")
        
        error_message = "Could not get a response from the AI. Please try again."
        
        if "API key not found" in str(e):
            error_message = "AI service API key is missing. Please contact the administrator."
        elif "429" in str(e) or "rate limit" in str(e).lower():
            error_message = "AI service rate limit exceeded. Please try again later."
        
        return jsonify({"error": error_message, "provider": provider}), 500

@app.route('/meal-plan')
def meal_plan():
    return render_template('meal_plan.html')

@app.route('/api/meal-plan', methods=['POST'])
def api_meal_plan():
    data = request.json
    time_frame = data.get('timeFrame', 'day')
    target_calories = data.get('targetCalories', 2000)
    diet = data.get('diet', '')
    exclude = data.get('exclude', '')
    
    try:
        meal_plan = generate_meal_plan(time_frame, target_calories, diet, exclude)
        return jsonify(meal_plan)
    except Exception as e:
        logging.error(f"Error generating meal plan: {e}")
        error_message = "Could not generate meal plan. Please try again."
        status_code = 500
        
        # Check if it's an API limit error (402 Payment Required)
        if "402" in str(e) and "Payment Required" in str(e):
            error_message = "The recipe service has reached its daily request limit. Please try again tomorrow or contact support for assistance."
            status_code = 402
            
        return jsonify({"error": error_message}), status_code

@app.route('/shopping-list')
def shopping_list():
    return render_template('shopping_list.html')

@app.route('/api/add-to-shopping-list', methods=['POST'])
def api_add_to_shopping_list():
    data = request.json
    recipe_id = data.get('recipe_id')
    
    if not recipe_id:
        return jsonify({"error": "No recipe ID provided"}), 400
    
    # Store in session
    if 'shopping_list' not in session:
        session['shopping_list'] = []
    
    # Check if recipe is already in the shopping list
    if recipe_id not in session['shopping_list']:
        session['shopping_list'].append(recipe_id)
    
    return jsonify({"success": True, "message": "Recipe added to shopping list", "count": len(session['shopping_list'])})

@app.route('/api/remove-from-shopping-list', methods=['POST'])
def api_remove_from_shopping_list():
    data = request.json
    recipe_id = data.get('recipe_id')
    
    if not recipe_id:
        return jsonify({"error": "No recipe ID provided"}), 400
    
    # Remove from session
    if 'shopping_list' in session and recipe_id in session['shopping_list']:
        session['shopping_list'].remove(recipe_id)
    
    return jsonify({"success": True, "message": "Recipe removed from shopping list", "count": len(session.get('shopping_list', []))})

@app.route('/api/get-shopping-list', methods=['GET'])
def api_get_shopping_list():
    recipe_ids = session.get('shopping_list', [])
    
    if not recipe_ids or len(recipe_ids) == 0:
        return jsonify({"aisles": []})
    
    try:
        shopping_list = generate_shopping_list(recipe_ids)
        return jsonify(shopping_list)
    except Exception as e:
        logging.error(f"Error generating shopping list: {e}")
        error_message = "Could not generate shopping list. Please try again."
        status_code = 500
        
        # Check if it's an API limit error (402 Payment Required)
        if "402" in str(e) and "Payment Required" in str(e):
            error_message = "The recipe service has reached its daily request limit. Please try again tomorrow or contact support for assistance."
            status_code = 402
            
        return jsonify({"error": error_message}), status_code

@app.route('/api/clear-shopping-list', methods=['POST'])
def api_clear_shopping_list():
    if 'shopping_list' in session:
        session.pop('shopping_list')
    
    return jsonify({"success": True, "message": "Shopping list cleared"})

@app.route('/api/nutrition/<int:recipe_id>', methods=['GET'])
def api_nutrition(recipe_id):
    try:
        nutrition_data = get_recipe_nutrition_widget(recipe_id)
        return jsonify(nutrition_data)
    except Exception as e:
        logging.error(f"Error getting nutrition data: {e}")
        error_message = "Could not get nutrition data. Please try again."
        status_code = 500
        
        # Check if it's an API limit error (402 Payment Required)
        if "402" in str(e) and "Payment Required" in str(e):
            error_message = "The recipe service has reached its daily request limit. Please try again tomorrow or contact support for assistance."
            status_code = 402
            
        return jsonify({"error": error_message}), status_code

@app.route('/api/recipe-videos/<path:query>', methods=['GET'])
def api_recipe_videos(query):
    try:
        videos = get_recipe_videos(query, number=3)
        return jsonify({"videos": videos})
    except Exception as e:
        logging.error(f"Error getting recipe videos: {e}")
        error_message = "Could not get recipe videos. Please try again."
        status_code = 500
        
        # Check if it's an API limit error (402 Payment Required)
        if "402" in str(e) and "Payment Required" in str(e):
            error_message = "The recipe service has reached its daily request limit. Please try again tomorrow or contact support for assistance."
            status_code = 402
            
        return jsonify({"error": error_message}), status_code

@app.errorhandler(404)
def page_not_found(e):
    return render_template('index.html', error="Page not found"), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('index.html', error="An internal server error occurred. Please try again later."), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
