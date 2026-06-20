import { parseCitysuperProducts } from "@/lib/citysuper/product"

export function safeHostname(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

/** Google S2 favicon URL for a page (domain derived from URL). */
export function faviconUrlForPage(pageUrl: string) {
  let host = pageUrl
  try {
    host = new URL(pageUrl).hostname
  } catch {
    /* use raw string */
  }
  return `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(host)}`
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value.trim())
}

/** Compact label for chain-of-thought source links (title or hostname). */
export function getSourceDisplayTitle({
  url,
  title,
}: {
  url: string
  title?: string | null
}) {
  const trimmed = title?.trim()
  if (trimmed && trimmed !== url && !isHttpUrl(trimmed)) {
    return trimmed
  }
  return safeHostname(url).replace(/^www\./i, "")
}

export function getScrapeInputUrl(input: unknown): string | undefined {
  if (!input || typeof input !== "object") return undefined
  const url = (input as { url?: unknown }).url
  return typeof url === "string" ? url : undefined
}

export function getBatchScrapeInput(input: unknown): {
  urls: string[]
} | null {
  if (!input || typeof input !== "object") return null
  const doc = input as { urls?: unknown }
  if (!Array.isArray(doc.urls)) return null
  const urls = doc.urls.filter((u): u is string => typeof u === "string")
  if (urls.length === 0) return null
  return { urls }
}

/** Combined answer text from batchScrape tool output (concatenates per-page answers). */
export function getBatchScrapeAnswerFromOutput(result: unknown): string | null {
  if (!result || typeof result !== "object") return null
  const doc = result as Record<string, unknown>

  const rows = (() => {
    const data =
      doc.data && typeof doc.data === "object" && !Array.isArray(doc.data)
        ? (doc.data as Record<string, unknown>)
        : doc
    for (const candidate of [data.data, data.results, doc.results, doc.data]) {
      if (Array.isArray(candidate)) return candidate
    }
    return null
  })()

  if (!rows) return null

  const parts: string[] = []
  for (const item of rows) {
    if (!item || typeof item !== "object") continue
    const row = item as Record<string, unknown>
    const json =
      row.json && typeof row.json === "object"
        ? (row.json as Record<string, unknown>)
        : null
    const answer =
      typeof row.answer === "string"
        ? row.answer
        : json && typeof json.answer === "string"
          ? json.answer
          : null
    if (answer?.trim()) {
      const url =
        typeof row.url === "string"
          ? row.url
          : row.metadata &&
              typeof row.metadata === "object" &&
              typeof (row.metadata as Record<string, unknown>).url === "string"
            ? String((row.metadata as Record<string, unknown>).url)
            : "Source"
      parts.push(`## ${url}\n\n${answer.trim()}`)
    }
  }

  return parts.length > 0 ? parts.join("\n\n") : null
}

function decodePartialJsonStringFragment(raw: string): string {
  return raw
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
}

/** Extract `notes` while the model is still streaming tool JSON (input is a string). */
function getThinkNotesFromPartialJson(raw: string): string | undefined {
  const trimmed = raw.trim()
  if (!trimmed) return undefined

  try {
    const parsed = JSON.parse(trimmed) as { notes?: unknown }
    if (typeof parsed.notes === "string") {
      const notes = parsed.notes.trim()
      return notes.length > 0 ? notes : undefined
    }
  } catch {
    /* incomplete JSON — fall through */
  }

  const match = trimmed.match(/"notes"\s*:\s*"((?:[^"\\]|\\.|[\r\n])*)(?:"|$)/)
  if (!match) return undefined

  const notes = decodePartialJsonStringFragment(match[1]).trim()
  return notes.length > 0 ? notes : undefined
}

