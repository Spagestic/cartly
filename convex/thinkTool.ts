import { z } from "zod";
import { createTool, type ToolCtx } from "@convex-dev/agent";
import { internal } from "./_generated/api";

const thinkInputSchema = z.object({
  notes: z
    .string()
    .describe("Internal reasoning notes, hypotheses, and next-step plan."),
});

export const think = createTool({
  description:
    "Private scratchpad for planning. Use this to reason step by step, " +
    "summarize evidence, or draft a plan before calling other tools. " +
    "Do not use it for final user-facing output.",
  inputSchema: thinkInputSchema,
  execute: async (ctx: ToolCtx, { notes }) => {
    if (ctx.threadId && ctx.messageId) {
      await ctx.runMutation(internal.agentLogs.addThought, {
        threadId: ctx.threadId,
        messageId: ctx.messageId,
        notes,
      });
    }
    return "Thought recorded";
  },
});
