"use client"

import { useQuests } from "@/hooks/use-quests"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, CheckCircle2, Star, Loader2, AlertTriangle } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/stores/auth-store"
import { useSWRConfig } from "swr"

interface QuestPanelProps {
  onClose: () => void
}

export function QuestPanel({ onClose }: QuestPanelProps) {
  const { translations } = useLanguage()
  const { quests, isLoading, error } = useQuests()
  const { token } = useAuthStore()
  const { mutate } = useSWRConfig()

  const handleCompleteQuest = async (questId: string) => {
    if (!token) return

    try {
      const res = await fetch(`/api/quests/${questId}/complete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error("Failed to complete quest")
      }

      // Revalidate the quests data to update the UI
      mutate(["/api/quests", token])
    } catch (err) {
      console.error(err)
      // Here you might want to show a toast notification to the user
    }
  }

  const inProgressQuests = quests.filter((q) => q.status === "in_progress")
  const completedQuests = quests.filter((q) => q.status === "completed")

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <div className="space-y-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-8 w-1/3 mt-4" />
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="p-4 flex flex-col items-center justify-center h-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="font-bold">{translations.errorOccurred}</h3>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      )
    }

    return (
      <div className="p-4 space-y-6">
        <div className="space-y-2">
          <h3 className="font-medium text-sm flex items-center gap-1">
            <Star className="h-4 w-4 text-amber-500" />
            {translations.inProgressQuests}
          </h3>
          {inProgressQuests.length > 0 ? (
            inProgressQuests.map((quest) => (
              <div key={quest.id} className="border rounded-md p-3 space-y-2 bg-muted/30">
                <div className="flex justify-between items-start">
                  <div className="flex-grow pr-4">
                    <h4 className="font-medium">{quest.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{quest.description}</p>
                  </div>
                  <div className="flex-shrink-0 bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-md">
                    {quest.experienceReward} XP
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCompleteQuest(quest.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {translations.complete}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground p-3 text-center">{translations.noActiveQuests}</p>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-sm flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            {translations.completedQuests}
          </h3>
          {completedQuests.length > 0 ? (
            completedQuests.map((quest) => (
              <div key={quest.id} className="border rounded-md p-3 space-y-2 opacity-70">
                <div className="flex justify-between items-start">
                  <div className="flex-grow pr-4">
                    <h4 className="font-medium line-through">{quest.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{quest.description}</p>
                  </div>
                  <div className="flex-shrink-0 bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-md">
                    {quest.experienceReward} XP
                  </div>
                </div>
              </div>
            ))
          ) : (
             <p className="text-sm text-muted-foreground p-3 text-center">{translations.noCompletedQuests}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-background border-l shadow-lg z-20">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-bold text-lg">{translations.quests}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100%-60px)]">
        {renderContent()}
      </ScrollArea>
    </div>
  )
}

