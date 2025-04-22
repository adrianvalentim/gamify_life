"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { X, CheckCircle2, Clock, Star } from "lucide-react"

interface QuestPanelProps {
  onClose: () => void
}

export function QuestPanel({ onClose }: QuestPanelProps) {
  // Mock quests data - in a real app this would come from a database
  const [quests, setQuests] = useState([
    {
      id: "q1",
      title: "The Scholar's Path",
      description: "Write 500 words on any topic",
      reward: "50 XP",
      progress: 30,
      active: true,
      difficulty: "easy",
    },
    {
      id: "q2",
      title: "Daily Scribe",
      description: "Write in your journal for 3 consecutive days",
      reward: "100 XP",
      progress: 66,
      active: true,
      difficulty: "medium",
    },
    {
      id: "q3",
      title: "World Builder",
      description: "Create a detailed description of a fantasy location",
      reward: "75 XP + Magic Quill item",
      progress: 0,
      active: false,
      difficulty: "hard",
    },
    {
      id: "q4",
      title: "Character Creator",
      description: "Develop a character with backstory, traits, and goals",
      reward: "120 XP",
      progress: 0,
      active: false,
      difficulty: "hard",
    },
  ])

  const toggleQuestActive = (questId: string) => {
    setQuests(quests.map((quest) => (quest.id === questId ? { ...quest, active: !quest.active } : quest)))
  }

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-background border-l shadow-lg z-20">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-bold text-lg">Quests</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100%-60px)]">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium text-sm flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-500" />
              Active Quests
            </h3>

            {quests
              .filter((q) => q.active)
              .map((quest) => (
                <div key={quest.id} className="border rounded-md p-3 space-y-2 bg-muted/30">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{quest.title}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => toggleQuestActive(quest.id)}
                    >
                      Abandon
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{quest.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-500 font-medium">Reward: {quest.reward}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Progress: {quest.progress}%
                    </span>
                  </div>
                  <Progress value={quest.progress} className="h-1.5" />
                </div>
              ))}
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-sm">Available Quests</h3>

            {quests
              .filter((q) => !q.active)
              .map((quest) => (
                <div key={quest.id} className="border rounded-md p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{quest.title}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700"
                      onClick={() => toggleQuestActive(quest.id)}
                    >
                      Accept
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{quest.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-500 font-medium">Reward: {quest.reward}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full ${
                        quest.difficulty === "easy"
                          ? "bg-green-100 text-green-700"
                          : quest.difficulty === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
          </div>

          <div className="pt-4 border-t">
            <Button className="w-full bg-amber-500 hover:bg-amber-600">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Complete Daily Quest
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

