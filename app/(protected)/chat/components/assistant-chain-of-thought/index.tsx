"use client"

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtImage,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought"
import { isFileUIPart, isReasoningUIPart, isToolUIPart, type UIMessage } from "ai"
import { TextShimmer } from "@/components/prompt-kit/text-shimmer"
import { Brain, Image as LucideImageIcon, NotebookPen } from "lucide-react"
import { ChainStepLabel } from "./step-label"
import { useCallback, useMemo, useState } from "react"
import {
  streamdownLinkSafety,
  streamdownPlugins,
} from "@/lib/streamdown-plugins"
import { Streamdown } from "streamdown"
import {
  countRenderableChainSteps,
  dedupeAssistantChainToolParts,
  isAssistantChainToolUIPart,
  isRenderableAssistantChainPart,
} from "./parts"
import {
  buildAssistantUIMessageSegments,
  type AssistantUIMessageSegment,
} from "./segments"
import { renderToolChainSteps } from "./tools"
import { buildUrlTitleLookup } from "./url-title-lookup"

export {
  type AssistantUIMessageSegment,
  buildAssistantUIMessageSegments,
}

export function AssistantChainOfThought({
  parts,
  titleLookupParts,
  isStreaming,
}: {
  parts: UIMessage["parts"]
  /** Full assistant message parts so scrape steps can show titles from earlier search hits. */
  titleLookupParts?: UIMessage["parts"]
  isStreaming: boolean
}) {
  const [openWhenIdle, setOpenWhenIdle] = useState(true)
  const chainParts = useMemo(
    () => dedupeAssistantChainToolParts(parts),
    [parts]
  )
  const urlTitleLookup = useMemo(
    () => buildUrlTitleLookup(titleLookupParts ?? parts),
    [titleLookupParts, parts]
  )
  const open = isStreaming ? true : openWhenIdle
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!isStreaming) {
        setOpenWhenIdle(next)
      }
    },
    [isStreaming]
  )

  const hasRenderableParts = chainParts.some(isRenderableAssistantChainPart)

  // While the assistant message is streaming but has not produced any renderable
  // chain part yet (e.g. only a `step-start`), keep showing the planning
  // placeholder so the Chain of Thought does not flicker out and back in.
  if (!hasRenderableParts && !isStreaming) {
    return null
  }

  const stepCount = countRenderableChainSteps(chainParts)
  const completedStepsLabel =
    stepCount === 1
      ? "Completed 1 Step"
      : `Completed ${stepCount} Steps`

  return (
    <ChainOfThought
      className="mb-3"
      open={open}
      onOpenChange={handleOpenChange}
    >
      <ChainOfThoughtHeader>
        {isStreaming ? (
          <TextShimmer>Chain of Thought</TextShimmer>
        ) : (
          completedStepsLabel
        )}
      </ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        {!hasRenderableParts ? (
          <ChainOfThoughtStep
            icon={NotebookPen}
            label={<ChainStepLabel active>Planning next steps</ChainStepLabel>}
            status="active"
          />
        ) : null}
        {chainParts.map((part, index) => {
          if (isReasoningUIPart(part)) {
            // Reasoning parts should flip to `done` after `reasoning-end` (see stream protocol). In
            // multi-step tool flows, a part can remain `streaming` in state while the chat is already
            // finished — gate "active" on the message-level stream so the UI does not freeze.
            const reasoningActive = isStreaming && part.state === "streaming"
            return (
              <ChainOfThoughtStep
                key={`reasoning-${index}`}
                icon={Brain}
                label={
                  <ChainStepLabel active={reasoningActive}>
                    Reasoning
                  </ChainStepLabel>
                }
                status={reasoningActive ? "active" : "complete"}
              >
                <div className="not-prose text-muted-foreground">
                  <Streamdown
                    plugins={streamdownPlugins}
                    linkSafety={streamdownLinkSafety}
                    isAnimating={reasoningActive}
                  >
                    {part.text}
                  </Streamdown>
                </div>
              </ChainOfThoughtStep>
            )
          }

          if (isToolUIPart(part) && isAssistantChainToolUIPart(part)) {
            return (
              <div key={part.toolCallId} className="space-y-3">
                {renderToolChainSteps(part, urlTitleLookup)}
              </div>
            )
          }

          if (isFileUIPart(part) && part.mediaType.startsWith("image/")) {
            return (
              <ChainOfThoughtStep
                key={`file-${part.url}-${index}`}
                icon={LucideImageIcon}
                label={part.filename ?? "Image"}
                status="complete"
              >
                <ChainOfThoughtImage
                  caption={part.filename ?? part.mediaType ?? "Attached image"}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- data URLs and arbitrary attachment hosts */}
                  <img
                    src={part.url}
                    alt={part.filename ?? "Attached image"}
                    className="aspect-square max-h-50 border object-contain"
                  />
                </ChainOfThoughtImage>
              </ChainOfThoughtStep>
            )
          }

          return null
        })}
      </ChainOfThoughtContent>
    </ChainOfThought>
  )
}
