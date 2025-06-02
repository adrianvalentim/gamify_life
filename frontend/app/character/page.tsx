"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Sword, Heart, Zap, Award, BookOpen, Target, Gift } from "lucide-react"

export default function CharacterPage() {
  // This would eventually be fetched from the API
  const [character, setCharacter] = useState({
    id: '1',
    name: 'Aventureiro',
    class: 'Warrior',
    level: 5,
    xp: 450,
    nextLevelXp: 600,
    attributes: {
      strength: 10 + Math.floor(5 / 2),
      defense: 8 + Math.floor(5 / 3),
      health: 100 + (5 * 10),
      mana: 50 + (5 * 5)
    }
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  
  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    
    return () => clearTimeout(timer)
    
    // In the future, this would fetch from the character API
    // async function fetchCharacter() {
    //   try {
    //     const response = await fetch('/api/v1/characters/me')
    //     if (response.ok) {
    //       const data = await response.json()
    //       setCharacter(data)
    //     }
    //   } catch (error) {
    //     console.error('Failed to fetch character', error)
    //   } finally {
    //     setIsLoading(false)
    //   }
    // }
    // 
    // fetchCharacter()
  }, [])
  
  const progress = (character.xp / character.nextLevelXp) * 100
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => router.back()}
      >
        ← Voltar
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:row-span-2">
          <CardHeader>
            <CardTitle>Ficha de Personagem</CardTitle>
            <CardDescription>Seu personagem no mundo de Gamify Journal</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold absolute -top-2 -right-2 z-10">
                {character.level}
              </div>
              <div className="rounded-full border-4 border-amber-500 p-1 overflow-hidden">
                <Image
                  src={"/placeholder.svg"}
                  alt="Character avatar"
                  width={120}
                  height={120}
                  className="rounded-full"
                />
              </div>
            </div>
            
            <h2 className="text-xl font-bold">{character.name}</h2>
            <Badge variant="outline" className="mt-1 mb-4">
              {character.class}
            </Badge>
            
            <div className="w-full">
              <div className="flex justify-between text-sm mb-1">
                <span>Experiência</span>
                <span>{character.xp}/{character.nextLevelXp}</span>
              </div>
              <Progress value={progress} className="h-2 mb-6" />
              
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg">
                  <Sword className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">Força</div>
                    <div className="font-medium">{character.attributes.strength}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">Defesa</div>
                    <div className="font-medium">{character.attributes.defense}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg">
                  <Heart className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">Saúde</div>
                    <div className="font-medium">{character.attributes.health}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg">
                  <Zap className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">Mana</div>
                    <div className="font-medium">{character.attributes.mana}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
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
                    <div className="border-l-2 border-amber-500 pl-4 py-2">
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
                    
                    <div className="border-l-2 border-amber-500 pl-4 py-2">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4 flex items-center gap-3">
                      <div className="bg-amber-100 p-2 rounded-full">
                        <Award className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Escrevinhador Constante</h3>
                        <p className="text-xs text-muted-foreground">Escreveu por 7 dias seguidos</p>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4 flex items-center gap-3">
                      <div className="bg-indigo-100 p-2 rounded-full">
                        <Zap className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Mestre das Palavras</h3>
                        <p className="text-xs text-muted-foreground">Escreveu mais de 10.000 palavras</p>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4 flex items-center gap-3 opacity-50">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <Gift className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Tema Especial</h3>
                        <p className="text-xs text-muted-foreground">Desbloqueado no nível 10</p>
                      </div>
                    </div>
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