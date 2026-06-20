"use client";

import {
  ChevronUp,
  LoaderIcon,
  UserCircle,
  ScrollText,
  Lock,
  LogOut,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export function NavUser() {
  const user = useQuery(api.users.getCurrentUser);
  const { signOut } = useAuthActions();
  const { isMobile } = useSidebar();
  const isLoading = user === undefined;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {isLoading ? (
              <SidebarMenuButton
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                data-testid="user-nav-button"
                size="lg"
              >
                <div className="flex flex-row gap-2 w-full">
                  <div className="size-8 animate-pulse rounded-lg bg-zinc-500/20" />
                  <div className="grid flex-1 text-left text-sm leading-tight gap-1">
                    <span className="w-3/5 h-4 rounded-lg animate-pulse bg-zinc-500/20 font-medium text-transparent">
                      User Name
                    </span>
                    <span className="w-4/5 h-3 rounded-lg animate-pulse bg-zinc-500/20 text-xs text-transparent">
                      User Email
                    </span>
                  </div>
                </div>
                <div className="animate-spin text-zinc-500">
                  <LoaderIcon className="size-4" />
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                data-testid="user-nav-button"
                size="lg"
              >
                <Avatar className="h-8 w-8 rounded-lg grayscale">
                  <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
                  <AvatarFallback className="rounded-lg">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user?.email}
                  </span>
                </div>
                <ChevronUp className="ml-auto" />
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg z-100"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
                  <AvatarFallback className="rounded-lg">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user?.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserCircle />
                  Profile
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/terms">
                  <ScrollText />
                  Terms
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/privacy">
                  <Lock />
                  Privacy Policy
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
