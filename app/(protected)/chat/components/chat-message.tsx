"use client";

import { Message } from "@/components/ai-elements/message";
import type { UIMessage } from "ai";
import { useMemo } from "react";
import { AssistantMessage } from "./chat-message/assistant-message";
import { UserMessage } from "./chat-message/user-message";

export function ChatMessage({
  message,
  isLastMessage,
  status,
  onEditMessage,
  onRegenerateMessage,
}: {
  message: UIMessage;
  isLastMessage: boolean;
  status: string;
  onEditMessage?: (messageId: string, nextText: string) => void;
  onRegenerateMessage?: (messageId: string) => void;
}) {
  const isAssistant = message.role === "assistant";
  const isStreamingMessage =
    isAssistant &&
    isLastMessage &&
    (status === "submitted" || status === "streaming");

  const content = useMemo(() => {
    const fromParts = message.parts
      .map((part) => (part.type === "text" ? part.text : null))
      .join("");
    if (fromParts.trim()) return fromParts;
    const agentText =
      isAssistant && "agentText" in message
        ? (message as UIMessage & { agentText?: string }).agentText
        : undefined;
    return agentText?.trim() ?? "";
  }, [message, isAssistant]);

  return (
    <Message
      from={isAssistant ? "assistant" : "user"}
      className="mx-auto w-full max-w-3xl px-6"
    >
      {isAssistant ? (
        <AssistantMessage
          message={message}
          isLastMessage={isLastMessage}
          isStreamingMessage={isStreamingMessage}
          onRegenerateMessage={onRegenerateMessage}
        />
      ) : (
        <UserMessage
          message={message}
          content={content}
          onEditMessage={onEditMessage}
        />
      )}
    </Message>
  );
}
