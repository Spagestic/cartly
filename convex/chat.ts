// convex/chat.ts
import { components, internal } from "./_generated/api";
import {
  saveMessage,
  vStreamArgs,
  listUIMessages,
  syncStreams,
  storeFile,
  getFile,
  updateThreadMetadata,
} from "@convex-dev/agent";
import {
  createChatAgent,
  DEFAULT_CHAT_MODEL,
  type ChatAgent,
} from "./chatAgent";
import {
  action,
  mutation,
  query,
  internalMutation,
  type MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const MAX_THREAD_TITLE_LENGTH = 48;

function truncateThreadTitle(title: string): string {
  if (title.length <= MAX_THREAD_TITLE_LENGTH) {
    return title;
  }
  return `${title.slice(0, MAX_THREAD_TITLE_LENGTH - 3)}...`;
}

export const reportError = internalMutation({
  args: { threadId: v.string(), error: v.string() },
  handler: async (ctx, { threadId, error }) => {
    await saveMessage(ctx, components.agent, {
      threadId,
      message: { role: "assistant", content: error },
    });
  },
});

export const uploadFile = action({
  args: {
    file: v.bytes(),
    mimeType: v.string(),
    filename: v.string(),
  },
  handler: async (ctx, { file, mimeType, filename }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const {
      file: { fileId, url },
    } = await storeFile(
      ctx,
      components.agent,
      new Blob([file], { type: mimeType }),
      {
        filename,
      },
    );
    return { fileId, url };
  },
});

export const sendMessage = mutation({
  args: {
    threadId: v.optional(v.string()),
    prompt: v.string(),
    model: v.optional(v.string()),
    fileId: v.optional(v.string()),
  },
  handler: async (ctx, { threadId, prompt, model, fileId }) => {
    const userId = await getAuthUserId(ctx);
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt && !fileId) {
      throw new Error("Message cannot be empty");
    }

    const agent = createChatAgent(model ?? DEFAULT_CHAT_MODEL);

    if (!threadId) {
      const titleSource = prompt.trim() || "New chat";
      const { threadId: newThreadId } = await agent.createThread(ctx, {
        userId: userId || undefined,
        title: truncateThreadTitle(titleSource),
      });
      threadId = newThreadId;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let content: any = trimmedPrompt || prompt;
    if (fileId) {
      const { filePart, imagePart } = await getFile(
        ctx,
        components.agent,
        fileId,
      );
      content = trimmedPrompt
        ? [imagePart ?? filePart, { type: "text", text: trimmedPrompt }]
        : [imagePart ?? filePart];
    }

    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId,
      message: { role: "user", content },
      metadata: fileId ? { fileIds: [fileId] } : undefined,
    });

    await ctx.scheduler.runAfter(0, internal.chatGenerate.generate, {
      threadId,
      promptMessageId: messageId,
      model,
    });

    return { threadId };
  },
});

async function deleteMessagesFromStep(
  ctx: MutationCtx,
  agent: ChatAgent,
  threadId: string,
  startOrder: number,
  startStepOrder: number,
) {
  let isDone = false;
  let order = startOrder;
  let stepOrder = startStepOrder;

  while (!isDone) {
    const result = await agent.deleteMessageRange(ctx, {
      threadId,
      startOrder: order,
      startStepOrder: stepOrder,
      endOrder: order + 1_000_000,
    });
    isDone = result.isDone;
    if (!isDone && result.lastOrder !== undefined) {
      order = result.lastOrder;
      stepOrder = (result.lastStepOrder ?? 0) + 1;
    }
  }
}

async function deleteResponseAtOrder(
  ctx: MutationCtx,
  agent: ChatAgent,
  threadId: string,
  order: number,
) {
  let isDone = false;
  let startStepOrder = 1;

  while (!isDone) {
    const result = await agent.deleteMessageRange(ctx, {
      threadId,
      startOrder: order,
      startStepOrder,
      endOrder: order + 1,
    });
    isDone = result.isDone;
    if (!isDone && result.lastStepOrder !== undefined) {
      startStepOrder = result.lastStepOrder + 1;
    }
  }
}

async function authorizeThreadAccess(ctx: MutationCtx, threadId: string) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const thread = await ctx.runQuery(components.agent.threads.getThread, {
    threadId,
  });
  if (!thread || thread.userId !== userId) {
    throw new Error("Thread not found");
  }

  return userId;
}

export const regenerateMessage = mutation({
  args: {
    threadId: v.string(),
    promptMessageId: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, { threadId, promptMessageId, model }) => {
    await authorizeThreadAccess(ctx, threadId);

    const [promptMessage] = await ctx.runQuery(
      components.agent.messages.getMessagesByIds,
      { messageIds: [promptMessageId] },
    );
    if (
      !promptMessage ||
      promptMessage.threadId !== threadId ||
      promptMessage.message?.role !== "user"
    ) {
      throw new Error("User message not found");
    }

    const agent = createChatAgent(model ?? DEFAULT_CHAT_MODEL);
    await deleteMessagesFromStep(ctx, agent, threadId, promptMessage.order, 1);

    await ctx.scheduler.runAfter(0, internal.chatGenerate.generate, {
      threadId,
      promptMessageId,
      model,
    });
  },
});

export const editMessage = mutation({
  args: {
    threadId: v.string(),
    messageId: v.string(),
    prompt: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, { threadId, messageId, prompt, model }) => {
    await authorizeThreadAccess(ctx, threadId);

    const trimmed = prompt.trim();
    if (!trimmed) {
      throw new Error("Message cannot be empty");
    }

    const [userMessage] = await ctx.runQuery(
      components.agent.messages.getMessagesByIds,
      { messageIds: [messageId] },
    );
    if (
      !userMessage ||
      userMessage.threadId !== threadId ||
      userMessage.message?.role !== "user"
    ) {
      throw new Error("User message not found");
    }

    const agent = createChatAgent(model ?? DEFAULT_CHAT_MODEL);

    await agent.updateMessage(ctx, {
      messageId,
      patch: {
        message: { role: "user", content: trimmed },
        status: "success",
      },
    });

    await deleteResponseAtOrder(ctx, agent, threadId, userMessage.order);

    await ctx.scheduler.runAfter(0, internal.chatGenerate.generate, {
      threadId,
      promptMessageId: messageId,
      model,
    });
  },
});

export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    const paginated = await listUIMessages(ctx, components.agent, args);
    const streams = await syncStreams(ctx, components.agent, args);
    return { ...paginated, streams };
  },
});

export const listThreads = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.runQuery(components.agent.threads.listThreadsByUserId, {
      userId,
      paginationOpts: args.paginationOpts,
    });
  },
});

export const getThread = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    return await ctx.runQuery(components.agent.threads.getThread, { threadId });
  },
});

export const renameThread = mutation({
  args: { threadId: v.string(), title: v.string() },
  handler: async (ctx, { threadId, title }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const trimmed = title.trim();
    if (!trimmed) {
      throw new Error("Title cannot be empty");
    }

    await updateThreadMetadata(ctx, components.agent, {
      threadId,
      patch: { title: trimmed },
    });

    return { success: true };
  },
});

export const deleteThread = mutation({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const agent = createChatAgent();

    // Asynchronous delete (safe from mutation)
    await agent.deleteThreadAsync(ctx, { threadId });

    return { success: true };
  },
});
