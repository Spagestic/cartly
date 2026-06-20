import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { ChatContent } from "../components/chat-content";

export default async function ThreadChatPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const preloadedThread = await preloadQuery(api.chat.getThread, { threadId });

  return (
    <ChatContent threadId={threadId} preloadedThread={preloadedThread} />
  );
}
