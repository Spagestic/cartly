import { isToolUIPart, type UIMessage } from "ai"
import {
  dedupeAssistantChainToolParts,
  isAssistantChainToolUIPart,
} from "./parts"
import {
  getToolSourceItems,
  resolveBatchScrapeDisplayItems,
} from "./tool-source"
import {
  getScrapeInputUrl,
  getScrapePageTitleFromOutput,
} from "./tool-input-output"

/** Stable key for matching scrape URLs to titles from search / prior scrapes. */
export function normalizeUrlLookupKey(url: string): string {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "")
    const path = parsed.pathname.replace(/\/$/, "") || ""
    return `${parsed.protocol}//${host}${path}${parsed.search}`
  } catch {
    return url.trim().toLowerCase()
  }
}

function hostnameKey(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return null
  }
}

function isUsefulTitle(title: string, url: string): boolean {
  const trimmed = title.trim()
  if (!trimmed || trimmed === url) return false
  return !/^https?:\/\//i.test(trimmed)
}

/** Titles gathered from search hits and completed scrapes in the same assistant message. */
export function buildUrlTitleLookup(
  parts: UIMessage["parts"],
): Map<string, string> {
  const map = new Map<string, string>()

  const remember = (url: string, title: string) => {
    if (!isUsefulTitle(title, url)) return
    const key = normalizeUrlLookupKey(url)
    if (!map.has(key)) {
      map.set(key, title.trim())
    }
    const host = hostnameKey(url)
    if (host && !map.has(host)) {
      map.set(host, title.trim())
    }
  }

  for (const part of dedupeAssistantChainToolParts(parts)) {
    if (!isToolUIPart(part) || !isAssistantChainToolUIPart(part)) continue
    if (part.state !== "output-available" || part.output == null) continue

    const toolName =
      part.type === "dynamic-tool" ? part.toolName : part.type.slice(5)

    if (toolName === "search") {
      for (const item of getToolSourceItems(part.output)) {
        remember(item.url, item.title)
      }
      continue
    }

    if (toolName === "batchScrape") {
      for (const item of resolveBatchScrapeDisplayItems(
        part.output,
        part.input,
      )) {
        remember(item.url, item.title)
      }
      continue
    }

    if (toolName === "scrape") {
      const url = getScrapeInputUrl(part.input)
      const title = getScrapePageTitleFromOutput(part.output)
      if (url && title) remember(url, title)
    }
  }

  return map
}

export function lookupUrlTitle(
  lookup: Map<string, string>,
  url: string,
): string | undefined {
  const normalized = normalizeUrlLookupKey(url)
  const direct = lookup.get(normalized)
  if (direct) return direct

  const host = hostnameKey(url)
  if (host) {
    const byHost = lookup.get(host)
    if (byHost) return byHost
  }

  return undefined
}
