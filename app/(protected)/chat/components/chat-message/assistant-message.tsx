"use client";

import {
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { Check, Copy, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import {
  streamdownLinkSafety,
  streamdownPlugins,
} from "@/lib/streamdown-plugins";
import { Streamdown } from "streamdown";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useMemo } from "react";
import {
  AssistantChainOfThought,
  buildAssistantUIMessageSegments,
} from "../assistant-chain-of-thought";
import { CitysuperProductGrid } from "../citysuper/citysuper-product-grid";
import { assistantStreamdownComponents } from "./streamdown-citation";

type AssistantMessageProps = {
  message: UIMessage;
  isLastMessage: boolean;
  isStreamingMessage: boolean;
  onRegenerateMessage?: (messageId: string) => void;
};

export function AssistantMessage({
  message,
  isLastMessage,
  isStreamingMessage,
  onRegenerateMessage,
}: AssistantMessageProps) {
  const agentText =
    "agentText" in message
      ? (message as UIMessage & { agentText?: string }).agentText
      : undefined;

  const assistantSegments = useMemo(
    () =>
      buildAssistantUIMessageSegments(message.parts, {
        fallbackText: agentText,
      }),
    [message.parts, agentText],
  );

  const content = useMemo(() => {
    const fromParts = message.parts
      .map((part) => (part.type === "text" ? part.text : null))
      .join("");
    if (fromParts.trim()) return fromParts;
    if (agentText?.trim()) return agentText;
    return assistantSegments
      .filter((seg) => seg.kind === "text")
      .map((seg) => seg.text)
      .join("");
  }, [message.parts, agentText, assistantSegments]);

  const hasFinalResponse = content.trim().length > 0;
  const showAssistantActions = !isStreamingMessage && hasFinalResponse;
  const { copyToClipboard, isCopied } = useCopyToClipboard();

  // While streaming, if the message hasn't produced any renderable segment yet
  // (e.g. only a `step-start`), inject a chain placeholder so the Chain of
  // Thought stays visible instead of flickering out and back in.
  const renderSegments = useMemo(() => {
    if (!isStreamingMessage) return assistantSegments;
    if (assistantSegments.length > 0) return assistantSegments;
    return [
      {
        kind: "chain" as const,
        parts: message.parts,
        key: "chain-placeholder",
      },
    ];
  }, [isStreamingMessage, assistantSegments, message.parts]);

  return (
    <div className="group flex w-full flex-col gap-3">
      {renderSegments.map((seg) => {
        if (seg.kind === "text") {
          return (
            <MessageContent
              key={seg.key}
              className="prose flex-1 rounded-lg bg-transparent p-0 text-foreground"
            >
              <Streamdown
                plugins={streamdownPlugins}
                linkSafety={streamdownLinkSafety}
                isAnimating={isStreamingMessage && seg.isStreaming}
                components={assistantStreamdownComponents}
              >
                {seg.text}
              </Streamdown>
            </MessageContent>
          );
        }
        if (seg.kind === "products") {
          return (
            <CitysuperProductGrid
              key={seg.key}
              title={seg.title}
              products={seg.products}
            />
          );
        }
        return (
          <AssistantChainOfThought
            key={seg.key}
            parts={seg.parts}
            titleLookupParts={message.parts}
            isStreaming={isStreamingMessage}
          />
        );
      })}
      {showAssistantActions ? (
        <MessageActions
          className={cn(
            "-ml-2.5 flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100",
            isLastMessage && "opacity-100",
          )}
        >
          <MessageAction
            tooltip="Copy"
            aria-label="Copy"
            onClick={() => copyToClipboard(content)}
          >
            {isCopied ? <Check /> : <Copy />}
          </MessageAction>
          {onRegenerateMessage ? (
            <MessageAction
              tooltip="Regenerate"
              aria-label="Regenerate response"
              onClick={() => onRegenerateMessage(message.id)}
            >
              <RotateCcw />
            </MessageAction>
          ) : null}
          <MessageAction tooltip="Upvote" aria-label="Upvote">
            <ThumbsUp />
          </MessageAction>
          <MessageAction tooltip="Downvote" aria-label="Downvote">
            <ThumbsDown />
          </MessageAction>
        </MessageActions>
      ) : null}
    </div>
  );
}
