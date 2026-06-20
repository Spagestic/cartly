import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  users: defineTable({
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.float64()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.float64()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),
  tasks: defineTable({
    text: v.string(),
    completed: v.boolean(),
    userId: v.id("users"),
  }).index("by_user_id", ["userId"]),
  agentThoughts: defineTable({
    threadId: v.string(),
    messageId: v.string(),
    notes: v.string(),
  })
    .index("by_thread", ["threadId"])
    .index("by_message", ["messageId"]),
  citysuperSearchTurns: defineTable({
    threadId: v.string(),
    promptMessageId: v.string(),
    searchCount: v.number(),
  }).index("by_thread", ["threadId"]),
});
