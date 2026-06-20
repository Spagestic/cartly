import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/prompt-kit/chat-container";
import { ScrollButton } from "@/components/prompt-kit/scroll-button";
import type { UIMessage } from "@convex-dev/agent/react";
import { MessageList } from "../message-list";

type ChatMessageAreaProps = {
  messages: UIMessage[];
  status: string;
  onEditMessage?: (messageId: string, nextText: string) => void;
  onRegenerateMessage?: (messageId: string) => void;
};

export function ChatMessageArea({
  messages,
  status,
  onEditMessage,
  onRegenerateMessage,
}: ChatMessageAreaProps) {
  if (messages.length === 0) return null;

  return (
    <ChatContainerRoot className="min-h-0 flex-1">
      <ChatContainerContent className="space-y-0 px-5 py-12">
        <MessageList
          messages={messages}
          status={status}
          onEditMessage={onEditMessage}
          onRegenerateMessage={onRegenerateMessage}
        />
      </ChatContainerContent>
      <div className="absolute bottom-4 left-1/2 flex w-full max-w-3xl -translate-x-1/2 justify-end px-5">
        <ScrollButton className="shadow-sm" />
      </div>
    </ChatContainerRoot>
  );
}
