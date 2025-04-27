"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

type Language = "en" | "pt"

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  translations: Record<string, string>
}

// Define translations for both languages
const translationMap: Record<Language, Record<string, string>> = {
  en: {
    // Sidebar
    "newPage": "New Page",
    "noPages": "No pages yet. Create one!",
    "search": "Search...",
    
    // Document editor
    "whatIsTitle": "What is the title?",
    "beginAdventure": "Begin your adventure...",
    
    // Create document dialog
    "createNewPage": "Create new page",
    "createDescription": "Create a new journal page to continue your adventure.",
    "title": "Title",
    "folder": "Folder",
    "selectFolder": "Select a folder",
    "cancel": "Cancel",
    "create": "Create",
    "creating": "Creating...",
    "success": "Success",
    "documentCreated": "Document created successfully",
    "error": "Error",
    "documentCreateFailed": "Failed to create document",
    
    // Settings
    "settings": "Settings",
    "language": "Language",
    "english": "English",
    "portuguese": "Portuguese"
  },
  pt: {
    // Sidebar
    "newPage": "Nova Página",
    "noPages": "Sem páginas ainda. Crie uma!",
    "search": "Buscar...",
    
    // Document editor
    "whatIsTitle": "Qual é o título?",
    "beginAdventure": "Comece sua aventura...",
    
    // Create document dialog
    "createNewPage": "Criar nova página",
    "createDescription": "Crie uma nova página de diário para continuar sua aventura.",
    "title": "Título",
    "folder": "Pasta",
    "selectFolder": "Selecione uma pasta",
    "cancel": "Cancelar",
    "create": "Criar",
    "creating": "Criando...",
    "success": "Sucesso",
    "documentCreated": "Documento criado com sucesso",
    "error": "Erro",
    "documentCreateFailed": "Falha ao criar documento",
    
    // Settings
    "settings": "Configurações",
    "language": "Idioma",
    "english": "Inglês",
    "portuguese": "Português"
  }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Default to English, but check localStorage for saved preference
  const [language, setLanguageState] = useState<Language>("en")
  
  useEffect(() => {
    // Get saved language from localStorage
    const savedLanguage = localStorage.getItem("gamify-journal-language") as Language | null
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "pt")) {
      setLanguageState(savedLanguage)
    }
  }, [])
  
  // Update language and save to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("gamify-journal-language", lang)
  }
  
  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage,
      translations: translationMap[language] 
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
} 