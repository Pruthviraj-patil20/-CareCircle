import { Users, Crown, Shield, User, Heart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface FamilyMemberData {
  id: string
  role: string
  user: {
    id: string
    name: string | null
    image: string | null
    email: string | null
  }
}

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; variant: string }> = {
  OWNER: { label: "Owner", icon: Crown, variant: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  ADMIN: { label: "Admin", icon: Shield, variant: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  MEMBER: { label: "Member", icon: User, variant: "bg-muted text-muted-foreground" },
  CAREGIVER: { label: "Caregiver", icon: Heart, variant: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20" },
}

function getInitials(name: string | null) {
  if (!name) return "?"
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

export function FamilyMembers({ members }: { members: FamilyMemberData[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Family Members</CardTitle>
        <Link href="/dashboard/members" className="text-xs text-primary hover:underline">
          Manage
        </Link>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No members yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.slice(0, 6).map((member) => {
              const config = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.MEMBER
              const RoleIcon = config.icon
              return (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar size="default">
                    <AvatarImage src={member.user.image ?? undefined} />
                    <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.user.name ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] gap-1 shrink-0 ${config.variant}`}>
                    <RoleIcon className="h-2.5 w-2.5" />
                    {config.label}
                  </Badge>
                </div>
              )
            })}
            {members.length > 6 && (
              <Link href="/dashboard/members" className="block text-center text-xs text-primary hover:underline pt-1">
                +{members.length - 6} more members
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function FamilyMembersSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="h-4 w-28 bg-muted rounded" />
        <div className="h-3 w-12 bg-muted rounded" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
            <div className="h-4 w-16 bg-muted rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
