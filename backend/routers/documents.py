from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List, Optional

# Use relative imports within the backend package
from .. import models, schemas, security
from ..database import get_db

router = APIRouter(
    prefix="/api/documents", # Match prefix used in main.py
    tags=["documents"],
    dependencies=[Depends(security.get_current_active_user)], # Protect all document routes
    responses={404: {"description": "Not found"}},
)

# Helper function to get folder by ID and check ownership
def get_folder_or_404(folder_id: int, db: Session, current_user: models.User):
    folder = db.query(models.Folder).filter(models.Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Folder with id {folder_id} not found")
    if folder.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this folder")
    return folder

# Helper function to get document by ID and check ownership
def get_document_or_404(document_id: int, db: Session, current_user: models.User):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Document with id {document_id} not found")
    if document.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this document")
    return document

@router.post("", status_code=status.HTTP_201_CREATED, response_model=schemas.DocumentRead)
def create_document(
    document: schemas.DocumentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Creates a new document, optionally assigning it to a folder."""
    folder = None
    # Handle case where folder_id might be 0 or None for root
    target_folder_id = document.folder_id if document.folder_id and document.folder_id > 0 else None
    
    if target_folder_id:
        folder = get_folder_or_404(target_folder_id, db, current_user)
        target_folder_id = folder.id # Ensure we use the validated ID
    else:
        target_folder_id = None # Explicitly None for root

    # Create new document instance
    db_document = models.Document(
        name=document.name,
        content=document.content if document.content is not None else f"<h1>{document.name}</h1><p>Start writing...</p>",
        folder_id=target_folder_id, 
        owner_id=current_user.id
    )
    
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

@router.get("/structure", response_model=schemas.DocumentStructureResponse)
def get_document_structure(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Fetches the nested folder and document structure for the current user."""
    # Fetch top-level folders for the user, eagerly loading subfolders and documents recursively
    top_level_folders = (
        db.query(models.Folder)
        .filter(models.Folder.owner_id == current_user.id, models.Folder.parent_folder_id == None)
        .options(
            selectinload(models.Folder.documents), # Documents in top-level
            selectinload(models.Folder.subfolders)
                .selectinload(models.Folder.documents), # Docs in 1st level subfolders
             selectinload(models.Folder.subfolders)
                .selectinload(models.Folder.subfolders)
                .selectinload(models.Folder.documents) # Docs in 2nd level subfolders (adjust depth as needed)
            # Add more nested selectinload calls if deeper nesting is expected
        )
        .all()
    )

    # Fetch root documents (those not in any folder)
    root_documents = (
        db.query(models.Document)
        .filter(models.Document.owner_id == current_user.id, models.Document.folder_id == None)
        .all()
    )

    return schemas.DocumentStructureResponse(
        root_documents=root_documents,
        folders=top_level_folders
    )

@router.get("/{document_id}", response_model=schemas.DocumentRead)
def read_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Fetches a single document by its ID."""
    db_document = get_document_or_404(document_id, db, current_user)
    return db_document

@router.put("/{document_id}", response_model=schemas.DocumentRead)
def update_document(
    document_id: int,
    document_update: schemas.DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Updates a document's name, content, or folder assignment."""
    db_document = get_document_or_404(document_id, db, current_user)

    # Handle folder change
    if document_update.folder_id is not None:
        if document_update.folder_id <= 0: # Treat 0 or negative as moving to root
             db_document.folder_id = None
        else: 
             target_folder = get_folder_or_404(document_update.folder_id, db, current_user)
             # Basic check to prevent assigning folder to itself or its own descendant (complex cycle checks omitted)
             if target_folder.id == db_document.folder_id: # No change needed
                 pass
             # Add more sophisticated cycle checks if needed
             else:
                db_document.folder_id = target_folder.id

    # Update other fields from the request body if they are provided
    update_data = document_update.model_dump(exclude_unset=True, exclude={'folder_id'})
    for key, value in update_data.items():
        setattr(db_document, key, value)

    db.commit()
    db.refresh(db_document)
    return db_document

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Deletes a document by its ID."""
    db_document = get_document_or_404(document_id, db, current_user)
    db.delete(db_document)
    db.commit()
    return None # No content response

# --- Folder Endpoints --- 

@router.post("/folders", status_code=status.HTTP_201_CREATED, response_model=schemas.FolderRead)
def create_folder(
    folder: schemas.FolderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Creates a new folder, optionally as a subfolder of another."""
    parent_folder_id = folder.parent_folder_id if folder.parent_folder_id and folder.parent_folder_id > 0 else None
    
    if parent_folder_id:
        parent_folder = get_folder_or_404(parent_folder_id, db, current_user)
        parent_folder_id = parent_folder.id # Use validated ID
    else:
        parent_folder_id = None
            
    db_folder = models.Folder(
        name=folder.name,
        parent_folder_id=parent_folder_id,
        owner_id=current_user.id
    )
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    # Need to manually load relationships if the response model expects them
    # This might require another query or careful session management
    # For simplicity, return the basic refreshed object
    return db_folder 

# TODO: Add endpoints for GET /folders/{folder_id}, PUT /folders/{folder_id}, DELETE /folders/{folder_id} 