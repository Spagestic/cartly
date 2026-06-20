"use node";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { batchScrape, interact, poll, scrape, search } from "firecrawl-aisdk";
import { createChatAgent, DEFAULT_CHAT_MODEL } from "./chatAgent";
import { citysuperSearch } from "./citysuperTool";
import { showCitysuperProducts } from "./showCitysuperProductsTool";
// import { think } from "./thinkTool";

const chatTools = {
  citysuperSearch,
  showCitysuperProducts,
  search,
  scrape,
  batchScrape,
  interact,
  poll,
};

function isStreamControllerClosedError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return message.includes("Controller is already closed");
}

function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as {
    message?: string;
    reason?: string;
    lastError?: { message?: string; statusCode?: number };
    errors?: Array<{ message?: string; statusCode?: number }>;
  };
  const candidates = [
    err.message,
    err.reason,
    err.lastError?.message,
    ...(err.errors?.map((e) => e.message) ?? []),
  ];
  return candidates.some(
    (msg) =>
      typeof msg === "string" &&
      (msg.includes("Rate limit") ||
        msg.includes("rate_limited") ||
        msg.includes("429")),
  );
}

export const generate = internalAction({
  args: {
    threadId: v.string(),
    promptMessageId: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, { threadId, promptMessageId, model }) => {
    const agent = createChatAgent(model ?? DEFAULT_CHAT_MODEL);

    await ctx.runMutation(internal.citysuper.turnGuard.resetCitysuperSearchTurn, {
      threadId,
      promptMessageId,
    });

    try {
      const result = await agent.streamText(
        ctx,
        { threadId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { promptMessageId, tools: chatTools } as any,
        {
          // Persist UIMessage stream deltas so tool inputs update live
          // update live via listThreadMessages + syncStreams. Do not also
          // consume the stream here — streamText awaits completion when deltas
          // are enabled (@convex-dev/agent 0.6+).
          saveStreamDeltas: { throttleMs: 100 },
        },
      );
      await result.text;
    } catch (error) {
      if (isStreamControllerClosedError(error)) {
        // Benign shutdown race after tools/text finished; avoid error toast.
        console.warn("Stream controller closed after generation:", error);
        return;
      }
      console.error("Error in agent generation:", error);
      const errorMessage = isRateLimitError(error)
        ? "I'm currently experiencing high traffic (Rate Limit Exceeded). Please try again in a few moments."
        : "I encountered an error while generating the response. Please try again.";

      await ctx.runMutation(internal.chat.reportError, {
        threadId,
        error: errorMessage,
      });
    }
  },
});
