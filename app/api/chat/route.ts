import { convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai"
import { mistral } from "@ai-sdk/mistral"
import { search, scrape, interact, batchScrape, poll } from "firecrawl-aisdk"

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: mistral("mistral-large-2512"),
    messages: await convertToModelMessages(messages),
    system: `You are a helpful research assistant. The current date is ${new Date().toLocaleDateString()}. Use search, then batchScrape at least 3 relevant URLs from results. If pages are not useful, scrape other URLs or search again with a different query — never refuse after only one source. Always end with a direct synthesized answer.`,
    tools: {
      search: search,
      scrape: scrape,
      interact: interact,
      batchScrape: batchScrape,
      poll: poll,
    },
    // toolChoice: "required", // Force tool calls at every step
    stopWhen: stepCountIs(20),
  })

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
  })
}
