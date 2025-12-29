"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";

import { PlusIcon } from "lucide-react";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { workspaceSchema, type WorkspaceSchemaType } from "@/app/schemas/workspace";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";
import { isDefinedError } from "@orpc/client";

export function CreateWorkspace() {
  const [openDialog, setDialogOpen] = React.useState(false);

  const queryClient = useQueryClient();

  const form = useForm<WorkspaceSchemaType>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: "" },
  });

  const createWorkspaceMutation = useMutation(
    orpc.workspace.create.mutationOptions({
      onSuccess: (newWorkspace) => {
        toast.success(`Workspace "${newWorkspace.workspaceName}" created successfully!`);

        queryClient.invalidateQueries({ queryKey: orpc.workspace.list.queryKey() });

        form.reset();
        setDialogOpen(false);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          if (error.code === "RATE_LIMITER") {
            toast.error("Rate limit exceeded. Please try again later.");
          } else if (error.code === "FORBIDDEN") {
            toast.error("You do not have permission to create a workspace.");
          } else {
            toast.error(error.message);
          }

          return;
        }

        toast.error("Failed to create workspace due to an unexpected error.");
      },
    })
  );

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && createWorkspaceMutation.isPending) {
      // Prevent closing the dialog while mutation is in progress
      return;
    }

    setDialogOpen(isOpen);
  };

  const onSubmit = (data: WorkspaceSchemaType) => {
    createWorkspaceMutation.mutate(data);
  };

  return (
    // disabled dialog close when mutation is in progress
    <Dialog open={openDialog} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-12 rounded-xl border-2 border-dashed border-muted-foreground/50 text-muted-foreground hover:border-muted-foreground hover:rounded-lg transition-all dureation-200"
            >
              <PlusIcon className="size-5" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>

        <TooltipContent side="right">
          <p>Create Workspace</p>
        </TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
          <DialogDescription>Please enter the name of the new workspace.</DialogDescription>
        </DialogHeader>

        <form id="form-create-workspace" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-create-workspace-name">Workspace Name</FieldLabel>
                  <Input
                    {...field}
                    id="form-create-workspace-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="My New Workspace"
                    autoComplete="off"
                    disabled={createWorkspaceMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <Field orientation="horizontal" className="justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createWorkspaceMutation.isPending}
            >
              Cancel
            </Button>

            <Button type="submit" form="form-create-workspace" disabled={createWorkspaceMutation.isPending}>
              {createWorkspaceMutation.isPending ? "Creating..." : "Create Workspace"}
            </Button>
          </Field>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
