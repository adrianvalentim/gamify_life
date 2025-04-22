"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { X, Sparkles, Scroll, BookOpen, MapPin, Swords, MessageSquare, Compass, Award } from "lucide-react"

interface QuestInfoPanelProps {
  onClose: () => void
  characterClass: string
  level: number
}

export function QuestInfoPanel({ onClose, characterClass, level }: QuestInfoPanelProps) {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"quest" | "lore" | "rewards">("quest")
  const [questData, setQuestData] = useState<{
    title: string
    description: string
    objective: string
    progress: number
    lore: string
    nextSteps: string[]
    rewards: {
      xp: number
      items: string[]
      gold: number
    }
  } | null>(null)

  // Simulate API call to LLM for quest information
  useEffect(() => {
    const fetchQuestInfo = async () => {
      setLoading(true)

      try {
        // In a real implementation, this would be an API call to your LLM
        // const response = await fetch('/api/generate-quest', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ characterClass, level })
        // })
        // const data = await response.json()

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Mock data that would come from the LLM
        const mockQuestData = {
          title:
            characterClass === "warrior"
              ? "The Crimson Blade"
              : characterClass === "mage"
                ? "Arcane Mysteries"
                : "The Silent Hunt",
          description: `As a ${level > 5 ? "seasoned" : "novice"} ${characterClass}, you've been tasked with ${
            characterClass === "warrior"
              ? "defeating the bandits terrorizing the northern villages"
              : characterClass === "mage"
                ? "investigating the strange magical anomalies in the ancient tower"
                : "tracking down the elusive shadow beast in the western woods"
          }.`,
          objective:
            characterClass === "warrior"
              ? "Defeat the bandit leader and recover the stolen artifacts"
              : characterClass === "mage"
                ? "Discover the source of the magical disturbances and contain it"
                : "Track and capture the shadow beast without harming it",
          progress: Math.floor(Math.random() * 70) + 10,
          lore: `The ${
            characterClass === "warrior"
              ? "Crimson Blade is an ancient sword said to have been forged in dragon fire. Legend says it was wielded by the hero Artorius during the Great War against the demon hordes. After his death, the sword was lost for centuries until rumors of its reappearance began to surface in the northern villages."
              : characterClass === "mage"
                ? "Arcane Tower was once the center of magical research for the kingdom. The greatest mages of the realm gathered there to study the fundamental forces of magic. However, a catastrophic experiment caused the tower to be abandoned nearly a century ago. Recently, strange lights and sounds have been reported coming from the ruins."
                : "Shadow Beasts are rare creatures that only appear during specific lunar phases. They are not inherently malevolent, but their presence often disrupts the natural balance of the areas they inhabit. Scholars believe they are manifestations of ancient nature spirits rather than flesh and blood creatures."
          } Many have sought to ${
            characterClass === "warrior"
              ? "wield its power, but the blade is said to choose its wielder. Those deemed unworthy who attempt to use it are consumed by its crimson flames."
              : characterClass === "mage"
                ? "unlock its secrets, but the complex magical wards and traps left behind by the original mages have proven deadly to amateur explorers."
                : "study these elusive creatures, but their ephemeral nature makes them nearly impossible to track by conventional means."
          }`,
          nextSteps: [
            characterClass === "warrior"
              ? "Gather information about the bandit hideout from the village elder"
              : characterClass === "mage"
                ? "Research the tower's history in the royal library"
                : "Find tracks or signs of the beast's passage near the western woods",
            characterClass === "warrior"
              ? "Acquire better armor before confronting the bandits"
              : characterClass === "mage"
                ? "Prepare protective wards against unknown magical forces"
                : "Set up traps or lures to attract the beast",
            "Speak with the local villagers for more information",
            `Return to the guild master when you've made progress`,
          ],
          rewards: {
            xp: 150 + level * 25,
            items: [
              characterClass === "warrior"
                ? "Crimson Blade (Legendary Sword)"
                : characterClass === "mage"
                  ? "Staff of Arcane Secrets (Rare Staff)"
                  : "Shadow Cloak (Uncommon Armor)",
              "Potion of Healing",
              `${characterClass} Emblem`,
            ],
            gold: 50 + level * 10,
          },
        }

        setQuestData(mockQuestData)
      } catch (error) {
        console.error("Error fetching quest information:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestInfo()
  }, [characterClass, level])

  return (
    <div className="h-full w-[350px] bg-background border-l shadow-lg z-20 flex flex-col transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Scroll className="h-5 w-5 text-amber-500" />
          Adventure Journal
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex border-b">
        <Button
          variant="ghost"
          className={`flex-1 rounded-none ${activeTab === "quest" ? "border-b-2 border-amber-500" : ""}`}
          onClick={() => setActiveTab("quest")}
        >
          <Compass className="h-4 w-4 mr-2" />
          Quest
        </Button>
        <Button
          variant="ghost"
          className={`flex-1 rounded-none ${activeTab === "lore" ? "border-b-2 border-amber-500" : ""}`}
          onClick={() => setActiveTab("lore")}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Lore
        </Button>
        <Button
          variant="ghost"
          className={`flex-1 rounded-none ${activeTab === "rewards" ? "border-b-2 border-amber-500" : ""}`}
          onClick={() => setActiveTab("rewards")}
        >
          <Award className="h-4 w-4 mr-2" />
          Rewards
        </Button>
      </div>

      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-6">
          {loading ? (
            <>
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </>
          ) : questData ? (
            <>
              {activeTab === "quest" && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-bold text-xl text-amber-600">{questData.title}</h3>
                    <p className="text-sm text-muted-foreground">{questData.description}</p>

                    <div className="bg-muted/50 rounded-md p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Swords className="h-4 w-4 text-amber-500" />
                        <h4 className="font-medium text-sm">Objective</h4>
                      </div>
                      <p className="text-sm">{questData.objective}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{questData.progress}%</span>
                        </div>
                        <Progress value={questData.progress} className="h-1.5" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-amber-500" />
                      <h4 className="font-medium">Next Steps</h4>
                    </div>
                    <ul className="space-y-2">
                      {questData.nextSteps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="bg-amber-100 text-amber-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t mt-4">
                    <Button className="w-full bg-amber-500 hover:bg-amber-600">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Ask for Guidance
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "lore" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-xl text-amber-600">{questData.title} - Lore</h3>
                  <div className="bg-muted/30 rounded-md p-4 border border-amber-200/20">
                    <p className="text-sm leading-relaxed">{questData.lore}</p>
                  </div>

                  <div className="bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 p-4 rounded-md border border-amber-200 mt-6">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Scribe's Note
                    </h4>
                    <p className="text-sm italic">
                      Continue writing in your journal to uncover more of this story. The more you write, the more lore
                      will be revealed.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "rewards" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-xl text-amber-600">Quest Rewards</h3>

                  <div className="bg-muted/50 rounded-md p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Experience</span>
                      <span className="text-green-600 font-bold">{questData.rewards.xp} XP</span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Items</h4>
                      <ul className="space-y-2">
                        {questData.rewards.items.map((item, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm bg-background/80 p-2 rounded-md">
                            <div className="h-8 w-8 bg-amber-100 rounded-md flex items-center justify-center text-amber-800">
                              {index === 0 ? "★" : "✦"}
                            </div>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium">Gold</span>
                      <span className="text-amber-600 font-bold">{questData.rewards.gold} coins</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t mt-4">
                    <Button className="w-full bg-amber-500 hover:bg-amber-600">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate New Quest
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">Failed to load quest information</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

