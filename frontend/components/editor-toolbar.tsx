"use client"

import type { Editor } from "@tiptap/react"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Scroll,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface EditorToolbarProps {
  editor: Editor | null
  onToggleQuests: () => void
}

export function EditorToolbar({ editor, onToggleQuests }: EditorToolbarProps) {
  if (!editor) {
    return null
  }

  const addBlock = (type: string) => {
    if (type === "heading1") {
      editor.chain().focus().toggleHeading({ level: 1 }).run()
    } else if (type === "heading2") {
      editor.chain().focus().toggleHeading({ level: 2 }).run()
    } else if (type === "heading3") {
      editor.chain().focus().toggleHeading({ level: 3 }).run()
    } else if (type === "bulletList") {
      editor.chain().focus().toggleBulletList().run()
    } else if (type === "orderedList") {
      editor.chain().focus().toggleOrderedList().run()
    } else {
      // Default to paragraph
      editor.chain().focus().setParagraph().run()
    }
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-background p-1 sticky top-0 z-10 shadow-sm">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Plus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => addBlock("paragraph")}>
            <span className="text-sm font-medium">Text</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => addBlock("heading1")}>
            <span className="text-xl font-bold">Heading 1</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => addBlock("heading2")}>
            <span className="text-lg font-bold">Heading 2</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => addBlock("heading3")}>
            <span className="text-base font-bold">Heading 3</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => addBlock("bulletList")}>
            <List className="h-4 w-4 mr-2" />
            <span>Bullet List</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => addBlock("orderedList")}>
            <ListOrdered className="h-4 w-4 mr-2" />
            <span>Numbered List</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="mx-1 h-4 w-px bg-border" />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(editor.isActive("bold") && "bg-accent")}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(editor.isActive("italic") && "bg-accent")}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <div className="mx-1 h-4 w-px bg-border" />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(editor.isActive("heading", { level: 1 }) && "bg-accent")}
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(editor.isActive("heading", { level: 2 }) && "bg-accent")}
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={cn(editor.isActive("heading", { level: 3 }) && "bg-accent")}
      >
        <Heading3 className="h-4 w-4" />
      </Button>
      <div className="mx-1 h-4 w-px bg-border" />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(editor.isActive("bulletList") && "bg-accent")}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(editor.isActive("orderedList") && "bg-accent")}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <div className="mx-1 h-4 w-px bg-border" />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={cn(editor.isActive({ textAlign: "left" }) && "bg-accent")}
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={cn(editor.isActive({ textAlign: "center" }) && "bg-accent")}
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={cn(editor.isActive({ textAlign: "right" }) && "bg-accent")}
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <div className="mx-1 h-4 w-px bg-border" />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="h-4 w-4" />
      </Button>
      <div className="mx-1 h-4 w-px bg-border" />
      <Button variant="ghost" size="icon" onClick={onToggleQuests}>
        <Scroll className="h-4 w-4" />
        <span className="sr-only">Toggle Quests</span>
      </Button>
    </div>
  )
}

