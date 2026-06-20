import { Suspense } from "react";
import type { Metadata } from "next";
import { ChatLayoutShell } from "./components/chat-layout-shell";
import { ChatSidebarLoader } from "./components/chat-sidebar-loader";
import { ChatSidebarSkeleton } from "./components/chat-sidebar-skeleton";

export const metadata: Metadata = {
  title: "Cartly",
  description:
    "Making supermarket shopping feel personal, even in the busiest aisles.",
  icons: {
    icon: "/cartly_logo.png",
  },
};

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
