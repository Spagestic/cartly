"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthActions } from "@convex-dev/auth/react";

export function UserAvatar({ className }: { className?: string }) {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  console.log("Current user:", user);
  const { signOut } = useAuthActions();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="group h-auto rounded-full p-0 hover:bg-transparent"
          variant="ghost"
        >
          <Avatar className="ring-offset-background transition-all group-hover:ring-2 group-hover:ring-secondary">
            <AvatarImage alt="Profile image" src={user?.image || ""} />
            <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={`max-w-64 ${className}`}>
        <DropdownMenuLabel className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-foreground text-sm">
            {user?.name}
          </span>
          <span className="truncate font-normal text-muted-foreground text-xs">
            {user?.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            void signOut().then(() => {
              router.push("/login");
            })
          }
        >
          <LogOutIcon aria-hidden="true" className="opacity-60" size={16} />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
