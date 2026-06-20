import { cjk } from "@streamdown/cjk"
import { code } from "@streamdown/code"
import { math } from "@streamdown/math"
import { mermaid } from "@streamdown/mermaid"
import type { LinkSafetyConfig, PluginConfig } from "streamdown"

/**
 * Shared Streamdown plugins. Cast to PluginConfig because @streamdown/code's
 * HighlightOptions (ThemeInput themes) is slightly ahead of streamdown's types
 * ([string, string]); runtime behavior is compatible.
 */
export const streamdownPlugins = {
  cjk,
  code,
  math,
  mermaid,
} as PluginConfig

/** Open markdown links directly instead of Streamdown's confirmation modal. */
export const streamdownLinkSafety: LinkSafetyConfig = {
  enabled: false,
}
