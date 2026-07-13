import { Suspense } from "react";
import { ChatLayoutShell } from "./components/chat-layout-shell";
import { ChatSidebarLoader } from "./components/chat-sidebar-loader";
import { ChatSidebarSkeleton } from "./components/chat-sidebar-skeleton";

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ChatLayoutShell
      sidebar={
        <Suspense fallback={<ChatSidebarSkeleton />}>
          <ChatSidebarLoader />
        </Suspense>
      }
    >
      {children}
    </ChatLayoutShell>
  );
}
