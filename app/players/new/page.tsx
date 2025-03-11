"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Star, Upload, Image as ImageIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/app/hooks/use-auth"
import { getAuthHeaders } from "@/lib/admin-utils"
import AdminCheck from "@/components/admin-check"

export default function NewPlayerPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isAdmin } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    level: "3",
    bio: "",
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")

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
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "שגיאה",
          description: "הקובץ חייב להיות תמונה",
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
    try {
      // בדיקת הרשאות מנהל
      if (!isAdmin) {
        toast({
          title: "שגיאה",
          description: "אין לך הרשאות מנהל ליצירת שחקן חדש",
          variant: "destructive",
        })
        return
      }
      
      let avatarUrl = ""
      
      if (avatarFile) {
        // Create FormData for image upload
        const imageData = new FormData()
        imageData.append('file', avatarFile)
        
        // Upload image first
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            ...getAuthHeaders()
          },
          body: imageData,
        })
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image')
        }
        
        const { url } = await uploadResponse.json()
        avatarUrl = url
      }

      // Create player with image URL
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          ...formData,
          avatar: avatarUrl,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create player')
      }

      toast({
        title: "השחקן נוצר בהצלחה",
        description: "השחקן נוסף למערכת",
      })

      router.push("/players")
    } catch (error) {
      console.error('Error creating player:', error)
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה ביצירת השחקן",
        variant: "destructive",
      })
    }
  }

  return (
    <AdminCheck>
      <div dir="rtl" className="container mx-auto py-6 max-w-2xl bg-gradient-to-b from-blue-50 to-white min-h-screen">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/players">
            <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-800 hover:bg-blue-100">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-blue-700">הוסף שחקן חדש</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-2 border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50">
              <CardTitle className="text-blue-800">פרטי השחקן</CardTitle>
              <CardDescription className="text-blue-600">מלא את הפרטים עבור השחקן החדש</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    {avatarPreview ? (
                      <div className="h-full w-full overflow-hidden rounded-full">
                        <img 
                          src={avatarPreview} 
                          alt="תצוגה מקדימה" 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            console.log('Error loading avatar preview in new player');
                            (e.target as HTMLImageElement).src = '/placeholder-user.jpg';
                          }}
                        />
                      </div>
                    ) : (
                      <AvatarFallback>
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 p-1 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90"
                  >
                    <Upload className="h-4 w-4" />
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  לחץ על הסמל כדי להעלות תמונת פרופיל
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-blue-700">
                  שם מלא
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="הזן את שם השחקן"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-blue-700">
                    אימייל
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="example@domain.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-blue-700">
                    טלפון
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="050-1234567"
                    value={formData.phone}
                    onChange={handleChange}
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level" className="text-blue-700 flex items-center gap-2">
                  רמת שחקן
                  <Star className="h-4 w-4 text-yellow-500" />
                </Label>
                <Select value={formData.level} onValueChange={(value) => handleSelectChange("level", value)}>
                  <SelectTrigger className="border-blue-200 focus:border-blue-400">
                    <SelectValue placeholder="בחר רמה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">מתחיל ★</SelectItem>
                    <SelectItem value="2">מתחיל מתקדם ★★</SelectItem>
                    <SelectItem value="3">בינוני ★★★</SelectItem>
                    <SelectItem value="4">מתקדם ★★★★</SelectItem>
                    <SelectItem value="5">מקצועי ★★★★★</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-blue-700">
                  על השחקן
                </Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="ספר קצת על השחקן, ניסיון, סגנון משחק וכו'"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-blue-50">
              <Link href="/players">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                  ביטול
                </Button>
              </Link>
              <Button type="submit" className="bg-green-500 hover:bg-green-600 text-white">
                הוסף שחקן
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AdminCheck>
  )
}

