import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Match {
  id: string
  player1: { name: string }
  player2: { name: string }
  tournament: { name: string }
  date: string
  player1Score?: number
  player2Score?: number
  status: string
}

interface RecentActivitiesProps {
  activities: Match[]
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  return (
    <div className="space-y-8">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {activity.player1.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="mr-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {activity.player1.name} נגד {activity.player2.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {activity.tournament.name} - {new Date(activity.date).toLocaleDateString('he-IL')}
            </p>
            {activity.status === 'completed' && activity.player1Score !== undefined && activity.player2Score !== undefined && (
              <p className="text-sm text-muted-foreground">
                תוצאה: {activity.player1Score} - {activity.player2Score}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
} 