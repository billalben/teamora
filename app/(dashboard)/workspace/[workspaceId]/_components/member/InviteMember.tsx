import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteMemberSchema, InviteMemberSchemaType } from "@/app/schemas/member";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";
import { useWorkspaceRealtime } from "@/providers/WorkspaceRealtimeProvider";

type InviteMemberProps = {
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function InviteMember({ trigger, open, onOpenChange }: InviteMemberProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isModalOpen = isControlled ? open : internalOpen;

  const queryClient = useQueryClient();
  const { sendEvent } = useWorkspaceRealtime();

  const form = useForm<InviteMemberSchemaType>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: "" },
  });

  const inviteMutation = useMutation(
    orpc.workspace.member.invite.mutationOptions({
      onSuccess: ({ userId }) => {
        toast.success("Member added successfully!");
        form.reset();
        setOpen(false);

        sendEvent({ type: "member:joined", payload: { userId } });

        // Refresh the member lists shown in the header popover and the sidebar.
        queryClient.invalidateQueries({ queryKey: orpc.workspace.member.list.queryKey() });
        queryClient.invalidateQueries({ queryKey: orpc.workspace.member.activity.queryKey({ input: {} }) });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setInternalOpen(next);
    }

    onOpenChange?.(next);
  };

  const handleOpenChange = (next: boolean) => {
    // Prevent closing while the request is in flight (covers the X button, outside click and Escape).
    if (!next && inviteMutation.isPending) {
      return;
    }

    setOpen(next);

    if (!next) {
      form.reset();
    }
  };

  const onSubmit = (values: InviteMemberSchemaType) => {
    inviteMutation.mutate(values);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange} disablePointerDismissal={inviteMutation.isPending}>
      {trigger && <DialogTrigger render={trigger} />}

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add member</DialogTitle>
          <DialogDescription>Add an existing account to this workspace by their email.</DialogDescription>
        </DialogHeader>

        <form id="form-invite-member" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => {
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-invite-member-email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="form-invite-member-email"
                      type="email"
                      aria-invalid={fieldState.invalid}
                      placeholder="teammate@example.com"
                      autoComplete="off"
                      disabled={inviteMutation.isPending}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <Field orientation="horizontal" className="justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" form="form-invite-member" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add member"
              )}
            </Button>
          </Field>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
