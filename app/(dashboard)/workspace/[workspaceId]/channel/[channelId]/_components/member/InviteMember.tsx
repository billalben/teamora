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
import { CheckIcon, Loader2Icon, UserPlusIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteMemberSchema, InviteMemberSchemaType } from "@/app/schemas/member";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { useWorkspaceRealtime } from "@/providers/WorkspaceRealtimeProvider";

export function InviteMember() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // null means the admin has not made a choice yet, so we default to the channel being viewed.
  const [channelSelection, setChannelSelection] = useState<string[] | null>(null);

  const queryClient = useQueryClient();
  const { sendEvent } = useWorkspaceRealtime();
  const params = useParams<{ channelId?: string }>();
  const currentChannelId = params.channelId;

  const { data: channelList } = useQuery(orpc.channel.list.queryOptions());

  const selectedChannelIds = channelSelection ?? (currentChannelId ? [currentChannelId] : []);

  const form = useForm<InviteMemberSchemaType>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: "" },
  });

  const toggleChannel = (channelId: string) => {
    const next = selectedChannelIds.includes(channelId)
      ? selectedChannelIds.filter((id) => id !== channelId)
      : [...selectedChannelIds, channelId];

    setChannelSelection(next);
  };

  const inviteMutation = useMutation(
    orpc.workspace.member.invite.mutationOptions({
      onSuccess: ({ userId }) => {
        toast.success("Member added successfully!");
        form.reset();
        setIsModalOpen(false);

        sendEvent({ type: "member:joined", payload: { userId } });

        // Refresh the member lists shown in the header popover and the sidebar.
        queryClient.invalidateQueries({ queryKey: orpc.workspace.member.list.queryKey() });
        queryClient.invalidateQueries({ queryKey: orpc.channel.list.queryKey() });
        queryClient.invalidateQueries({ queryKey: orpc.workspace.member.activity.queryKey({ input: {} }) });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const handleOpenChange = (open: boolean) => {
    // Prevent closing while the request is in flight (covers the X button, outside click and Escape).
    if (!open && inviteMutation.isPending) {
      return;
    }

    setIsModalOpen(open);

    if (!open) {
      form.reset();
      setChannelSelection(null);
    }
  };

  const onSubmit = (values: InviteMemberSchemaType) => {
    inviteMutation.mutate({ email: values.email, channelIds: selectedChannelIds });
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange} disablePointerDismissal={inviteMutation.isPending}>
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
          <DialogDescription>Add a new member to your workspace by using their email</DialogDescription>
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

          {channelList && channelList.channels.length > 0 && (
            <div className="mt-4 space-y-2">
              <div>
                <FieldLabel>Channel access</FieldLabel>
                <p className="text-xs text-muted-foreground">Choose which channels this member can see.</p>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-md border">
                {channelList.channels.map((channel) => {
                  const selected = selectedChannelIds.includes(channel.id);

                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => toggleChannel(channel.id)}
                      disabled={inviteMutation.isPending}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent transition-colors disabled:opacity-50"
                    >
                      <span className="truncate">#{channel.name}</span>
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded border",
                          selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                        )}
                      >
                        {selected && <CheckIcon className="size-3.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
                  Sending...
                </>
              ) : (
                "Send invitation"
              )}
            </Button>
          </Field>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
