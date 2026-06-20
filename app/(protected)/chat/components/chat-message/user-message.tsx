"use client";

import {
  Attachment,
  AttachmentPreview,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { isFileUIPart } from "ai";
import { Check, Copy, Pencil, Trash } from "lucide-react";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useMemo, useState } from "react";

type UserMessageProps = {
  message: UIMessage;
  content: string;
  onEditMessage?: (messageId: string, nextText: string) => void;
};

export function UserMessage({
  message,
  content,
  onEditMessage,
}: UserMessageProps) {
  const fileParts = message.parts.filter(isFileUIPart);
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const editorKey = useMemo(
    () => `${message.id}-${content}`,
    [message.id, content],
  );

  const resizeEditor = (element: HTMLTextAreaElement | null) => {
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  };

  const commitEdit = () => {
    const nextText = draft.trim();
    if (!nextText || nextText === content || !onEditMessage) {
      setIsEditing(false);
      setDraft(content);
      return;
    }
    onEditMessage(message.id, nextText);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "group flex w-full flex-col gap-2",
        !isEditing && "items-end gap-1",
      )}
    >
      {isEditing ? (
        <div className="mb-4 ml-auto flex w-full max-w-[85%] flex-col gap-2 sm:max-w-[75%]">
          <textarea
            key={editorKey}
            autoFocus
            className="field-sizing-content min-h-10 w-full resize-none overflow-hidden rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              resizeEditor(event.target);
            }}
            onFocus={(event) => resizeEditor(event.target)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                commitEdit();
              }
            }}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setDraft(content);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={commitEdit}
            >
              Done
            </Button>
          </div>
        </div>
      ) : (
        <div className="ml-auto flex max-w-[85%] flex-col items-end gap-2 sm:max-w-[75%]">
          {fileParts.length > 0 ? (
            <Attachments variant="grid">
              {fileParts.map((part, index) => (
                <Attachment
                  key={`${part.url ?? part.filename}-${index}`}
                  data={{
                    id: `${message.id}-file-${index}`,
                    type: "file",
                    url: part.url,
                    mediaType: part.mediaType,
                    filename: part.filename,
                  }}
                >
                  <AttachmentPreview />
                </Attachment>
              ))}
            </Attachments>
          ) : null}
          {content ? (
            <MessageContent className="rounded-3xl bg-muted px-5 py-2.5 text-primary">
              {content}
            </MessageContent>
          ) : null}
        </div>
      )}
      {!isEditing ? (
        <MessageActions className="flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {onEditMessage ? (
            <MessageAction
              tooltip="Edit"
              aria-label="Edit"
              onClick={() => setIsEditing(true)}
            >
              <Pencil />
            </MessageAction>
          ) : null}
          <MessageAction tooltip="Delete" aria-label="Delete">
            <Trash />
          </MessageAction>
          <MessageAction
            tooltip="Copy"
            aria-label="Copy"
            onClick={() => copyToClipboard(content)}
          >
            {isCopied ? <Check /> : <Copy />}
          </MessageAction>
        </MessageActions>
      ) : null}
    </div>
  );
}
