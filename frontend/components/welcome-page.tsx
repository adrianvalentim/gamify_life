"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDocument } from "@/hooks/use-document";
import { Loader2, Plus } from "lucide-react";
import { useCharacter } from "@/hooks/use-character";
import { CharacterDisplay } from "@/components/character-display";

const getNextLevelXp = (level: number) => {
    return level * 100;
}

export function WelcomePage() {
  const { createDocument, navigateToDocument } = useDocument();
  const [isCreating, setIsCreating] = useState(false);
  const { character, isLoading: isCharacterLoading } = useCharacter();

  const handleCreateNewPage = async () => {
    setIsCreating(true);
    try {
      const newDoc = await createDocument("Untitled");
      if (newDoc) {
        navigateToDocument(newDoc.id);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="relative flex-1 h-full">
      {isCharacterLoading ? (
        <div className="absolute top-4 right-4 z-10">Loading character...</div>
      ) : character ? (
        <div className="absolute top-4 right-4 z-10">
          <CharacterDisplay
            level={character.level}
            xp={character.xp}
            nextLevelXp={getNextLevelXp(character.level)}
            characterClass={character.class}
            avatarUrl={character.avatar_url}
            showQuestInfo={false}
            onToggleQuestInfo={() => {}}
          />
        </div>
      ) : null}
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your Gamify Journal</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your adventure awaits.
        </p>
        <Button onClick={handleCreateNewPage} disabled={isCreating} size="lg">
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Create a new page
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 