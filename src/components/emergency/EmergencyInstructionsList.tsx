"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Heart,
  Home,
  Navigation,
  Lock,
  MoreVertical,
  Trash2,
  Edit3,
  AlertTriangle,
  Info,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { EmergencyInstructionItem } from "@/types/emergency";
import { deleteEmergencyInstruction } from "@/actions/emergency";
import { CreateInstructionDialog } from "./CreateInstructionDialog";
import { EditInstructionDialog } from "./EditInstructionDialog";

interface EmergencyInstructionsListProps {
  instructions: EmergencyInstructionItem[];
  isFamilyAdmin: boolean;
}

const CATEGORY_MAP: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  MEDICAL: { label: "Medical Protocol", icon: Heart, color: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800" },
  HOME_SAFETY: { label: "Home Safety", icon: Home, color: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800" },
  EVACUATION: { label: "Evacuation Plan", icon: Navigation, color: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800" },
  GENERAL: { label: "General Protocol", icon: Info, color: "bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800" },
};

export function EmergencyInstructionsList({
  instructions,
  isFamilyAdmin,
}: EmergencyInstructionsListProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedInstruction, setSelectedInstruction] = useState<EmergencyInstructionItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDelete = () => {
    if (!selectedInstruction) return;
    startTransition(async () => {
      try {
        await deleteEmergencyInstruction(selectedInstruction.id);
        toast.success("Protocol deleted");
        setDeleteOpen(false);
        setSelectedInstruction(null);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to delete protocol");
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          Critical Emergency Instructions & Protocols
        </h3>
        {isFamilyAdmin && <CreateInstructionDialog />}
      </div>

      {instructions.length === 0 ? (
        <Card className="border border-dashed bg-muted/10 p-6 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">No emergency instructions added yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Document gas shutoffs, severe allergy treatments, emergency bag locations, or disaster rendezvous spots.
          </p>
          {isFamilyAdmin && (
            <div className="mt-4">
              <CreateInstructionDialog />
            </div>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {instructions.map((ins) => {
            const cat = CATEGORY_MAP[ins.category] || CATEGORY_MAP.GENERAL;
            const CatIcon = cat.icon;

            return (
              <Card key={ins.id} className="border bg-card shadow-2xs hover:shadow-xs transition-shadow">
                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-xs px-2 py-0.5 font-medium border flex items-center gap-1.5 ${cat.color}`}>
                      <CatIcon className="h-3.5 w-3.5" />
                      {cat.label}
                    </Badge>
                    {ins.isSensitive && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Admin Only
                      </Badge>
                    )}
                  </div>

                  {isFamilyAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedInstruction(ins);
                            setEditOpen(true);
                          }}
                          className="cursor-pointer"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Protocol
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedInstruction(ins);
                            setDeleteOpen(true);
                          }}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Protocol
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </CardHeader>

                <CardContent className="p-4 pt-1 space-y-2">
                  <h4 className="font-bold text-sm text-foreground">{ins.title}</h4>
                  <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {ins.content}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {selectedInstruction && (
        <EditInstructionDialog
          instruction={selectedInstruction}
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setSelectedInstruction(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Protocol?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{selectedInstruction?.title}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete Protocol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
