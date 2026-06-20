import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { ChatSidebar } from "./chat-sidebar";

export async function ChatSidebarLoader() {
  const preloadedThreads = await preloadQuery(api.chat.listThreads, {
    paginationOpts: { cursor: null, numItems: 20 },
  });

  return <ChatSidebar preloadedThreads={preloadedThreads} />;
}
