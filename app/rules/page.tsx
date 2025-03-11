"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion"
import {
  Trophy,
  Users,
  Star,
  Award,
  Table as TableIcon,
  Medal,
  Swords,
  Calculator,
  TrendingUp,
  HelpCircle,
  BadgeInfo,
  Flame,
  Crown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export default function RulesPage() {
  const [activeTab, setActiveTab] = useState("rating")
  const [sampleRating, setSampleRating] = useState(1000)
  const [showWinAnimation, setShowWinAnimation] = useState(false)
  
  const incrementRating = () => {
    setSampleRating(prev => {
      const newValue = prev + 25
      if (newValue > 1200) {
        setShowWinAnimation(true)
        setTimeout(() => setShowWinAnimation(false), 2000)
      }
      return newValue
    })
  }
  
  const decrementRating = () => {
    setSampleRating(prev => Math.max(800, prev - 15))
  }
  
  const getLevelFromRating = (rating: number) => {
    // הדגמה של האחוזונים באמצעות מערך דירוגים לדוגמה
    const sampleRatings = [800, 850, 900, 950, 980, 1000, 1020, 1050, 1080, 1100, 1150, 1200, 1250, 1300, 1350];
    
    // מיון הרשימה
    const sortedRatings = [...sampleRatings, rating].sort((a, b) => a - b);
    
    // מציאת המיקום של הדירוג
    const position = sortedRatings.indexOf(rating);
    
    // חישוב האחוזון (0-100)
    const percentile = (position / sortedRatings.length) * 100;
    
    // קביעת הרמה לפי האחוזון החדש
    if (percentile >= 80) return 5; // 20% עליונים
    if (percentile >= 60) return 4; // 20% הבאים
    if (percentile >= 40) return 3; // 20% הבאים
    if (percentile >= 20) return 2; // 20% הבאים
    return 1; // 20% תחתונים
  }
  
  const level = getLevelFromRating(sampleRating)
  
  return (
    <div className="container py-8">
      <div className="flex flex-col max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-center text-blue-800 mb-8">חוקי הדירוג ושיטות משחק</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 max-w-lg mx-auto">
            <TabsTrigger value="rating" className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              <span>שיטת הדירוג</span>
            </TabsTrigger>
            <TabsTrigger value="tournaments" className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              <span>סוגי טורנירים</span>
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-1">
              <BadgeInfo className="h-4 w-4" />
              <span>חוקי המשחק</span>
            </TabsTrigger>
          </TabsList>
          
          {/* שיטת הדירוג */}
          <TabsContent value="rating" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <Award className="h-6 w-6 text-yellow-500 mr-2" />
                  שיטת דירוג השחקנים
                </CardTitle>
                <CardDescription>
                  מערכת הדירוג שלנו מבוססת על שיטת ELO המותאמת לטורנירי פינג פונג
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-700">
                  כל שחקן חדש מתחיל עם דירוג בסיסי של 1000 נקודות. לאחר כל משחק, הדירוג מתעדכן לפי התוצאה: 
                  ניצחון מעלה את הדירוג והפסד מוריד אותו. כמות הנקודות שניתנת או נלקחת תלויה בהפרש הדירוג בין השחקנים.
                </p>
                
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
                  <h3 className="text-lg font-bold text-blue-800 mb-4">נסה בעצמך!</h3>
                  
                  <div className="bg-white rounded-xl p-6 shadow-sm relative overflow-hidden">
                    {showWinAnimation && (
                      <div className="absolute inset-0 bg-yellow-100 bg-opacity-40 animate-pulse flex items-center justify-center">
                        <div className="text-2xl font-bold text-yellow-600 animate-bounce flex items-center">
                          <Crown className="h-8 w-8 mr-2 text-yellow-500" />
                          עלית רמה!
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col items-center mb-6">
                      <Avatar className={cn(
                        "h-20 w-20 border-4 mb-3 transition-all duration-300",
                        level >= 4 ? "border-yellow-400" : 
                        level >= 3 ? "border-blue-400" : 
                        "border-gray-200"
                      )}>
                        <AvatarFallback className="bg-blue-500 text-white text-lg">
                          דג
                        </AvatarFallback>
                      </Avatar>
                      
                      <h4 className="text-xl font-bold">הדירוג שלך: {sampleRating}</h4>
                      
                      <div className="flex items-center gap-1 mt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-5 w-5 transition-all",
                              i < level ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                            )}
                          />
                        ))}
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-500">רמה {level}</div>
                    </div>
                    
                    <div className="flex justify-center gap-4 mt-4">
                      <Button
                        variant="outline" 
                        className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
                        onClick={incrementRating}
                      >
                        <TrendingUp className="h-4 w-4" />
                        ניצחון (+25)
                      </Button>
                      
                      <Button
                        variant="outline" 
                        className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50"
                        onClick={decrementRating}
                      >
                        <TrendingUp className="h-4 w-4 rotate-180" />
                        הפסד (-15)
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="rating-calculation">
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center">
                        <Calculator className="h-5 w-5 mr-2 text-blue-600" />
                        איך מחושב הדירוג?
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 space-y-2">
                      <p>נוסחת הדירוג המלאה:</p>
                      <div className="bg-gray-50 p-4 rounded-md font-mono text-sm">
                        <div>נצפה = 1 / (1 + 10^((דירוג_יריב - דירוג_שחקן) / 400))</div>
                        <div>שינוי = K * (תוצאה - נצפה)</div>
                        <div>דירוג_חדש = דירוג_ישן + שינוי</div>
                      </div>
                      
                      <p className="mt-2">
                        <strong>K</strong> הוא מקדם המשקל של המשחק:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>K=32 למשחקים רגילים</li>
                        <li>K=48 למשחקים בטורניר</li>
                        <li>K=64 למשחקי גמר בטורניר</li>
                      </ul>
                      
                      <p className="mt-2">
                        <strong>תוצאה</strong> היא 1 עבור ניצחון ו-0 עבור הפסד.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="levels">
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center">
                        <Medal className="h-5 w-5 mr-2 text-yellow-600" />
                        רמות השחקנים
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700">
                      <div className="space-y-4">
                        <p>
                          <span className="font-bold">חדש!</span> המערכת משתמשת כעת בשיטת <span className="font-bold text-blue-600">אחוזונים דינמיים</span> לקביעת רמת השחקנים.
                          שיטה זו מבטיחה שהדירוג יהיה יחסי תמיד לכלל השחקנים במערכת, ויתעדכן באופן אוטומטי כאשר:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>שחקנים חדשים מצטרפים למערכת</li>
                          <li>שחקנים קיימים משפרים את הדירוג שלהם</li>
                          <li>מתקיימים משחקים ותוצאותיהם משנות את התפלגות הדירוגים</li>
                        </ul>
                        
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-bold mb-2">חלוקת הרמות לפי אחוזונים:</h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-4">
                              <div className="flex">
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                              </div>
                              <div>
                                <div className="font-bold">רמה 1</div>
                                <div className="text-sm text-gray-600">20% תחתונים - שחקן מתחיל חדש</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="flex">
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                              </div>
                              <div>
                                <div className="font-bold">רמה 2</div>
                                <div className="text-sm text-gray-600">21%-40% - שחקן מתחיל</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="flex">
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                              </div>
                              <div>
                                <div className="font-bold">רמה 3</div>
                                <div className="text-sm text-gray-600">41%-60% - שחקן בינוני</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="flex">
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                              </div>
                              <div>
                                <div className="font-bold">רמה 4</div>
                                <div className="text-sm text-gray-600">61%-80% - שחקן מתקדם</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="flex">
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                              </div>
                              <div>
                                <div className="font-bold">רמה 5</div>
                                <div className="text-sm text-gray-600">81% ומעלה - שחקן מקצועי</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-500 italic mt-2">
                          * שים לב: הרמה שלך יכולה להשתנות גם אם הדירוג שלך לא השתנה, וזאת בעקבות שינויים בדירוגים של שחקנים אחרים.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* סוגי טורנירים */}
          <TabsContent value="tournaments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
                  סוגי טורנירים
                </CardTitle>
                <CardDescription>
                  המערכת תומכת במספר שיטות משחק לטורנירים
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
                    <div className="flex items-center gap-2 text-xl font-bold text-blue-800 mb-3">
                      <TableIcon className="h-6 w-6 text-blue-600" />
                      <span>ליגה (League)</span>
                    </div>
                    <p className="text-gray-700 mb-3">
                      בשיטת ליגה, כל שחקן משחק נגד כל שחקן אחר. 
                      מנצח הטורניר הוא השחקן שצבר את הכי הרבה ניצחונות.
                    </p>
                    <div className="text-sm text-gray-500">
                      <div className="mb-1"><strong>יתרונות:</strong> כל שחקן מקבל מספר רב של משחקים</div>
                      <div><strong>חסרונות:</strong> דורש זמן רב יותר עבור טורנירים גדולים</div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg border border-green-200 shadow-sm">
                    <div className="flex items-center gap-2 text-xl font-bold text-green-800 mb-3">
                      <Trophy className="h-6 w-6 text-green-600" />
                      <span>נוק-אאוט (Knockout)</span>
                    </div>
                    <p className="text-gray-700 mb-3">
                      בשיטת נוק-אאוט, המפסיד יוצא מהתחרות והמנצח מתקדם לשלב הבא.
                      יעיל במיוחד עבור טורנירים עם מספר גדול של שחקנים.
                    </p>
                    <div className="text-sm text-gray-500">
                      <div className="mb-1"><strong>יתרונות:</strong> מהיר ואינטנסיבי</div>
                      <div><strong>חסרונות:</strong> שחקנים עלולים לשחק רק משחק אחד</div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg border border-purple-200 shadow-sm">
                    <div className="flex items-center gap-2 text-xl font-bold text-purple-800 mb-3">
                      <Users className="h-6 w-6 text-purple-600" />
                      <span>בתים + נוק-אאוט (Groups + Knockout)</span>
                    </div>
                    <p className="text-gray-700 mb-3">
                      שיטה משולבת: השחקנים מחולקים לבתים, ומשחקים ליגה בתוך כל בית.
                      המובילים בכל בית עולים לשלב הנוק-אאוט.
                    </p>
                    <div className="text-sm text-gray-500">
                      <div className="mb-1"><strong>יתרונות:</strong> מאזן בין משחקים רבים והכרעה מהירה</div>
                      <div><strong>חסרונות:</strong> מורכב יותר לניהול</div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg border border-amber-200 shadow-sm">
                    <div className="flex items-center gap-2 text-xl font-bold text-amber-800 mb-3">
                      <Flame className="h-6 w-6 text-amber-600" />
                      <span>משחק הטוב מ-3 (Best of 3)</span>
                    </div>
                    <p className="text-gray-700 mb-3">
                      אפשרות להפעלה בכל סוגי הטורנירים, כאשר הניצחון במשחק נקבע לפי 
                      שחקן שמנצח 2 מתוך 3 משחקונים.
                    </p>
                    <div className="text-sm text-gray-500">
                      <div className="mb-1"><strong>יתרונות:</strong> מפחית את גורם המזל</div>
                      <div><strong>חסרונות:</strong> דורש זמן משחק ארוך יותר</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-bold text-blue-800 mb-3">חישוב דירוג בטורנירים</h3>
                  <p className="text-gray-700 mb-3">
                    ניצחונות בטורנירים מזכים בנקודות דירוג גבוהות יותר מאשר משחקים רגילים:
                  </p>
                  
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>משחקים בשלבי טורניר: 48 נקודות K-factor (במקום 32)</li>
                    <li>משחקים בשלב הגמר: 64 נקודות K-factor</li>
                    <li>שחקן שמסיים טורניר במקום הראשון: בונוס של 50 נקודות</li>
                    <li>שחקן שמסיים טורניר במקום השני: בונוס של 25 נקודות</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* חוקי המשחק */}
          <TabsContent value="rules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <Swords className="h-6 w-6 text-blue-500 mr-2" />
                  חוקי פינג פונג בסיסיים
                </CardTitle>
                <CardDescription>
                  חוקי המשחק הרשמיים בטורנירי פינג פונג
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="basic-rules">
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center">
                        <BadgeInfo className="h-5 w-5 mr-2 text-blue-600" />
                        חוקי משחק בסיסיים
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 space-y-4">
                      <div className="bg-blue-50 rounded-md p-4 mb-4">
                        <p className="text-sm text-blue-600 font-medium mb-2">במערכת ניתן לשחק בשתי שיטות ניקוד שונות:</p>
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">11</div>
                          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">21</div>
                        </div>
                      </div>
                      
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <h4 className="text-base font-bold text-blue-700 mb-3 flex items-center">
                            <div className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mr-2">11</div>
                            משחקים עד 11 נקודות
                          </h4>
                          <ul className="space-y-2 list-disc list-inside text-sm">
                            <li>משחק מסתיים כאשר שחקן מגיע ל-11 נקודות עם יתרון של לפחות 2 נקודות</li>
                            <li>כל שחקן מגיש 2 הגשות ברצף ואז ההגשה עוברת ליריב</li>
                            <li>אם התוצאה מגיעה ל-10:10, כל שחקן מגיש הגשה אחת לסירוגין</li>
                            <li>זוהי השיטה התחרותית הרשמית של איגוד טניס השולחן העולמי (ITTF)</li>
                            <li>טורנירים רשמיים משוחקים בשיטה זו</li>
                          </ul>
                        </div>
                        
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                          <h4 className="text-base font-bold text-green-700 mb-3 flex items-center">
                            <div className="bg-green-100 text-green-800 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mr-2">21</div>
                            משחקים עד 21 נקודות
                          </h4>
                          <ul className="space-y-2 list-disc list-inside text-sm">
                            <li>משחק מסתיים כאשר שחקן מגיע ל-21 נקודות עם יתרון של לפחות 2 נקודות</li>
                            <li>כל שחקן מגיש 5 הגשות ברצף ואז ההגשה עוברת ליריב</li>
                            <li>אם התוצאה מגיעה ל-20:20, כל שחקן מגיש הגשה אחת לסירוגין</li>
                            <li>שיטה מסורתית ופופולרית במשחקי פנאי</li>
                            <li>משחקים ארוכים יותר ומתאימים למשחקי אימון</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                        <h4 className="text-base font-bold text-gray-700 mb-2">חוקים משותפים לשתי השיטות:</h4>
                        <ul className="space-y-2 list-disc list-inside">
                          <li>הזוכה בהטלת המטבע בוחר אם להגיש ראשון או באיזה צד לשחק</li>
                          <li>יש להחליף צדדים לאחר כל משחקון בסדרה</li>
                          <li>המנצח הוא זה שמגיע ראשון ליעד הנקודות עם יתרון של 2 לפחות</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="serving">
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center">
                        <BadgeInfo className="h-5 w-5 mr-2 text-blue-600" />
                        חוקי הגשה
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 space-y-2">
                      <ul className="space-y-2 list-disc list-inside">
                        <li>הכדור חייב להיות מוחזק על כף היד הפתוחה</li>
                        <li>יש לזרוק את הכדור באנכית לפחות 16 ס"מ</li>
                        <li>אסור להסתיר את הכדור מהיריב בזמן ההגשה</li>
                        <li>הכדור חייב לפגוע קודם בצד של המגיש ואז בצד של היריב</li>
                        <li>אם הכדור נוגע ברשת אך עובר לצד השני בצורה תקינה, יש לחזור על ההגשה</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="scoring">
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center">
                        <BadgeInfo className="h-5 w-5 mr-2 text-blue-600" />
                        שיטת ניקוד
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 space-y-2">
                      <ul className="space-y-2 list-disc list-inside">
                        <li>שחקן מקבל נקודה כאשר היריב מבצע שגיאה:</li>
                        <li className="list-inside ml-4">לא מצליח להחזיר את הכדור</li>
                        <li className="list-inside ml-4">הכדור פוגע ברשת ולא עובר לצד השני</li>
                        <li className="list-inside ml-4">הכדור נוגע בשולחן פעמיים בצד שלו</li>
                        <li className="list-inside ml-4">השחקן נוגע בשולחן או מזיז אותו בזמן המשחק</li>
                        <li className="list-inside ml-4">השחקן נוגע ברשת בזמן המשחק</li>
                        <li>המשחק מתנהל בשיטת "כל נקודה סופרת" (point-a-rally)</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="equipment">
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center">
                        <BadgeInfo className="h-5 w-5 mr-2 text-blue-600" />
                        ציוד תקני
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 space-y-2">
                      <ul className="space-y-2 list-disc list-inside">
                        <li>המחבט חייב להיות בצבע שונה בכל צד (בדרך כלל אדום ושחור)</li>
                        <li>הכדור חייב להיות בקוטר של 40 מ"מ</li>
                        <li>הכדור חייב להיות בצבע לבן או כתום (במשחקים רשמיים)</li>
                        <li>שולחן במידות 2.74 מ' אורך, 1.525 מ' רוחב, וגובה 76 ס"מ</li>
                        <li>רשת בגובה 15.25 ס"מ</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="tournaments-rules">
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center">
                        <BadgeInfo className="h-5 w-5 mr-2 text-blue-600" />
                        חוקים נוספים לטורנירים
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 space-y-2">
                      <ul className="space-y-2 list-disc list-inside">
                        <li>זמן חימום מוגבל ל-2 דקות לפני תחילת המשחק</li>
                        <li>מותר לקחת פסק זמן אחד של דקה אחת במהלך משחק</li>
                        <li>מותר להחליף מחבט רק אם נשבר במהלך המשחק</li>
                        <li>אסור לייעץ לשחקנים במהלך המשחק, למעט בזמן פסק זמן</li>
                        <li>יש להתנהג בספורטיביות ולכבד את החלטות השופט</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
                <div className="mt-4 flex justify-center">
                  <Button 
                    variant="default" 
                    className="gap-2"
                    onClick={() => window.open("https://www.ittf.com/handbook/", "_blank")}
                  >
                    <HelpCircle className="h-4 w-4" />
                    לחוקים הרשמיים המלאים
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 