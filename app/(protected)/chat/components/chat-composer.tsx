"use client";

import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import { getScribeToken } from "@/lib/get-scribe-token";
import { Button } from "@/components/ui/button";
import {
  SpeechInput,
  SpeechInputCancelButton,
  SpeechInputPreview,
  SpeechInputRecordButton,
} from "@/components/ui/speech-input";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input";
import { cn } from "@/lib/utils";
import { ArrowUp, Loader2, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { ChatModelId } from "./chat-models";
import { ModelSelect } from "./model-select";
import { useComposerDragDrop } from "./chat-composer/use-composer-drag-drop";

async function getToken() {
  const result = await getScribeToken();
  if (result.error) {
    throw new Error(result.error);
  }
  return result.token!;
}

const ACCEPTED_FILE_TYPES = "image/*,.pdf,.txt,.md,.csv,.json,.doc,.docx";

export type ChatComposerAttachment = {
  fileId: string;
  url: string;
  filename: string;
  mediaType: string;
};

export function ChatComposer({
  status,
  attachment,
  isUploading,
  centered = false,
  model,
  onModelChange,
  onAttach,
  onRemoveAttachment,
  onSend,
}: {
  status: string;
  attachment: ChatComposerAttachment | null;
  isUploading: boolean;
  centered?: boolean;
  model: ChatModelId;
  onModelChange: (model: ChatModelId) => void;
  onAttach: (file: File) => void;
  onRemoveAttachment: () => void;
  onSend: (prompt: string, fileId?: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptAtStartRef = useRef("");

  const canAttach = status === "ready" && !isUploading;
  const canSend =
    canAttach && (prompt.trim().length > 0 || attachment !== null);

  const {
    isDragging,
    attachFile,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  } = useComposerDragDrop(canAttach, onAttach);

  const handleSubmit = () => {
    if (!canSend) return;
    onSend(prompt.trim(), attachment?.fileId);
    setPrompt("");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      attachFile(file);
    }
  };

  return (
    <div
      className={cn(
        "z-10 w-full px-3 pb-3 md:px-5 md:pb-5",
        centered
          ? "absolute inset-x-0 top-1/2 mx-auto flex max-w-3xl -translate-y-[calc(50%+2.5rem)] flex-col items-center justify-center"
          : "mt-auto shrink-0 bg-background",
      )}
    >
      <div className="mx-auto w-full max-w-3xl">
        {centered ? (
          <h1 className="mb-6 text-center text-4xl font-normal tracking-tight">
            What would you like to do today?
          </h1>
        ) : null} 
        <PromptInput
          isLoading={status !== "ready"}
          value={prompt}
          onValueChange={setPrompt}
          onSubmit={handleSubmit}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            "relative z-10 w-full rounded-3xl border bg-popover p-0 pt-1 shadow-xs transition-colors",
            isDragging
              ? "border-primary border-dashed bg-primary/5"
              : "border-input",
          )}
        >
          {isDragging ? (
            <div
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-primary/5"
              aria-hidden
            >
              <p className="text-sm font-medium text-primary">
                Drop file to attach
              </p>
            </div>
          ) : null}

          <div className="flex flex-col">
            {attachment ? (
              <div className="px-3 pt-3">
                <Attachments variant="grid">
                  <Attachment
                    data={{
                      id: attachment.fileId,
                      type: "file",
                      url: attachment.url,
                      mediaType: attachment.mediaType,
                      filename: attachment.filename,
                    }}
                    onRemove={onRemoveAttachment}
                  >
                    <AttachmentPreview />
                    <AttachmentRemove />
                  </Attachment>
                </Attachments>
              </div>
            ) : null}

            <PromptInputTextarea
              placeholder={
                attachment ? "Add a message (optional)" : "Ask anything..."
              }
              className="min-h-11 pt-3 pl-4 text-base leading-[1.3] sm:text-base md:text-base"
            />

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ACCEPTED_FILE_TYPES}
              onChange={handleFileChange}
            />

            <PromptInputActions className="mt-5 flex w-full items-center justify-between gap-2 px-3 pb-3">
              <div className="flex items-center gap-2">
                <PromptInputAction tooltip="Attach a file or image">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9 rounded-full"
                    disabled={!canAttach}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Plus size={18} />
                    )}
                  </Button>
                </PromptInputAction>
              </div>
              <div className="flex items-center gap-2">
                <ModelSelect
                  model={model}
                  onModelChange={onModelChange}
                  disabled={!canAttach}
                />

                <PromptInputAction tooltip="Voice input">
                  <SpeechInput
                    getToken={getToken}
                    className="shrink-0"
                    onStart={() => {
                      promptAtStartRef.current = prompt;
                    }}
                    onChange={({ transcript }) => {
                      setPrompt(promptAtStartRef.current + transcript);
                    }}
                    onStop={({ transcript }) => {
                      setPrompt(promptAtStartRef.current + transcript);
                    }}
                    onCancel={() => {
                      setPrompt(promptAtStartRef.current);
                    }}
                    onError={(error) => {
                      toast.error(String(error));
                    }}
                  >
                    <SpeechInputCancelButton />
                    <SpeechInputPreview placeholder="Listening..." />
                    <SpeechInputRecordButton
                      variant="outline"
                      disabled={!canAttach}
                      className="size-9 rounded-full"
                    />
                  </SpeechInput>
                </PromptInputAction>

                <Button
                  size="icon"
                  disabled={!canSend}
                  onClick={handleSubmit}
                  className="size-9 rounded-full"
                >
                  {status === "ready" ? (
                    <ArrowUp size={18} />
                  ) : (
                    <span className="size-3 rounded-xs bg-white" />
                  )}
                </Button>
              </div>
            </PromptInputActions>
          </div>
        </PromptInput>
      </div>
    </div>
  );
}
