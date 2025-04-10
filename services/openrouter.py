import requests
import logging
from config import Config

def get_ai_response(user_message, chat_history=None):
    """
    Get a response from the OpenRouter API for the cooking assistant
    """
    if chat_history is None:
        chat_history = []
    
    # Prepare the system message to establish the AI's role
    system_message = {
        "role": "system",
        "content": (
            "You are an expert AI cooking assistant named Chef AI. Your expertise is in providing cooking guidance, "
            "recipe instructions, ingredient substitutions, cooking techniques, and meal planning advice. "
            "Be friendly, helpful, and provide clear, step-by-step instructions when explaining recipes or cooking methods. "
            "Feel free to suggest ingredient alternatives and cooking tips. If you don't know something, admit it and "
            "suggest looking for recipes that might be more suitable."
        )
    }
    
    # Format the chat history
    formatted_history = []
    for message in chat_history:
        if 'user' in message:
            formatted_history.append({"role": "user", "content": message['user']})
        if 'assistant' in message:
            formatted_history.append({"role": "assistant", "content": message['assistant']})
    
    # Add the current user message
    formatted_history.append({"role": "user", "content": user_message})
    
    # Prepare the full messages array with the system message first
    messages = [system_message] + formatted_history
    
    # Make the API request
    headers = {
        "Authorization": f"Bearer {Config.OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "openai/gpt-3.5-turbo",  # Using GPT-3.5 Turbo through OpenRouter
        "messages": messages
    }
    
    try:
        response = requests.post(
            Config.OPENROUTER_API_URL,
            headers=headers,
            json=data
        )
        response.raise_for_status()
        
        response_data = response.json()
        logging.debug(f"AI Response: {response_data}")
        
        # Extract and return the assistant's message
        if "choices" in response_data and len(response_data["choices"]) > 0:
            return response_data["choices"][0]["message"]["content"]
        else:
            raise Exception("No response content from AI")
            
    except requests.exceptions.RequestException as e:
        logging.error(f"Error getting AI response: {e}")
        raise Exception(f"Error getting AI response: {e}")
