import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";

export function ChatSidebarSkeleton() {
  return (
    <Sidebar>
      <SidebarHeader className="hidden px-5 pt-6 md:flex">
        <div className="h-7 w-32 animate-pulse rounded-md bg-muted" />
      </SidebarHeader>
      <SidebarContent className="pt-4">
        <div className="px-4">
          <div className="mb-4 h-9 w-full animate-pulse rounded-md bg-muted" />
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>History</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2 px-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 animate-pulse rounded-md bg-muted"
                />
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="h-12 animate-pulse rounded-lg bg-muted" />
      </SidebarFooter>
    </Sidebar>
  );
}
