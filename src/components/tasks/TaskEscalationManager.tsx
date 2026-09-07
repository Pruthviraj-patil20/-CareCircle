"use client";

import { useState, useTransition } from "react";
// Bypassing IDE cache issues for newly generated Prisma types
type TaskEscalation = {
  id: string;
  taskId: string;
  afterMinutes: number;
  notifyUserId: string;
  channel: "EMAIL" | "IN_APP" | "BOTH";
  createdAt: Date;
};
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addEscalationRule, deleteEscalationRule } from "@/actions/escalations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Member = { id: string; name: string | null; email: string | null; image: string | null };

interface TaskEscalationManagerProps {
  taskId: string;
  members: Member[];
  initialRules: TaskEscalation[];
  taskStatus: string;
}

export function TaskEscalationManager({ taskId, members, initialRules, taskStatus }: TaskEscalationManagerProps) {
  const [rules, setRules] = useState<TaskEscalation[]>(initialRules);
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [afterMinutes, setAfterMinutes] = useState("60");
  const [notifyUserId, setNotifyUserId] = useState(members[0]?.id || "");
  const [channel, setChannel] = useState<"EMAIL" | "IN_APP" | "BOTH">("BOTH");

  const isCompleted = taskStatus === "COMPLETED" || taskStatus === "CANCELLED";

  const handleAddRule = () => {
    if (!afterMinutes || !notifyUserId || isNaN(Number(afterMinutes))) {
      toast.error("Please provide valid inputs");
      return;
    }

    startTransition(async () => {
      try {
        const res = await addEscalationRule(taskId, parseInt(afterMinutes), notifyUserId, channel);
        if (res.success && res.rule) {
          setRules(prev => [...prev, res.rule].sort((a, b) => a.afterMinutes - b.afterMinutes));
          setIsAdding(false);
          toast.success("Escalation rule added");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to add rule");
      }
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    startTransition(async () => {
      try {
        const res = await deleteEscalationRule(ruleId, taskId);
        if (res.success) {
          setRules(prev => prev.filter(r => r.id !== ruleId));
          toast.success("Rule removed");
        }
      } catch (err: any) {
        toast.error("Failed to delete rule");
      }
    });
  };

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins} minutes`;
    if (mins === 60) return `1 hour`;
    if (mins % 60 === 0) return `${mins / 60} hours`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Escalation Path</CardTitle>
            <CardDescription>Automatically notify others if this task is overdue.</CardDescription>
          </div>
          {!isCompleted && (
            <Button variant="outline" size="sm" onClick={() => setIsAdding(!isAdding)} disabled={isPending}>
              {isAdding ? "Cancel" : <><Plus className="h-4 w-4 mr-1" /> Add Rule</>}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isCompleted && rules.length > 0 && (
          <div className="mb-4 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
            <AlertCircle className="h-4 w-4" />
            Task is complete or cancelled. Escalations will not fire.
          </div>
        )}

        {isAdding && (
          <div className="bg-muted/50 p-4 rounded-lg border mb-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>After Due Date</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    min="1" 
                    value={afterMinutes} 
                    onChange={e => setAfterMinutes(e.target.value)} 
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notify Member</Label>
                <Select value={notifyUserId} onValueChange={(val: any) => setNotifyUserId(val || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Delivery Channel</Label>
                <Select value={channel} onValueChange={(val: any) => setChannel(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_APP">In-App Notification Only</SelectItem>
                    <SelectItem value="EMAIL">Email Only</SelectItem>
                    <SelectItem value="BOTH">Email & In-App</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={handleAddRule} disabled={isPending} className="w-full sm:w-auto">
              Save Rule
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {rules.length === 0 && !isAdding ? (
            <p className="text-sm text-muted-foreground py-2 text-center">No escalation rules configured.</p>
          ) : (
            rules.map((rule, index) => {
              const member = members.find(m => m.id === rule.notifyUserId);
              return (
                <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40"></div>
                  
                  <div className="flex items-center gap-4 pl-2">
                    <div className="flex flex-col items-center justify-center bg-muted h-10 w-10 rounded-full text-xs font-bold text-muted-foreground">
                      #{index + 1}
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        Wait <span className="text-primary font-bold">{formatMinutes(rule.afterMinutes)}</span>, then notify
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={member?.image || ""} />
                          <AvatarFallback className="text-[10px]">{member?.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{member?.name || "Unknown"}</span>
                        <span className="text-[10px] uppercase bg-secondary px-1.5 py-0.5 rounded ml-2">{rule.channel}</span>
                      </div>
                    </div>
                  </div>

                  {!isCompleted && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteRule(rule.id)}
                      disabled={isPending}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
