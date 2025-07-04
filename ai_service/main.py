from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
import logging
import sys
from pathlib import Path
import os

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

class TextInput(BaseModel):
    text: str
    user_id: str

class Action(BaseModel):
    type: str
    target_entity: str
    entity_id: str | None = None
    parameters: dict

class AIResponse(BaseModel):
    suggested_actions: list[Action]

# --- API Endpoints ---
@app.get("/")
def read_root():
    if gemini_config.gemini is None:
        raise HTTPException(status_code=503, detail="Service Unavailable: AI Model is not initialized.")
    return {"message": "Gamify Life AI Service is running!"}

@app.post("/agent/update_character")
async def agent_update_character(input_data: ParagraphInput):
    if gemini_config.gemini is None:
        raise HTTPException(status_code=503, detail="AI Service is not initialized.")
    
    try:
        prompt_path = Path(__file__).parent / "prompts" / "update_character"
        with open(prompt_path, "r") as f:
            prompt_template = f.read()
        
        full_prompt = f"{prompt_template}\\n\\nUser's paragraph:\\n\\\"{input_data.paragraph}\\\""
        
        response = gemini_config.gemini.generate_content(full_prompt)
        
        return {"response": response.text}
    except FileNotFoundError:
        logger.error(f"Prompt file not found at {prompt_path}")
        raise HTTPException(status_code=500, detail="Prompt file not found.")
    except Exception as e:
        logger.error(f"Error in agent_update_character: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while processing the request with Gemini.")

@app.post("/process-text", response_model=AIResponse)
async def process_text(input_data: TextInput):
    if gemini_config.gemini is None:
        raise HTTPException(status_code=503, detail="AI Service is not initialized.")
        
    logger.info(f"Received text: '{input_data.text}' for user: {input_data.user_id}")

    # Dummy logic as a placeholder
    actions = []
    if "complete quest" in input_data.text.lower():
        actions.append(Action(
            type="COMPLETE_QUEST",
            target_entity="quest",
            entity_id="quest_123_placeholder",
            parameters={"xp_reward": 100}
        ))
    else:
        actions.append(Action(
            type="NO_ACTION_RECOGNIZED",
            target_entity="none",
            parameters={"original_text": input_data.text}
        ))
        
    return AIResponse(suggested_actions=actions)

# To run this app (from the ai_service directory):
# 1. Install dependencies: pip install fastapi uvicorn python-dotenv
# 2. Set your GEMINI_API_KEY environment variable.
# 3. Run: uvicorn main:app --reload --port 8000 