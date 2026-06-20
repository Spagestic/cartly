"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { ThreadSidebarMenuItem } from "./thread-sidebar-menu-item";
import type { Thread } from "./utils";

type ThreadListProps = {
  threads: Thread[] | undefined;
  currentThreadId: string | undefined;
};

export function ThreadList({ threads, currentThreadId }: ThreadListProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>History</SidebarGroupLabel>
      <SidebarGroupContent>
        {threads === undefined ? (
          <div className="px-2 py-2 text-sm text-muted-foreground animate-pulse">
            Loading chats...
          </div>
        ) : threads.length === 0 ? (
          <div className="px-2 py-2 text-sm text-muted-foreground">
            No chats yet.
          </div>
        ) : (
          <SidebarMenu>
            {threads.map((thread) => (
              <ThreadSidebarMenuItem
                key={thread._id}
                thread={thread}
                isActive={currentThreadId === thread._id}
              />
            ))}
          </SidebarMenu>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
