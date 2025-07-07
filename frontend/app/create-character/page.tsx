"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  class: z.enum(["Warrior", "Mage", "Rogue"]),
});

export default function CreateCharacterPage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const [avatarPrompt, setAvatarPrompt] = useState("a warrior with a sword");
  const [avatarUrl, setAvatarUrl] = useState(`https://api.dicebear.com/8.x/adventurer/svg?seed=${Math.random().toString()}`);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const handleGenerateAvatar = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("http://localhost:8080/api/v1/generate-avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: avatarPrompt }),
      });

      if (!response.ok) {
        throw new Error("Avatar generation failed");
      }

      const data = await response.json();
      setAvatarUrl(data.avatar_url);
    } catch (error) {
      console.error(error);
      // Handle error
    } finally {
      setIsGenerating(false);
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      class: "Warrior",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch("http://localhost:8080/api/v1/characters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...values, avatar_url: avatarUrl }),
      });

      if (!response.ok) {
        throw new Error("Character creation failed");
      }

      router.push("/docs");
    } catch (error) {
      console.error(error);
      // Handle error
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Your Character</CardTitle>
          <CardDescription>
            Forge your hero to embark on a new adventure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-4">
            <Image
              src={avatarUrl}
              alt="Character Avatar"
              width={128}
              height={128}
              className="rounded-full bg-gray-200"
              key={avatarUrl}
            />
          </div>
          <div className="space-y-2 mb-6">
            <Label htmlFor="avatar-prompt">Avatar Prompt</Label>
            <div className="flex gap-2">
              <Input
                id="avatar-prompt"
                placeholder="e.g., a mage with a glowing staff"
                value={avatarPrompt}
                onChange={(e) => setAvatarPrompt(e.target.value)}
              />
              <Button onClick={handleGenerateAvatar} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Character Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Elora, the Brave" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Warrior">Warrior</SelectItem>
                        <SelectItem value="Mage">Mage</SelectItem>
                        <SelectItem value="Rogue">Rogue</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Create Character
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 