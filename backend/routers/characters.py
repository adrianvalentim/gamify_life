from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from database import get_db
from models import Character, User
from schemas import CharacterCreate, CharacterResponse, CharacterUpdate
from security import get_current_active_user

router = APIRouter()

# Default starting stats based on character class
DEFAULT_STATS = {
    "warrior": {"strength": 10, "intelligence": 5, "agility": 7, "constitution": 10, "charisma": 5},
    "mage": {"strength": 4, "intelligence": 12, "agility": 6, "constitution": 5, "charisma": 8},
    "rogue": {"strength": 6, "intelligence": 7, "agility": 12, "constitution": 6, "charisma": 8},
    "bard": {"strength": 5, "intelligence": 8, "agility": 8, "constitution": 6, "charisma": 12},
    "cleric": {"strength": 6, "intelligence": 10, "agility": 5, "constitution": 8, "charisma": 10},
}

@router.post("/", response_model=CharacterResponse)
def create_character(
    character: CharacterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user already has a character
    if current_user.character:
        raise HTTPException(
            status_code=400,
            detail="User already has a character"
        )
    
    # Get default stats based on character class
    default_stats = DEFAULT_STATS.get(character.character_class.value, {})
    
    # Create character
    db_character = Character(
        name=character.name,
        character_class=character.character_class,
        user_id=current_user.id,
        stats=default_stats
    )
    
    db.add(db_character)
    db.commit()
    db.refresh(db_character)
    
    return db_character

@router.get("/me", response_model=CharacterResponse)
def get_my_character(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not current_user.character:
        raise HTTPException(
            status_code=404,
            detail="Character not found"
        )
    
    return current_user.character

@router.put("/me", response_model=CharacterResponse)
def update_my_character(
    character_update: CharacterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not current_user.character:
        raise HTTPException(
            status_code=404,
            detail="Character not found"
        )
    
    # Update fields if provided
    if character_update.name is not None:
        current_user.character.name = character_update.name
    
    if character_update.character_class is not None:
        current_user.character.character_class = character_update.character_class
        # Update stats based on new class if changed
        default_stats = DEFAULT_STATS.get(character_update.character_class.value, {})
        current_user.character.stats = default_stats
    
    db.commit()
    db.refresh(current_user.character)
    
    return current_user.character

@router.put("/me/stats", response_model=CharacterResponse)
def update_character_stats(
    stats: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not current_user.character:
        raise HTTPException(
            status_code=404,
            detail="Character not found"
        )
    
    # Update or merge stats
    current_stats = current_user.character.stats or {}
    current_stats.update(stats)
    current_user.character.stats = current_stats
    
    db.commit()
    db.refresh(current_user.character)
    
    return current_user.character 