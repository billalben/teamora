"use client";
import { useState } from "react";
import { channelNameSchema, transformChannelName, type ChannelNameSchemaType } from "@/app/schemas/channel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

export function CreateNewChannel() {
  const [openDialog, setOpenDialog] = useState(false);
  const form = useForm<ChannelNameSchemaType>({
    resolver: zodResolver(channelNameSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = (values: ChannelNameSchemaType) => {
    console.log("values", values);
    setOpenDialog(false);
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <PlusIcon className="size-4" />
          Add Channel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a Channel</DialogTitle>
          <DialogDescription>Create a new channel to collaborate with your team members.</DialogDescription>
        </DialogHeader>
        <form id="form-create-channel" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => {
                // Calculate transformed name here, using field.value
                const transformedName = field.value ? transformChannelName(field.value) : "";

                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-create-channel-name">Channel Name</FieldLabel>
                    <Input
                      {...field}
                      id="form-create-channel-name"
                      aria-invalid={fieldState.invalid}
                      placeholder="My New Channel"
                      autoComplete="off"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    {transformedName && transformedName !== field.value && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Suggested channel name: <strong>{transformedName}</strong>
                      </p>
                    )}
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Field orientation="horizontal" className="justify-end">
            <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" form="form-create-channel">
              Create Channel
            </Button>
          </Field>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
