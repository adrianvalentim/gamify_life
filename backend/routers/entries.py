from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import random

from database import get_db
from models import JournalEntry, User
from schemas import JournalEntryCreate, JournalEntryResponse, JournalEntryUpdate
from security import get_current_active_user

router = APIRouter()

@router.post("/", response_model=JournalEntryResponse)
def create_entry(
    entry: JournalEntryCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Calculate XP based on content length (simple algorithm)
    # In a real app, you might want a more sophisticated algorithm
    content_length = len(entry.content)
    xp_earned = min(content_length // 10, 100)  # Cap at 100 XP
    
    # Add some randomness for fun
    xp_earned += random.randint(1, 10)
    
    db_entry = JournalEntry(
        title=entry.title,
        content=entry.content,
        user_id=current_user.id,
        xp_earned=xp_earned
    )
    
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    # Update user character XP
    if current_user.character:
        current_user.character.xp += xp_earned
        
        # Check for level up (simple algorithm)
        next_level_xp = current_user.character.level * 100
        if current_user.character.xp >= next_level_xp:
            current_user.character.level += 1
        
        db.commit()
    
    return db_entry

@router.get("/", response_model=List[JournalEntryResponse])
def get_entries(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    entries = db.query(JournalEntry).filter(
        JournalEntry.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return entries

@router.get("/{entry_id}", response_model=JournalEntryResponse)
def get_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.user_id == current_user.id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    return entry

@router.put("/{entry_id}", response_model=JournalEntryResponse)
def update_entry(
    entry_id: int,
    entry_update: JournalEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.user_id == current_user.id
    ).first()
    
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    # Update fields if provided
    if entry_update.title is not None:
        db_entry.title = entry_update.title
    
    if entry_update.content is not None:
        db_entry.content = entry_update.content
    
    db.commit()
    db.refresh(db_entry)
    
    return db_entry

@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.user_id == current_user.id
    ).first()
    
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    db.delete(db_entry)
    db.commit()
    
    return None 