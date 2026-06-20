"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { CHAT_MODELS, type ChatModelId } from "./chat-models";

function modelLabel(model: ChatModelId) {
  return CHAT_MODELS.find((m) => m.id === model)?.label ?? model;
}

const triggerClassName =
  "border-input data-placeholder:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-fit items-center justify-between gap-2 rounded-full border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

export function ModelSelect({
  model,
  onModelChange,
  disabled,
}: {
  model: ChatModelId;
  onModelChange: (model: ChatModelId) => void;
  disabled?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        disabled={disabled}
        aria-label="Model"
        className={cn(triggerClassName)}
      >
        <span className="line-clamp-1">{modelLabel(model)}</span>
        <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
      </button>
    );
  }

  return (
    <Select
      value={model}
      onValueChange={(value) => onModelChange(value as ChatModelId)}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        className="h-9 rounded-full px-3"
        aria-label="Model"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="end">
        {CHAT_MODELS.map(({ id, label }) => (
          <SelectItem key={id} value={id}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
