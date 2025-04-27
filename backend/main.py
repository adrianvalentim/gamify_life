from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import init_db
from routers import users, entries, quests, characters, documents

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database on startup
    init_db()
    yield
    # Clean up resources on shutdown
    pass

app = FastAPI(
    title="Gamify Journal API",
    description="API for the Gamify Journal application that transforms journaling into an RPG experience",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # NextJS frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(entries.router, prefix="/api/entries", tags=["entries"])
app.include_router(quests.router, prefix="/api/quests", tags=["quests"])
app.include_router(characters.router, prefix="/api/characters", tags=["characters"])
app.include_router(documents.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Gamify Journal API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 