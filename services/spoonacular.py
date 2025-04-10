import requests
import logging
from config import Config

SPOONACULAR_BASE_URL = "https://api.spoonacular.com"

def search_recipes(query, diet='', intolerances=''):
    """
    Search for recipes using the Spoonacular API
    """
    endpoint = f"{SPOONACULAR_BASE_URL}/recipes/complexSearch"
    
    params = {
        'apiKey': Config.SPOONACULAR_API_KEY,
        'query': query,
        'addRecipeInformation': True,
        'fillIngredients': True,
        'number': 12,  # Number of results to return
    }
    
    if diet:
        params['diet'] = diet
    
    if intolerances:
        params['intolerances'] = intolerances
    
    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()
        return response.json().get('results', [])
    except requests.exceptions.RequestException as e:
        logging.error(f"Error searching recipes: {e}")
        raise Exception(f"Error searching recipes: {e}")

def get_recipe_info(recipe_id):
    """
    Get detailed information about a specific recipe
    """
    endpoint = f"{SPOONACULAR_BASE_URL}/recipes/{recipe_id}/information"
    
    params = {
        'apiKey': Config.SPOONACULAR_API_KEY,
        'includeNutrition': True
    }
    
    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()
        recipe_data = response.json()
        
        # Get similar recipes
        similar_recipes = get_similar_recipes(recipe_id)
        recipe_data['similar_recipes'] = similar_recipes
        
        # Get video data for recipe if available
        try:
            videos = get_recipe_videos(recipe_data['title'])
            if videos and len(videos) > 0:
                recipe_data['videos'] = videos
        except Exception as e:
            logging.error(f"Error getting recipe videos: {e}")
        
        return recipe_data
    except requests.exceptions.RequestException as e:
        logging.error(f"Error getting recipe info: {e}")
        raise Exception(f"Error getting recipe info: {e}")

def get_similar_recipes(recipe_id, number=3):
    """
    Get similar recipes to the one specified
    """
    endpoint = f"{SPOONACULAR_BASE_URL}/recipes/{recipe_id}/similar"
    
    params = {
        'apiKey': Config.SPOONACULAR_API_KEY,
        'number': number
    }
    
    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logging.error(f"Error getting similar recipes: {e}")
        return []

def get_recipe_videos(query, number=1):
    """
    Get YouTube videos related to a recipe
    """
    endpoint = f"{SPOONACULAR_BASE_URL}/food/videos/search"
    
    params = {
        'apiKey': Config.SPOONACULAR_API_KEY,
        'query': query,
        'number': number
    }
    
    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()
        return response.json().get('videos', [])
    except requests.exceptions.RequestException as e:
        logging.error(f"Error getting recipe videos: {e}")
        return []

def generate_meal_plan(time_frame='day', target_calories=2000, diet='', exclude=''):
    """
    Generate a meal plan based on user preferences
    """
    endpoint = f"{SPOONACULAR_BASE_URL}/mealplanner/generate"
    
    params = {
        'apiKey': Config.SPOONACULAR_API_KEY,
        'timeFrame': time_frame,
        'targetCalories': target_calories,
    }
    
    if diet:
        params['diet'] = diet
    
    if exclude:
        params['exclude'] = exclude
    
    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()
        
        meal_plan_data = response.json()
        
        # If we have a day meal plan, get detailed recipe info for each meal
        if time_frame == 'day' and 'meals' in meal_plan_data:
            for i, meal in enumerate(meal_plan_data['meals']):
                recipe_id = meal['id']
                try:
                    recipe_details = get_recipe_info(recipe_id)
                    meal_plan_data['meals'][i]['details'] = recipe_details
                except Exception as e:
                    logging.error(f"Error getting recipe details for meal plan: {e}")
                    meal_plan_data['meals'][i]['details'] = None
        
        return meal_plan_data
    except requests.exceptions.RequestException as e:
        logging.error(f"Error generating meal plan: {e}")
        raise Exception(f"Error generating meal plan: {e}")

def generate_shopping_list(recipe_ids):
    """
    Generate a shopping list for a set of recipes
    """
    if not recipe_ids or len(recipe_ids) == 0:
        return {'aisles': []}
    
    endpoint = f"{SPOONACULAR_BASE_URL}/mealplanner/shopping-list/compute"
    
    # Format the recipe list in the required format
    recipes = []
    for recipe_id in recipe_ids:
        recipes.append({
            "id": int(recipe_id),
            "servings": 1
        })
    
    data = {
        "items": recipes
    }
    
    params = {
        'apiKey': Config.SPOONACULAR_API_KEY,
    }
    
    try:
        response = requests.post(endpoint, json=data, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logging.error(f"Error generating shopping list: {e}")
        raise Exception(f"Error generating shopping list: {e}")

def get_recipe_nutrition_widget(recipe_id):
    """
    Get a nutrition widget for a recipe
    """
    endpoint = f"{SPOONACULAR_BASE_URL}/recipes/{recipe_id}/nutritionWidget.json"
    
    params = {
        'apiKey': Config.SPOONACULAR_API_KEY
    }
    
    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logging.error(f"Error getting recipe nutrition: {e}")
        return None
