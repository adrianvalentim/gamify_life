"use client"

import { useState, useEffect } from "react"

export function useXpSystem() {
  const [characterXp, setCharacterXp] = useState(0)
  const [characterLevel, setCharacterLevel] = useState(1)

  // Calculate XP needed for next level using a common RPG formula
  const calculateNextLevelXp = (level: number) => {
    return Math.floor(100 * Math.pow(1.5, level - 1))
  }

  const nextLevelXp = calculateNextLevelXp(characterLevel)

  // Add XP and handle level ups
  const addXp = (amount: number) => {
    setCharacterXp((prevXp) => {
      const newXp = prevXp + amount
      return newXp
    })
  }

  // Check for level ups whenever XP changes
  useEffect(() => {
    const checkLevelUp = () => {
      const xpNeeded = calculateNextLevelXp(characterLevel)

      if (characterXp >= xpNeeded) {
        // Level up!
        setCharacterLevel((prevLevel) => prevLevel + 1)
        setCharacterXp((prevXp) => prevXp - xpNeeded)

        // Show level up notification
        // This would be implemented with a toast or animation in a real app
        console.log("Level up! You are now level", characterLevel + 1)
      }
    }

    checkLevelUp()
  }, [characterXp, characterLevel])

  return {
    characterXp,
    characterLevel,
    nextLevelXp,
    addXp,
  }
}

