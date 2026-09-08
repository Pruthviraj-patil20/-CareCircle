"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createFamily } from "@/actions/family";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export function CreateFamilyDialog({
  children,
  nativeButton,
}: {
  children: React.ReactNode;
  nativeButton?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    startTransition(() => {
      createFamily(values.name, values.description)
        .then((data) => {
          if (data.success) {
            toast.success(data.success);
            setOpen(false);
            form.reset();
          }
        })
        .catch((e) => toast.error(e.message || "Failed to create family"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={nativeButton}
        render={children as React.ReactElement}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Family</DialogTitle>
          <DialogDescription>
            Set up a new space to coordinate care and responsibilities.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Family Name</Label>
            <Input id="name" disabled={isPending} {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input id="description" disabled={isPending} {...form.register("description")} />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating..." : "Create Family"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
