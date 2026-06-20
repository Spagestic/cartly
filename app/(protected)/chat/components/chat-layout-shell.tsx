"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { ReactNode } from "react";
import { ChatModelProvider } from "./chat-model-context";

type ChatLayoutShellProps = {
  sidebar: ReactNode;
  children: ReactNode;
};

export function ChatLayoutShell({ sidebar, children }: ChatLayoutShellProps) {
  return (
    <SidebarProvider>
      {sidebar}
      <SidebarInset>
        <ChatModelProvider>{children}</ChatModelProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
