"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Terminal,
  Send,
  Loader2,
  Trash2,
  Settings,
  ChevronDown,
  X,
  Plug,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getModels, getProviders, addRequestLog, ModelData, ProviderData } from "@/lib/firebase-db";
import { PROVIDER_CONFIG } from "@/lib/constants";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function PlaygroundPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [models, setModels] = useState<ModelData[]>([]);
  const [providers, setProviders] = useState<Record<string, ProviderData & { id: string }>>({});
  const [selectedModel, setSelectedModel] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [systemPrompt, setSystemPrompt] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [modelList, providerData] = await Promise.all([
        getModels(user.uid),
        getProviders(user.uid),
      ]);
      setModels(modelList);
      const providersWithId: Record<string, ProviderData & { id: string }> = {};
      Object.entries(providerData).forEach(([id, p]) => {
        providersWithId[id] = { ...p, id };
      });
      setProviders(providersWithId);
      if (modelList.length > 0 && !selectedModel) {
        setSelectedModel(modelList[0].modelId);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, [user, selectedModel]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedModel || loading || !user) return;
    
    const userMsg: Message = { role: "user", content: input.trim() };
    const allMessages: Message[] = [
      ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
      ...messages,
      userMsg,
    ];
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const startTime = Date.now();
    const model = models.find((m) => m.modelId === selectedModel);
    const providerEntry = Object.entries(providers).find(([, p]) => p.name === model?.providerName);

    if (!model || !providerEntry) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error: Model or provider not found." }]);
      setLoading(false);
      return;
    }

    const [providerId, provider] = providerEntry;
    const config = PROVIDER_CONFIG[provider.name];

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      let body: string;
      let endpoint: string;

      if (provider.name === "anthropic") {
        headers["x-api-key"] = provider.apiKey;
        headers["anthropic-version"] = "2023-06-01";
        endpoint = `${config.baseUrl}/messages`;
        const systemMsgs = allMessages.filter((m) => m.role === "system");
        const nonSystemMsgs = allMessages.filter((m) => m.role !== "system");
        body = JSON.stringify({
          model: selectedModel,
          messages: nonSystemMsgs.map((m) => ({ role: m.role, content: m.content })),
          system: systemMsgs.length > 0 ? systemMsgs[0].content : undefined,
          max_tokens: maxTokens,
          temperature,
        });
      } else {
        headers["Authorization"] = `Bearer ${provider.apiKey}`;
        endpoint = `${provider.baseUrl || config.baseUrl}/chat/completions`;
        body = JSON.stringify({
          model: selectedModel,
          messages: allMessages,
          temperature,
          max_tokens: maxTokens,
        });
      }

      const resp = await fetch(endpoint, { method: "POST", headers, body });
      const data = await resp.json();
      const latencyMs = Date.now() - startTime;

      let content = "";
      let inputTokens = 0;
      let outputTokens = 0;

      if (provider.name === "anthropic" && resp.ok) {
        content = data.content?.[0]?.text || "";
        inputTokens = data.usage?.input_tokens || 0;
        outputTokens = data.usage?.output_tokens || 0;
      } else if (resp.ok) {
        content = data.choices?.[0]?.message?.content || "";
        inputTokens = data.usage?.prompt_tokens || 0;
        outputTokens = data.usage?.completion_tokens || 0;
      } else {
        content = `Error: ${data.error?.message || JSON.stringify(data.error) || "Request failed"}`;
      }

      await addRequestLog(user.uid, {
        modelId: selectedModel,
        providerName: provider.name,
        providerId,
        status: resp.status,
        latencyMs,
        inputTokens,
        outputTokens,
        errorMessage: resp.ok ? undefined : content,
        createdAt: Date.now(),
      });

      setMessages((prev) => [...prev, { role: "assistant", content }]);
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : "Request failed";
      
      await addRequestLog(user.uid, {
        modelId: selectedModel,
        providerName: provider.name,
        providerId,
        status: 500,
        latencyMs,
        errorMessage: errorMsg,
        createdAt: Date.now(),
      });

      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  // No providers - show empty state immediately (no buffering)
  if (Object.keys(providers).length === 0) {
    return (
      <div className="animate-fadeIn">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">Playground</h1>
          <p className="text-text-muted text-sm">Test your models in real-time</p>
        </div>
        <div className="text-center py-16 sm:py-20 rounded-xl bg-surface-2 border border-border">
          <Terminal className="w-10 h-10 sm:w-12 sm:h-12 text-text-muted/40 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium mb-2">No providers connected</h3>
          <p className="text-text-muted text-sm mb-5 sm:mb-6 px-4">
            Add an AI provider to start using the playground
          </p>
          <button
            onClick={() => router.push("/dashboard/providers")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plug className="w-4 h-4" />
            Add Provider
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn flex flex-col" style={{ height: "calc(100vh - 5rem)" }}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-0.5 sm:mb-1">Playground</h1>
          <p className="text-text-muted text-xs sm:text-sm">Test your models in real-time</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg border transition-colors ${showSettings ? "border-primary bg-primary/5 text-text" : "border-border text-text-muted hover:text-text"}`}
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMessages([])}
            className="p-2 rounded-lg border border-border text-text-muted hover:text-error hover:border-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-3 sm:gap-4 flex-1 min-h-0 relative">
        <div className="flex-1 flex flex-col rounded-xl bg-surface-2 border border-border overflow-hidden">
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border flex items-center gap-2 sm:gap-3">
            <Terminal className="w-4 h-4 text-text-muted hidden sm:block" />
            <div className="relative flex-1">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full appearance-none px-3 py-1.5 bg-surface-3 border border-border rounded-lg text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary pr-8 transition-all"
              >
                <option value="">Select a model</option>
                {models.map((m, i) => (
                  <option key={`${m.modelId}-${i}`} value={m.modelId}>
                    {m.modelId} ({PROVIDER_CONFIG[m.providerName]?.displayName || m.providerName})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-text-muted text-xs sm:text-sm text-center px-4">
                <p>Send a message to start the conversation</p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] sm:max-w-[75%] px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "bg-primary text-white rounded-br-md" : "bg-surface-3 text-text rounded-bl-md"}`}>
                    {m.content}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-surface-3">
                  <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Type your message..."
                className="flex-1 px-3.5 py-2.5 bg-surface-3 border border-border rounded-lg text-text text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-0"
                disabled={loading || !selectedModel}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim() || !selectedModel}
                className="px-3 sm:px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {showSettings && (
          <>
            <div className="hidden lg:block w-64 xl:w-72 rounded-xl bg-surface-2 border border-border p-4 space-y-5 overflow-y-auto flex-shrink-0">
              <h3 className="font-semibold text-sm">Parameters</h3>
              <div>
                <label className="text-xs text-text-muted block mb-1.5">System Prompt</label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-surface-3 border border-border rounded-lg text-text text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
                  placeholder="You are a helpful assistant..."
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-text-muted">Temperature</span>
                  <span className="font-medium">{temperature}</span>
                </div>
                <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-full accent-primary" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-text-muted">Max Tokens</span>
                  <span className="font-medium">{maxTokens}</span>
                </div>
                <input type="range" min="256" max="16384" step="256" value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value))} className="w-full accent-primary" />
              </div>
            </div>

            <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}>
              <div className="w-full bg-surface-2 border-t border-border rounded-t-2xl p-5 space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Parameters</h3>
                  <button onClick={() => setShowSettings(false)} className="p-1 text-text-muted hover:text-text"><X className="w-5 h-5" /></button>
                </div>
                <div>
                  <label className="text-xs text-text-muted block mb-1.5">System Prompt</label>
                  <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={2} className="w-full px-3 py-2 bg-surface-3 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all" placeholder="You are a helpful assistant..." />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5"><span className="text-text-muted">Temperature</span><span className="font-medium">{temperature}</span></div>
                  <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-full accent-primary" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5"><span className="text-text-muted">Max Tokens</span><span className="font-medium">{maxTokens}</span></div>
                  <input type="range" min="256" max="16384" step="256" value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value))} className="w-full accent-primary" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
