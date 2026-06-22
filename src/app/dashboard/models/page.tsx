"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Box, Search, Plug } from "lucide-react";
import { PROVIDER_CONFIG } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { getModels, ModelData } from "@/lib/firebase-db";

export default function ModelsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [models, setModels] = useState<ModelData[]>([]);
  const [search, setSearch] = useState("");
  const [filterProvider, setFilterProvider] = useState("");

  const loadModels = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getModels(user.uid);
      setModels(data);
    } catch (error) {
      console.error("Error loading models:", error);
    }
  }, [user]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const filtered = models.filter((m) => {
    const matchesSearch =
      !search ||
      m.modelId.toLowerCase().includes(search.toLowerCase()) ||
      m.displayName.toLowerCase().includes(search.toLowerCase());
    const matchesProvider = !filterProvider || m.providerName === filterProvider;
    return matchesSearch && matchesProvider;
  });

  const providerNames = [...new Set(models.map((m) => m.providerName))];

  return (
    <div className="animate-fadeIn">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">Models</h1>
        <p className="text-text-muted text-sm">
          All available models from your connected providers
        </p>
      </div>

      {/* No models - show empty state immediately */}
      {models.length === 0 ? (
        <div className="text-center py-16 sm:py-20 rounded-xl bg-surface-2 border border-border">
          <Box className="w-10 h-10 sm:w-12 sm:h-12 text-text-muted/40 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium mb-2">No models available</h3>
          <p className="text-text-muted text-sm mb-5 sm:mb-6 px-4">
            Connect an AI provider to see available models
          </p>
          <button
            onClick={() => router.push("/dashboard/providers")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plug className="w-4 h-4" />
            Add Provider
          </button>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-5 sm:mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models..."
                className="w-full pl-9 pr-4 py-2.5 bg-surface-2 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="px-3.5 py-2.5 bg-surface-2 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="">All Providers</option>
              {providerNames.map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_CONFIG[p]?.displayName || p}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-text-muted mb-3 sm:mb-4">
            {filtered.length} model{filtered.length !== 1 ? "s" : ""} {search || filterProvider ? "found" : "available"}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3">
            {filtered.map((m, i) => {
              const config = PROVIDER_CONFIG[m.providerName];
              return (
                <div
                  key={`${m.modelId}-${i}`}
                  className="p-3.5 sm:p-4 rounded-xl bg-surface-2 border border-border hover:border-border-hover transition-colors"
                >
                  <div className="flex items-start justify-between mb-1.5 sm:mb-2 gap-2">
                    <h3 className="font-mono text-xs sm:text-sm font-medium truncate flex-1">
                      {m.modelId}
                    </h3>
                    <span
                      className={`ml-1 px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium flex-shrink-0 ${
                        m.isAvailable
                          ? "bg-green-50 text-success border border-green-200"
                          : "bg-red-50 text-error border border-red-200"
                      }`}
                    >
                      {m.isAvailable ? "Active" : "Down"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span className="text-sm" style={{ color: config?.color }}>{config?.icon || "●"}</span>
                    <span>{config?.displayName || m.providerName}</span>
                    {m.contextLength && (
                      <>
                        <span className="text-border">·</span>
                        <span>{(m.contextLength / 1000).toFixed(0)}K ctx</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
