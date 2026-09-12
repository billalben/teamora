"use client";

import { orpc } from "@/lib/orpc";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export type StagedAttachment = {
  url: string;
  key: string;
  name: string;
};

export function useAttachmentUpload() {
  const [isOpen, setIsOpen] = useState(false);
  const [stagedAttachment, setStagedAttachment] = useState<StagedAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleModal = (isOpen: boolean) => {
    setIsOpen(isOpen);
  };

  const handleUploadStart = () => {
    setIsUploading(true);
  };

  const handleUploadError = () => {
    setIsUploading(false);
  };

  const onUploadComplete = (attachment: StagedAttachment) => {
    setStagedAttachment(attachment);
    setIsUploading(false);
    handleModal(false);
  };

  const clearStagedAttachment = () => {
    setStagedAttachment(null);
  };

  const removeStagedAttachmentMutation = useMutation(
    orpc.attachment.deleteUpload.mutationOptions({
      onSuccess: () => {
        setStagedAttachment(null);
      },
      onError: () => {
        toast.error("Failed to remove attachment. Please try again.");
      },
    })
  );

  const removeStagedAttachment = () => {
    if (!stagedAttachment) return;
    removeStagedAttachmentMutation.mutate({ fileKey: stagedAttachment.key });
  };

  return {
    isOpen,
    handleModal,
    onUploadComplete,
    stagedAttachment,
    isUploading,
    handleUploadStart,
    handleUploadError,
    clearStagedAttachment,
    removeStagedAttachment,
    isRemovingAttachment: removeStagedAttachmentMutation.isPending,
  };
}

export type UseAttachmentUploadReturn = ReturnType<typeof useAttachmentUpload>;
