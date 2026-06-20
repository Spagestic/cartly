"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Thread } from "./utils";

type ThreadSidebarMenuItemProps = {
  thread: Thread;
  isActive: boolean;
};

export function ThreadSidebarMenuItem({
  thread,
  isActive,
}: ThreadSidebarMenuItemProps) {
  const router = useRouter();
  const deleteThread = useMutation(api.chat.deleteThread);
  const renameThread = useMutation(api.chat.renameThread);

  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [title, setTitle] = useState(thread.title || "New Chat");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    if (renameOpen) {
      setTitle(thread.title || "New Chat");
    }
  }, [renameOpen, thread.title]);

  const handleRename = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    setIsRenaming(true);
    try {
      await renameThread({ threadId: thread._id, title: trimmed });
      setRenameOpen(false);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteThread({ threadId: thread._id });
      setDeleteOpen(false);
      if (isActive) {
        router.push("/chat");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={`/chat/${thread._id}`}>
          <span className="truncate">{thread.title || "New Chat"}</span>
        </Link>
      </SidebarMenuButton>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            showOnHover
            className="data-[state=open]:opacity-100"
            onClick={(event) => event.stopPropagation()}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">Thread options</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem
            onSelect={() => {
              setMenuOpen(false);
              setRenameOpen(true);
            }}
          >
            <PencilIcon />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              setMenuOpen(false);
              setDeleteOpen(true);
            }}
          >
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
          </DialogHeader>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleRename();
              }
            }}
            autoFocus
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRenameOpen(false)}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleRename()}
              disabled={isRenaming || !title.trim()}
            >
              {isRenaming ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{thread.title || "New Chat"}&quot; and
              all of its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarMenuItem>
  );
}
