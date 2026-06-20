"use client";

import { api } from "@/convex/_generated/api";
import { type Preloaded, usePreloadedQuery, useQuery } from "convex/react";
import { ChatContentInner } from "./chat-content/chat-content-inner";

type ChatContentProps = {
  threadId: string | null;
  preloadedThread?: Preloaded<typeof api.chat.getThread>;
};

export function ChatContent(props: ChatContentProps) {
  if (props.preloadedThread) {
    return (
      <ChatContentWithPreloadedThread
        threadId={props.threadId}
        preloadedThread={props.preloadedThread}
      />
    );
  }

  return <ChatContentWithLiveThread threadId={props.threadId} />;
}

function ChatContentWithPreloadedThread({
  threadId,
  preloadedThread,
}: {
  threadId: string | null;
  preloadedThread: Preloaded<typeof api.chat.getThread>;
}) {
  const thread = usePreloadedQuery(preloadedThread);
  return <ChatContentInner threadId={threadId} thread={thread} />;
}

function ChatContentWithLiveThread({ threadId }: { threadId: string | null }) {
  const thread = useQuery(api.chat.getThread, threadId ? { threadId } : "skip");
  return <ChatContentInner threadId={threadId} thread={thread} />;
}
