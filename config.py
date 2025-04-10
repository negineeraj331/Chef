import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get("SESSION_SECRET", "dev-secret-key")
    SPOONACULAR_API_KEY = os.environ.get("SPOONACULAR_API_KEY", "257afb0551804279af943caa042733be")
    OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "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")
    OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
