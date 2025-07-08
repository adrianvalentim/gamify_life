"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Shield, Sword, Heart, Zap, Award, BookOpen, Target, Gift, ArrowLeft } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"

// Define the structure of the character data
interface Character {
  id: string
  name: string
  class: string
  level: number
  xp: number
  avatar_url: string
  strength: number
  defense: number
  vitality: number
  mana: number
  attribute_points: number
}

// Function to calculate XP needed for the next level
const getNextLevelXp = (level: number) => {
  return level * 100
}

export default function CharacterPage() {
  const [character, setCharacter] = useState<Character | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pointsToSpend, setPointsToSpend] = useState({
    strength: 0,
    defense: 0,
    vitality: 0,
    mana: 0,
  })
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, token } = useAuthStore()
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    async function fetchCharacter() {
      setIsLoading(true)
      try {
        const response = await fetch("/api/character", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        })
        if (response.ok) {
          const data: Character = await response.json()
          setCharacter(data)

          // Check for level up against locally stored level
          const storedLevelKey = `character_level_${data.id}`
          const storedLevel = localStorage.getItem(storedLevelKey)

          if (storedLevel && data.level > parseInt(storedLevel, 10)) {
            toast({
              title: "🎉 Level Up!",
              description: `Parabéns, você alcançou o nível ${data.level}!`,
              duration: 5000,
            })
          }

          // Update local storage with the latest level
          localStorage.setItem(storedLevelKey, data.level.toString())
        } else {
          if (response.status === 404) {
            router.push('/create-character')
          } else {
            console.error("No character found for this user.")
          }
        }
      } catch (error) {
        console.error("Failed to fetch character", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCharacter()
  }, [isAuthenticated, router, toast, token])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h2 className="text-2xl font-semibold mb-4">
          Personagem não encontrado
        </h2>
        <p className="text-muted-foreground mb-6">
          Parece que você ainda não tem um personagem.
        </p>
        <Button onClick={() => router.push("/create-character")}>Criar Personagem</Button>
      </div>
    )
  }

  const handlePointChange = (attr: keyof typeof pointsToSpend, amount: number) => {
    const remainingPoints =
      character.attribute_points -
      (pointsToSpend.strength + pointsToSpend.defense + pointsToSpend.vitality + pointsToSpend.mana)

    if (amount > 0 && remainingPoints <= 0) return // No points left to spend
    if (amount < 0 && pointsToSpend[attr] <= 0) return // Cannot go below 0

    setPointsToSpend(prev => ({ ...prev, [attr]: prev[attr] + amount }))
  }

  const handleSaveChanges = async () => {
    try {
      const response = await fetch("/api/character/spend-points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pointsToSpend),
      });

      if (response.ok) {
        const updatedCharacter = await response.json();
        setCharacter(updatedCharacter);
        setPointsToSpend({ strength: 0, defense: 0, vitality: 0, mana: 0 }); // Reset points
        toast({
          title: "Atributos atualizados!",
          description: "Seus pontos foram distribuídos com sucesso.",
        });
      } else {
        console.error("Failed to save attribute points");
        toast({
          title: "Erro",
          description: "Não foi possível salvar os atributos.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving attribute points:", error);
    }
  };

  const nextLevelXp = getNextLevelXp(character.level)
  const progress = (character.xp / nextLevelXp) * 100
  const totalSpentPoints = Object.values(pointsToSpend).reduce((a, b) => a + b, 0);

  // Derived stats based on core attributes
  const health = (character.vitality + pointsToSpend.vitality) * 10;
  const mana = (character.mana + pointsToSpend.mana) * 10;

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <Button 
        variant="ghost" 
        className="mb-4 flex items-center gap-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:row-span-2 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Ficha de Personagem</CardTitle>
            <CardDescription>Seu personagem no mundo de Gamify Journal</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold absolute -top-2 -right-2 z-10 border-2 border-background">
                {character.level}
              </div>
              <div className="rounded-full border-4 border-primary p-1 overflow-hidden">
                <Image
                  src={character.avatar_url || "/placeholder.svg"}
                  alt="Character avatar"
                  width={120}
                  height={120}
                  className="rounded-full"
                />
              </div>
            </div>
            
            <h2 className="text-xl font-bold">{character.name}</h2>
            <Badge variant="secondary" className="mt-1 mb-4">
              {character.class}
            </Badge>
            
            <div className="w-full">
              <div className="flex justify-between text-sm mb-1 text-muted-foreground">
                <span>Experiência</span>
                <span>{character.xp}/{nextLevelXp}</span>
              </div>
              <Progress value={progress} className="h-2 mb-6" />
              
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="flex items-center justify-between gap-2 bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sword className="h-5 w-5 text-red-500" />
                    <div>
                      <div className="text-xs text-muted-foreground">Força</div>
                      <div className="font-medium">{character.strength + pointsToSpend.strength}</div>
                    </div>
                  </div>
                  {character.attribute_points > 0 && (
                     <div className="flex items-center gap-1">
                       <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handlePointChange('strength', -1)}>-</Button>
                       <span className="w-4 text-center">{pointsToSpend.strength}</span>
                       <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handlePointChange('strength', 1)}>+</Button>
                     </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between gap-2 bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-xs text-muted-foreground">Defesa</div>
                      <div className="font-medium">{character.defense + pointsToSpend.defense}</div>
                    </div>
                  </div>
                  {character.attribute_points > 0 && (
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handlePointChange('defense', -1)}>-</Button>
                      <span className="w-4 text-center">{pointsToSpend.defense}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handlePointChange('defense', 1)}>+</Button>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between gap-2 bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="text-xs text-muted-foreground">Saúde</div>
                      <div className="font-medium">{health}</div>
                    </div>
                  </div>
                  {character.attribute_points > 0 && (
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handlePointChange('vitality', -1)}>-</Button>
                      <span className="w-4 text-center">{pointsToSpend.vitality}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handlePointChange('vitality', 1)}>+</Button>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between gap-2 bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-500" />
                    <div>
                      <div className="text-xs text-muted-foreground">Mana</div>
                      <div className="font-medium">{mana}</div>
                    </div>
                  </div>
                   {character.attribute_points > 0 && (
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handlePointChange('mana', -1)}>-</Button>
                      <span className="w-4 text-center">{pointsToSpend.mana}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handlePointChange('mana', 1)}>+</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          {character.attribute_points > 0 && (
            <CardFooter className="flex-col items-start">
                <div className="text-center w-full mb-2 text-sm font-medium">
                  Você tem {character.attribute_points - totalSpentPoints} pontos para distribuir!
                </div>
                <Button className="w-full" onClick={handleSaveChanges} disabled={totalSpentPoints === 0}>
                  Salvar Alterações
                </Button>
            </CardFooter>
          )}
        </Card>
        
        <div className="col-span-1 lg:col-span-2">
          <Tabs defaultValue="missions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="missions" className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>Missões</span>
              </TabsTrigger>
              <TabsTrigger value="story" className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>História</span>
              </TabsTrigger>
              <TabsTrigger value="rewards" className="flex items-center gap-1">
                <Gift className="h-4 w-4" />
                <span>Recompensas</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="missions">
              <Card>
                <CardHeader>
                  <CardTitle>Missões Ativas</CardTitle>
                  <CardDescription>Complete missões para ganhar experiência e recompensas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">Escritor Dedicado</h3>
                          <p className="text-sm text-muted-foreground">Escreva todos os dias por uma semana</p>
                        </div>
                        <Badge>+100 XP</Badge>
                      </div>
                      <Progress value={71} className="h-2 mt-2" />
                      <p className="text-xs text-right mt-1 text-muted-foreground">5/7 dias</p>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">Explorador de Ideias</h3>
                          <p className="text-sm text-muted-foreground">Crie 5 novos documentos em categorias diferentes</p>
                        </div>
                        <Badge>+150 XP</Badge>
                      </div>
                      <Progress value={40} className="h-2 mt-2" />
                      <p className="text-xs text-right mt-1 text-muted-foreground">2/5 documentos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="story">
              <Card>
                <CardHeader>
                  <CardTitle>Sua Jornada</CardTitle>
                  <CardDescription>A história do seu personagem até agora</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-2 border-primary pl-4 py-2">
                      <h3 className="font-semibold">Capítulo 1: O Início da Jornada</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Você começou sua jornada como um escritor novato, mas cheio de determinação.
                        Seus primeiros passos foram tímidos, mas cada palavra escrita fortaleceu sua
                        determinação e habilidades.
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Award className="h-4 w-4 text-amber-500" />
                        <span className="text-xs">Nível 1 alcançado</span>
                      </div>
                    </div>
                    
                    <div className="border-l-2 border-primary pl-4 py-2">
                      <h3 className="font-semibold">Capítulo 2: Disciplina Diária</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Após dominar o básico, você estabeleceu uma rotina consistente de escrita.
                        Suas palavras começaram a fluir com mais facilidade, e suas ideias ganharam
                        profundidade e consistência.
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Award className="h-4 w-4 text-amber-500" />
                        <span className="text-xs">Nível 3 alcançado</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="rewards">
              <Card>
                <CardHeader>
                  <CardTitle>Recompensas</CardTitle>
                  <CardDescription>Conquistas e itens desbloqueados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground">
                    <p>Nenhuma recompensa ainda.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 