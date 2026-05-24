"use client";

import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { ImageUploadModal } from "@/components/rich-text-editor/ImageUploadModal";
import { Button } from "@/components/ui/button";
import { useAttachmentUploadType } from "@/hooks/use-attachement-upload";
import { ImageIcon, SendIcon } from "lucide-react";
import AttachmentChip from "./AttachmentChip";

interface IAppProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  upload: useAttachmentUploadType;
}

export function MessageComposer({ value, onChange, onSubmit, isSubmitting, upload }: IAppProps) {
  return (
    <>
      <RichTextEditor
        field={{ value, onChange }}
        sendButton={
          <Button type="button" size="sm" onClick={onSubmit} disabled={isSubmitting}>
            <SendIcon className="size-4 mr-1" />
            Send
          </Button>
        }
        footerLeft={
          upload.stagedAttachment ? (
            <AttachmentChip
              url={upload.stagedAttachment.url}
              fileName={upload.stagedAttachment.name}
              onRemoveImage={upload.removeStagedAttachment}
              isRemoving={upload.isRemovingAttachment}
            />
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => upload.handleModal(true)}
            >
              <ImageIcon className="size-4 mr-1" />
              Attach
            </Button>
          )
        }
      />

      <ImageUploadModal
        isOpen={upload.isOpen}
        handleModal={upload.handleModal}
        onUploadComplete={upload.onUploadComplete}
        isUploading={upload.isUploading}
        handleStartUpload={upload.handleUploadStart}
        handleUploadError={upload.handleUploadError}
      />
    </>
  );
}
