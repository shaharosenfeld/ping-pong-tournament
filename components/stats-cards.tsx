import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Trophy, Users, Table, BarChart } from "lucide-react"

interface Stats {
  activeTournaments: number
  totalPlayers: number
  totalMatches: number
  averageRating: number
}

export const StatsCards = ({ stats }: { stats: Stats }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">טורנירים פעילים</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeTournaments}</div>
          <p className="text-xs text-muted-foreground">טורנירים מתנהלים כרגע</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">שחקנים רשומים</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPlayers}</div>
          <p className="text-xs text-muted-foreground">סה"כ שחקנים במערכת</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">משחקים</CardTitle>
          <Table className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalMatches}</div>
          <p className="text-xs text-muted-foreground">סה"כ משחקים שהתקיימו</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">דירוג ממוצע</CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">ממוצע דירוג השחקנים</p>
        </CardContent>
      </Card>
    </div>
  )
} 