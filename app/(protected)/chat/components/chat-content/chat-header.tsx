import { SidebarTrigger } from "@/components/ui/sidebar";

type ChatHeaderProps = {
  title: string;
};

export function ChatHeader({ title }: ChatHeaderProps) {
  return (
    <header className="z-10 flex h-16 w-full shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="truncate text-foreground">{title}</div>
    </header>
  );
}
