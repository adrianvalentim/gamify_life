from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import datetime

from database import Base

class CharacterClass(enum.Enum):
    WARRIOR = "warrior"
    MAGE = "mage"
    ROGUE = "rogue"
    BARD = "bard"
    CLERIC = "cleric"

class QuestStatus(enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    FAILED = "failed"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    character = relationship("Character", back_populates="user", uselist=False)
    entries = relationship("JournalEntry", back_populates="user")
    quests = relationship("UserQuest", back_populates="user")
    folders = relationship("Folder", back_populates="owner")
    documents = relationship("Document", back_populates="owner", foreign_keys="Document.owner_id")

class Character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    level = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    character_class = Column(Enum(CharacterClass))
    stats = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="character")

class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    content = Column(Text)
    xp_earned = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="entries")

class Quest(Base):
    __tablename__ = "quests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text)
    xp_reward = Column(Integer)
    requirements = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user_quests = relationship("UserQuest", back_populates="quest")

class UserQuest(Base):
    __tablename__ = "user_quests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    quest_id = Column(Integer, ForeignKey("quests.id"))
    status = Column(Enum(QuestStatus), default=QuestStatus.ACTIVE)
    progress = Column(JSON, default={})
    accepted_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="quests")
    quest = relationship("Quest", back_populates="user_quests")

class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="folders")
    subfolders = relationship("Folder", back_populates="parent_folder", remote_side=[id])
    parent_folder = relationship("Folder", back_populates="subfolders", remote_side=[parent_folder_id])
    documents = relationship("Document", back_populates="folder", foreign_keys="Document.folder_id")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    content = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="documents", foreign_keys=[owner_id])
    folder = relationship("Folder", back_populates="documents", foreign_keys=[folder_id]) 