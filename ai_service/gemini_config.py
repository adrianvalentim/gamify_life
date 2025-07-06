import os
import logging
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

# This will be configured by main.py
logger = logging.getLogger(__name__)

gemini = None

def initialize_gemini():
    """
    Initializes the Gemini client by loading the API key from environment
    variables and configuring the generative model.
    """
    global gemini
    logger.info("Starting Gemini Configuration...")

    config_dir = Path(__file__).parent.resolve()
    env_path = config_dir / ".env"

    logger.info(f"Searching for .env file at: {env_path}")
    if env_path.is_file():
        logger.info(".env file found, loading variables.")
        load_dotenv(dotenv_path=env_path, verbose=True)
    else:
        logger.warning(".env file not found. Relying on host environment variables.")

    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        logger.error("GEMINI_API_KEY not found in environment.")
        raise ValueError("GEMINI_API_KEY must be set.")

    logger.info("GEMINI_API_KEY loaded successfully.")
    
    try:
        genai.configure(api_key=api_key)

        generation_config = {
            "temperature": 1,
            "top_p": 0.95,
            "top_k": 64,
            "max_output_tokens": 8192,
        }

        gemini = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config=generation_config,
        )
        logger.info("Gemini generative model initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to configure or initialize Gemini model: {e}")
        raise
