import os
import logging
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai
import google.ai.generativelanguage as glm
import json

logger = logging.getLogger(__name__)

gemini_model = None

def initialize_text_agent():
    """
    Initializes the Gemini client for text processing by loading the API key 
    from environment variables and configuring the generative model.
    """
    global gemini_model
    logger.info("Initializing Text Agent...")

    load_dotenv()
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        logger.error("GEMINI_API_KEY not found for Text Agent.")
        raise ValueError("GEMINI_API_KEY must be set.")

    try:
        genai.configure(api_key=api_key)

        generation_config = {
            "temperature": 1,
            "top_p": 0.95,
            "top_k": 64,
            "max_output_tokens": 8192,
        }
        
        update_xp_tool = glm.Tool(
            function_declarations=[
                glm.FunctionDeclaration(
                    name="update_xp",
                    description="Updates the character's experience points (XP) based on completed tasks.",
                    parameters=glm.Schema(
                        type=glm.Type.OBJECT,
                        properties={
                            "xp_amount": glm.Schema(type=glm.Type.INTEGER)
                        },
                        required=["xp_amount"],
                    ),
                )
            ]
        )

        gemini_model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config=generation_config,
            tools=[update_xp_tool]
        )
        logger.info("Text Agent initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Text Agent model: {e}")
        raise

async def analyze_text_for_xp(paragraph: str) -> dict:
    """
    Analyzes the user's paragraph to award XP using tool-calling.
    """
    if gemini_model is None:
        raise Exception("Text Agent is not initialized.")

    try:
        prompt_path = Path(__file__).parent / "prompts" / "update_character_xp"
        with open(prompt_path, "r") as f:
            prompt_template = f.read()
        
        full_prompt = f"{prompt_template}\\n\\nUser's paragraph:\\n\\\"{paragraph}\\\""
        
        response = await gemini_model.generate_content_async(full_prompt)

        try:
            # The model should return a JSON string, try to parse it
            response_text = response.text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:-4] #
            
            response_json = json.loads(response_text)

            if response_json.get("action") == "AWARD_XP":
                tool_calls = response_json.get("tool_calls", [])
                xp_call = next((call for call in tool_calls if call.get("name") == "update_xp"), None)
                if xp_call and "args" in xp_call and "xp_amount" in xp_call["args"]:
                    xp_amount = int(xp_call["args"]["xp_amount"])
                    # Return a dictionary that matches the structure expected by main.py
                    return {
                        "action": "AWARD_XP",
                        "tool_calls": [{"name": "update_xp", "args": {"xp_amount": xp_amount}}]
                    }
        except (json.JSONDecodeError, IndexError, AttributeError) as e:
            logger.warning(f"Could not parse JSON from model response for XP agent: {e}. Response was: {response.text}")
            # Fall through to NO_ACTION if parsing fails
            pass

        return {"action": "NO_ACTION_RECOGNIZED", "tool_calls": []}

    except Exception as e:
        logger.error(f"Error in analyze_text_for_xp: {e}")
        raise 