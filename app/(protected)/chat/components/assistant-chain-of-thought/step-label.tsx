"use client"

import { TextShimmer } from "@/components/prompt-kit/text-shimmer"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

/** Shimmering label for a chain step while it is still in progress. */
export function ChainStepLabel({
  active,
  children,
  className,
}: {
  active: boolean
  children: ReactNode
  className?: string
}) {
  if (!active) {
    return <>{children}</>
  }

  if (typeof children === "string") {
    return (
      <TextShimmer className={cn("text-sm font-medium", className)}>
        {children}
      </TextShimmer>
    )
  }

  return (
    <TextShimmer as="div" className={cn("text-sm font-medium", className)}>
      {children}
    </TextShimmer>
  )
}
