"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, TrendingUp, Zap, Clock, Play } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getStats } from "@/lib/firebase-db";

interface Stats {
  totalRequests: number;
  recentRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgLatency: number;
  errorCount: number;
  dailyStats: Array<{ date: string; count: number; tokens: number }>;
  providerStats: Array<{ provider: string; count: number }>;
}

const emptyStats: Stats = {
  totalRequests: 0,
  recentRequests: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  avgLatency: 0,
  errorCount: 0,
  dailyStats: [],
  providerStats: [],
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>(emptyStats);

  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getStats(user.uid);
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const totalTokens = stats.totalInputTokens + stats.totalOutputTokens;
  const successRate = stats.totalRequests > 0
    ? Math.round(((stats.totalRequests - stats.errorCount) / stats.totalRequests) * 100)
    : 100;

  const maxDailyCount = Math.max(...stats.dailyStats.map((d) => d.count), 1);
  const maxDailyTokens = Math.max(...stats.dailyStats.map((d) => d.tokens), 1);

  // No data state
  if (stats.totalRequests === 0) {
    return (
      <div className="animate-fadeIn">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">Analytics</h1>
          <p className="text-text-muted text-sm">Usage metrics and performance insights</p>
        </div>
        <div className="text-center py-16 sm:py-20 rounded-xl bg-surface-2 border border-border">
          <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 text-text-muted/40 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium mb-2">No analytics data yet</h3>
          <p className="text-text-muted text-sm mb-5 sm:mb-6 px-4">
            Make some API requests to see your usage analytics
          </p>
          <button
            onClick={() => router.push("/dashboard/playground")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            Open Playground
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">Analytics</h1>
        <p className="text-text-muted text-sm">Usage metrics and performance insights</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { icon: <TrendingUp className="w-4 h-4" />, label: "Total Requests", value: stats.totalRequests.toLocaleString(), sub: `${stats.recentRequests} this week` },
          { icon: <Zap className="w-4 h-4" />, label: "Total Tokens", value: totalTokens.toLocaleString(), sub: `${stats.totalInputTokens.toLocaleString()} in / ${stats.totalOutputTokens.toLocaleString()} out` },
          { icon: <Clock className="w-4 h-4" />, label: "Avg Latency", value: stats.avgLatency > 0 ? `${stats.avgLatency}ms` : "—", sub: "Response time" },
          { icon: <BarChart3 className="w-4 h-4" />, label: "Success Rate", value: `${successRate}%`, sub: `${stats.errorCount} errors total` },
        ].map((card, i) => (
          <div key={i} className="p-4 sm:p-5 rounded-xl bg-surface-2 border border-border">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="w-8 h-8 rounded-lg bg-surface-3 text-text-muted flex items-center justify-center">{card.icon}</div>
            </div>
            <p className="text-lg sm:text-2xl font-bold tracking-tight">{card.value}</p>
            <p className="text-[11px] sm:text-xs text-text-muted mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Daily requests chart */}
        <div className="p-4 sm:p-6 rounded-xl bg-surface-2 border border-border">
          <h3 className="font-semibold text-sm sm:text-base mb-4">Daily Requests (7 Days)</h3>
          {stats.dailyStats.length === 0 ? (
            <div className="flex items-center justify-center h-32 sm:h-40 text-text-muted text-sm">No data yet</div>
          ) : (
            <div className="space-y-2">
              {stats.dailyStats.map((d) => (
                <div key={d.date} className="flex items-center gap-2 sm:gap-3">
                  <span className="text-[10px] sm:text-xs text-text-muted w-14 sm:w-20 flex-shrink-0">
                    {new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <div className="flex-1 h-5 sm:h-6 bg-surface-3 rounded-md overflow-hidden">
                    <div className="h-full bg-primary/20 rounded-md transition-all" style={{ width: `${(d.count / maxDailyCount) * 100}%` }} />
                  </div>
                  <span className="text-[10px] sm:text-xs text-text-muted w-8 sm:w-10 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily tokens chart */}
        <div className="p-4 sm:p-6 rounded-xl bg-surface-2 border border-border">
          <h3 className="font-semibold text-sm sm:text-base mb-4">Daily Tokens (7 Days)</h3>
          {stats.dailyStats.length === 0 ? (
            <div className="flex items-center justify-center h-32 sm:h-40 text-text-muted text-sm">No data yet</div>
          ) : (
            <div className="space-y-2">
              {stats.dailyStats.map((d) => (
                <div key={d.date} className="flex items-center gap-2 sm:gap-3">
                  <span className="text-[10px] sm:text-xs text-text-muted w-14 sm:w-20 flex-shrink-0">
                    {new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <div className="flex-1 h-5 sm:h-6 bg-surface-3 rounded-md overflow-hidden">
                    <div className="h-full bg-primary/10 rounded-md transition-all" style={{ width: `${(d.tokens / maxDailyTokens) * 100}%` }} />
                  </div>
                  <span className="text-[10px] sm:text-xs text-text-muted w-12 sm:w-16 text-right">{d.tokens.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Provider distribution */}
        {stats.providerStats.length > 0 && (
          <div className="p-4 sm:p-6 rounded-xl bg-surface-2 border border-border lg:col-span-2">
            <h3 className="font-semibold text-sm sm:text-base mb-4">Provider Distribution</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {stats.providerStats.map((ps, i) => {
                const total = stats.providerStats.reduce((sum, p) => sum + p.count, 0);
                const pct = total > 0 ? Math.round((ps.count / total) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-sm bg-primary" style={{ opacity: 1 - i * 0.15 }} />
                    <span className="text-sm capitalize flex-1">{ps.provider || "Unknown"}</span>
                    <span className="text-sm font-medium">{ps.count}</span>
                    <span className="text-xs text-text-muted w-10 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
