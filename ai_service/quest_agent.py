import os
import logging
import json
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

logger = logging.getLogger(__name__)

quest_model = None

def initialize_quest_agent():
    """
    Initializes the Gemini client for quest processing.
    """
    global quest_model
    logger.info("Initializing Quest Agent...")

    load_dotenv()
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        logger.error("GEMINI_API_KEY not found for Quest Agent.")
        raise ValueError("GEMINI_API_KEY must be set.")

    try:
        genai.configure(api_key=api_key)

        generation_config = {
            "temperature": 0.9,
            "top_p": 1,
            "top_k": 1,
            "max_output_tokens": 2048,
            "response_mime_type": "application/json",
        }

        quest_model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config=generation_config,
        )
        logger.info("Quest Agent initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Quest Agent model: {e}")
        raise

async def process_text_for_quests(entry_text: str, active_quests: list) -> dict:
    """
    Analyzes the user's journal entry to create, update, or complete quests.
    """
    if quest_model is None:
        raise Exception("Quest Agent is not initialized.")

    try:
        prompt_path = Path(__file__).parent / "prompts" / "update_quests"
        with open(prompt_path, "r") as f:
            prompt_template = f.read()

        input_data = {
            "entry_text": entry_text,
            "active_quests": active_quests
        }
        
        full_prompt = f"{prompt_template}\\n\\nInput:\\n{json.dumps(input_data, indent=2)}"
        
        response = await quest_model.generate_content_async(full_prompt)
        
        response_text = response.text
        logger.debug(f"Raw response from Quest Agent: {response_text}")
        
        # The model is configured to return JSON, so we parse it directly.
        return json.loads(response_text)

    except Exception as e:
        logger.error(f"Error in process_text_for_quests: {e}")
        raise

async def generate_quest_details_from_text(title: str, description: str) -> dict:
    """
    Generates rich lore and rewards for a quest based on its title and description.
    """
    if quest_model is None:
        raise Exception("Quest Agent is not initialized.")

    try:
        prompt_path = Path(__file__).parent / "prompts" / "generate_quest_details"
        with open(prompt_path, "r") as f:
            prompt_template = f.read()

        user_input = json.dumps({"title": title, "description": description})
        full_prompt = f"{prompt_template}\\n\\nUser Input:\\n{user_input}"

        response = await quest_model.generate_content_async(full_prompt)
        
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-4]

        details = json.loads(response_text)
        return details

    except Exception as e:
        logger.error(f"Error in generate_quest_details_from_text: {e}")
        raise 