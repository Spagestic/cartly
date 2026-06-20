"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { getFirecrawlClient } from "./client";

const VALID_LANGUAGES = new Set(["node", "python", "bash"]);

type FirecrawlInteractOptions = {
  prompt?: string;
  code?: string;
  language?: "node" | "python" | "bash";
  timeout?: number;
  origin?: string;
};

type FirecrawlInteractClient = {
  interact: (
    scrapeId: string,
    options: FirecrawlInteractOptions,
  ) => Promise<unknown>;
};

export const interact = action({
  args: {
    scrapeId: v.string(),
    prompt: v.optional(v.string()),
    code: v.optional(v.string()),
    language: v.optional(
      v.union(v.literal("node"), v.literal("python"), v.literal("bash")),
    ),
    timeout: v.optional(v.number()),
    origin: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const scrapeId = args.scrapeId?.trim();
    if (!scrapeId) {
      throw new Error("Missing `scrapeId`");
    }

    const prompt = args.prompt?.trim();
    const code = args.code?.trim();

    if (!prompt && !code) {
      throw new Error("Either `prompt` or `code` must be provided");
    }

    if (prompt && code) {
      throw new Error("Provide only one of `prompt` or `code`");
    }

    if (code && !VALID_LANGUAGES.has(args.language ?? "node")) {
      throw new Error("`language` must be one of `node`, `python`, or `bash`");
    }

    if (
      args.timeout !== undefined &&
      (!Number.isFinite(args.timeout) || args.timeout < 1 || args.timeout > 300)
    ) {
      throw new Error("`timeout` must be between 1 and 300 seconds");
    }

    const firecrawl =
      getFirecrawlClient() as unknown as FirecrawlInteractClient;

    return await firecrawl.interact(scrapeId, {
      ...(prompt ? { prompt } : {}),
      ...(code ? { code } : {}),
      ...(code ? { language: args.language ?? "node" } : {}),
      ...(args.timeout !== undefined ? { timeout: args.timeout } : {}),
      ...(args.origin ? { origin: args.origin } : {}),
    });
  },
});
