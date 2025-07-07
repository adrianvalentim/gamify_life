"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChevronDown,
  ChevronRight,
  FileText,
  FolderClosed,
  FolderOpen,
  Home,
  Plus,
  Search,
  Settings,
  Loader2,
  FolderPlus,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDocument } from "@/hooks/use-document"
import { useDocumentStructure } from "@/hooks/use-document-structure"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/hooks/use-language"
import { SettingsPanel } from "@/components/settings-panel"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  pointerWithin,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuthStore } from "@/stores/auth-store"

interface DocumentToRename {
  id: string;
  name: string;
}

interface FolderToRename {
  id: string;
  name: string;
}

interface DocumentItemProps {
  doc: { id: string; name: string };
  depth?: number;
  activeDocumentId?: string;
  handleDeleteDocument: (id: string) => void;
  onRename: (doc: DocumentToRename) => void;
}

interface FolderItemProps {
  folder: any;
  depth?: number;
  expandedFolders: Record<string, boolean>;
  toggleFolder: (id: string) => void;
  onRename: (folder: FolderToRename) => void;
  onDelete: (id: string) => void;
  activeDocumentId?: string;
  handleDeleteDocument: (id: string) => void;
  handleRenameDocument: (doc: DocumentToRename) => void;
}

const DocumentItem: React.FC<DocumentItemProps> = ({ doc, depth = 0, activeDocumentId, handleDeleteDocument, onRename }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: doc.id });
  const style = {
      transform: CSS.Transform.toString(transform),
      transition,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} >
      <ContextMenu key={doc.id}>
        <ContextMenuTrigger asChild>
          <div {...listeners}>
            <Link href={`/docs/${doc.id}`} passHref>
              <div
                className={cn(
                  "flex items-center rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors",
                  depth > 0 && "ml-3",
                  activeDocumentId === doc.id && "bg-accent",
                )}
              >
                <span className={cn("mr-2", depth === 0 && "ml-0", depth > 0 && "ml-5")}>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </span>
                <span className="truncate">{doc.name}</span>
              </div>
            </Link>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => onRename(doc)}>Rename</ContextMenuItem>
          <ContextMenuItem
            className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
            onSelect={() => handleDeleteDocument(doc.id)}
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};

const FolderItem: React.FC<FolderItemProps> = ({ folder, depth = 0, expandedFolders, toggleFolder, onRename, onDelete, activeDocumentId, handleDeleteDocument, handleRenameDocument, ...props }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: folder.id });
  const style = {
      transform: CSS.Transform.toString(transform),
      transition,
  };
  const isExpanded = expandedFolders[folder.id];

  return (
      <div ref={setNodeRef} style={style} {...attributes} className="space-y-1">
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <button
                onClick={() => toggleFolder(folder.id)}
                {...listeners}
                className={cn(
                    "flex items-center w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors",
                    depth > 0 && "ml-3"
                )}
            >
                <span className="mr-1">
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </span>
                <span className="mr-2">
                    {isExpanded ? <FolderOpen className="h-4 w-4 text-amber-500" /> : <FolderClosed className="h-4 w-4 text-amber-500" />}
                </span>
                <span className="truncate">{folder.name}</span>
            </button>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={() => onRename(folder)}>Rename</ContextMenuItem>
            <ContextMenuItem
              className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
              onSelect={() => onDelete(folder.id)}
            >
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
          {isExpanded && (
              <div className="space-y-1 pl-2">
                  {folder.documents?.map((doc: any) => (
                    <DocumentItem 
                      key={doc.id} 
                      doc={doc} 
                      depth={depth + 1} 
                      activeDocumentId={activeDocumentId}
                      handleDeleteDocument={handleDeleteDocument}
                      onRename={handleRenameDocument} 
                    />
                  ))}
                  {folder.subfolders?.map((subfolder: any) => (
                    <FolderItem 
                      key={subfolder.id} 
                      folder={subfolder} 
                      depth={depth + 1} 
                      expandedFolders={expandedFolders} 
                      toggleFolder={toggleFolder} 
                      onRename={onRename} 
                      onDelete={onDelete} 
                      activeDocumentId={activeDocumentId}
                      handleDeleteDocument={handleDeleteDocument}
                      handleRenameDocument={handleRenameDocument}
                    />
                  ))}
              </div>
          )}
      </div>
  );
};

interface SidebarProps {
  activeDocumentId?: string
}

