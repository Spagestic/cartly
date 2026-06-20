export const CHAT_MODELS = [
  { id: "mistral-large-2512", label: "Mistral Large 3" },
  { id: "mistral-medium-3-5", label: "Mistral Medium 3.5" },
  { id: "mistral-small-2603", label: "Mistral Small 4" },
  { id: "devstral-2512", label: "Devstral 2" },
] as const;

export type ChatModelId = (typeof CHAT_MODELS)[number]["id"];

export const DEFAULT_CHAT_MODEL: ChatModelId = "mistral-large-2512";
