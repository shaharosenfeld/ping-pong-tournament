"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Star, Upload, Image as ImageIcon, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import AdminCheck from "@/components/admin-check"

interface PlayerData {
  id: string
  name: string
  email: string
  phone: string
  level: number
  bio: string
  avatar?: string
  initials: string
}

export default function EditPlayerPage() {
  const router = useRouter()
  const pathname = usePathname()
  // Extract the ID from pathname
  // const playerId = pathname.split('/').slice(-2)[0] || ''
  
  // שיפור חילוץ ה-ID מהנתיב
  const pathSegments = pathname.split('/')
  // לדוגמה: /players/abc123/edit יהפוך ל ['', 'players', 'abc123', 'edit']
  // אנחנו רוצים לקחת את הערך שנמצא אחרי 'players'
  const playerIndex = pathSegments.findIndex(segment => segment === 'players')
  const playerId = playerIndex >= 0 && pathSegments.length > playerIndex + 1 
    ? pathSegments[playerIndex + 1] 
    : ''
  
  console.log('Current pathname:', pathname, 'Path segments:', pathSegments, 'Player ID:', playerId)
  
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    level: "3",
    bio: "",
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [originalAvatar, setOriginalAvatar] = useState<string>("")

  useEffect(() => {
    const fetchPlayer = async () => {
      if (!playerId) {
        console.error("Player ID is missing")
        toast({
          title: "שגיאה",
          description: "מזהה שחקן חסר או לא תקין",
          variant: "destructive",
        })
        router.push('/players')
        return
      }
      
      try {
        console.log(`Fetching player data for ID: ${playerId}`)
        const response = await fetch(`/api/players/${playerId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null) || await response.text()
          const errorMessage = typeof errorData === 'object' && errorData.error 
            ? errorData.error 
            : `Status ${response.status}: ${response.statusText}`
          
          console.error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`)
          throw new Error(`Failed to fetch player: ${errorMessage}`)
        }
        
        const player: PlayerData = await response.json()
        console.log('Player data retrieved:', player)
        
        if (!player || !player.id) {
          throw new Error('Invalid player data received')
        }
        
        setFormData({
          name: player.name || "",
          email: player.email || "",
          phone: player.phone || "",
          level: player.level?.toString() || "3",
          bio: player.bio || "",
        })
        
        if (player.avatar) {
          setAvatarPreview(player.avatar)
          setOriginalAvatar(player.avatar)
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching player:', error)
        toast({
          title: "שגיאה בטעינת נתונים",
          description: error instanceof Error ? error.message : "לא ניתן לטעון את פרטי השחקן",
          variant: "destructive",
        })
        
        // נחזור לדף הרשימה לאחר השהייה קצרה
        setTimeout(() => {
          router.push('/players')
        }, 1500)
      }
    }

    fetchPlayer()
  }, [playerId, router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "שגיאה",
          description: "גודל התמונה חייב להיות קטן מ-5MB",
          variant: "destructive",
        })
        return
      }

      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSaving) return
    
    if (!playerId) {
      toast({
        title: "שגיאה",
        description: "מזהה שחקן חסר או לא תקין",
        variant: "destructive",
      })
      return
    }
    
    setIsSaving(true)
    
    try {
      let avatarUrl = originalAvatar
      
      // Upload new avatar if selected
      if (avatarFile) {
        const formData = new FormData()
        formData.append('file', avatarFile)
        
        console.log('Uploading new avatar...')
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => null) || await uploadResponse.text()
          console.error(`Upload API Error: ${uploadResponse.status} - ${JSON.stringify(errorData)}`)
          throw new Error('Failed to upload avatar')
        }
        
        const uploadData = await uploadResponse.json()
        avatarUrl = uploadData.url
        console.log('Avatar uploaded successfully:', avatarUrl)
      }
      
      console.log(`Updating player with ID: ${playerId}`)
      // Update player data
      const response = await fetch(`/api/players/${playerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          avatar: avatarUrl,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null) || await response.text()
        console.error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`)
        
        const errorMessage = typeof errorData === 'object' && errorData.error 
          ? errorData.error 
          : 'Failed to update player'
        
        throw new Error(errorMessage)
      }
      
      toast({
        title: "השחקן עודכן בהצלחה",
        description: "פרטי השחקן עודכנו במערכת",
        variant: "default",
      })
      
      router.push('/players')
    } catch (error) {
      console.error('Error updating player:', error)
      toast({
        title: "שגיאה בעדכון",
        description: error instanceof Error ? error.message : "אירעה שגיאה בעדכון פרטי השחקן",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AdminCheck>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/players">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">עריכת שחקן</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>עריכת פרטי שחקן</CardTitle>
              <CardDescription>עדכן את פרטי השחקן במערכת</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">שם מלא</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="שם השחקן"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">אימייל</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="כתובת אימייל"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">טלפון</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="מספר טלפון"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">רמת שחקן</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => handleSelectChange("level", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר רמה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-2" fill="currentColor" />
                          <span>מתחיל (1)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="2">
                        <div className="flex items-center">
                          <div className="flex">
                            <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                            <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                          </div>
                          <span className="mr-2">חובבן (2)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="3">
                        <div className="flex items-center">
                          <div className="flex">
                            <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                            <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                            <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                          </div>
                          <span className="mr-2">בינוני (3)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="4">
                        <div className="flex items-center">
                          <div className="flex">
                            <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
                            <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
                            <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
                            <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
                          </div>
                          <span className="mr-2">מתקדם (4)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="5">
                        <div className="flex items-center">
                          <div className="flex">
                            <Star className="h-4 w-4 text-red-500" fill="currentColor" />
                            <Star className="h-4 w-4 text-red-500" fill="currentColor" />
                            <Star className="h-4 w-4 text-red-500" fill="currentColor" />
                            <Star className="h-4 w-4 text-red-500" fill="currentColor" />
                            <Star className="h-4 w-4 text-red-500" fill="currentColor" />
                          </div>
                          <span className="mr-2">מקצועי (5)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>תמונת פרופיל</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-muted">
                      {avatarPreview ? (
                        <div className="h-full w-full overflow-hidden rounded-full">
                          <img 
                            src={avatarPreview} 
                            alt="Avatar preview" 
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              console.log('Error loading avatar preview in player edit');
                              (e.target as HTMLImageElement).src = '/placeholder-user.jpg';
                            }}
                          />
                        </div>
                      ) : (
                        <AvatarFallback>
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <Label
                        htmlFor="avatar"
                        className="cursor-pointer inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        העלה תמונה
                      </Label>
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG או GIF עד 5MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">אודות</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="מידע נוסף על השחקן"
                    rows={4}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => router.push('/players')}>
                  ביטול
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "שומר..." : "שמור שינויים"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </AdminCheck>
  )
}

