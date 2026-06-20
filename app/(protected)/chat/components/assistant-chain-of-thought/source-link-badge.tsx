"use client"

import { ChainOfThoughtSearchResult } from "@/components/ai-elements/chain-of-thought"
import {
  faviconUrlForPage,
  getSourceDisplayTitle,
} from "./tool-input-output"

const PREVIEW_FAVICON_COUNT = 3

/** Three favicons + “+N more” for collapsed search/scrape step headers. */
export function SourceFaviconPreview({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null

  const previewUrls = urls.slice(0, PREVIEW_FAVICON_COUNT)
  const remaining = urls.length - previewUrls.length

  const moreLabel =
    remaining > 0 ? `, and ${remaining} more` : ""

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5"
      aria-label={`${urls.length} source${urls.length === 1 ? "" : "s"}${moreLabel}`}
    >
      <span className="inline-flex items-center -space-x-1">
        {previewUrls.map((url) => (
          // eslint-disable-next-line @next/next/no-img-element -- external favicon URLs
          <img
            key={url}
            src={faviconUrlForPage(url)}
            alt=""
            width={16}
            height={16}
            className="size-4 shrink-0 rounded-sm ring-2 ring-background"
            loading="lazy"
            decoding="async"
          />
        ))}
      </span>
      {remaining > 0 ? (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          +{remaining} more
        </span>
      ) : null}
    </span>
  )
}

export function ChainSourceLink({
  url,
  title,
}: {
  url: string
  title?: string | null
}) {
  const displayTitle = getSourceDisplayTitle({ url, title })
  const tooltip = title?.trim() && title.trim() !== url ? title.trim() : url

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-full min-w-0"
      title={tooltip}
    >
      <ChainOfThoughtSearchResult className="h-auto max-w-full min-w-0 justify-start py-1">
        <span className="flex min-w-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- external favicon URLs */}
          <img
            src={faviconUrlForPage(url)}
            alt=""
            width={16}
            height={16}
            className="size-4 shrink-0 rounded-sm"
            loading="lazy"
            decoding="async"
          />
          <span className="truncate">{displayTitle}</span>
        </span>
      </ChainOfThoughtSearchResult>
    </a>
  )
}
