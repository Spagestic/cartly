import {
  isFileUIPart,
  isReasoningUIPart,
  isToolUIPart,
  type ToolUIPart,
  type UIMessage,
} from "ai"
import {
  getBatchScrapeAnswerFromOutput,
  getScrapeAnswerFromToolOutput,
  getScrapePageTitleFromOutput,
  getThinkInputNotes,
} from "./tool-input-output"
import {
  getToolSourceItems,
  resolveBatchScrapeDisplayItems,
} from "./tool-source"

type AssistantChainToolName =
  | "search"
  | "scrape"
  | "batchScrape"
  | "think"
  | "citysuperSearch"
  | "showCitysuperProducts"

export function assistantChainToolName(
  part: UIMessage["parts"][number]
): AssistantChainToolName | null {
  if (!isToolUIPart(part)) return null
  if (part.type === "dynamic-tool") {
    if (
      part.toolName === "search" ||
      part.toolName === "scrape" ||
      part.toolName === "batchScrape" ||
      part.toolName === "think" ||
      part.toolName === "citysuperSearch" ||
      part.toolName === "showCitysuperProducts"
    ) {
      return part.toolName
    }
    return null
  }
  const name = part.type.slice(5)
  return name === "search" ||
    name === "scrape" ||
    name === "batchScrape" ||
    name === "think" ||
    name === "citysuperSearch" ||
    name === "showCitysuperProducts"
    ? name
    : null
}

/** Prefer later tool lifecycle states (and richer outputs) when stream deltas repeat a call. */
function assistantChainToolPartRank(
  part: UIMessage["parts"][number]
): number {
  if (!isToolUIPart(part)) return 0

  switch (part.state) {
    case "input-streaming":
      return 0
    case "input-available":
      return 1
    case "output-error":
      return 4
    case "output-available": {
      let rank = 3
      const toolName = assistantChainToolName(part)
      if (toolName === "search") {
        rank += Math.min(getToolSourceItems(part.output).length, 5)
      } else if (toolName === "batchScrape") {
        rank += Math.min(
          resolveBatchScrapeDisplayItems(part.output, part.input).length,
          5,
        )
      } else if (toolName === "scrape" && getScrapePageTitleFromOutput(part.output)) {
        rank += 1
      } else if (toolName === "think" && getThinkInputNotes(part.input)) {
        rank += 1
      } else if (
        toolName === "citysuperSearch" ||
        toolName === "showCitysuperProducts"
      ) {
        rank += 1
      } else if (part.output != null) {
        rank += 1
      }
      return rank
    }
    default:
      return 0
  }
}

function hasToolInput(input: ToolUIPart["input"] | undefined): boolean {
  if (input === undefined) return false
  if (typeof input === "string") return input.length > 0
  if (typeof input === "object" && input !== null) {
    return Object.keys(input).length > 0
  }
  return true
}

/** Merge two lifecycle snapshots for the same tool call into one UI part. */
function mergeChainToolParts(
  a: UIMessage["parts"][number],
  b: UIMessage["parts"][number]
): UIMessage["parts"][number] {
  if (!isToolUIPart(a) || !isToolUIPart(b)) {
    return assistantChainToolPartRank(a) >= assistantChainToolPartRank(b) ? a : b
  }

  const [primary, secondary] =
    assistantChainToolPartRank(a) >= assistantChainToolPartRank(b) ? [a, b] : [b, a]

  const merged = { ...primary } as ToolUIPart

  if (!hasToolInput(merged.input) && hasToolInput(secondary.input)) {
    merged.input = secondary.input
  }

  if (
    assistantChainToolName(merged) === "think" &&
    assistantChainToolName(secondary) === "think"
  ) {
    const primaryNotes = getThinkInputNotes(merged.input) ?? ""
    const secondaryNotes = getThinkInputNotes(secondary.input) ?? ""
    if (secondaryNotes.length > primaryNotes.length) {
      merged.input = secondary.input
    }
    if (
      secondary.state === "input-streaming" &&
      merged.state !== "output-available" &&
      merged.state !== "output-error" &&
      secondaryNotes.length >= primaryNotes.length
    ) {
      merged.state = secondary.state
    }
  }

  if (
    "callProviderMetadata" in merged &&
    "callProviderMetadata" in secondary &&
    !merged.callProviderMetadata &&
    secondary.callProviderMetadata
  ) {
    merged.callProviderMetadata = secondary.callProviderMetadata
  }

  return merged
}

function stripOrphanStepStarts(parts: UIMessage["parts"]): UIMessage["parts"] {
  const out: UIMessage["parts"] = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (part.type !== "step-start") {
      out.push(part)
      continue
    }

    const hasRenderableFollower = parts
      .slice(i + 1)
      .some(isRenderableAssistantChainPart)

    if (hasRenderableFollower) {
      out.push(part)
    }
  }

  return out
}

