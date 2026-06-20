import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const addThought = internalMutation({
  args: {
    threadId: v.string(),
    messageId: v.string(),
    notes: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { threadId, messageId, notes }) => {
    await ctx.db.insert("agentThoughts", {
      threadId,
      messageId,
      notes,
    });
    return null;
  },
});
