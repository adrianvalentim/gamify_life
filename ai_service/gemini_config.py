import os
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

# Build an absolute path to the .env file.
# This ensures it's found regardless of where the script is run from.
config_dir = Path(__file__).parent.resolve()
env_path = config_dir / ".env"

# Load environment variables from .env file
load_dotenv(dotenv_path=env_path)

# Get API key from environment variable
api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    raise ValueError("Please set GEMINI_API_KEY in your .env file")

genai.configure(api_key=api_key)

generation_config = {
  "temperature": 1,
  "top_p": 0.95,
  "top_k": 64,
  "max_output_tokens": 8192,
}

gemini = genai.GenerativeModel(
  model_name="gemini-2.0-flash",
  generation_config=generation_config,
)
