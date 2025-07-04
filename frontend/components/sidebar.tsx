"use client"

import { useState, useEffect } from "react"
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

  // Initialize expanded state based on fetched structure
  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    const setExpanded = (folders: any[]) => {
      folders.forEach(f => {
        // Optionally expand top-level folders by default
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
    // Convert "root" value to undefined for the API
    const folderIdToUse = selectedFolderId === "root" ? undefined : selectedFolderId;
    
    const document = await createDocument(newDocTitle || "Untitled", folderIdToUse);
    
    if (document) {
      setIsNewDocDialogOpen(false);
      setNewDocTitle("");
      setSelectedFolderId("root");
      
      // Revalidate the structure from the server
      revalidateStructure();
      
      toast({
        title: "Success",
        description: "Document created successfully",
      });
      navigateToDocument(document.id);
    } else {
      toast({
        title: "Error",
        description: "Failed to create document",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      revalidateStructure();
      
      if(activeDocumentId === documentId) {
          router.push('/docs');
      }

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const renderFolder = (
    folder: {
      id: string
      name: string
      documents: { id: string; name: string }[]
      subfolders?: any[]
    },
    depth = 0,
  ) => {
    const isExpanded = expandedFolders[folder.id]

    return (
      <div key={folder.id} className="space-y-1">
        <button
          onClick={() => toggleFolder(folder.id)}
          className={cn(
            "flex items-center w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors",
            depth > 0 && "ml-3",
          )}
        >
          <span className="mr-1">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </span>
          <span className="mr-2">
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-amber-500" />
            ) : (
              <FolderClosed className="h-4 w-4 text-amber-500" />
            )}
          </span>
          <span className="truncate">{folder.name}</span>
        </button>

        {isExpanded && (
          <div className="space-y-1">
            {folder.documents?.map((doc) => renderDocumentItem(doc, depth + 1))}
            {folder.subfolders?.map((subfolder) => renderFolder(subfolder, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const renderDocumentItem = (
    doc: { id: string; name: string },
    depth = 0,
  ) => {
    return (
      <ContextMenu key={doc.id}>
        <ContextMenuTrigger asChild>
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
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Rename</ContextMenuItem>
          <ContextMenuItem>Move</ContextMenuItem>
          <ContextMenuItem
            className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
            onSelect={() => handleDeleteDocument(doc.id)}
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  // Flatten folders for the dropdown
  const getAllFolders = () => {
    const result: { id: string; name: string; depth: number }[] = []
    
    const addFolder = (folder: any, depth = 0) => {
      result.push({ id: folder.id, name: folder.name, depth })
      folder.subfolders?.forEach((subfolder: any) => addFolder(subfolder, depth + 1))
    }
    
    structure.folders.forEach(folder => addFolder(folder))
    return result
  }

  const allFolders = getAllFolders()

  if (isLoadingStructure) {
    return (
      <div className="w-64 border-r bg-muted/20 flex flex-col h-full">
        {/* Keep header and footer visible during load */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md">
            <Home className="h-5 w-5" />
            <span className="font-semibold text-lg">Gamify Journal</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <div className="p-4 border-t mt-auto">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="w-full justify-start" disabled>
              <Plus className="mr-2 h-4 w-4" />
              {translations.newPage}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
        {/* Root documents */}
        {structure.rootDocuments.length > 0 && (
          <div className="space-y-1 py-2">
            {structure.rootDocuments.map((doc) => renderDocumentItem(doc))}
          </div>
        )}
        
        {/* Folders */}
        {structure.folders && structure.folders.length > 0 && (
          <div className="space-y-1 py-2">
            {structure.folders.map((folder) => renderFolder(folder))}
          </div>
        )}
        {/* Display message if no documents or folders */}
        {structure.rootDocuments.length === 0 && structure.folders.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {translations.noPages}
          </div>
        )}
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
                <DialogDescription>
                  {translations.createDescription}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    {translations.title}
                  </Label>
                  <Input
                    id="title"
                    placeholder="Untitled"
                    className="col-span-3"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="folder" className="text-right">
                    {translations.folder}
                  </Label>
                  <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={translations.selectFolder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="root">Root</SelectItem>
                      {allFolders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.depth > 0 ? "┗ ".repeat(folder.depth) : ""}{folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewDocDialogOpen(false)}>
                  {translations.cancel}
                </Button>
                <Button onClick={handleCreateDocument} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {translations.creating}
                    </>
                  ) : (
                    translations.create
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <SettingsPanel open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
        </div>
      </div>
    </div>
  )
}

