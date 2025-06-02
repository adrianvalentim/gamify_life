from fastapi import FastAPI
from pydantic import BaseModel
import os

# Placeholder for Gemini API Key - Load from environment variable
# For local development, you might set this in your shell:
# export GEMINI_API_KEY="your_actual_api_key"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI()

class TextInput(BaseModel):
    text: str
    user_id: str # Optional: To associate the text with a user
    # Add other relevant context your Go backend might send

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