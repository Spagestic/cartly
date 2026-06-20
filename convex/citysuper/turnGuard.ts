import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

/** Reset search allowance at the start of each assistant generation turn. */
export const resetCitysuperSearchTurn = internalMutation({
  args: {
    threadId: v.string(),
    promptMessageId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { threadId, promptMessageId }) => {
    await ctx.db.insert("citysuperSearchTurns", {
      threadId,
      promptMessageId,
      searchCount: 0,
    });
    return null;
  },
});

/**
 * Allow at most one citysuperSearch per user message turn (per thread).
 * Throws if the agent already searched in this turn.
 */
export const acquireCitysuperSearch = internalMutation({
  args: {
    threadId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { threadId }) => {
    const turn = await ctx.db
      .query("citysuperSearchTurns")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .order("desc")
      .first();

    if (!turn) {
      return null;
    }

    if (turn.searchCount >= 1) {
      throw new Error(
        "Only one citysuperSearch is allowed per user message. " +
          "Use the products from your previous search, call showCitysuperProducts with your picks, " +
          "or use page/page_count on a single search instead of searching again with a different query.",
      );
    }

    await ctx.db.patch(turn._id, { searchCount: turn.searchCount + 1 });
    return null;
  },
});
