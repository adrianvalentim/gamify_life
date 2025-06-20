from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from pathlib import Path

# Import the configured Gemini model
from gemini_config import gemini

# Placeholder for Gemini API Key - Load from environment variable
# For local development, you might set this in your shell:
# export GEMINI_API_KEY="your_actual_api_key"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI()

# --- CORS Middleware ---
# This allows the frontend (running on http://localhost:3000)
# to communicate with this backend service (running on http://localhost:8000).
origins = [
    "http://localhost:3000",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allow all methods (GET, POST, etc.)
    allow_headers=["*"], # Allow all headers
)

class TextInput(BaseModel):
    text: str
    user_id: str # Optional: To associate the text with a user
    # Add other relevant context your Go backend might send

class ParagraphInput(BaseModel):
    paragraph: str

class Action(BaseModel):
    type: str
    target_entity: str
    entity_id: str | None = None # e.g., character_id, mission_id
    parameters: dict | None = None # e.g., {"amount": 50} for XP

class AIResponse(BaseModel):
    suggested_actions: list[Action]

@app.get("/")
async def root():
    return {"message": "Gamify Life AI Service is running!"}

@app.post("/agent/update_character")
async def agent_update_character(input_data: ParagraphInput):
    """
    Receives a paragraph, combines it with a prompt, and sends it to Gemini.
    """
    try:
        # 1. Load the prompt from the specified file using an absolute path
        main_py_dir = Path(__file__).parent.resolve()
        prompt_path = main_py_dir / "prompts" / "update_character"
        
        with open(prompt_path, "r") as f:
            prompt_template = f.read()

        # 2. Combine the prompt with the input paragraph
        full_prompt = f"{prompt_template}\\n\\nUser's paragraph:\\n\\\"{input_data.paragraph}\\\""

        # 3. Send to Gemini API
        print(f"Sending prompt to Gemini: {full_prompt}")
        gemini_response = gemini.generate_content(full_prompt)

        # 4. Print the response to the terminal
        print("--- AI Agent Response ---")
        print(gemini_response.text)
        print("-------------------------")

        # 5. Return the response to the frontend
        return {"response": gemini_response.text}

    except FileNotFoundError:
        raise HTTPException(status_code=500, detail=f"Prompt file not found at {prompt_path}")
    except Exception as e:
        # Log the error for debugging
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while processing the request with Gemini.")

@app.post("/process-text", response_model=AIResponse)
async def process_text(input_data: TextInput):
    """
    Receives text from the Go backend, (will) interact with Gemini API,
    and returns structured actions.
    """
    print(f"Received text: {input_data.text} for user: {input_data.user_id}")

    # ---- AI Logic Placeholder ----
    # In a real scenario:
    # 1. Validate GEMINI_API_KEY
    # if not GEMINI_API_KEY:
    #     raise HTTPException(status_code=500, detail="Gemini API key not configured")
    # 2. Initialize Gemini client (e.g., using the google.generativeai library)
    #    genai.configure(api_key=GEMINI_API_KEY)
    #    model = genai.GenerativeModel('gemini-pro') # Or your chosen model
    # 3. Prepare prompt for Gemini using input_data.text and any other context.
    #    prompt = f"User '{input_data.user_id}' wrote: '{input_data.text}'. What game actions should be taken?"
    # 4. Send prompt to Gemini API.
    #    gemini_response = model.generate_content(prompt)
    # 5. Parse Gemini's response to determine actions.
    #    (This is the complex part - you'll need to define how Gemini's output maps to your game actions)
    # -------------------------------

    # For now, return a dummy action based on the input text.
    # This is where your Python AI agent's logic using Gemini would go.
    # It would analyze input_data.text and decide what actions to suggest.
    
    actions = []
    if "complete quest" in input_data.text.lower():
        actions.append(Action(
            type="COMPLETE_QUEST",
            target_entity="quest",
            entity_id="quest_123_placeholder", # This would be dynamically determined
            parameters={"xp_reward": 100}
        ))
    elif "level up" in input_data.text.lower() or "gain exp" in input_data.text.lower():
        actions.append(Action(
            type="GRANT_XP",
            target_entity="character",
            entity_id="char_abc_placeholder", # This would be dynamically determined
            parameters={"amount": 50}
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