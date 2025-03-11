"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar, Trophy } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface League {
  id: string
  name: string
  description: string | null
  startDate: Date
  endDate: Date | null
  rounds: number
  status: string
}

export function LeagueManager() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    rounds: "1",
    status: "draft"
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!formData.name || !formData.startDate) {
        toast.error("נא למלא את כל השדות החובה")
        return
      }

      const response = await fetch("/api/leagues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          startDate: new Date(formData.startDate),
          endDate: formData.endDate ? new Date(formData.endDate) : undefined,
          rounds: parseInt(formData.rounds),
          status: formData.status
        })
      })

      if (!response.ok) {
        throw new Error("Failed to create league")
      }

      const data = await response.json()
      
      toast.success("הליגה נוצרה בהצלחה!", {
        description: "הליגה החדשה נוצרה ומוכנה להוספת שחקנים",
        action: {
          label: "הוסף שחקנים",
          onClick: () => router.push(`/leagues/${data.league.id}/players`)
        }
      })

      router.refresh()
    } catch (error) {
      console.error('Error creating league:', error)
      toast.error("שגיאה ביצירת הליגה", {
        description: "אנא נסה שוב מאוחר יותר"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-2 border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-blue-800">צור ליגה חדשה</CardTitle>
              <CardDescription className="text-blue-600">מלא את הפרטים עבור הליגה החדשה</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-blue-700">
              שם הליגה
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="הזן את שם הליגה"
              value={formData.name}
              onChange={handleChange}
              required
              className="border-blue-200 focus:border-blue-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-blue-700">
              תיאור
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="תאר את הליגה, מטרתה, פרסים וכו'"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="border-blue-200 focus:border-blue-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-blue-700">
                תאריך התחלה
              </Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-400" />
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="pl-8 border-blue-200 focus:border-blue-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-blue-700">
                תאריך סיום (אופציונלי)
              </Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-400" />
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="pl-8 border-blue-200 focus:border-blue-400"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-blue-700">מספר סיבובים</Label>
            <RadioGroup
              value={formData.rounds}
              onValueChange={(value) => handleSelectChange("rounds", value)}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="1" id="single" />
                <Label htmlFor="single" className="font-normal">
                  סיבוב אחד (כל אחד משחק נגד כולם פעם אחת)
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="2" id="double" />
                <Label htmlFor="double" className="font-normal">
                  סיבוב כפול (כל אחד משחק נגד כולם פעמיים)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end bg-blue-50">
          <Button 
            type="submit" 
            className="bg-green-500 hover:bg-green-600 text-white"
            disabled={isLoading}
          >
            {isLoading ? "יוצר ליגה..." : "צור ליגה"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
} 