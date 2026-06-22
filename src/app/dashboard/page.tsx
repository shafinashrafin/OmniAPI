"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Plug,
  Box,
  Key,
  Zap,
  Activity,
  Clock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getStats } from "@/lib/firebase-db";

interface Stats {
  totalRequests: number;
  recentRequests: number;
  providerCount: number;
  modelCount: number;
  keyCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgLatency: number;
  errorCount: number;
  dailyStats: Array<{ date: string; count: number; tokens: number }>;
  providerStats: Array<{ provider: string; count: number }>;
}

// Default empty stats
const emptyStats: Stats = {
  totalRequests: 0,
  recentRequests: 0,
  providerCount: 0,
  modelCount: 0,
  keyCount: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  avgLatency: 0,
  errorCount: 0,
  dailyStats: [],
  providerStats: [],
};

export default function DashboardOverview() {
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

  const cards = [
    {
      icon: <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: "Total Requests",
      value: stats.totalRequests.toLocaleString(),
      sub: `${stats.recentRequests} this week`,
    },
    {
      icon: <Plug className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: "Providers",
      value: stats.providerCount,
      sub: "Connected",
    },
    {
      icon: <Box className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: "Models",
      value: stats.modelCount,
      sub: "Available",
    },
    {
      icon: <Key className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: "API Keys",
      value: stats.keyCount,
      sub: "Active",
    },
    {
      icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: "Tokens Used",
      value: (stats.totalInputTokens + stats.totalOutputTokens).toLocaleString(),
      sub: `${stats.totalInputTokens.toLocaleString()} in / ${stats.totalOutputTokens.toLocaleString()} out`,
    },
    {
      icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: "Avg Latency",
      value: stats.avgLatency > 0 ? `${stats.avgLatency}ms` : "—",
      sub: "Response time",
    },
    {
      icon: <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: "Errors",
      value: stats.errorCount,
      sub: "Total errors",
    },
    {
      icon: <Activity className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: "Success Rate",
      value: stats.totalRequests > 0
        ? `${Math.round(((stats.totalRequests - stats.errorCount) / stats.totalRequests) * 100)}%`
        : "—",
      sub: "Request success",
    },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">Dashboard</h1>
        <p className="text-text-muted text-sm">
          {user?.displayName ? `Welcome back, ${user.displayName}!` : "Overview of your OmniAPI gateway"}
        </p>
      </div>

      {/* Quick start guide - show when no providers */}
      {stats.providerCount === 0 && (
        <div className="p-5 sm:p-8 rounded-2xl bg-surface-2 border border-border mb-6 sm:mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold mb-1">Get Started with OmniAPI</h2>
              <p className="text-text-muted text-sm">Complete these steps to start using your unified AI gateway</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {[
              {
                n: "1",
                title: "Connect a Provider",
                desc: "Add your API key from OpenAI, Google, Anthropic, or any other supported provider",
                action: () => router.push("/dashboard/providers"),
                buttonText: "Add Provider",
                done: stats.providerCount > 0,
              },
              {
                n: "2",
                title: "Generate an API Key",
                desc: "Create your unified OmniAPI key to use across all your applications",
                action: () => router.push("/dashboard/keys"),
                buttonText: "Create Key",
                done: stats.keyCount > 0,
              },
              {
                n: "3",
                title: "Test in Playground",
                desc: "Try out your connected models in our built-in chat playground",
                action: () => router.push("/dashboard/playground"),
                buttonText: "Open Playground",
                done: stats.totalRequests > 0,
              },
            ].map((step) => (
              <div 
                key={step.n} 
                className={`flex items-start gap-4 p-4 rounded-xl border ${
                  step.done ? "bg-green-50/50 border-green-200" : "bg-surface-3/50 border-border"
                }`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  step.done ? "bg-success text-white" : "bg-primary text-white"
                }`}>
                  {step.done ? "✓" : step.n}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base">{step.title}</p>
                  <p className="text-sm text-text-muted mt-0.5">{step.desc}</p>
                </div>
                {!step.done && (
                  <button
                    onClick={step.action}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex-shrink-0"
                  >
                    {step.buttonText}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats cards - always show, no loading state */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {cards.map((c, i) => (
          <div
            key={i}
            className="p-4 sm:p-5 rounded-xl bg-surface-2 border border-border hover:border-border-hover transition-colors"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-surface-3 text-text-muted flex items-center justify-center">
                {c.icon}
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-bold tracking-tight">{c.value}</p>
            <p className="text-[11px] sm:text-xs text-text-muted mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Provider distribution - only show if there's data */}
      {stats.providerStats.length > 0 && (
        <div className="p-4 sm:p-6 rounded-xl bg-surface-2 border border-border">
          <h3 className="text-base sm:text-lg font-semibold mb-4">
            Requests by Provider
          </h3>
          <div className="space-y-3">
            {stats.providerStats.map((ps, i) => {
              const total = stats.providerStats.reduce((sum, p) => sum + p.count, 0);
              const pct = total > 0 ? Math.round((ps.count / total) * 100) : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="capitalize font-medium">{ps.provider || "Unknown"}</span>
                    <span className="text-text-muted">{ps.count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-3">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
