"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useLanguage } from "@/lib/language-context"

interface SettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const { language, setLanguage, translations } = useLanguage()
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{translations.settings}</SheetTitle>
          <SheetDescription>
            {/* Add a description here if needed */}
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6">
          <div className="space-y-4">
            <div>
              <h3 className="mb-4 text-sm font-medium">{translations.language}</h3>
              <RadioGroup 
                defaultValue={language} 
                onValueChange={(value) => setLanguage(value as "en" | "pt")}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="lang-en" />
                  <Label htmlFor="lang-en">{translations.english}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pt" id="lang-pt" />
                  <Label htmlFor="lang-pt">{translations.portuguese}</Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Add more settings sections here as needed */}
          </div>
        </div>
        
        <SheetFooter>
          <Button onClick={() => onOpenChange(false)}>
            {translations.cancel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
} 