/**
 * Streamed assistant messages can append multiple UI parts for the same tool call
 * (e.g. input-available then output-available). Merge into one entry per `toolCallId`.
 */
export function dedupeAssistantChainToolParts(
  parts: UIMessage["parts"]
): UIMessage["parts"] {
  const mergedByCallId = new Map<string, UIMessage["parts"][number]>()
  const firstIndexByCallId = new Map<string, number>()
  let hasChainTools = false

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (!isAssistantChainToolUIPart(part) || !isToolUIPart(part)) continue

    hasChainTools = true
    const id = part.toolCallId
    const existing = mergedByCallId.get(id)

    if (!existing) {
      firstIndexByCallId.set(id, i)
      mergedByCallId.set(id, part)
    } else {
      mergedByCallId.set(id, mergeChainToolParts(existing, part))
    }
  }

  if (!hasChainTools) {
    return stripOrphanStepStarts(parts)
  }

  const emitted = new Set<string>()
  const out: UIMessage["parts"] = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    if (isAssistantChainToolUIPart(part) && isToolUIPart(part)) {
      const id = part.toolCallId
      if (firstIndexByCallId.get(id) !== i) continue
      if (emitted.has(id)) continue
      emitted.add(id)
      out.push(mergedByCallId.get(id)!)
      continue
    }

    out.push(part)
  }

  return stripOrphanStepStarts(out)
}

/** Tools shown in the chain UI (static `tool-*` or `dynamic-tool` by name). */
export function isAssistantChainToolUIPart(
  part: UIMessage["parts"][number]
): boolean {
  if (!isToolUIPart(part)) return false
  if (part.type === "dynamic-tool") {
    return (
      part.toolName === "search" ||
      part.toolName === "scrape" ||
      part.toolName === "batchScrape" ||
      part.toolName === "think" ||
      part.toolName === "citysuperSearch" ||
      part.toolName === "showCitysuperProducts"
    )
  }
  const name = part.type.slice(5)
  return (
    name === "search" ||
    name === "scrape" ||
    name === "batchScrape" ||
    name === "think" ||
    name === "citysuperSearch" ||
    name === "showCitysuperProducts"
  )
}

/** Latest completed showCitysuperProducts tool part (for product card segment). */
export function findShowCitysuperProductsPart(
  parts: UIMessage["parts"],
): UIMessage["parts"][number] | null {
  let found: UIMessage["parts"][number] | null = null
  for (const part of parts) {
    if (!isToolUIPart(part)) continue
    if (assistantChainToolName(part) !== "showCitysuperProducts") continue
    if (part.state !== "output-available") continue
    found = part
  }
  return found
}

/**
 * When the agent stops after tools without a text step, scrape `query` outputs
 * often contain the formatted answer — use the last non-empty one for display.
 */
export function extractAssistantAnswerFromToolParts(
  parts: UIMessage["parts"]
): string | null {
  const deduped = dedupeAssistantChainToolParts(parts)
  let lastAnswer: string | null = null

  for (const part of deduped) {
    if (!isAssistantChainToolUIPart(part) || !isToolUIPart(part)) continue
    if (part.state !== "output-available") continue
    const toolName = assistantChainToolName(part)
    if (toolName !== "scrape" && toolName !== "batchScrape") continue

    const answer =
      toolName === "batchScrape"
        ? getBatchScrapeAnswerFromOutput(part.output)
        : getScrapeAnswerFromToolOutput(part.output)
    if (answer) lastAnswer = answer
  }

  return lastAnswer
}

export function isRenderableAssistantChainPart(
  part: UIMessage["parts"][number]
): boolean {
  if (isReasoningUIPart(part)) return true
  if (isAssistantChainToolUIPart(part)) return true
  if (
    isFileUIPart(part) &&
    typeof part.mediaType === "string" &&
    part.mediaType.startsWith("image/")
  ) {
    return true
  }
  return false
}

/** Top-level chain steps shown for reasoning, each chain tool call, and image attachments. */
export function countRenderableChainSteps(
  parts: UIMessage["parts"]
): number {
  let n = 0
  for (const part of dedupeAssistantChainToolParts(parts)) {
    if (isReasoningUIPart(part)) {
      n += 1
      continue
    }
    if (isAssistantChainToolUIPart(part)) {
      n += 1
      continue
    }
    if (
      isFileUIPart(part) &&
      typeof part.mediaType === "string" &&
      part.mediaType.startsWith("image/")
    ) {
      n += 1
    }
  }
  return n
}
