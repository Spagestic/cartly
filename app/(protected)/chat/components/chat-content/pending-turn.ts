import type { UIMessage } from "@convex-dev/agent/react";
import type { ChatComposerAttachment } from "../chat-composer";

export const CHAT_PENDING_THREAD_STORAGE_PREFIX = "chat-pending-thread:";

export type StoredPendingTurn = {
  prompt: string;
  attachment?: {
    url: string;
    filename: string;
    mediaType: string;
  } | null;
};

export function pendingUserMessage(
  prompt: string,
  attachment?: ChatComposerAttachment | null,
): UIMessage {
  const parts: UIMessage["parts"] = [];
  if (attachment) {
    parts.push({
      type: "file",
      url: attachment.url,
      mediaType: attachment.mediaType,
      filename: attachment.filename,
    });
  }
  if (prompt) {
    parts.push({ type: "text", text: prompt });
  }

  return {
    id: "pending-user-message",
    key: "pending-user-message",
    role: "user",
    parts,
    order: 0,
    stepOrder: 0,
    status: "pending",
    text: prompt,
    _creationTime: Date.now(),
  };
}

export function pendingAssistantPlanningMessage(order: number): UIMessage {
  return {
    id: "pending-assistant-message",
    key: "pending-assistant-message",
    role: "assistant",
    // Empty parts: chain-of-thought UI shows "Planning next steps" while streaming.
    parts: [] as UIMessage["parts"],
    order,
    stepOrder: 0,
    status: "streaming",
    text: "",
    _creationTime: Date.now(),
  };
}

function pendingThreadStorageKey(threadId: string) {
  return `${CHAT_PENDING_THREAD_STORAGE_PREFIX}${threadId}`;
}

export function readStoredPendingTurn(threadId: string): StoredPendingTurn | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(pendingThreadStorageKey(threadId));
    if (!raw) return null;
    return JSON.parse(raw) as StoredPendingTurn;
  } catch {
    return null;
  }
}

export function writeStoredPendingTurn(threadId: string, turn: StoredPendingTurn) {
  sessionStorage.setItem(pendingThreadStorageKey(threadId), JSON.stringify(turn));
}

export function clearStoredPendingTurn(threadId: string) {
  sessionStorage.removeItem(pendingThreadStorageKey(threadId));
}

export function isAwaitingAssistantReply(messages: UIMessage[]): boolean {
  if (messages.length === 0) return false;
  if (messages.some((message) => message.role === "assistant")) return false;
  return messages[messages.length - 1]?.role === "user";
}

export function appendOptimisticAssistantPlanning(
  messages: UIMessage[],
): UIMessage[] {
  if (!isAwaitingAssistantReply(messages)) return messages;
  const lastMessage = messages[messages.length - 1]!;
  return [...messages, pendingAssistantPlanningMessage(lastMessage.order + 1)];
}
