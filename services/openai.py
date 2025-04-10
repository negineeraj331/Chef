"""
OpenAI API service for the cooking assistant
Uses OpenAI's GPT models via their official API
"""
import json
import os
from openai import OpenAI

# the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
# do not change this unless explicitly requested by the user
MODEL_NAME = "gpt-4o"

# Get API key from environment variables
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")


def get_client():
    """
    Returns an OpenAI client instance
    Will raise ValueError if API key is not set
    """
    if not OPENAI_API_KEY:
        raise ValueError("OpenAI API key not found. Please set the OPENAI_API_KEY environment variable.")
    
    return OpenAI(api_key=OPENAI_API_KEY)


def get_ai_response(user_message, chat_history=None):
    """
    Get a response from the OpenAI API for the cooking assistant
    
    Args:
        user_message (str): The user's message
        chat_history (list): Previous messages in the conversation
    
    Returns:
        str: The AI's response text
    """
    try:
        if not chat_history:
            chat_history = []
        
        client = get_client()
        
        # Construct messages for the API request
        system_prompt = """
        You are an expert cooking assistant with deep knowledge of recipes, ingredients, cooking techniques, 
        and nutrition. Your goal is to help users with their cooking questions, meal planning, and provide 
        culinary advice.

        Focus your responses on:
        - Providing clear, step-by-step cooking instructions
        - Offering ingredient substitutions for dietary restrictions
        - Explaining cooking techniques and kitchen science
        - Suggesting meal ideas based on user preferences
        - Answering nutrition questions related to recipes and ingredients

        Be friendly, encouraging, and supportive of home cooks of all skill levels. 
        Format your answers for readability, using bullet points and sections as needed.
        """
        
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add chat history
        for msg in chat_history:
            messages.append(msg)
        
        # Add the user's new message
        messages.append({"role": "user", "content": user_message})
        
        # Make the API request
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            temperature=0.7,
            max_tokens=800
        )
        
        return response.choices[0].message.content
    
    except Exception as e:
        return f"I apologize, but I encountered an error while processing your request: {str(e)}"


def analyze_recipe(recipe_text):
    """
    Analyze a recipe text to extract structured information
    
    Args:
        recipe_text (str): The full recipe text including title, ingredients, and instructions
    
    Returns:
        dict: Structured recipe data including title, ingredients, instructions, etc.
    """
    try:
        client = get_client()
        
        system_prompt = """
        You are a recipe analysis expert. Extract structured information from recipe text.
        Provide the output as a JSON object with the following fields:
        - title: The recipe title
        - servings: Number of servings (integer)
        - prep_time_mins: Preparation time in minutes (integer)
        - cook_time_mins: Cooking time in minutes (integer)
        - ingredients: Array of ingredient objects with 'name', 'amount', and 'unit' fields
        - instructions: Array of step-by-step instructions
        - cuisine_type: The type of cuisine (e.g., Italian, Mexican)
        - difficulty: Cooking difficulty (Easy, Medium, Hard)
        - tags: Array of recipe tags (e.g., Vegetarian, Gluten-Free, Quick)
        """
        
        # Make the API request with JSON response format
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": recipe_text}
            ],
            temperature=0.2,
            max_tokens=1000,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return result
    
    except Exception as e:
        return {"error": f"Error analyzing recipe: {str(e)}"}


def generate_meal_suggestions(preferences, diet_restrictions=None, ingredient_list=None):
    """
    Generate meal suggestions based on user preferences and available ingredients
    
    Args:
        preferences (str): User's preferences, cuisine interests, or meal types
        diet_restrictions (str, optional): Any dietary restrictions or allergies
        ingredient_list (list, optional): List of available ingredients to use
    
    Returns:
        dict: Dictionary containing meal suggestions
    """
    try:
        client = get_client()
        
        # Construct the prompt
        prompt = f"Generate meal suggestions based on the following criteria:\n\n"
        prompt += f"Preferences: {preferences}\n"
        
        if diet_restrictions:
            prompt += f"Dietary restrictions: {diet_restrictions}\n"
        
        if ingredient_list and len(ingredient_list) > 0:
            prompt += f"Available ingredients: {', '.join(ingredient_list)}\n"
        
        prompt += "\nProvide 3-5 meal ideas with brief descriptions. Format as JSON with an array of meal objects."
        
        # Make the API request with JSON response format
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system", 
                    "content": "You are a culinary expert that specializes in meal planning and recipe suggestions. Respond with detailed, creative meal ideas in JSON format."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=800,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return result
    
    except Exception as e:
        return {"error": f"Error generating meal suggestions: {str(e)}"}