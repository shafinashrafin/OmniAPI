export const PROVIDER_CONFIG: Record<
  string,
  {
    displayName: string;
    baseUrl: string;
    modelsEndpoint: string;
    chatEndpoint: string;
    color: string;
    icon: string;
  }
> = {
  openai: {
    displayName: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    modelsEndpoint: "/models",
    chatEndpoint: "/chat/completions",
    color: "#10a37f",
    icon: "◯",
  },
  google: {
    displayName: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    modelsEndpoint: "/models",
    chatEndpoint: "/chat/completions",
    color: "#4285f4",
    icon: "◆",
  },
  anthropic: {
    displayName: "Anthropic Claude",
    baseUrl: "https://api.anthropic.com/v1",
    modelsEndpoint: "/models",
    chatEndpoint: "/messages",
    color: "#d4a574",
    icon: "◈",
  },
  deepseek: {
    displayName: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    modelsEndpoint: "/models",
    chatEndpoint: "/chat/completions",
    color: "#0066ff",
    icon: "◇",
  },
  grok: {
    displayName: "Grok (xAI)",
    baseUrl: "https://api.x.ai/v1",
    modelsEndpoint: "/models",
    chatEndpoint: "/chat/completions",
    color: "#1da1f2",
    icon: "✦",
  },
  mistral: {
    displayName: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    modelsEndpoint: "/models",
    chatEndpoint: "/chat/completions",
    color: "#ff7000",
    icon: "▲",
  },
  openrouter: {
    displayName: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    modelsEndpoint: "/models",
    chatEndpoint: "/chat/completions",
    color: "#8b5cf6",
    icon: "◎",
  },
};

export const PROVIDER_NAMES = Object.keys(PROVIDER_CONFIG);

// Default models for each provider (used when we can't fetch from API due to CORS)
export const DEFAULT_MODELS: Record<string, string[]> = {
  openai: [
    "gpt-4o",
    "gpt-4o-mini", 
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo",
    "o1-preview",
    "o1-mini",
  ],
  google: [
    "gemini-2.5-flash-preview-05-20",
    "gemini-2.5-pro-preview-05-06",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ],
  anthropic: [
    "claude-sonnet-4-20250514",
    "claude-3-7-sonnet-20250219",
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
    "claude-3-opus-20240229",
  ],
  deepseek: [
    "deepseek-chat",
    "deepseek-reasoner",
  ],
  grok: [
    "grok-3",
    "grok-3-fast",
    "grok-2",
    "grok-2-vision",
  ],
  mistral: [
    "mistral-large-latest",
    "mistral-medium-latest",
    "mistral-small-latest",
    "codestral-latest",
    "open-mistral-nemo",
  ],
  openrouter: [
    "openai/gpt-4o",
    "anthropic/claude-3.5-sonnet",
    "google/gemini-pro-1.5",
    "meta-llama/llama-3.1-405b-instruct",
  ],
};

export const VIRTUAL_MODELS: Record<string, { description: string; preferredCapability: string }> = {
  "free-fast": {
    description: "Fastest available model",
    preferredCapability: "fast",
  },
  "free-smart": {
    description: "Most capable model",
    preferredCapability: "smart",
  },
  "free-coding": {
    description: "Best coding model",
    preferredCapability: "coding",
  },
  "free-reasoning": {
    description: "Best reasoning model",
    preferredCapability: "reasoning",
  },
};
