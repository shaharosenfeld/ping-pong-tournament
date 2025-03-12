"use client"



import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Calendar, Trophy, Users, CheckCircle2, Gauge } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/app/hooks/use-auth"
import { getAuthHeaders } from "@/lib/admin-utils"

interface Player {
  id: string
  name: string
  rating: number
}

interface TournamentFormProps {
  mode?: 'create' | 'edit'
  tournamentId?: string
  initialData?: {
    name: string
    description: string
    startDate: string
    endDate: string
    format: string
    maxPlayers: string
    rounds: string
    status: string
    players: string[]
    location?: string
    groupCount?: string
    advanceCount?: string
    price?: string
    registrationOpen?: boolean
    registrationDeadline?: string
  }
  onSuccess?: () => void
}

// Group players by skill level
function groupPlayersBySkill(players: Player[]): Record<string, Player[]> {
  const sortedPlayers = [...players].sort((a, b) => b.rating - a.rating);
  
  // Define skill groups based on ratings
  const skillGroups: Record<string, Player[]> = {
    "מתקדמים": [],
    "בינוניים": [],
    "מתחילים": []
  };
  
  // Divide players into three equal groups
  const groupSize = Math.ceil(sortedPlayers.length / 3);
  
  sortedPlayers.forEach((player, index) => {
    if (index < groupSize) {
      skillGroups["מתקדמים"].push(player);
    } else if (index < groupSize * 2) {
      skillGroups["בינוניים"].push(player);
    } else {
      skillGroups["מתחילים"].push(player);
    }
  });
  
  return skillGroups;
}

