import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }
    return await ctx.db
      .query("tasks")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const add = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    return await ctx.db.insert("tasks", {
      text: args.text,
      completed: false,
      userId,
    });
  },
});

export const check = mutation({
  args: { id: v.id("tasks"), completed: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.id, { completed: args.completed });
  },
});

export const updateText = mutation({
  args: { id: v.id("tasks"), text: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.id, { text: args.text });
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.delete(args.id);
  },
});