export function getThinkInputNotes(input: unknown): string | undefined {
  if (typeof input === "string") {
    return getThinkNotesFromPartialJson(input)
  }
  if (!input || typeof input !== "object") return undefined
  const doc = input as {
    notes?: unknown
    args?: unknown
    input?: unknown
  }

  if (typeof doc.notes === "string") {
    const trimmed = doc.notes.trim()
    if (trimmed.length > 0) return trimmed
  }

  for (const candidate of [doc.input, doc.args]) {
    if (typeof candidate === "string") {
      const parsed = getThinkNotesFromPartialJson(candidate)
      if (parsed) return parsed
    }
    if (candidate && typeof candidate === "object") {
      const nested = (candidate as { notes?: unknown }).notes
      if (typeof nested === "string" && nested.trim().length > 0) {
        return nested.trim()
      }
    }
  }

  return undefined
}

export function getSearchInputQuery(input: unknown): string | undefined {
  if (!input || typeof input !== "object") return undefined
  const query = (input as { query?: unknown }).query
  if (typeof query !== "string") return undefined
  const trimmed = query.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function getCitysuperSearchQuery(input: unknown): string | undefined {
  return getSearchInputQuery(input)
}

export function getCitysuperResultCount(output: unknown): number | undefined {
  if (!output || typeof output !== "object") return undefined
  const count = (output as { result_count?: unknown }).result_count
  if (typeof count === "number" && Number.isFinite(count)) return count
  const products = parseCitysuperProducts(output)
  return products.length > 0 ? products.length : undefined
}

export function getShowCitysuperProductCount(output: unknown): number {
  return parseCitysuperProducts(output).length
}

function titleFromMetadataRecord(meta: Record<string, unknown>): string | null {
  const candidates = ["title", "ogTitle", "ogSiteName"] as const
  for (const key of candidates) {
    const v = meta[key]
    if (typeof v === "string" && v.trim()) return v.trim()
  }
  return null
}

/**
 * Title from Firecrawl scrape tool output for compact UI (favicon + title line).
 * Handles nested API shape: `{ success, data: { json, metadata: { title, ogTitle, ... } } }`
 * as well as flatter tool payloads.
 */
export function getScrapePageTitleFromOutput(result: unknown): string | null {
  if (!result || typeof result !== "object") return null
  const doc = result as Record<string, unknown>

  if (typeof doc.title === "string" && doc.title.trim()) {
    return doc.title.trim()
  }

  const metaRoot =
    doc.metadata && typeof doc.metadata === "object"
      ? (doc.metadata as Record<string, unknown>)
      : null
  if (metaRoot) {
    const fromRootMeta = titleFromMetadataRecord(metaRoot)
    if (fromRootMeta) return fromRootMeta
  }

  const dataBlock =
    doc.data && typeof doc.data === "object" && !Array.isArray(doc.data)
      ? (doc.data as Record<string, unknown>)
      : null

  if (dataBlock && typeof dataBlock.title === "string" && dataBlock.title.trim()) {
    return dataBlock.title.trim()
  }

  const metaInData =
    dataBlock?.metadata && typeof dataBlock.metadata === "object"
      ? (dataBlock.metadata as Record<string, unknown>)
      : null
  if (metaInData) {
    const fromDataMeta = titleFromMetadataRecord(metaInData)
    if (fromDataMeta) return fromDataMeta
  }

  return null
}

/** Markdown answer from Firecrawl scrape `query` format (tool output or nested JSON). */
export function getScrapeAnswerFromToolOutput(result: unknown): string | null {
  if (!result || typeof result !== "object") return null

  const candidates: unknown[] = [result]
  const doc = result as Record<string, unknown>

  if (doc.value && typeof doc.value === "object") {
    candidates.push(doc.value)
  }
  if (doc.data && typeof doc.data === "object" && !Array.isArray(doc.data)) {
    candidates.push(doc.data)
    const data = doc.data as Record<string, unknown>
    if (data.json && typeof data.json === "object") {
      candidates.push(data.json)
    }
  }

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue
    const answer = (candidate as Record<string, unknown>).answer
    if (typeof answer === "string" && answer.trim()) {
      return answer.trim()
    }
  }

  return null
}
