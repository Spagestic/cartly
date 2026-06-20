import { getBatchScrapeInput } from "./tool-input-output"

export type ToolSource = {
  url: string
  title: string
  description: string
}

function normalizeUrlKey(url: string): string {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "")
    const path = parsed.pathname.replace(/\/$/, "") || ""
    return `${parsed.protocol}//${host}${path}${parsed.search}`
  } catch {
    return url.trim().toLowerCase()
  }
}

/** Unwrap JSON strings and AI SDK `{ value }` tool result envelopes. */
function normalizeToolResult(result: unknown): unknown {
  if (typeof result === "string") {
    try {
      return normalizeToolResult(JSON.parse(result))
    } catch {
      return result
    }
  }
  if (!result || typeof result !== "object") return result
  const doc = result as Record<string, unknown>
  if ("value" in doc && doc.value != null) {
    return normalizeToolResult(doc.value)
  }
  return result
}

function titleFromBatchRowMetadata(
  meta: Record<string, unknown> | null
): string | null {
  if (!meta) return null
  for (const key of ["title", "ogTitle", "ogSiteName"] as const) {
    const value = meta[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

function batchScrapeRowUrl(row: Record<string, unknown>): string | null {
  if (typeof row.url === "string" && row.url.length > 0) return row.url

  const meta =
    row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : null

  if (!meta) return null

  for (const key of ["url", "sourceURL", "sourceUrl", "ogUrl"] as const) {
    const value = meta[key]
    if (typeof value === "string" && value.length > 0) return value
  }

  return null
}

function batchScrapeRowTitle(row: Record<string, unknown>, url: string): string {
  if (typeof row.title === "string" && row.title.trim()) {
    return row.title.trim()
  }

  const meta =
    row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : null

  const fromMeta = titleFromBatchRowMetadata(meta)
  if (fromMeta) return fromMeta

  const dataBlock =
    row.data && typeof row.data === "object" && !Array.isArray(row.data)
      ? (row.data as Record<string, unknown>)
      : null
  if (dataBlock) {
    if (typeof dataBlock.title === "string" && dataBlock.title.trim()) {
      return dataBlock.title.trim()
    }
    const dataMeta =
      dataBlock.metadata && typeof dataBlock.metadata === "object"
        ? (dataBlock.metadata as Record<string, unknown>)
        : null
    const fromDataMeta = titleFromBatchRowMetadata(dataMeta)
    if (fromDataMeta) return fromDataMeta
  }

  return url
}

export function firecrawlSearchHitToSource(
  item: Record<string, unknown>
): ToolSource | null {
  const meta =
    item.metadata && typeof item.metadata === "object"
      ? (item.metadata as Record<string, unknown>)
      : null
  const urlFromMeta =
    meta && typeof meta.url === "string"
      ? meta.url
      : meta && typeof meta.sourceURL === "string"
        ? meta.sourceURL
        : null

  const url =
    typeof item.url === "string" && item.url.length > 0 ? item.url : urlFromMeta

  if (!url) return null

  const title =
    typeof item.title === "string"
      ? item.title
      : meta && typeof meta.title === "string"
        ? meta.title
        : url

  const description =
    typeof item.description === "string"
      ? item.description
      : typeof item.snippet === "string"
        ? item.snippet
        : ""

  return { url, title, description }
}

export function getFirecrawlSearchSourceItems(
  result: Record<string, unknown>
): ToolSource[] {
  const keys = ["web", "news", "images"] as const
  const out: ToolSource[] = []
  const seen = new Set<string>()

  for (const key of keys) {
    const arr = result[key]
    if (!Array.isArray(arr)) continue

    for (const raw of arr) {
      if (raw == null) continue

      if (typeof raw === "string") {
        if (!seen.has(raw)) {
          seen.add(raw)
          out.push({ url: raw, title: raw, description: "" })
        }
        continue
      }

      if (typeof raw !== "object") continue
      const obj = raw as Record<string, unknown>

      let source = firecrawlSearchHitToSource(obj)
      if (!source && key === "images") {
        const imgUrl =
          typeof obj.imageUrl === "string"
            ? obj.imageUrl
            : typeof obj.url === "string"
              ? obj.url
              : null
        if (imgUrl) {
          source = {
            url: imgUrl,
            title: typeof obj.title === "string" ? obj.title : imgUrl,
            description: "",
          }
        }
      }
      if (!source) continue
      if (seen.has(source.url)) continue
      seen.add(source.url)
      out.push(source)
    }
  }

  return out
}

function firecrawlSearchPayload(
  doc: Record<string, unknown>
): Record<string, unknown> | null {
  const data = doc.data
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>
  }
  return null
}

function batchScrapePageRows(result: unknown): Record<string, unknown>[] {
  const normalized = normalizeToolResult(result)
  if (Array.isArray(normalized)) {
    return normalized.filter(
      (item): item is Record<string, unknown> =>
        item != null && typeof item === "object",
    )
  }

  if (!normalized || typeof normalized !== "object") return []
  const doc = normalized as Record<string, unknown>

  const data =
    doc.data && typeof doc.data === "object" && !Array.isArray(doc.data)
      ? (doc.data as Record<string, unknown>)
      : doc

  const candidates = [
    data.data,
    data.results,
    data.pages,
    data.scrapes,
    doc.results,
    doc.data,
    doc.pages,
    doc.scrapes,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(
        (item): item is Record<string, unknown> =>
          item != null && typeof item === "object",
      )
    }
  }

  return []
}

export function getBatchScrapeSourceItems(result: unknown): ToolSource[] {
  const rows = batchScrapePageRows(result)
  if (rows.length === 0) return []

  const seen = new Set<string>()
  const out: ToolSource[] = []

  for (const row of rows) {
    const url = batchScrapeRowUrl(row)
    if (!url) continue

    const key = normalizeUrlKey(url)
    if (seen.has(key)) continue
    seen.add(key)

    out.push({
      url,
      title: batchScrapeRowTitle(row, url),
      description:
        typeof row.error === "string"
          ? row.error
          : typeof row.answer === "string"
            ? row.answer.slice(0, 200)
            : "",
    })
  }

  return out
}

/**
 * URLs + titles for batch scrape UI. Parses tool output when possible; otherwise
 * falls back to tool input URLs with optional title lookup (e.g. from search hits).
 */
export function resolveBatchScrapeDisplayItems(
  output: unknown,
  input: unknown,
  resolveTitle?: (url: string) => string | undefined,
): ToolSource[] {
  const fromOutput = getBatchScrapeSourceItems(output)
  const batchInput = getBatchScrapeInput(input)

  const fallbackTitle = (url: string) =>
    resolveTitle?.(url) ?? url

  const toFallbackSource = (url: string): ToolSource => ({
    url,
    title: fallbackTitle(url),
    description: "",
  })

  if (!batchInput?.urls.length) {
    return fromOutput
  }

  if (fromOutput.length === 0) {
    return batchInput.urls.map(toFallbackSource)
  }

  const byUrl = new Map<string, ToolSource>()
  for (const item of fromOutput) {
    byUrl.set(normalizeUrlKey(item.url), item)
  }

  return batchInput.urls.map((url) => {
    const existing = byUrl.get(normalizeUrlKey(url))
    if (existing) return existing
    return toFallbackSource(url)
  })
}

export function getToolSourceItems(result: unknown): ToolSource[] {
  if (!result || typeof result !== "object") return []

  const doc = result as Record<string, unknown>

  const fromFirecrawl = getFirecrawlSearchSourceItems(doc)
  if (fromFirecrawl.length > 0) return fromFirecrawl

  const nested = firecrawlSearchPayload(doc)
  if (nested) {
    const fromNested = getFirecrawlSearchSourceItems(nested)
    if (fromNested.length > 0) return fromNested
  }

  const maybeSources = doc.sources ?? doc.data
  if (!Array.isArray(maybeSources)) return []

  return maybeSources
    .flatMap((item) => {
      if (!item || typeof item !== "object") return null

      const source = item as {
        url?: unknown
        title?: unknown
        description?: unknown
      }

      if (typeof source.url !== "string") return null

      return {
        url: source.url,
        title: typeof source.title === "string" ? source.title : source.url,
        description:
          typeof source.description === "string" ? source.description : "",
      }
    })
    .filter((item): item is ToolSource => item !== null)
}
