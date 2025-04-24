# Gamify Journal Backend

This is the FastAPI backend for the Gamify Journal application, which provides RESTful APIs for the frontend to interact with.

## Features

- User authentication and registration
- Character creation and management
- Journal entry creation and management
- Quest system with dynamic quest generation
- XP and leveling system for characters

## Getting Started

### Prerequisites

- Python 3.8+
- pip/pip3

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pip3 install -r backend/requirements.txt
   ```

### Running the Server

To start the development server:

```bash
cd backend
python3 -m uvicorn main:app --reload
```

The API will be available at http://localhost:8000

### API Documentation

Once the server is running, you can access the automatically generated API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

The API includes the following main endpoints:

### Authentication

- `POST /api/users/register` - Register a new user
- `POST /api/users/token` - Login and get access token
- `GET /api/users/me` - Get current user info

### Characters

- `POST /api/characters/` - Create a character
- `GET /api/characters/me` - Get current user's character
- `PUT /api/characters/me` - Update character
- `PUT /api/characters/me/stats` - Update character stats

### Journal Entries

- `POST /api/entries/` - Create a journal entry
- `GET /api/entries/` - Get all entries for current user
- `GET /api/entries/{entry_id}` - Get specific entry
- `PUT /api/entries/{entry_id}` - Update an entry
- `DELETE /api/entries/{entry_id}` - Delete an entry

### Quests

- `GET /api/quests/available` - Get available quests
- `POST /api/quests/generate` - Generate a random quest
- `POST /api/quests/accept/{quest_id}` - Accept a quest
- `GET /api/quests/my-quests` - Get all quests for current user
- `PUT /api/quests/my-quests/{user_quest_id}` - Update quest progress

## Database

The application uses SQLite as the database for simplicity. In a production environment, you might want to switch to a more robust database like PostgreSQL. 