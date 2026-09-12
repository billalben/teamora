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
import { UserPlusIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteMemberSchema, InviteMemberSchemaType } from "@/app/schemas/member";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";

export function InviteMember() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (open: boolean) => {
    setIsModalOpen(open);
  };

  const inviteMutation = useMutation(
    orpc.workspace.member.invite.mutationOptions({
      onSuccess: () => {
        toast.success("Invitation sent successfully!");
        form.reset();
        handleOpenModal(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const form = useForm<InviteMemberSchemaType>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { name: "", email: "" },
  });

  const onSubmit = (values: InviteMemberSchemaType) => {
    inviteMutation.mutate(values);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenModal}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <UserPlusIcon />
            Invite Member
          </Button>
        }
      />

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>Invite a new member to your workspace by using their email</DialogDescription>
        </DialogHeader>

        <form id="form-invite-member" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => {
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-invite-member">Name</FieldLabel>
                    <Input
                      {...field}
                      id="form-invite-member"
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter name"
                      autoComplete="off"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                );
              }}
            />
          </FieldGroup>

          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => {
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-invite-member">Email</FieldLabel>
                    <Input
                      {...field}
                      id="form-invite-member"
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter email"
                      autoComplete="off"
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
              onClick={() => handleOpenModal(false)}
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" form="form-invite-member" disabled={inviteMutation.isPending}>
              send invitation
            </Button>
          </Field>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
