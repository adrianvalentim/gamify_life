from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import random

from database import get_db
from models import Quest, UserQuest, User, QuestStatus
from schemas import QuestCreate, QuestResponse, UserQuestCreate, UserQuestResponse, UserQuestUpdate
from security import get_current_active_user

router = APIRouter()

# Sample quest requirements types
QUEST_TYPES = [
    "word_count",  # Write entries with X number of words
    "days_streak",  # Write entries for X days in a row
    "topic_based",  # Write about a specific topic
    "reflection",   # Answer reflection questions
]

SAMPLE_QUESTS = [
    {
        "title": "Daily Chronicler",
        "description": "Write a journal entry for 5 consecutive days.",
        "xp_reward": 150,
        "requirements": {
            "type": "days_streak",
            "count": 5,
        }
    },
    {
        "title": "Verbose Explorer",
        "description": "Write a journal entry with at least 300 words.",
        "xp_reward": 100,
        "requirements": {
            "type": "word_count",
            "min_words": 300,
        }
    },
    {
        "title": "Memory Lane",
        "description": "Write about your favorite childhood memory.",
        "xp_reward": 120,
        "requirements": {
            "type": "topic_based",
            "topic": "childhood memory",
        }
    },
    {
        "title": "Deep Reflection",
        "description": "Answer these reflection questions: What are you grateful for today? What challenged you? What did you learn?",
        "xp_reward": 200,
        "requirements": {
            "type": "reflection",
            "questions": [
                "What are you grateful for today?",
                "What challenged you?",
                "What did you learn?"
            ]
        }
    },
]

@router.get("/available", response_model=List[QuestResponse])
def get_available_quests(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get quests available to the user that they haven't accepted yet"""
    
    # Get quests the user has already accepted
    accepted_quest_ids = db.query(UserQuest.quest_id).filter(
        UserQuest.user_id == current_user.id
    ).all()
    accepted_quest_ids = [quest_id for (quest_id,) in accepted_quest_ids]
    
    # Get quests that aren't already accepted
    available_quests = db.query(Quest).filter(
        ~Quest.id.in_(accepted_quest_ids) if accepted_quest_ids else True
    ).offset(skip).limit(limit).all()
    
    # If there are no quests or very few, create some sample quests
    if len(available_quests) < 3:
        for quest_data in SAMPLE_QUESTS:
            # Check if this quest already exists (by title)
            existing_quest = db.query(Quest).filter(
                Quest.title == quest_data["title"]
            ).first()
            
            if not existing_quest:
                new_quest = Quest(**quest_data)
                db.add(new_quest)
                db.commit()
                db.refresh(new_quest)
                available_quests.append(new_quest)
    
    return available_quests

@router.post("/generate", response_model=QuestResponse)
def generate_random_quest(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate a random quest for the user"""
    
    quest_type = random.choice(QUEST_TYPES)
    
    if quest_type == "word_count":
        word_count = random.choice([100, 200, 300, 500])
        quest = Quest(
            title=f"Word Master: {word_count}",
            description=f"Write a journal entry with at least {word_count} words.",
            xp_reward=word_count // 2,
            requirements={
                "type": "word_count",
                "min_words": word_count,
            }
        )
    elif quest_type == "days_streak":
        days = random.randint(3, 7)
        quest = Quest(
            title=f"{days}-Day Streak Challenge",
            description=f"Write a journal entry for {days} consecutive days.",
            xp_reward=days * 30,
            requirements={
                "type": "days_streak",
                "count": days,
            }
        )
    elif quest_type == "topic_based":
        topics = ["childhood", "future goals", "recent accomplishment", "personal challenge", 
                 "gratitude", "learning experience", "favorite person"]
        topic = random.choice(topics)
        quest = Quest(
            title=f"Reflection: {topic.title()}",
            description=f"Write a journal entry about {topic}.",
            xp_reward=random.randint(100, 150),
            requirements={
                "type": "topic_based",
                "topic": topic,
            }
        )
    else:  # reflection
        question_sets = [
            ["What went well today?", "What could have gone better?", "What did you learn?"],
            ["What are you grateful for?", "Who made a positive impact on you recently?"],
            ["What is a goal you're working towards?", "What steps can you take to achieve it?"],
            ["What made you smile today?", "What challenged you today?"]
        ]
        questions = random.choice(question_sets)
        quest = Quest(
            title="Deep Reflection Quest",
            description="Answer these reflection questions: " + " ".join(questions),
            xp_reward=len(questions) * 40,
            requirements={
                "type": "reflection",
                "questions": questions
            }
        )
    
    db.add(quest)
    db.commit()
    db.refresh(quest)
    
    return quest

@router.post("/accept/{quest_id}", response_model=UserQuestResponse)
def accept_quest(
    quest_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Accept a quest for the current user"""
    
    # Check if quest exists
    quest = db.query(Quest).filter(Quest.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    # Check if user already has this quest
    existing_user_quest = db.query(UserQuest).filter(
        UserQuest.user_id == current_user.id,
        UserQuest.quest_id == quest_id
    ).first()
    
    if existing_user_quest:
        raise HTTPException(status_code=400, detail="Quest already accepted")
    
    # Create user quest
    user_quest = UserQuest(
        user_id=current_user.id,
        quest_id=quest_id,
        status=QuestStatus.ACTIVE,
        progress={}
    )
    
    db.add(user_quest)
    db.commit()
    db.refresh(user_quest)
    
    return user_quest

@router.get("/my-quests", response_model=List[UserQuestResponse])
def get_my_quests(
    status: QuestStatus = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all quests for the current user, optionally filtered by status"""
    
    query = db.query(UserQuest).filter(UserQuest.user_id == current_user.id)
    
    if status:
        query = query.filter(UserQuest.status == status)
    
    user_quests = query.all()
    
    return user_quests

@router.put("/my-quests/{user_quest_id}", response_model=UserQuestResponse)
def update_quest_progress(
    user_quest_id: int,
    update: UserQuestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a user's quest progress"""
    
    # Find the user quest
    user_quest = db.query(UserQuest).filter(
        UserQuest.id == user_quest_id,
        UserQuest.user_id == current_user.id
    ).first()
    
    if not user_quest:
        raise HTTPException(status_code=404, detail="User quest not found")
    
    # Update status if provided
    if update.status is not None:
        user_quest.status = update.status
        
        # If completing the quest, add XP to character
        if update.status == QuestStatus.COMPLETED and current_user.character:
            quest = db.query(Quest).filter(Quest.id == user_quest.quest_id).first()
            if quest:
                current_user.character.xp += quest.xp_reward
                
                # Check for level up
                next_level_xp = current_user.character.level * 100
                if current_user.character.xp >= next_level_xp:
                    current_user.character.level += 1
    
    # Update progress if provided
    if update.progress is not None:
        if user_quest.progress is None:
            user_quest.progress = update.progress
        else:
            # Merge the existing progress with the new progress
            current_progress = user_quest.progress
            current_progress.update(update.progress)
            user_quest.progress = current_progress
    
    db.commit()
    db.refresh(user_quest)
    
    return user_quest 