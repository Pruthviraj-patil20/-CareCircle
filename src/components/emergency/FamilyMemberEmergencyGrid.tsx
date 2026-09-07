"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, Users } from "lucide-react";
import { FamilyMemberEmergencyContact } from "@/types/emergency";

interface FamilyMemberEmergencyGridProps {
  members: FamilyMemberEmergencyContact[];
}

export function FamilyMemberEmergencyGrid({ members }: FamilyMemberEmergencyGridProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Family Members Immediate Contact
        </h3>
        <span className="text-[11px] text-muted-foreground">{members.length} members</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {members.map((member) => (
          <Card key={member.id} className="border bg-card shadow-2xs">
            <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={member.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {member.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{member.name || "Member"}</p>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize text-muted-foreground">
                    {member.role.toLowerCase()}
                  </Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                {member.phone ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs gap-1.5 text-primary hover:text-primary-foreground hover:bg-primary"
                    render={
                      <a href={`tel:${member.phone.replace(/[^0-9+]/g, "")}`}>
                        <Phone className="h-3.5 w-3.5" />
                        <span>Call</span>
                      </a>
                    }
                  />
                ) : member.email ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                    render={
                      <a href={`mailto:${member.email}`}>
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">Email</span>
                      </a>
                    }
                  />
                ) : (
                  <span className="text-[11px] text-muted-foreground italic">No phone or email set</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
