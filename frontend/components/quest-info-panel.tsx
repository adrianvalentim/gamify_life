"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  CheckCircle2,
  Star,
  AlertTriangle,
  Scroll,
  BookOpen,
  Award,
  Compass,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useQuests, Quest } from "@/hooks/use-quests";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useQuestDetails } from "@/hooks/use-quest-details";

interface QuestInfoPanelProps {
  onClose: () => void;
}

export function QuestInfoPanel({ onClose }: QuestInfoPanelProps) {
  const { translations } = useLanguage();
  const { quests, isLoading: isLoadingQuests, error: questsError } = useQuests();
  const [activeTab, setActiveTab] = useState<"quest" | "lore" | "rewards">("quest");
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

  const {
    details: questDetails,
    isLoading: isLoadingDetails,
    error: detailsError,
  } = useQuestDetails(selectedQuest);

  const handleQuestSelection = (quest: Quest) => {
    if (selectedQuest?.id === quest.id) {
      setSelectedQuest(null); // Allow deselecting
    } else {
      setSelectedQuest(quest);
      setActiveTab("lore"); // Switch to lore tab on new selection
    }
  };

  const renderQuestList = () => {
    if (isLoadingQuests && !quests.length) {
      return (
        <div className="p-4 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }
    if (questsError) {
      return (
        <div className="p-4 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-2 text-sm text-muted-foreground">{questsError.message}</p>
        </div>
      );
    }
    if (quests.length === 0) {
      return <p className="p-4 text-center text-sm text-muted-foreground">{translations.noQuestsAvailable}</p>;
    }

    const inProgressQuests = quests.filter((q) => q.status === "in_progress");
    const completedQuests = quests.filter((q) => q.status === "completed");

    return (
      <div className="p-4 space-y-6">
        {inProgressQuests.length > 0 && (
          <div>
            <h3 className="font-medium text-sm mb-2 flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-500" />
              {translations.inProgressQuests}
            </h3>
            {inProgressQuests.map((quest) => (
              <div
                key={quest.id}
                className={cn(
                  "border rounded-md p-3 space-y-2 cursor-pointer hover:bg-muted/50",
                  selectedQuest?.id === quest.id && "bg-amber-100/50 border-amber-500"
                )}
                onClick={() => handleQuestSelection(quest)}
              >
                <h4 className="font-medium">{quest.title}</h4>
                <p className="text-sm text-muted-foreground">{quest.description}</p>
              </div>
            ))}
          </div>
        )}
        {completedQuests.length > 0 && (
          <div>
            <h3 className="font-medium text-sm mb-2 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {translations.completedQuests}
            </h3>
            {completedQuests.map((quest) => (
               <div key={quest.id} className="border rounded-md p-3 opacity-60">
                 <h4 className="font-medium line-through">{quest.title}</h4>
               </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  const renderDetailsTab = (type: "lore" | "rewards") => {
    if (!selectedQuest) {
      return <p className="p-4 text-center text-sm text-muted-foreground">Select a quest to view its {type}.</p>;
    }
    if (isLoadingDetails) {
      return (
        <div className="p-4 space-y-4">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      );
    }
    if (detailsError) {
      return <p className="p-4 text-center text-sm text-red-500">{detailsError.message}</p>;
    }
    return (
      <div className="p-4 space-y-4">
        <h3 className="font-bold text-lg text-amber-600">{selectedQuest.title}</h3>
        <p className="text-sm leading-relaxed">{type === "lore" ? questDetails?.lore : questDetails?.rewards}</p>
      </div>
    );
  };

  return (
    <div className="h-full w-[350px] bg-background border-l shadow-lg z-20 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Scroll className="h-5 w-5 text-amber-500" />
          {translations.adventureJournal}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex border-b">
        <Button
          variant="ghost"
          className={cn("flex-1 rounded-none", activeTab === "quest" && "border-b-2 border-amber-500")}
          onClick={() => setActiveTab("quest")}
        >
          <Compass className="h-4 w-4 mr-2" />
          {translations.quest}
        </Button>
        <Button
          variant="ghost"
          className={cn("flex-1 rounded-none", activeTab === "lore" && "border-b-2 border-amber-500")}
          onClick={() => setActiveTab("lore")}
          disabled={!selectedQuest}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          {translations.lore}
        </Button>
        <Button
          variant="ghost"
          className={cn("flex-1 rounded-none", activeTab === "rewards" && "border-b-2 border-amber-500")}
          onClick={() => setActiveTab("rewards")}
          disabled={!selectedQuest}
        >
          <Award className="h-4 w-4 mr-2" />
          {translations.rewards}
        </Button>
      </div>

      <ScrollArea className="flex-grow">
        {activeTab === "quest" && renderQuestList()}
        {activeTab === "lore" && renderDetailsTab("lore")}
        {activeTab === "rewards" && renderDetailsTab("rewards")}
      </ScrollArea>
    </div>
  );
} 