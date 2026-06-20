"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  CHAT_MODELS,
  DEFAULT_CHAT_MODEL,
  type ChatModelId,
} from "./chat-models";

const CHAT_MODEL_STORAGE_KEY = "chat-selected-model";

function isChatModelId(value: string): value is ChatModelId {
  return CHAT_MODELS.some((m) => m.id === value);
}

function readStoredChatModel(): ChatModelId | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem(CHAT_MODEL_STORAGE_KEY);
    if (stored && isChatModelId(stored)) return stored;
  } catch {
    // ignore
  }
  return null;
}

function writeStoredChatModel(model: ChatModelId) {
  sessionStorage.setItem(CHAT_MODEL_STORAGE_KEY, model);
}

type ChatModelContextValue = {
  model: ChatModelId;
  setModel: (model: ChatModelId) => void;
};

const ChatModelContext = createContext<ChatModelContextValue | null>(null);

export function ChatModelProvider({ children }: { children: ReactNode }) {
  const [model, setModelState] = useState<ChatModelId>(DEFAULT_CHAT_MODEL);

  useEffect(() => {
    const stored = readStoredChatModel();
    if (stored) setModelState(stored);
  }, []);

  const setModel = useCallback((next: ChatModelId) => {
    setModelState(next);
    writeStoredChatModel(next);
  }, []);

  return (
    <ChatModelContext.Provider value={{ model, setModel }}>
      {children}
    </ChatModelContext.Provider>
  );
}

export function useChatModel() {
  const context = useContext(ChatModelContext);
  if (!context) {
    throw new Error("useChatModel must be used within ChatModelProvider");
  }
  return context;
}