export function TournamentForm({ 
  mode = 'create', 
  tournamentId,
  initialData,
  onSuccess 
}: TournamentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { isAdmin } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    startDate: initialData?.startDate || "",
    endDate: initialData?.endDate || "",
    format: initialData?.format || "league",
    maxPlayers: initialData?.maxPlayers || "8",
    rounds: initialData?.rounds || "1",
    status: initialData?.status || "draft",
    location: initialData?.location || "",
    groupCount: initialData?.groupCount || "2",
    advanceCount: initialData?.advanceCount || "2",
    price: initialData?.price || "",
    registrationOpen: initialData?.registrationOpen || false,
    registrationDeadline: initialData?.registrationDeadline || ""
  })
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(initialData?.players || [])
  const [playerGroups, setPlayerGroups] = useState<Record<string, Player[]>>({})
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectionMode, setSelectionMode] = useState<"manual" | "auto">("manual")
  const [matchGenerationMode, setMatchGenerationMode] = useState<"automatic" | "manual">("automatic")
  const [manualMatches, setManualMatches] = useState<Array<{player1Id: string, player2Id: string}>>([])
  const [groupAssignments, setGroupAssignments] = useState<Record<string, string[]>>({})
  const [groupSelectionMode, setGroupSelectionMode] = useState<"automatic" | "manual">("automatic")

  // Initialize player groups
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch('/api/players')
        if (!response.ok) throw new Error('Failed to fetch players')
        const data = await response.json()
        setPlayers(data)
        setPlayerGroups(groupPlayersBySkill(data))
      } catch (error) {
        console.error('Error fetching players:', error)
        toast({
          title: "שגיאה",
          description: "לא ניתן לטעון את רשימת השחקנים",
          variant: "destructive",
        })
      }
    }

    fetchPlayers()
  }, [toast])

  // Initialize group assignments
  useEffect(() => {
    if (formData.format === 'groups_knockout') {
      const count = parseInt(formData.groupCount) || 2;
      const newGroupAssignments: Record<string, string[]> = {};
      
      for (let i = 0; i < count; i++) {
        const groupName = `Group ${String.fromCharCode(65 + i)}`; // Group A, B, C, etc.
        newGroupAssignments[groupName] = [];
      }
      
      setGroupAssignments(newGroupAssignments);
    }
  }, [formData.format, formData.groupCount]);

  // Auto-assign players to groups when players change
  useEffect(() => {
    if (formData.format === 'groups_knockout' && groupSelectionMode === 'automatic' && selectedPlayers.length > 0) {
      const count = parseInt(formData.groupCount) || 2;
      const newGroupAssignments: Record<string, string[]> = {};
      
      // Initialize groups
      for (let i = 0; i < count; i++) {
        const groupName = `Group ${String.fromCharCode(65 + i)}`; // Group A, B, C, etc.
        newGroupAssignments[groupName] = [];
      }
      
      // Distribute players evenly across groups
      const shuffledPlayers = [...selectedPlayers].sort(() => Math.random() - 0.5);
      shuffledPlayers.forEach((playerId, index) => {
        const groupIndex = index % count;
        const groupName = `Group ${String.fromCharCode(65 + groupIndex)}`;
        newGroupAssignments[groupName].push(playerId);
      });
      
      setGroupAssignments(newGroupAssignments);
    }
  }, [selectedPlayers, formData.format, formData.groupCount, groupSelectionMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePlayerToggle = (playerId: string) => {
    // If player is already selected, unselect them - but first warn if in edit mode
    if (selectedPlayers.includes(playerId) && mode === 'edit') {
      const playerToRemove = players.find(p => p.id === playerId);
      const playerName = playerToRemove?.name || 'השחקן';
      
      if (confirm(`שים לב: הסרת ${playerName} מהטורניר תמחק גם את כל המשחקים שלו. האם להמשיך?`)) {
        setSelectedPlayers(prev => prev.filter(id => id !== playerId));
      }
      return;
    }
    
    // Toggle player selection
    setSelectedPlayers(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  }

  const handleGroupToggle = (groupName: string) => {
    if (selectedGroups.includes(groupName)) {
      // Remove group
      setSelectedGroups(prev => prev.filter(g => g !== groupName))
      
      // Remove all players from this group
      const groupPlayerIds = playerGroups[groupName].map(p => p.id)
      setSelectedPlayers(prev => prev.filter(id => !groupPlayerIds.includes(id)))
    } else {
      // Add group
      setSelectedGroups(prev => [...prev, groupName])
      
      // Add all players from this group
      const groupPlayerIds = playerGroups[groupName].map(p => p.id)
      setSelectedPlayers(prev => {
        const newSelection = [...prev]
        groupPlayerIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id)
          }
        })
        return newSelection
      })
    }
  }

  const handlePlayerGroupAssignment = (playerId: string, groupName: string) => {
    // Remove player from current group if any
    const updatedAssignments = { ...groupAssignments };
    
    // Find and remove player from any existing group
    Object.keys(updatedAssignments).forEach(group => {
      updatedAssignments[group] = updatedAssignments[group].filter(id => id !== playerId);
    });
    
    // Add player to new group
    updatedAssignments[groupName] = [...updatedAssignments[groupName], playerId];
    
    setGroupAssignments(updatedAssignments);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      // בדיקת הרשאות מנהל
      if (!isAdmin) {
        toast({
          title: "שגיאה",
          description: "אין לך הרשאות מנהל לביצוע פעולה זו",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }
      
      // Validate form
      if (!formData.name || !formData.startDate || selectedPlayers.length === 0) {
        toast({
          title: "שגיאה",
          description: "יש למלא את כל השדות הנדרשים",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }
      
      // Validate manual matches if that mode is selected
      if (mode === 'create' && matchGenerationMode === 'manual' && manualMatches.length === 0) {
        toast({
          title: "שגיאה",
          description: "יש להגדיר לפחות משחק אחד בהגרלה ידנית",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }
      
      // Validate that all players are included in at least one match when using manual match generation
      if (mode === 'create' && matchGenerationMode === 'manual' && manualMatches.length > 0) {
        const playersInMatches = new Set<string>();
        
        manualMatches.forEach(match => {
          playersInMatches.add(match.player1Id);
          playersInMatches.add(match.player2Id);
        });
        
        const missingPlayers = selectedPlayers.filter(playerId => !playersInMatches.has(playerId));
        
        if (missingPlayers.length > 0) {
          const missingPlayerNames = missingPlayers.map(id => 
            players.find(p => p.id === id)?.name || 'שחקן לא ידוע'
          ).join(', ');
          
          toast({
            title: "שגיאה",
            description: `ישנם שחקנים שלא משובצים לאף משחק: ${missingPlayerNames}`,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      // Validate group assignments for groups_knockout format
      if (mode === 'create' && formData.format === 'groups_knockout') {
        // Check if all players are assigned to a group
        const assignedPlayers = new Set<string>();
        Object.values(groupAssignments).forEach(group => {
          group.forEach(playerId => assignedPlayers.add(playerId));
        });
        
        const unassignedPlayers = selectedPlayers.filter(playerId => !assignedPlayers.has(playerId));
        
        if (unassignedPlayers.length > 0) {
          const unassignedPlayerNames = unassignedPlayers.map(id => 
            players.find(p => p.id === id)?.name || 'שחקן לא ידוע'
          ).join(', ');
          
          toast({
            title: "שגיאה",
            description: `ישנם שחקנים שלא משובצים לאף בית: ${unassignedPlayerNames}`,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        
        // Check if any group is empty
        const emptyGroups = Object.entries(groupAssignments)
          .filter(([_, players]) => players.length === 0)
          .map(([name, _]) => name);
        
        if (emptyGroups.length > 0) {
          toast({
            title: "שגיאה",
            description: `ישנם בתים ריקים: ${emptyGroups.join(', ')}`,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      // Prepare data for API
      let apiData = {}
      
      if (mode === 'edit') {
        // In edit mode, only send fields that should be editable
        apiData = {
          name: formData.name,
          description: formData.description,
          endDate: formData.endDate,
          location: formData.location,
          status: formData.status,
          players: selectedPlayers
        }
      } else {
        // In create mode, send all fields
        apiData = {
          ...formData,
          players: selectedPlayers,
          matchGenerationMode,
          manualMatches: matchGenerationMode === 'manual' ? manualMatches : undefined,
          groupAssignments: formData.format === 'groups_knockout' ? groupAssignments : undefined
        }
      }
      
      // Send to API
      const url = mode === 'edit' 
        ? `/api/tournaments/${tournamentId}` 
        : '/api/tournaments'
      
      const method = mode === 'edit' ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(apiData),
      })
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          console.error('Server error:', errorData);
          throw new Error(`Failed to ${mode === 'edit' ? 'update' : 'create'} tournament: ${errorData.error || response.statusText}`);
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          throw new Error(`Failed to ${mode === 'edit' ? 'update' : 'create'} tournament`);
        }
      }
      
      toast({
        title: mode === 'edit' ? "הטורניר עודכן בהצלחה" : "הטורניר נוצר בהצלחה",
        description: mode === 'edit' ? "פרטי הטורניר עודכנו במערכת" : "הטורניר נוצר במערכת",
        variant: "default",
      })
      
      if (onSuccess) {
        onSuccess()
      } else {
        // Default navigation
        const data = await response.json()
        const tournamentId = data.tournament?.id || data.id
        router.push(`/tournaments/${tournamentId}`)
      }
    } catch (error) {
      console.error('Error submitting tournament:', error)
      toast({
        title: "שגיאה",
        description: `אירעה שגיאה ב${mode === 'edit' ? 'עדכון' : 'יצירת'} הטורניר`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-[450px] border-2 border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-blue-800">{mode === 'edit' ? "עריכת תחרות" : "יצירת תחרות חדשה"}</CardTitle>
              <CardDescription className="text-blue-600">{mode === 'edit' ? "עדכן את פרטי התחרות" : "הזן את פרטי התחרות החדשה"}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit} dir="rtl">
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name" className="text-blue-700">שם התחרות</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="הזן את שם התחרות"
                required
                className="border-blue-200 focus:border-blue-400"
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="location" className="text-blue-700">מיקום</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="הזן את מיקום התחרות"
                className="border-blue-200 focus:border-blue-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="startDate" className="text-blue-700">תאריך התחלה</Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-500" />
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="pl-8 border-blue-200 focus:border-blue-400"
                    disabled={mode === 'edit'}
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="endDate" className="text-blue-700">תאריך סיום (אופציונלי)</Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-500" />
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

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="price" className="text-blue-700">מחיר השתתפות (ש״ח)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="1"
                value={formData.price}
                onChange={handleChange}
                placeholder="הזן את מחיר ההשתתפות בטורניר"
                className="border-blue-200 focus:border-blue-400"
              />
            </div>

            <div className="flex items-center space-x-4 space-x-reverse">
              <Checkbox 
                id="registrationOpen" 
                checked={Boolean(formData.registrationOpen)}
                onCheckedChange={(checked) => {
                  setFormData({
                    ...formData,
                    registrationOpen: checked === true
                  });
                }}
              />
              <Label htmlFor="registrationOpen" className="text-blue-700">
                פתח להרשמה
              </Label>
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="registrationDeadline" className="text-blue-700">תאריך סיום הרשמה</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-500" />
                <Input
                  id="registrationDeadline"
                  name="registrationDeadline"
                  type="date"
                  value={formData.registrationDeadline}
                  onChange={handleChange}
                  className="pl-8 border-blue-200 focus:border-blue-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>סוג הטורניר</Label>
              <RadioGroup 
                value={formData.format}
                onValueChange={(value) => handleSelectChange('format', value)}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="league"
                    id="league"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="league"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Trophy className="mb-3 h-6 w-6" />
                    <span>ליגה</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="groups_knockout"
                    id="groups_knockout"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="groups_knockout"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Trophy className="mb-3 h-6 w-6" />
                    <span>בתים + נוק-אאוט</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {mode === 'create' && (
              <>
                <div className="space-y-2">
                  <Label className="text-blue-700">אופן הגרלת המשחקים</Label>
                  <RadioGroup
                    value={matchGenerationMode}
                    onValueChange={(value) => setMatchGenerationMode(value as "automatic" | "manual")}
                    className="grid gap-2"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="automatic" id="automatic" />
                      <Label htmlFor="automatic" className="font-normal">
                        אוטומטי (המערכת תגריל את המשחקים)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="manual" id="manual" />
                      <Label htmlFor="manual" className="font-normal">
                        ידני (בחירת זוגות המשחקים באופן ידני)
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  {matchGenerationMode === 'manual' && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                      <p>שים לב: בהגרלה ידנית עליך להגדיר את כל המשחקים בעצמך. המערכת לא תייצר משחקים נוספים באופן אוטומטי.</p>
                    </div>
                  )}
                </div>

                {formData.format === 'league' && (
                  <div className="space-y-2">
                    <Label className="text-blue-700">מספר סיבובים</Label>
                    <RadioGroup
                      value={formData.rounds}
                      onValueChange={(value) => handleSelectChange("rounds", value)}
                      className="grid gap-2"
                    >
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem value="1" id="single" />
                        <Label htmlFor="single" className="font-normal">
                          סיבוב אחד
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem value="2" id="double" />
                        <Label htmlFor="double" className="font-normal">
                          סיבוב כפול
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {formData.format === 'knockout' && (
                  <div className="space-y-2">
                    <Label htmlFor="maxPlayers" className="text-blue-700">מספר שחקנים</Label>
                    <Input
                      id="maxPlayers"
                      name="maxPlayers"
                      type="number"
                      min="2"
                      value={formData.maxPlayers}
                      onChange={handleChange}
                      placeholder="הזן מספר שחקנים"
                      className="border-blue-200 focus:border-blue-400"
                    />
                    <p className="text-xs text-gray-500">מומלץ לבחור 4, 8, 16 או 32 שחקנים לתוצאות מיטביות</p>
                  </div>
                )}

                {formData.format === 'groups_knockout' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="groupCount" className="text-blue-700">מספר בתים</Label>
                      <Input
                        id="groupCount"
                        name="groupCount"
                        type="number"
                        min="2"
                        max="8"
                        value={formData.groupCount}
                        onChange={(e) => {
                          handleChange(e);
                          // Reset group assignments when group count changes
                          const count = parseInt(e.target.value) || 2;
                          const newGroupAssignments: Record<string, string[]> = {};
                          
                          for (let i = 0; i < count; i++) {
                            const groupName = `Group ${String.fromCharCode(65 + i)}`; // Group A, B, C, etc.
                            newGroupAssignments[groupName] = groupAssignments[groupName] || [];
                          }
                          
                          setGroupAssignments(newGroupAssignments);
                        }}
                        placeholder="הזן מספר בתים"
                        className="border-blue-200 focus:border-blue-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="advanceCount" className="text-blue-700">מספר העולים מכל בית</Label>
                      <Input
                        id="advanceCount"
                        name="advanceCount"
                        type="number"
                        min="1"
                        max="4"
                        value={formData.advanceCount}
                        onChange={handleChange}
                        placeholder="הזן מספר העולים מכל בית"
                        className="border-blue-200 focus:border-blue-400"
                      />
                      <p className="text-xs text-gray-500">
                        מספר העולים מכל בית יקבע את מבנה שלב הנוק-אאוט.
                        למשל, עבור 2 בתים עם 2 עולים מכל בית, יתקיים חצי גמר וגמר.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-blue-700">אופן שיבוץ השחקנים לבתים</Label>
                      <RadioGroup
                        value={groupSelectionMode}
                        onValueChange={(value) => setGroupSelectionMode(value as "automatic" | "manual")}
                        className="grid gap-2"
                      >
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <RadioGroupItem value="automatic" id="automatic_groups" />
                          <Label htmlFor="automatic_groups" className="font-normal">
                            אוטומטי (המערכת תשבץ את השחקנים לבתים)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <RadioGroupItem value="manual" id="manual_groups" />
                          <Label htmlFor="manual_groups" className="font-normal">
                            ידני (בחירת שיבוץ השחקנים לבתים באופן ידני)
                          </Label>
                        </div>
                      </RadioGroup>
                      
                      {groupSelectionMode === 'manual' && (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                          <p>שים לב: בשיבוץ ידני עליך לשבץ את כל השחקנים לבתים בעצמך.</p>
                        </div>
                      )}
                    </div>
                    
                    {selectedPlayers.length > 0 && (
                      <div className="space-y-4 mt-4">
                        <Label className="text-blue-700">שיבוץ שחקנים לבתים</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.keys(groupAssignments).map(groupName => (
                            <Card key={groupName} className="overflow-hidden">
                              <CardHeader className="bg-blue-50 py-3">
                                <CardTitle className="text-lg font-semibold text-blue-700">{groupName}</CardTitle>
                              </CardHeader>
                              <CardContent className="p-4">
                                {groupAssignments[groupName].length > 0 ? (
                                  <div className="space-y-2">
                                    {groupAssignments[groupName].map(playerId => {
                                      const player = players.find(p => p.id === playerId);
                                      return (
                                        <div 
                                          key={playerId}
                                          className="flex items-center justify-between p-2 rounded-lg bg-blue-100"
                                        >
                                          <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-blue-500" />
                                            <span>{player?.name || 'Unknown'}</span>
                                          </div>
                                          {groupSelectionMode === 'manual' && (
                                            <Badge 
                                              variant="outline" 
                                              className="cursor-pointer"
                                              onClick={() => {
                                                const updatedAssignments = { ...groupAssignments };
                                                updatedAssignments[groupName] = updatedAssignments[groupName].filter(id => id !== playerId);
                                                setGroupAssignments(updatedAssignments);
                                              }}
                                            >
                                              הסר
                                            </Badge>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-center p-4 text-gray-500">
                                    אין שחקנים בבית זה
                                  </div>
                                )}
                                
                                {groupSelectionMode === 'manual' && (
                                  <div className="mt-4">
                                    <Label className="text-sm mb-2 block">הוסף שחקן לבית זה</Label>
                                    <div className="flex gap-2">
                                      <select 
                                        className="flex-1 p-2 border rounded-md"
                                        id={`add-player-${groupName}`}
                                        aria-label={`הוסף שחקן לבית ${groupName}`}
                                      >
                                        <option value="">בחר שחקן</option>
                                        {selectedPlayers
                                          .filter(playerId => !Object.values(groupAssignments).flat().includes(playerId))
                                          .map(playerId => {
                                            const player = players.find(p => p.id === playerId);
                                            return (
                                              <option key={playerId} value={playerId}>
                                                {player?.name || 'Unknown'}
                                              </option>
                                            );
                                          })}
                                      </select>
                                      <Button 
                                        variant="outline"
                                        onClick={() => {
                                          const select = document.getElementById(`add-player-${groupName}`) as HTMLSelectElement;
                                          if (select && select.value) {
                                            handlePlayerGroupAssignment(select.value, groupName);
                                            select.value = '';
                                          }
                                        }}
                                      >
                                        הוסף
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        
                        {groupSelectionMode === 'manual' && selectedPlayers.some(playerId => !Object.values(groupAssignments).flat().includes(playerId)) && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <h4 className="font-medium text-red-700 mb-2">שחקנים שטרם שובצו לבית:</h4>
                            <div className="space-y-2">
                              {selectedPlayers
                                .filter(playerId => !Object.values(groupAssignments).flat().includes(playerId))
                                .map(playerId => {
                                  const player = players.find(p => p.id === playerId);
                                  return (
                                    <div 
                                      key={playerId}
                                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-red-100"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-red-500" />
                                        <span>{player?.name || 'Unknown'}</span>
                                      </div>
                                      <div className="flex gap-2">
                                        {Object.keys(groupAssignments).map(groupName => (
                                          <Button 
                                            key={groupName}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePlayerGroupAssignment(playerId, groupName)}
                                          >
                                            הוסף ל{groupName}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            
            {mode === 'edit' && (
              <div className="space-y-2">
                <Label className="text-blue-700">פרטי התחרות (לא ניתן לשינוי)</Label>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col border rounded p-2 bg-gray-50">
                    <span className="text-gray-500">פורמט:</span>
                    <span className="font-medium">
                      {formData.format === 'knockout' ? 'נוק-אאוט' : formData.format === 'league' ? 'ליגה' : 'בתים + נוק-אאוט'}
                    </span>
                  </div>
                  {formData.format === 'knockout' && (
                    <div className="flex flex-col border rounded p-2 bg-gray-50">
                      <span className="text-gray-500">מספר שחקנים:</span>
                      <span className="font-medium">{formData.maxPlayers}</span>
                    </div>
                  )}
                  {formData.format === 'league' && (
                    <div className="flex flex-col border rounded p-2 bg-gray-50">
                      <span className="text-gray-500">מספר סיבובים:</span>
                      <span className="font-medium">
                        {formData.rounds === '1' ? 'סיבוב אחד' : 'סיבוב כפול'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-blue-700">בחר שחקנים</Label>
                <Badge variant="secondary">
                  {selectedPlayers.length} {mode === 'edit' ? '' : `/ ${formData.maxPlayers}`}
                </Badge>
              </div>
              
              <Tabs defaultValue="manual" onValueChange={(v) => setSelectionMode(v as "manual" | "auto")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">בחירה ידנית</TabsTrigger>
                  <TabsTrigger value="auto">בחירה לפי רמה</TabsTrigger>
                </TabsList>
                
                <TabsContent value="manual">
                  {/* שחקנים נבחרים - יוצג רק אם יש שחקנים נבחרים */}
                  {selectedPlayers.length > 0 && (
                    <div className="mb-4">
                      <Label className="text-blue-700 mb-2 block">שחקנים נבחרים</Label>
                      <Card className="border border-blue-200">
                        <ScrollArea className="h-24">
                          <div className="p-4 grid gap-2">
                            {players?.filter(player => selectedPlayers.includes(player.id)).map((player) => (
                              <div
                                key={player.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-blue-100"
                                onClick={() => handlePlayerToggle(player.id)}
                              >
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-blue-500" />
                                  <span>{player.name}</span>
                                </div>
                                <Badge variant="outline" className="cursor-pointer">הסר</Badge>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </Card>
                    </div>
                  )}

                  {/* שחקנים זמינים */}
                  <Label className="text-blue-700 mb-2 block">שחקנים זמינים להוספה</Label>
                  <Card className="border border-blue-200">
                    <ScrollArea className="h-48">
                      <div className="p-4 grid gap-2">
                        {players?.filter(player => !selectedPlayers.includes(player.id)).map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer hover:bg-blue-50"
                            onClick={() => handlePlayerToggle(player.id)}
                          >
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-blue-500" />
                              <span>{player.name}</span>
                            </div>
                            <Badge variant="outline">{player.rating}</Badge>
                          </div>
                        ))}
                        {players?.filter(player => !selectedPlayers.includes(player.id)).length === 0 && (
                          <div className="text-center p-4 text-gray-500">
                            כל השחקנים כבר נבחרו
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </Card>
                </TabsContent>
                
                <TabsContent value="auto">
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {Object.keys(playerGroups).map((group) => (
                        <div
                          key={group}
                          className={`p-2 border rounded-md text-center cursor-pointer ${
                            selectedGroups.includes(group) ? 'bg-blue-100 border-blue-300' : 'hover:bg-blue-50'
                          }`}
                          onClick={() => handleGroupToggle(group)}
                        >
                          <span className="text-sm">{group}</span>
                          <Badge variant="secondary" className="mt-1 w-full">
                            {playerGroups[group].filter(player => !selectedPlayers.includes(player.id)).length}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        לחץ על קבוצת רמה כדי להוסיף את כל השחקנים שבה. 
                        <br />
                        רק שחקנים שטרם נבחרו יתווספו לטורניר.
                      </Label>
                      
                      {selectedGroups.length > 0 && (
                        <div className="mt-2">
                          <Card className="border border-blue-200">
                            <ScrollArea className="h-32">
                              <div className="p-4 grid gap-2">
                                {selectedGroups.flatMap(group => 
                                  playerGroups[group]
                                    .filter(player => !selectedPlayers.includes(player.id))
                                    .map(player => (
                                      <div
                                        key={player.id}
                                        className="flex items-center justify-between p-2 rounded-lg"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Users className="h-4 w-4 text-blue-500" />
                                          <span>{player.name}</span>
                                        </div>
                                        <Badge variant="outline">{player.rating}</Badge>
                                      </div>
                                    ))
                                )}
                                {selectedGroups.flatMap(group => 
                                  playerGroups[group].filter(player => !selectedPlayers.includes(player.id))
                                ).length === 0 && (
                                  <div className="text-center p-4 text-gray-500">
                                    כל השחקנים בקבוצות שנבחרו כבר משתתפים בטורניר
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </Card>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {mode === 'create' && matchGenerationMode === 'manual' && selectedPlayers.length >= 2 && (
              <div className="px-6 pb-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-blue-700">הגרלת משחקים ידנית</Label>
                    <Badge variant="secondary">
                      {manualMatches.length} משחקים
                    </Badge>
                  </div>
                  
                  <Card className="border border-blue-200">
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        {manualMatches.map((match, index) => {
                          const player1 = players.find(p => p.id === match.player1Id);
                          const player2 = players.find(p => p.id === match.player2Id);
                          
                          return (
                            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-blue-50">
                              <div className="flex items-center gap-2">
                                <span>{player1?.name}</span>
                                <span className="text-gray-500">נגד</span>
                                <span>{player2?.name}</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setManualMatches(prev => prev.filter((_, i) => i !== index));
                                }}
                              >
                                הסר
                              </Button>
                            </div>
                          );
                        })}
                        
                        {manualMatches.length === 0 && (
                          <div className="text-center p-4 text-gray-500">
                            לא נבחרו משחקים עדיין
                          </div>
                        )}
                        
                        <div className="border-t pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm">שחקן 1</Label>
                              <select 
                                className="w-full p-2 border rounded-md"
                                id="player1"
                                aria-label="בחירת שחקן ראשון"
                                onChange={(e) => {
                                  const select2 = document.getElementById('player2') as HTMLSelectElement;
                                  if (e.target.value === select2.value) {
                                    select2.value = '';
                                  }
                                }}
                              >
                                <option value="">בחר שחקן</option>
                                {selectedPlayers.map(playerId => {
                                  const player = players.find(p => p.id === playerId);
                                  return (
                                    <option key={playerId} value={playerId}>
                                      {player?.name}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">שחקן 2</Label>
                              <select 
                                className="w-full p-2 border rounded-md"
                                id="player2"
                                aria-label="בחירת שחקן שני"
                                onChange={(e) => {
                                  const select1 = document.getElementById('player1') as HTMLSelectElement;
                                  if (e.target.value === select1.value) {
                                    select1.value = '';
                                  }
                                }}
                              >
                                <option value="">בחר שחקן</option>
                                {selectedPlayers.map(playerId => {
                                  const player = players.find(p => p.id === playerId);
                                  return (
                                    <option key={playerId} value={playerId}>
                                      {player?.name}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          </div>
                          
                          <Button 
                            className="w-full mt-4"
                            variant="outline"
                            onClick={() => {
                              const select1 = document.getElementById('player1') as HTMLSelectElement;
                              const select2 = document.getElementById('player2') as HTMLSelectElement;
                              
                              if (!select1.value || !select2.value) {
                                toast({
                                  title: "שגיאה",
                                  description: "יש לבחור שני שחקנים",
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              if (select1.value === select2.value) {
                                toast({
                                  title: "שגיאה",
                                  description: "לא ניתן לבחור את אותו שחקן פעמיים",
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              // Check if this match already exists
                              const matchExists = manualMatches.some(
                                m => (m.player1Id === select1.value && m.player2Id === select2.value) || 
                                     (m.player1Id === select2.value && m.player2Id === select1.value)
                              );
                              
                              if (matchExists) {
                                toast({
                                  title: "שגיאה",
                                  description: "משחק זה כבר קיים",
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              setManualMatches(prev => [
                                ...prev, 
                                { player1Id: select1.value, player2Id: select2.value }
                              ]);
                              
                              // Reset selections
                              select1.value = '';
                              select2.value = '';
                            }}
                          >
                            הוסף משחק
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>{mode === 'edit' ? 'מעדכן טורניר...' : 'יוצר טורניר...'}</span>
                </div>
              ) : (
                mode === 'edit' ? 'עדכן טורניר' : 'צור טורניר'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 