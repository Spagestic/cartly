import { isTextUIPart, type UIMessage } from "ai"
import { parseShowCitysuperDisplay } from "@/lib/citysuper/product"
import type { CitysuperProductDisplay } from "@/lib/citysuper/product"
import {
  dedupeAssistantChainToolParts,
  extractAssistantAnswerFromToolParts,
  findShowCitysuperProductsPart,
  isRenderableAssistantChainPart,
} from "./parts"

export type AssistantUIMessageSegment =
  | {
      kind: "text"
      text: string
      isStreaming: boolean
      key: string
    }
  | {
      kind: "chain"
      parts: UIMessage["parts"]
      key: string
    }
  | {
      kind: "products"
      title?: string
      products: CitysuperProductDisplay[]
      key: string
    }

function productsSegmentFromParts(
  parts: UIMessage["parts"],
  keySuffix: string,
): AssistantUIMessageSegment | null {
  const displayPart = findShowCitysuperProductsPart(parts)
  if (!displayPart || !("output" in displayPart)) return null
  const { title, products } = parseShowCitysuperDisplay(displayPart.output)
  if (products.length === 0) return null
  return {
    kind: "products",
    title,
    products,
    key: `products-${"toolCallId" in displayPart ? displayPart.toolCallId : keySuffix}-${keySuffix}`,
  }
}

/**
 * Splits assistant `parts` in stream order so reasoning / think / search / scrape / image
 * steps can render between text blocks (see UIMessage `parts` in the AI SDK).
 * Skips `step-start` and other non-text parts that are not shown in the chain UI.
 */
export function buildAssistantUIMessageSegments(
  parts: UIMessage["parts"],
  options?: { fallbackText?: string },
): AssistantUIMessageSegment[] {
  const segments: AssistantUIMessageSegment[] = []

  let textBuffer = ""
  let textStreaming = false
  let textStartIdx: number | null = null

  let chainBuffer: UIMessage["parts"] = []
  let chainStartIdx: number | null = null

  const flushText = () => {
    if (textBuffer.length > 0 && textStartIdx !== null) {
      segments.push({
        kind: "text",
        text: textBuffer,
        isStreaming: textStreaming,
        key: `text-${textStartIdx}`,
      })
    }
    textBuffer = ""
    textStreaming = false
    textStartIdx = null
  }

  const flushChain = () => {
    if (chainBuffer.length > 0 && chainStartIdx !== null) {
      const dedupedChain = dedupeAssistantChainToolParts(chainBuffer)
      segments.push({
        kind: "chain",
        parts: dedupedChain,
        key: `chain-${chainStartIdx}`,
      })
      const productsSeg = productsSegmentFromParts(dedupedChain, String(chainStartIdx))
      if (productsSeg) {
        segments.push(productsSeg)
      }
    }
    chainBuffer = []
    chainStartIdx = null
  }

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    if (part.type === "step-start") {
      continue
    }

    if (isTextUIPart(part)) {
      flushChain()
      if (textStartIdx === null) {
        textStartIdx = i
      }
      textBuffer += part.text
      textStreaming ||= part.state === "streaming"
    } else if (isRenderableAssistantChainPart(part)) {
      flushText()
      if (chainStartIdx === null) {
        chainStartIdx = i
      }
      chainBuffer.push(part)
    } else {
      flushText()
      flushChain()
    }
  }

  flushText()
  flushChain()

  const hasTextSegment = segments.some(
    (s) => s.kind === "text" && s.text.trim().length > 0,
  )
  if (!hasTextSegment) {
    const fallback =
      options?.fallbackText?.trim() ||
      extractAssistantAnswerFromToolParts(parts)
    if (fallback) {
      segments.push({
        kind: "text",
        text: fallback,
        isStreaming: false,
        key: "text-fallback",
      })
    }
  }

  return segments
}
