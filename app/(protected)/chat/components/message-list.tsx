"use client";

import type { UIMessage } from "@convex-dev/agent/react";
import type { UIMessage as AIUIMessage } from "ai";
import { ChatMessage } from "./chat-message";

export function MessageList({
  messages,
  status,
  onEditMessage,
  onRegenerateMessage,
}: {
  messages: UIMessage[];
  status: string;
  onEditMessage?: (messageId: string, nextText: string) => void;
  onRegenerateMessage?: (assistantMessageId: string) => void;
}) {
  const lastIndex = messages.length - 1;
  const canEdit = status === "ready" && onEditMessage !== undefined;

  return (
    <>
      {messages.map((message, index) => {
        const uiMessage = toChatUIMessage(message);
        const isLastMessage = index === lastIndex;
        const canRegenerate =
          isLastMessage &&
          message.role === "assistant" &&
          onRegenerateMessage !== undefined;

        return (
          <ChatMessage
            key={message.key}
            message={uiMessage}
            isLastMessage={isLastMessage}
            status={status}
            onEditMessage={
              message.role === "user" && canEdit ? onEditMessage : undefined
            }
            onRegenerateMessage={
              canRegenerate ? onRegenerateMessage : undefined
            }
          />
        );
      })}
    </>
  );
}

function toChatUIMessage(
  message: UIMessage,
): AIUIMessage & { id: string; agentText?: string } {
  return {
    id: message.id,
    role: message.role,
    parts: message.parts,
    agentText: message.text,
  };
}
