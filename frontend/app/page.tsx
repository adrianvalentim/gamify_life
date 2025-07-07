"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { Book, Shield, Swords } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="text-center p-8 max-w-2xl">
        <h1 className="text-5xl font-bold mb-4 tracking-tight">
          Welcome to Gamify Journal
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Turn your daily thoughts into an epic adventure. Level up your life, one entry at a time.
        </p>
        <div className="flex justify-center gap-4">
          {isAuthenticated ? (
            <Button size="lg" onClick={() => router.push("/docs")}>
              Go to your Journal
            </Button>
          ) : (
            <>
              <Button size="lg" onClick={() => router.push("/login")}>
                Login
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push("/register")}
              >
                Create Account
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl text-center">
        <div className="p-6 rounded-lg">
          <Book className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-semibold mb-2">Journaling Reimagined</h3>
          <p className="text-muted-foreground">
            A simple, intuitive interface for your daily entries.
          </p>
        </div>
        <div className="p-6 rounded-lg">
          <Swords className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-semibold mb-2">Character Progression</h3>
          <p className="text-muted-foreground">
            Watch your character grow as you build your journaling habit.
          </p>
        </div>
        <div className="p-6 rounded-lg">
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-semibold mb-2">Quests & Achievements</h3>
          <p className="text-muted-foreground">
            Complete tasks and unlock achievements on your journey.
          </p>
        </div>
      </div>
    </div>
  );
}

