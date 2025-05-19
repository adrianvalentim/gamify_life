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
    "untitledPage": "Untitled Page",
    "welcomeTo": "Welcome to",
    "startWriting": "Start writing to earn experience and level up your character!",
    "selectQuests": "Select quests from the quest panel to earn bonus rewards.",
    "clickAnywhere": "Click anywhere on this page to start writing your own adventure!",
    
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
    
    // Quest Panel
    "quests": "Quests",
    "activeQuests": "Active Quests",
    "availableQuests": "Available Quests",
    "abandon": "Abandon",
    "accept": "Accept",
    "reward": "Reward",
    "progress": "Progress",
    "easy": "Easy",
    "medium": "Medium",
    "hard": "Hard",
    "completeDailyQuest": "Complete Daily Quest",

    // Adventure Journal
    "adventureJournal": "Adventure Journal",
    "quest": "Quest",
    "lore": "Lore",
    "rewards": "Rewards",
    "objective": "Objective",
    "nextSteps": "Next Steps",
    "askForGuidance": "Ask for Guidance",
    "scribesNote": "Scribe's Note",
    "continueWriting": "Continue writing in your journal to uncover more of this story. The more you write, the more lore will be revealed.",
    
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
    "untitledPage": "Página sem Título",
    "welcomeTo": "Bem-vindo ao",
    "startWriting": "Comece a escrever para ganhar experiência e subir de nível!",
    "selectQuests": "Selecione missões no painel de missões para ganhar recompensas extras.",
    "clickAnywhere": "Clique em qualquer lugar nesta página para começar a escrever sua própria aventura!",
    
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
    
    // Quest Panel
    "quests": "Missões",
    "activeQuests": "Missões Ativas",
    "availableQuests": "Missões Disponíveis",
    "abandon": "Abandonar",
    "accept": "Aceitar",
    "reward": "Recompensa",
    "progress": "Progresso",
    "easy": "Fácil",
    "medium": "Média",
    "hard": "Difícil",
    "completeDailyQuest": "Completar Missão Diária",

    // Adventure Journal
    "adventureJournal": "Diário de Aventura",
    "quest": "Missão",
    "lore": "História",
    "rewards": "Recompensas",
    "objective": "Objetivo",
    "nextSteps": "Próximos Passos",
    "askForGuidance": "Pedir Orientação",
    "scribesNote": "Nota do Escriba",
    "continueWriting": "Continue escrevendo em seu diário para descobrir mais desta história. Quanto mais você escrever, mais história será revelada.",
    
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