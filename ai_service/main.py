from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
import logging
import sys
from pathlib import Path
import os
import json
import httpx
import base64

# Import for agents
from text_agent import initialize_text_agent, analyze_text_for_xp
from quest_agent import initialize_quest_agent, process_text_for_quests, generate_quest_details_from_text
from image_agent import generate_avatar_image

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional

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
        initialize_text_agent()
        initialize_quest_agent()
        logger.info("AI Service: All agents initialized successfully. Service is ready.")
    except Exception as e:
        logger.critical(f"AI Service: FATAL ERROR during agent initialization: {e}")
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
class ProcessTextRequest(BaseModel):
    user_id: str
    entry_text: str

class AvatarInput(BaseModel):
    prompt: str

class QuestDetailsInput(BaseModel):
    title: str
    description: str

# --- Backend Communication ---
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080/api/v1")

async def update_character_xp_in_backend(user_id: str, xp_amount: int):
    """Calls the backend to update the character's XP."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BACKEND_URL}/api/v1/users/{user_id}/character/xp",
                json={"xp_amount": xp_amount}
            )
            response.raise_for_status()
            logger.info(f"Successfully updated XP for user {user_id} by {xp_amount}.")
            return response.json()
    except httpx.RequestError as e:
        logger.error(f"Error calling backend to update XP for user {user_id}: {e}")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred during XP update for user {user_id}: {e}")
        return None

async def get_active_quests_from_backend(user_id: str) -> list:
    """Fetches active quests for a user from the Go backend."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BACKEND_URL}/api/v1/quests/user/{user_id}")
            response.raise_for_status()
            logger.info(f"Successfully fetched active quests for user {user_id}.")
            return response.json()
    except httpx.RequestError as e:
        logger.error(f"Error calling backend to get quests for user {user_id}: {e}")
        return []
    except Exception as e:
        logger.error(f"An unexpected error occurred during quest fetching for user {user_id}: {e}")
        return []

async def create_quest_in_backend(user_id: str, data: dict):
    """Calls the backend to create a new quest."""
    payload = {**data, "user_id": user_id}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{BACKEND_URL}/api/v1/quests", json=payload)
            response.raise_for_status()
            logger.info(f"Successfully created quest for user {user_id}.")
            return response.json()
    except httpx.RequestError as e:
        logger.error(f"Error calling backend to create quest for user {user_id}: {e}")
        return None

async def update_quest_in_backend(quest_id: str, data: dict):
    """Calls the backend to update an existing quest."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(f"{BACKEND_URL}/api/v1/quests/{quest_id}", json=data)
            response.raise_for_status()
            logger.info(f"Successfully updated quest {quest_id}.")
            return response.json()
    except httpx.RequestError as e:
        logger.error(f"Error calling backend to update quest {quest_id}: {e}")
        return None

async def complete_quest_in_backend(quest_id: str):
    """Calls the backend to mark a quest as complete."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{BACKEND_URL}/api/v1/quests/{quest_id}/complete")
            response.raise_for_status()
            logger.info(f"Successfully completed quest {quest_id}.")
            return response.json()
    except httpx.RequestError as e:
        logger.error(f"Error calling backend to complete quest {quest_id}: {e}")
        return None

# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"message": "Gamify Life AI Service is running!"}

@app.post("/agent/update_character_xp")
async def agent_update_character_xp(input_data: ProcessTextRequest):
    logger.info(f"Received text from user {input_data.user_id} for XP analysis.")
    
    agent_response = await analyze_text_for_xp(input_data.entry_text)
    action = agent_response.get("action")
    
    if action == "AWARD_XP":
        tool_calls = agent_response.get("tool_calls", [])
        xp_call = next((call for call in tool_calls if call.get("name") == "update_xp"), None)
        
        if xp_call:
            xp_amount = xp_call.get("args", {}).get("xp_amount")
            if isinstance(xp_amount, int):
                logger.info(f"Agent decided to award {xp_amount} XP to user {input_data.user_id}.")
                await update_character_xp_in_backend(input_data.user_id, xp_amount)
                return {"status": "success", "action": "AWARD_XP", "xp_awarded": xp_amount}

    logger.info(f"XP Agent recognized no action for user {input_data.user_id}.")
    return {"status": "success", "action": "NO_ACTION_RECOGNIZED"}

@app.post("/agent/update_quests")
async def agent_update_quests(input_data: ProcessTextRequest):
    logger.info(f"Received text from user {input_data.user_id} for quest analysis.")
    
    active_quests = await get_active_quests_from_backend(input_data.user_id)
    
    agent_response = await process_text_for_quests(input_data.entry_text, active_quests)
    action = agent_response.get("action")
    data = agent_response.get("data")

    if action == "CREATE" and data:
        logger.info(f"Quest Agent decided to CREATE a quest for user {input_data.user_id}.")
        await create_quest_in_backend(input_data.user_id, data)
        return {"status": "success", "action": "CREATE"}
    
    elif action == "UPDATE" and data and "questId" in data:
        logger.info(f"Quest Agent decided to UPDATE quest {data['questId']}.")
        await update_quest_in_backend(data["questId"], {"description": data.get("description")})
        return {"status": "success", "action": "UPDATE"}

    elif action == "COMPLETE" and data and "questId" in data:
        logger.info(f"Quest Agent decided to COMPLETE quest {data['questId']}.")
        await complete_quest_in_backend(data["questId"])
        return {"status": "success", "action": "COMPLETE"}

    logger.info(f"Quest Agent recognized no action for user {input_data.user_id}.")
    return {"status": "success", "action": "NO_ACTION"}

@app.post("/agent/generate_quest_details")
async def agent_generate_quest_details(input_data: QuestDetailsInput):
    logger.info(f"Received request to generate details for quest: {input_data.title}")
    try:
        details = await generate_quest_details_from_text(input_data.title, input_data.description)
        return details
    except Exception as e:
        logger.error(f"Error in generate_quest_details endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-avatar")
async def generate_avatar(input_data: AvatarInput):
    """
    Generates an avatar image using the image_agent.
    """
    logger.info(f"Received request to generate avatar with prompt: {input_data.prompt}")
    try:
        image_data_url = await generate_avatar_image(input_data.prompt)
        return {"avatar_url": image_data_url}
    except Exception as e:
        logger.error(f"Error in generate_avatar endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred during image generation: {e}")

# To run this app (from the ai_service directory):
# 1. Install dependencies: pip install fastapi uvicorn python-dotenv google-genai
# 2. Set your GEMINI_API_KEY environment variable.
# 3. Run: uvicorn main:app --reload --port 8001 