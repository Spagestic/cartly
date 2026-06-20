"use client";

import { api } from "@/convex/_generated/api";
import {
  optimisticallySendMessage,
  useUIMessages,
} from "@convex-dev/agent/react";
import { useAction, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { ChatComposer, type ChatComposerAttachment } from "../chat-composer";
import { useChatModel } from "../chat-model-context";
import { ChatHeader } from "./chat-header";
import { ChatMessageArea } from "./chat-message-area";
import {
  appendOptimisticAssistantPlanning,
  clearStoredPendingTurn,
  isAwaitingAssistantReply,
  pendingUserMessage,
  readStoredPendingTurn,
  type StoredPendingTurn,
  writeStoredPendingTurn,
} from "./pending-turn";

type ChatContentInnerProps = {
  threadId: string | null;
  thread: { title?: string } | null | undefined;
};

export function ChatContentInner({ threadId, thread }: ChatContentInnerProps) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [pendingAttachment, setPendingAttachment] =
    useState<ChatComposerAttachment | null>(null);
  const [attachment, setAttachment] = useState<ChatComposerAttachment | null>(
    null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const { model, setModel } = useChatModel();
  const [restoredPendingTurn, setRestoredPendingTurn] =
    useState<StoredPendingTurn | null>(null);

  const uploadFile = useAction(api.chat.uploadFile);

  const sendMessage = useMutation(api.chat.sendMessage).withOptimisticUpdate(
    (store, args) => {
      if (!args.threadId) return;
      optimisticallySendMessage(api.chat.listThreadMessages)(store, {
        threadId: args.threadId,
        prompt: args.prompt,
      });
    },
  );
  const regenerateMessage = useMutation(api.chat.regenerateMessage);
  const editMessage = useMutation(api.chat.editMessage);
  const { results: messageResults } = useUIMessages(
    api.chat.listThreadMessages,
    threadId ? { threadId } : "skip",
    { initialNumItems: 20, stream: true },
  );

  useEffect(() => {
    if (!threadId) {
      setRestoredPendingTurn(null);
      return;
    }
    setRestoredPendingTurn(readStoredPendingTurn(threadId));
  }, [threadId]);

  useEffect(() => {
    if (
      threadId &&
      (pendingPrompt || pendingAttachment) &&
      messageResults.length > 0
    ) {
      setPendingPrompt(null);
      setPendingAttachment(null);
    }
  }, [threadId, pendingPrompt, pendingAttachment, messageResults.length]);

  useEffect(() => {
    if (!threadId || messageResults.length === 0) return;
    clearStoredPendingTurn(threadId);
    setRestoredPendingTurn(null);
  }, [threadId, messageResults.length]);

  const messages = useMemo(() => {
    if (threadId) {
      if (messageResults.length > 0) return messageResults;
      if (restoredPendingTurn) {
        const restoredAttachment = restoredPendingTurn.attachment
          ? {
              fileId: "restored-attachment",
              url: restoredPendingTurn.attachment.url,
              filename: restoredPendingTurn.attachment.filename,
              mediaType: restoredPendingTurn.attachment.mediaType,
            }
          : null;
        return [
          pendingUserMessage(
            restoredPendingTurn.prompt,
            restoredAttachment,
          ),
        ];
      }
      return [];
    }
    if (pendingPrompt || pendingAttachment) {
      return [pendingUserMessage(pendingPrompt ?? "", pendingAttachment)];
    }
    return [];
  }, [
    threadId,
    messageResults,
    pendingPrompt,
    pendingAttachment,
    restoredPendingTurn,
  ]);

  const headerTitle = threadId ? (thread?.title ?? "Chat") : "";

  const handleAttach = async (file: File) => {
    setIsUploading(true);
    try {
      const { fileId, url } = await uploadFile({
        file: await file.arrayBuffer(),
        mimeType: file.type || "application/octet-stream",
        filename: file.name,
      });
      setAttachment({
        fileId,
        url,
        filename: file.name,
        mediaType: file.type || "application/octet-stream",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async (prompt: string, fileId?: string) => {
    setIsSending(true);
    if (!threadId) {
      setPendingPrompt(prompt);
      setPendingAttachment(attachment);
    }

    try {
      const res = await sendMessage({
        prompt,
        threadId: threadId ?? undefined,
        model,
        fileId,
      });

      setAttachment(null);

      if (!threadId && res.threadId) {
        writeStoredPendingTurn(res.threadId, {
          prompt,
          attachment: attachment
            ? {
                url: attachment.url,
                filename: attachment.filename,
                mediaType: attachment.mediaType,
              }
            : null,
        });
        startTransition(() => {
          router.replace(`/chat/${res.threadId}`);
        });
      }
    } catch {
      if (!threadId) {
        setPendingPrompt(null);
        setPendingAttachment(null);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleRegenerate = async (assistantMessageId: string) => {
    if (!threadId) return;

    const index = messages.findIndex((m) => m.id === assistantMessageId);
    if (index <= 0) return;

    const promptMessage = messages[index - 1];
    if (promptMessage.role !== "user") return;

    setIsActionPending(true);
    try {
      await regenerateMessage({
        threadId,
        promptMessageId: promptMessage.id,
        model,
      });
    } finally {
      setIsActionPending(false);
    }
  };

  const handleEdit = async (messageId: string, nextText: string) => {
    if (!threadId) return;

    setIsActionPending(true);
    try {
      await editMessage({
        threadId,
        messageId,
        prompt: nextText,
        model,
      });
    } finally {
      setIsActionPending(false);
    }
  };

  const awaitingAssistantReply = isAwaitingAssistantReply(messages);

  const status = useMemo(() => {
    if (isSending || isActionPending) return "submitted";
    if (awaitingAssistantReply) return "streaming";
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && last.status === "streaming") {
      return "streaming";
    }
    return "ready";
  }, [isSending, isActionPending, messages, awaitingAssistantReply]);

  const displayMessages = useMemo(
    () => appendOptimisticAssistantPlanning(messages),
    [messages],
  );

  const isCenteredComposer = !threadId && messages.length === 0;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <ChatHeader title={headerTitle} />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {!isCenteredComposer ? (
          <ChatMessageArea
            messages={displayMessages}
            status={status}
            onEditMessage={threadId ? handleEdit : undefined}
            onRegenerateMessage={
              status === "ready" ? handleRegenerate : undefined
            }
          />
        ) : null}

        <ChatComposer
          centered={isCenteredComposer}
          status={status}
          attachment={attachment}
          isUploading={isUploading}
          model={model}
          onModelChange={setModel}
          onAttach={(file) => void handleAttach(file)}
          onRemoveAttachment={() => setAttachment(null)}
          onSend={(prompt, fileId) => void handleSend(prompt, fileId)}
        />
      </div>
    </div>
  );
}
