from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
import logging
import sys
from pathlib import Path
import os
import json
import httpx

import gemini_config
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- Logger Setup ---
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s] %(asctime)s - %(message)s",
    stream=sys.stdout
)

# --- Lifespan Manager ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI Service: Initializing...")
    try:
        gemini_config.initialize_gemini()
        logger.info("AI Service: Gemini initialization successful. Service is ready.")
    except Exception as e:
        logger.critical(f"AI Service: FATAL ERROR during Gemini initialization: {e}")
    yield
    logger.info("AI Service: Shutting down...")

app = FastAPI(lifespan=lifespan)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class ParagraphInput(BaseModel):
    paragraph: str
    user_id: str

# --- Backend Communication ---
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080/api/v1")

async def update_character_xp_in_backend(user_id: str, xp_amount: int):
    """Calls the backend to update the character's XP."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BACKEND_URL}/users/{user_id}/character/xp",
                json={"xp_amount": xp_amount}
            )
            response.raise_for_status()
            logger.info(f"Successfully updated XP for user {user_id} by {xp_amount}.")
            return response.json()
    except httpx.RequestError as e:
        logger.error(f"Error calling backend to update XP for user {user_id}: {e}")
        # This is an internal error, so we don't expose it to the client
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred during XP update for user {user_id}: {e}")
        return None


# --- AI Agents ---
async def update_character_agent(paragraph: str) -> dict:
    """
    Analyzes the user's paragraph to award XP using a specialized agent.
    """
    if gemini_config.gemini is None:
        raise HTTPException(status_code=503, detail="AI Service is not initialized.")

    try:
        prompt_path = Path(__file__).parent / "prompts" / "update_character_xp"
        with open(prompt_path, "r") as f:
            prompt_template = f.read()

        full_prompt = f"{prompt_template}\n\nUser's paragraph:\n\"{paragraph}\""
        
        response = gemini_config.gemini.generate_content(full_prompt)
        
        # Clean the response to ensure it's valid JSON
        cleaned_response = response.text.strip().replace('`', '')
        if cleaned_response.startswith("json"):
            cleaned_response = cleaned_response[4:].strip()
            
        return json.loads(cleaned_response)

    except FileNotFoundError:
        logger.error(f"Prompt file not found at {prompt_path}")
        raise HTTPException(status_code=500, detail="Agent prompt file not found.")
    except json.JSONDecodeError:
        logger.error(f"Failed to decode JSON from AI response: {response.text}")
        raise HTTPException(status_code=500, detail="Invalid format in AI response.")
    except Exception as e:
        logger.error(f"Error in update_character_agent: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while processing with the agent.")


# --- API Endpoints ---
@app.get("/")
def read_root():
    if gemini_config.gemini is None:
        raise HTTPException(status_code=503, detail="Service Unavailable: AI Model is not initialized.")
    return {"message": "Gamify Life AI Service is running!"}

@app.post("/agent/update_character")
async def agent_update_character(input_data: ParagraphInput):
    logger.info(f"Received paragraph from user {input_data.user_id} for character update.")
    
    agent_response = await update_character_agent(input_data.paragraph)

    action = agent_response.get("action")
    
    if action == "AWARD_XP":
        tool_calls = agent_response.get("tool_calls", [])
        if not tool_calls:
            return {"status": "no_op", "detail": "Agent decided to award XP but provided no tool call."}

        xp_call = next((call for call in tool_calls if call.get("name") == "update_xp"), None)
        
        if xp_call:
            xp_amount = xp_call.get("args", {}).get("xp_amount")
            if isinstance(xp_amount, int):
                logger.info(f"Agent decided to award {xp_amount} XP to user {input_data.user_id}.")
                await update_character_xp_in_backend(input_data.user_id, xp_amount)
                return {"status": "success", "action": "AWARD_XP", "xp_awarded": xp_amount}
            else:
                return {"status": "no_op", "detail": "Agent provided invalid 'xp_amount'."}

    elif action == "NO_ACTION_RECOGNIZED":
        logger.info(f"Agent recognized no action for user {input_data.user_id}.")
        return {"status": "success", "action": "NO_ACTION_RECOGNIZED"}

    logger.warning(f"Agent returned an unknown action: {action}")
    return {"status": "no_op", "detail": f"Agent returned an unknown action: {action}"}

# To run this app (from the ai_service directory):
# 1. Install dependencies: pip install fastapi uvicorn python-dotenv
# 2. Set your GEMINI_API_KEY environment variable.
# 3. Run: uvicorn main:app --reload --port 8000 