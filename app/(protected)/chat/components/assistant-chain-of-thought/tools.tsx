"use client"

import {
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought"
import { ChainStepLabel } from "./step-label"
import { isToolUIPart, type UIMessage } from "ai"
import { Globe, NotebookPen, Search, ShoppingBag } from "lucide-react"
import type { ReactNode } from "react"
import {
  streamdownLinkSafety,
  streamdownPlugins,
} from "@/lib/streamdown-plugins"
import { Streamdown } from "streamdown"
import { ChainSourceLink, SourceFaviconPreview } from "./source-link-badge"
import {
  getScrapeInputUrl,
  getScrapePageTitleFromOutput,
  getBatchScrapeInput,
  getCitysuperResultCount,
  getCitysuperSearchQuery,
  getShowCitysuperProductCount,
  getSearchInputQuery,
  getThinkInputNotes,
  safeHostname,
} from "./tool-input-output"
import {
  getToolSourceItems,
  resolveBatchScrapeDisplayItems,
  type ToolSource,
} from "./tool-source"
import { lookupUrlTitle } from "./url-title-lookup"

function SearchSourceBadges({ items }: { items: ToolSource[] }) {
  return (
    <ChainOfThoughtSearchResults className="flex-col items-stretch gap-1.5">
      {items.map((source) => (
        <ChainSourceLink
          key={source.url}
          url={source.url}
          title={source.title}
        />
      ))}
    </ChainOfThoughtSearchResults>
  )
}

function ScrapeSourceLink({
  url,
  pageTitle,
}: {
  url: string
  pageTitle?: string | null
}) {
  return (
    <ChainOfThoughtSearchResults className="flex-col items-stretch gap-1.5">
      <ChainSourceLink url={url} title={pageTitle} />
    </ChainOfThoughtSearchResults>
  )
}

export function renderToolChainSteps(
  part: UIMessage["parts"][number],
  urlTitleLookup: Map<string, string> = new Map(),
): ReactNode {
  if (!isToolUIPart(part)) return null
  const toolName =
    part.type === "dynamic-tool" ? part.toolName : part.type.slice(5)

  const isLoading =
    part.state === "input-streaming" || part.state === "input-available"

  if (toolName === "think") {
    const notes = getThinkInputNotes(part.input)
    return (
      <ChainOfThoughtStep
        icon={NotebookPen}
        label={
          <ChainStepLabel active={isLoading}>
            {isLoading && !notes ? "Planning next steps" : "Planning"}
          </ChainStepLabel>
        }
        description={
          part.state === "output-error"
            ? `Tool error: ${part.errorText ?? "Unknown error"}`
            : undefined
        }
        status={isLoading ? "active" : "complete"}
      >
        {notes ? (
          <div className="not-prose text-muted-foreground">
            <Streamdown
              plugins={streamdownPlugins}
              linkSafety={streamdownLinkSafety}
              isAnimating={isLoading}
            >
              {notes}
            </Streamdown>
          </div>
        ) : null}
      </ChainOfThoughtStep>
    )
  }

  if (toolName === "citysuperSearch") {
    const searchQuery = getCitysuperSearchQuery(part.input)
    const searchQueryCode = searchQuery ? (
      <code className="rounded-md border border-border/80 bg-muted/60 px-1.5 py-px font-mono text-[0.75rem] text-foreground">
        {searchQuery}
      </code>
    ) : null
    const resultCount =
      part.state === "output-available"
        ? getCitysuperResultCount(part.output)
        : undefined

    return (
      <ChainOfThoughtStep
        icon={ShoppingBag}
        label={
          <ChainStepLabel active={isLoading}>
            {isLoading
              ? searchQuery
                ? `Searching City'super for ${searchQuery}`
                : "Searching City'super"
              : searchQueryCode ? (
                  <p className="text-sm text-muted-foreground">
                    Searched City'super for {searchQueryCode}
                  </p>
                ) : (
                  "City'super search"
                )}
          </ChainStepLabel>
        }
        description={
          part.state === "output-error"
            ? `Tool error: ${part.errorText ?? "Unknown error"}`
            : resultCount != null && !isLoading
              ? `${resultCount} products found`
              : undefined
        }
        status={isLoading ? "active" : "complete"}
      />
    )
  }

  if (toolName === "showCitysuperProducts") {
    const pickCount =
      part.state === "output-available"
        ? getShowCitysuperProductCount(part.output)
        : getShowCitysuperProductCount(part.input)

    return (
      <ChainOfThoughtStep
        icon={ShoppingBag}
        label={
          <ChainStepLabel active={isLoading}>
            {isLoading
              ? "Preparing product picks"
              : pickCount > 0
                ? `Showing ${pickCount} product picks`
                : "Product picks ready"}
          </ChainStepLabel>
        }
        description={
          part.state === "output-error"
            ? `Tool error: ${part.errorText ?? "Unknown error"}`
            : undefined
        }
        status={isLoading ? "active" : "complete"}
      />
    )
  }

  if (
    toolName !== "search" &&
    toolName !== "scrape" &&
    toolName !== "batchScrape"
  ) {
    return null
  }

  const sourceItems =
    part.state === "output-available" ? getToolSourceItems(part.output) : []

  const scrapeUrl = getScrapeInputUrl(part.input)
  const batchScrapeInput = getBatchScrapeInput(part.input)
  const batchScrapeItems =
    toolName === "batchScrape"
      ? resolveBatchScrapeDisplayItems(
          part.state === "output-available" ? part.output : null,
          part.input,
          (url) => lookupUrlTitle(urlTitleLookup, url),
        )
      : []

  if (toolName === "search") {
    const searchQuery = getSearchInputQuery(part.input)
    const searchQueryCode = searchQuery ? (
      <code className="rounded-md border border-border/80 bg-muted/60 px-1.5 py-px font-mono text-[0.75rem] text-foreground">
        {searchQuery}
      </code>
    ) : null

    return (
      <ChainOfThoughtStep
        icon={Search}
        label={
          <ChainStepLabel active={isLoading}>
            {isLoading
              ? searchQuery
                ? `Searching for ${searchQuery}`
                : "Searching across sources"
              : searchQueryCode ? (
              <p className="text-sm text-muted-foreground">
                Searched for {searchQueryCode}
              </p>
              ) : (
                "Web search"
              )}
          </ChainStepLabel>
        }
        description={
          part.state === "output-error"
            ? `Tool error: ${part.errorText ?? "Unknown error"}`
            : undefined
        }
        status={isLoading ? "active" : "complete"}
        collapsedPreview={
          sourceItems.length > 0 ? (
            <SourceFaviconPreview urls={sourceItems.map((item) => item.url)} />
          ) : undefined
        }
      >
        {part.state === "output-available" && sourceItems.length > 0 ? (
          <SearchSourceBadges items={sourceItems} />
        ) : null}
      </ChainOfThoughtStep>
    )
  }

  if (toolName === "batchScrape") {
    const urlCount =
      batchScrapeItems.length > 0
        ? batchScrapeItems.length
        : (batchScrapeInput?.urls.length ?? 0)
    const scrapeListItems: ToolSource[] = isLoading
      ? (batchScrapeInput?.urls.map((url) => ({
          url,
          title: lookupUrlTitle(urlTitleLookup, url) ?? safeHostname(url),
          description: "",
        })) ?? [])
      : batchScrapeItems

    return (
      <ChainOfThoughtStep
        icon={Globe}
        label={
          <ChainStepLabel active={isLoading}>
            {isLoading
              ? urlCount > 0
                ? `Scraping ${urlCount} pages in parallel`
                : "Scraping pages in parallel"
              : urlCount > 0
                ? `Scraped ${urlCount} pages`
                : "Scraped pages"}
          </ChainStepLabel>
        }
        description={
          part.state === "output-error"
            ? `Tool error: ${part.errorText ?? "Unknown error"}`
            : undefined
        }
        status={isLoading ? "active" : "complete"}
        collapsible={scrapeListItems.length > 0}
        collapsedPreview={
          scrapeListItems.length > 0 ? (
            <SourceFaviconPreview
              urls={scrapeListItems.map((item) => item.url)}
            />
          ) : undefined
        }
      >
        {scrapeListItems.length > 0 ? (
          <SearchSourceBadges items={scrapeListItems} />
        ) : null}
      </ChainOfThoughtStep>
    )
  }

  const hostname = scrapeUrl ? safeHostname(scrapeUrl) : "Source"
  const pageTitle =
    getScrapePageTitleFromOutput(part.output) ??
    (scrapeUrl ? lookupUrlTitle(urlTitleLookup, scrapeUrl) : null)

  const steps: ReactNode[] = [
    <ChainOfThoughtStep
      key={`${part.toolCallId}-fetch`}
      icon={Globe}
      label={
        <ChainStepLabel active={isLoading}>
          {isLoading
            ? "Fetching page content"
            : scrapeUrl
              ? `Scraped ${hostname}`
              : "Scraping source"}
        </ChainStepLabel>
      }
      description={
        part.state === "output-error"
          ? `Tool error: ${part.errorText ?? "Unknown error"}`
          : undefined
      }
      status={isLoading ? "active" : "complete"}
      collapsedPreview={
        scrapeUrl ? <SourceFaviconPreview urls={[scrapeUrl]} /> : undefined
      }
    >
      {scrapeUrl ? (
        <ScrapeSourceLink url={scrapeUrl} pageTitle={pageTitle} />
      ) : null}
    </ChainOfThoughtStep>,
  ]

  return <>{steps}</>
}