export function Sidebar({ activeDocumentId }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { createDocument, navigateToDocument, isLoading: isCreating } = useDocument()
  const { structure, isLoading: isLoadingStructure, revalidateStructure } = useDocumentStructure()
  const { toast } = useToast()
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const [isNewDocDialogOpen, setIsNewDocDialogOpen] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState("")
  const [selectedFolderId, setSelectedFolderId] = useState<string>("root")
  const { translations } = useLanguage()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [documentToRename, setDocumentToRename] = useState<DocumentToRename | null>(null)
  const [renameInput, setRenameInput] = useState("")
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [folderToRename, setFolderToRename] = useState<FolderToRename | null>(null);
  const [folderRenameInput, setFolderRenameInput] = useState("");
  const { logout } = useAuthStore();
  const { token, user, isAuthenticated } = useAuthStore();

  const { setNodeRef: setRootDroppableRef } = useDroppable({
    id: 'root-droppable-area',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const itemParentFolderMap = useMemo(() => {
    const map = new Map<string, string | null>();
    if (!structure) return map;

    const traverse = (folders: any[], parentFolderId: string | null) => {
      for (const folder of folders) {
        map.set(folder.id, parentFolderId);
        folder.documents?.forEach((doc: any) => map.set(doc.id, folder.id));
        if (folder.subfolders) {
          traverse(folder.subfolders, folder.id);
        }
      }
    };

    structure.rootDocuments?.forEach((doc: any) => map.set(doc.id, null));
    traverse(structure.folders, null);

    return map;
  }, [structure]);

  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    const setExpanded = (folders: any[]) => {
      folders.forEach(f => {
        if (f.id === 'folder-1') initialExpanded[f.id] = true;
        if (f.subfolders) setExpanded(f.subfolders);
      });
    }
    if (structure && structure.folders) {
      setExpanded(structure.folders);
      setExpandedFolders(initialExpanded);
    }
  }, [structure]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }))
  }

  const handleCreateDocument = async () => {
    const folderIdToUse = selectedFolderId === "root" ? undefined : selectedFolderId;
    const document = await createDocument(newDocTitle || "Untitled", folderIdToUse);
    if (document) {
      setIsNewDocDialogOpen(false);
      setNewDocTitle("");
      setSelectedFolderId("root");
      revalidateStructure();
      toast({ title: "Success", description: "Document created successfully" });
      navigateToDocument(document.id);
    } else {
      toast({ title: "Error", description: "Failed to create document", variant: "destructive" });
    }
  };

  const handleCreateFolder = async () => {
    if (!isAuthenticated || !token || !user) {
      toast({ title: "Error", description: "You must be logged in to create a folder.", variant: "destructive" });
      return;
    }
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newFolderName, user_id: user.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to create folder');
      }
      
      toast({ title: "Success", description: "Folder created successfully" });
      setIsNewFolderDialogOpen(false);
      setNewFolderName("");
      revalidateStructure();
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to create folder", variant: "destructive" });
    }
  };

  const handleRename = (doc: DocumentToRename) => {
    setDocumentToRename(doc);
    setRenameInput(doc.name);
  };

  const handleRenameFolder = (folder: FolderToRename) => {
    setFolderToRename(folder);
    setFolderRenameInput(folder.name);
  };

  const handleRenameDocument = async () => {
    if (!documentToRename) return;
    try {
      const response = await fetch(`/api/documents/${documentToRename.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renameInput }),
      });
      if (!response.ok) throw new Error('Failed to rename document');
      toast({ title: "Success", description: "Document renamed successfully" });
      setDocumentToRename(null);
      setRenameInput("");
      revalidateStructure();
    } catch (error) {
      toast({ title: "Error", description: "Failed to rename document", variant: "destructive" });
    }
  };

  const handleUpdateFolder = async () => {
    if (!folderToRename) return;
    try {
      const response = await fetch(`/api/folders/${folderToRename.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderRenameInput }),
      });
      if (!response.ok) throw new Error('Failed to rename folder');
      toast({ title: "Success", description: "Folder renamed successfully" });
      setFolderToRename(null);
      setFolderRenameInput("");
      revalidateStructure();
    } catch (error) {
      toast({ title: "Error", description: "Failed to rename folder", variant: "destructive" });
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete document');
      revalidateStructure();
      toast({ title: "Success", description: "Document deleted successfully." });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to delete document.", variant: "destructive" });
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete folder');
      revalidateStructure();
      toast({ title: "Success", description: "Folder deleted successfully" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to delete folder.", variant: "destructive" });
    }
  };

  const handleDragEnd = async (event: any) => {
    setActiveDragId(null);
    const { active, over } = event;

    if (!active || !over || active.id === over.id) {
      return;
    }

    const isMovingDocument = active.id.startsWith('doc-');
    if (!isMovingDocument) {
      return;
    }

    const documentId = active.id;
    const targetId = over.id;

    let newFolderId: string | null | undefined = undefined;

    if (targetId === 'root-droppable-area') {
      newFolderId = null; // Move to root
    } else if (targetId.startsWith('folder-')) {
      newFolderId = targetId; // Dropped on a folder
    } else if (targetId.startsWith('doc-')) {
      newFolderId = itemParentFolderMap.get(targetId); // Dropped on a document, move to its folder
    }

    const currentFolderId = itemParentFolderMap.get(documentId);
    
    // Only proceed if the folder is actually changing
    if (newFolderId !== undefined && newFolderId !== currentFolderId) {
      try {
        const response = await fetch(`/api/documents/${documentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ folder_id: newFolderId }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Failed to move document: ${errorData}`);
        }

        revalidateStructure();
        toast({ title: "Success", description: "Document moved successfully." });
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to move document.", variant: "destructive" });
      }
    }
  };

  const flattenStructure = (folders: any[]): string[] => {
    if (!folders) return [];
    const items: string[] = [];
    for (const folder of folders) {
        items.push(folder.id);
        if (folder.documents) {
            items.push(...folder.documents.map((d: any) => d.id));
        }
        if (folder.subfolders) {
            items.push(...flattenStructure(folder.subfolders));
        }
    }
    return items;
  }

  const allItemIds = useMemo(() => {
    const docIds = structure.rootDocuments.map(d => d.id);
    const folderItems = flattenStructure(structure.folders);
    return [...docIds, ...folderItems];
  }, [structure]);

  const allFolders = useMemo(() => {
    const result: { id: string; name: string; depth: number }[] = []
    const addFolder = (folder: any, depth = 0) => {
      result.push({ id: folder.id, name: folder.name, depth })
      folder.subfolders?.forEach((subfolder: any) => addFolder(subfolder, depth + 1))
    }
    structure.folders.forEach(folder => addFolder(folder))
    return result
  }, [structure.folders]);

  const handleLogout = () => {
    logout();
    router.push('/login');
    toast({ title: "Logged out", description: "You have been successfully logged out." });
  };

  return (
    <div className="w-64 border-r bg-muted/20 flex flex-col h-full">
      <div className="p-4 border-b">
        <Link href="/docs">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors">
            <Home className="h-5 w-5" />
            <span className="font-semibold text-lg">Gamify Journal</span>
          </div>
        </Link>
      </div>
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={translations.search}
            className="pl-8 bg-background h-9 focus-visible:ring-amber-500"
          />
        </div>
      </div>
      <ScrollArea className="flex-1 px-2">
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={(e) => setActiveDragId(e.active.id as string)}
          onDragEnd={handleDragEnd}
        >
          <div ref={setRootDroppableRef} className="p-2 space-y-1 min-h-full">
            <SortableContext items={allItemIds} strategy={verticalListSortingStrategy}>
              {isLoadingStructure ? (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {structure.rootDocuments.map(doc => (
                    <DocumentItem 
                      key={doc.id}
                      doc={doc}
                      activeDocumentId={activeDocumentId}
                      handleDeleteDocument={handleDeleteDocument}
                      onRename={handleRename}
                    />
                  ))}
                  {structure.folders.map(folder => (
                    <FolderItem
                      key={folder.id}
                      folder={folder}
                      expandedFolders={expandedFolders}
                      toggleFolder={toggleFolder}
                      onRename={handleRenameFolder}
                      onDelete={handleDeleteFolder}
                      activeDocumentId={activeDocumentId}
                      handleDeleteDocument={handleDeleteDocument}
                      handleRenameDocument={handleRename}
                    />
                  ))}
                  {structure.rootDocuments.length === 0 && structure.folders.length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {translations.noPages}
                    </div>
                  )}
                </>
              )}
            </SortableContext>
            <div className="h-24" />
          </div>
          <DragOverlay>
            {activeDragId ? (
              <div className="bg-muted p-2 rounded-md shadow-lg">
                {structure.rootDocuments.find(d => d.id === activeDragId)?.name || allFolders.find(f => f.id === activeDragId)?.name}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </ScrollArea>
      <div className="p-4 border-t mt-auto">
        <div className="flex items-center justify-between">
          <Dialog open={isNewDocDialogOpen} onOpenChange={setIsNewDocDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                {translations.newPage}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{translations.createNewPage}</DialogTitle>
                <DialogDescription>{translations.createDescription}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">{translations.title}</Label>
                  <Input id="title" placeholder="Untitled" className="col-span-3" value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="folder" className="text-right">{translations.folder}</Label>
                  <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder={translations.selectFolder} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="root">Root</SelectItem>
                      {allFolders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {'┗ '.repeat(folder.depth)}{folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewDocDialogOpen(false)}>{translations.cancel}</Button>
                <Button onClick={handleCreateDocument} disabled={isCreating}>
                  {isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{translations.creating}</> : translations.create}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsNewFolderDialogOpen(true)}><FolderPlus className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsSettingsOpen(true)}><Settings className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <SettingsPanel open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      </div>

      {/* Rename Document Dialog */}
      <Dialog open={!!documentToRename} onOpenChange={(v) => !v && setDocumentToRename(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
            <DialogDescription>Enter a new name for the document &quot;{documentToRename?.name}&quot;.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rename-input">New name</Label>
            <Input id="rename-input" value={renameInput} onChange={(e) => setRenameInput(e.target.value)} className="mt-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocumentToRename(null)}>Cancel</Button>
            <Button onClick={handleRenameDocument}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* New Folder Dialog */}
      <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Enter a name for your new folder.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="folder-name-input">Folder name</Label>
            <Input id="folder-name-input" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="mt-2" placeholder="My Awesome Folder" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFolderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={!!folderToRename} onOpenChange={(v) => !v && setFolderToRename(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>Enter a new name for the folder &quot;{folderToRename?.name}&quot;.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rename-folder-input">New name</Label>
            <Input id="rename-folder-input" value={folderRenameInput} onChange={(e) => setFolderRenameInput(e.target.value)} className="mt-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderToRename(null)}>Cancel</Button>
            <Button onClick={handleUpdateFolder}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

