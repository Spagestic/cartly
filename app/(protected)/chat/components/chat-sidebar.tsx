"use client";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import { type Preloaded, useConvexAuth, usePreloadedQuery } from "convex/react";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatSidebarHeader } from "./chat-sidebar/chat-sidebar-header";
import { ThreadList } from "./chat-sidebar/thread-list";
import { threadIdFromPathname, type Thread } from "./chat-sidebar/utils";
import { NavUser } from "./nav-user";

type ChatSidebarProps = {
  preloadedThreads: Preloaded<typeof api.chat.listThreads>;
};

export function ChatSidebar({ preloadedThreads }: ChatSidebarProps) {
  const pathname = usePathname();
  const currentThreadId = threadIdFromPathname(pathname);
  const { isLoading: isAuthLoading } = useConvexAuth();

  const threads = usePreloadedQuery(preloadedThreads);

  // listThreads returns [] when auth is not ready yet; treat that as loading, not empty.
  const threadList: Thread[] | undefined =
    isAuthLoading || threads === undefined
      ? undefined
      : "page" in threads
        ? threads.page
        : threads;

  return (
    <Sidebar>
      <SidebarHeader className="hidden items-start px-5 pt-6 md:flex">
        <ChatSidebarHeader />
      </SidebarHeader>

      <SidebarContent className="pt-4">
        <div className="px-4">
          <Button
            variant="outline"
            className="mb-4 flex w-full items-center gap-2"
            asChild
          >
            <Link href="/chat">
              <PlusIcon className="size-4" />
              <span>New Chat</span>
            </Link>
          </Button>
        </div>
        <ThreadList threads={threadList} currentThreadId={currentThreadId} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
