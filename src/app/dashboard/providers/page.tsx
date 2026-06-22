"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plug,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { PROVIDER_CONFIG, DEFAULT_MODELS } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import {
  getProviders,
  addProvider,
  deleteProvider,
  addModels,
  ProviderData,
  ModelData,
} from "@/lib/firebase-db";

interface Provider extends ProviderData {
  id: string;
}

// Wraps a promise with a timeout so it never hangs forever
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms / 1000}s. Check your Firebase security rules — Firestore must allow read/write for authenticated users.`));
    }, ms);
    promise
      .then((val) => { clearTimeout(timer); resolve(val); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

export default function ProvidersPage() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProviders = useCallback(async () => {
    if (!user) return;
    try {
      const data = await withTimeout(getProviders(user.uid), 8000, "Loading providers");
      const list = Object.entries(data).map(([id, provider]) => ({
        id,
        ...provider,
      }));
      setProviders(list);
    } catch (err) {
      console.error("Load providers error:", err);
    }
  }, [user]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const handleAdd = async () => {
    if (!selectedProvider || !apiKeyInput || !user) return;

    setAdding(true);
    setError("");
    setSuccess("");

    const config = PROVIDER_CONFIG[selectedProvider];
    if (!config) {
      setError("Invalid provider");
      setAdding(false);
      return;
    }

    try {
      // Step 1: Save provider to Firestore with timeout
      const providerId = await withTimeout(
        addProvider(user.uid, {
          name: selectedProvider,
          apiKey: apiKeyInput,
          baseUrl: config.baseUrl,
          status: "active",
          isActive: true,
          createdAt: Date.now(),
          lastChecked: Date.now(),
        }),
        10000,
        "Saving provider"
      );

      // Step 2: Add default models (non-blocking — don't wait)
      const defaultModels = DEFAULT_MODELS[selectedProvider] || [];
      if (defaultModels.length > 0 && providerId) {
        const modelData: ModelData[] = defaultModels.map((modelId) => ({
          modelId,
          displayName: modelId,
          providerName: selectedProvider,
          providerId,
          isAvailable: true,
          createdAt: Date.now(),
        }));
        // Fire and forget — don't block the UI
        addModels(user.uid, providerId, modelData).catch((e) =>
          console.warn("Models save warning:", e)
        );
      }

      setSuccess(
        `${config.displayName} connected successfully! ${defaultModels.length} models added.`
      );
      setShowAdd(false);
      setSelectedProvider("");
      setApiKeyInput("");
      await loadProviders();
    } catch (err) {
      console.error("Add provider error:", err);
      const msg = err instanceof Error ? err.message : "Failed to add provider.";
      setError(msg);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (
      !confirm(
        "Remove this provider? All associated models will be deleted."
      )
    )
      return;

    try {
      await withTimeout(deleteProvider(user.uid, id), 8000, "Deleting provider");
      setSuccess("");
      await loadProviders();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-3.5 h-3.5 text-success" />;
      case "error":
        return <XCircle className="w-3.5 h-3.5 text-error" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-warning" />;
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 12) return "••••••••";
    return key.substring(0, 6) + "••••••" + key.substring(key.length - 4);
  };

  const connectedNames = new Set(providers.map((p) => p.name));

  return (
    <div className="animate-fadeIn">
      <div className="flex items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">
            Providers
          </h1>
          <p className="text-text-muted text-sm">
            Connect your AI provider API keys
          </p>
        </div>
        <button
          onClick={() => {
            setShowAdd(true);
            setError("");
            setSelectedProvider("");
            setApiKeyInput("");
          }}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors text-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Provider</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {success && (
        <div className="mb-5 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg text-success text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && !showAdd && (
        <div className="mb-5 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-error text-sm">
          {error}
        </div>
      )}

      {providers.length === 0 ? (
        <div className="text-center py-16 sm:py-20 rounded-xl bg-surface-2 border border-border">
          <Plug className="w-10 h-10 sm:w-12 sm:h-12 text-text-muted/40 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium mb-2">
            No providers connected
          </h3>
          <p className="text-text-muted text-sm mb-5 sm:mb-6 px-4">
            Add your first AI provider to start using OmniAPI
          </p>
          <button
            onClick={() => {
              setShowAdd(true);
              setError("");
              setSelectedProvider("");
              setApiKeyInput("");
            }}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
          >
            Add Provider
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {providers.map((p) => {
            const config = PROVIDER_CONFIG[p.name];
            return (
              <div
                key={p.id}
                className="p-4 sm:p-5 rounded-xl bg-surface-2 border border-border hover:border-border-hover transition-colors"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-lg sm:text-xl font-medium"
                      style={{
                        backgroundColor: `${config?.color}15`,
                        color: config?.color,
                      }}
                    >
                      {config?.icon || "●"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base">
                        {config?.displayName || p.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        {statusIcon(p.status)}
                        <span className="capitalize">{p.status}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-2 text-text-muted hover:text-error hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">API Key</span>
                    <span className="font-mono text-xs">
                      {maskApiKey(p.apiKey)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Added</span>
                    <span className="text-xs">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Provider Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={(e) =>
            e.target === e.currentTarget && !adding && setShowAdd(false)
          }
        >
          <div className="w-full sm:max-w-lg bg-surface-2 border border-border rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 animate-fadeIn max-h-[85vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-1">Add Provider</h2>
            <p className="text-sm text-text-muted mb-5 sm:mb-6">
              Select a provider and enter your API key
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-error text-sm break-words">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5 sm:mb-6">
              {Object.entries(PROVIDER_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedProvider(key)}
                  disabled={connectedNames.has(key) || adding}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border text-sm font-medium transition-all ${
                    selectedProvider === key
                      ? "border-primary bg-primary/5 text-text"
                      : connectedNames.has(key)
                        ? "border-border bg-surface-3 text-text-muted opacity-50 cursor-not-allowed"
                        : "border-border hover:border-border-hover"
                  }`}
                >
                  <span className="text-lg" style={{ color: config.color }}>
                    {config.icon}
                  </span>
                  <span className="flex-1 text-left">
                    {config.displayName}
                  </span>
                  {connectedNames.has(key) && (
                    <CheckCircle className="w-3.5 h-3.5 text-success" />
                  )}
                </button>
              ))}
            </div>

            {selectedProvider && (
              <div className="mb-5 sm:mb-6">
                <label className="text-sm font-medium text-text-muted block mb-1.5">
                  API Key for{" "}
                  {PROVIDER_CONFIG[selectedProvider]?.displayName}
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  disabled={adding}
                  className="w-full px-3.5 py-2.5 bg-surface-3 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono disabled:opacity-50"
                  placeholder="sk-... or your API key"
                />
                <p className="text-xs text-text-muted mt-2">
                  Your API key is stored securely and only used to route
                  requests to{" "}
                  {PROVIDER_CONFIG[selectedProvider]?.displayName}.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowAdd(false)}
                disabled={adding}
                className="flex-1 py-2.5 border border-border hover:bg-surface-3 text-text font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!selectedProvider || !apiKeyInput || adding}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {adding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Provider"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
