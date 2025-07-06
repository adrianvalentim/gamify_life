"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ChevronUp, Shield, Sword, ChevronRight, ChevronLeft } from "lucide-react"

interface CharacterDisplayProps {
  level: number
  xp: number
  nextLevelXp: number
  characterClass: string
  showQuestInfo: boolean
  onToggleQuestInfo: () => void
}

export function CharacterDisplay({
  level,
  xp,
  nextLevelXp,
  characterClass,
  showQuestInfo,
  onToggleQuestInfo,
}: CharacterDisplayProps) {
  const progress = nextLevelXp > 0 ? (xp / nextLevelXp) * 100 : 0
  const router = useRouter()

  const handleCharacterClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push("/character")
  }

  return (
    <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm border rounded-lg p-2 shadow-md w-[240px]">
      <Button
        variant="outline"
        className="rounded-full h-14 w-14 p-0 relative border-primary hover:border-primary/80 flex-shrink-0"
        onClick={handleCharacterClick}
      >
        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          {level}
        </div>
        <div className="overflow-hidden rounded-full">
          <Image
            src={"/placeholder.svg"} // Using a placeholder for now
            alt="Character avatar"
            width={56}
            height={56}
            className="object-cover"
          />
        </div>
      </Button>

      <div className="flex-grow">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm">
            {characterClass.charAt(0).toUpperCase() + characterClass.slice(1)}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>
              {xp}/{nextLevelXp}
            </span>
            <ChevronUp className="h-3 w-3 text-green-500" />
          </div>
        </div>
        <Progress value={progress} className="h-2 my-1" />

        <div className="flex items-center justify-between text-xs mt-1">
          <div className="flex items-center gap-1">
            <Sword className="h-3 w-3 text-red-500" />
            <span>{10 + Math.floor(level / 2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-blue-500" />
            <span>{8 + Math.floor(level / 3)}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 rounded-full"
            onClick={(e) => {
              e.stopPropagation()
              onToggleQuestInfo()
            }}
          >
            {showQuestInfo ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

