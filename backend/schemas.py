from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, List, Any, Union
from datetime import datetime
from models import CharacterClass, QuestStatus, User, Folder, Document

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

# Character schemas
class CharacterBase(BaseModel):
    name: str
    character_class: CharacterClass

class CharacterCreate(CharacterBase):
    pass

class CharacterUpdate(BaseModel):
    name: Optional[str] = None
    character_class: Optional[CharacterClass] = None
    
class CharacterResponse(CharacterBase):
    id: int
    user_id: int
    level: int
    xp: int
    stats: Dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

# Journal entry schemas
class JournalEntryBase(BaseModel):
    title: str
    content: str

class JournalEntryCreate(JournalEntryBase):
    pass

class JournalEntryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class JournalEntryResponse(JournalEntryBase):
    id: int
    user_id: int
    xp_earned: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

# Quest schemas
class QuestBase(BaseModel):
    title: str
    description: str
    xp_reward: int
    requirements: Dict[str, Any]

class QuestCreate(QuestBase):
    pass

class QuestResponse(QuestBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}

# User Quest schemas
class UserQuestBase(BaseModel):
    quest_id: int

class UserQuestCreate(UserQuestBase):
    pass

class UserQuestUpdate(BaseModel):
    status: Optional[QuestStatus] = None
    progress: Optional[Dict[str, Any]] = None

class UserQuestResponse(BaseModel):
    id: int
    user_id: int
    quest_id: int
    status: QuestStatus
    progress: Dict[str, Any]
    accepted_at: datetime
    completed_at: Optional[datetime] = None
    quest: QuestResponse

    model_config = {"from_attributes": True}

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- Document Schemas ---

class DocumentBase(BaseModel):
    name: str
    content: Optional[str] = None
    folder_id: Optional[int] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    folder_id: Optional[int] = None

# Forward declaration needed for recursive FolderRead
class FolderRead(BaseModel):
    pass

class DocumentRead(DocumentBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

# --- Folder Schemas ---

class FolderBase(BaseModel):
    name: str
    parent_folder_id: Optional[int] = None

class FolderCreate(FolderBase):
    pass

class FolderUpdate(BaseModel):
    name: Optional[str] = None
    parent_folder_id: Optional[int] = None

class FolderRead(FolderBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    documents: List[DocumentRead] = []
    subfolders: List['FolderRead'] = []

    model_config = {"from_attributes": True}

# Schema for the nested structure response
class DocumentStructureResponse(BaseModel):
    root_documents: List[DocumentRead] = []
    folders: List[FolderRead] = [] 