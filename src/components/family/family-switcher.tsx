"use client";

import { Family } from "@prisma/client";
import { setActiveFamily } from "@/actions/family";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateFamilyDialog } from "./create-family-dialog";
import { PlusCircle } from "lucide-react";
import { useTransition } from "react";

interface FamilySwitcherProps {
  families: { family: Pick<Family, "id" | "name"> }[];
  activeFamilyId?: string;
}

export function FamilySwitcher({ families, activeFamilyId }: FamilySwitcherProps) {
  const [isPending, startTransition] = useTransition();

  const handleValueChange = (val: string | null) => {
    if (!val || val === "create_new") return; // Handled by dialog trigger
    startTransition(() => {
      setActiveFamily(val);
    });
  };

  return (
    <div className="w-full">
      <Select
        value={activeFamilyId}
        onValueChange={handleValueChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-full font-medium">
          <SelectValue placeholder="Select a family" />
        </SelectTrigger>
        <SelectContent>
          {families.map((f) => (
            <SelectItem key={f.family.id} value={f.family.id}>
              {f.family.name}
            </SelectItem>
          ))}
          <CreateFamilyDialog>
            <button
              type="button"
              className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-left"
            >
              <PlusCircle className="absolute left-2 flex h-4 w-4 items-center justify-center" />
              <span>Create Family</span>
            </button>
          </CreateFamilyDialog>
        </SelectContent>
      </Select>
    </div>
  );
}
