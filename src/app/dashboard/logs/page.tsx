"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ScrollText, CheckCircle, XCircle, Play } from "lucide-react";
import { PROVIDER_CONFIG } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { getRequestLogs, RequestLogData } from "@/lib/firebase-db";

interface Log extends RequestLogData {
  id: string;
}

export default function LogsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>([]);

  const loadLogs = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getRequestLogs(user.uid, 100);
      setLogs(data);
    } catch (error) {
      console.error("Error loading logs:", error);
    }
  }, [user]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="animate-fadeIn">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">Request Logs</h1>
        <p className="text-text-muted text-sm">
          Recent API requests through OmniAPI
        </p>
      </div>

      {/* Show immediately - no loading state */}
      {logs.length === 0 ? (
        <div className="text-center py-16 sm:py-20 rounded-xl bg-surface-2 border border-border">
          <ScrollText className="w-10 h-10 sm:w-12 sm:h-12 text-text-muted/40 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium mb-2">No requests yet</h3>
          <p className="text-text-muted text-sm mb-5 sm:mb-6 px-4">
            Use the playground to make your first API request
          </p>
          <button
            onClick={() => router.push("/dashboard/playground")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            Open Playground
          </button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-2 border-b border-border">
                    <th className="text-left text-xs font-medium text-text-muted px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-text-muted px-4 py-3">Model</th>
                    <th className="text-left text-xs font-medium text-text-muted px-4 py-3">Provider</th>
                    <th className="text-left text-xs font-medium text-text-muted px-4 py-3">Latency</th>
                    <th className="text-left text-xs font-medium text-text-muted px-4 py-3">Tokens</th>
                    <th className="text-left text-xs font-medium text-text-muted px-4 py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const config = log.providerName ? PROVIDER_CONFIG[log.providerName] : null;
                    return (
                      <tr key={log.id} className="border-b border-border/50 hover:bg-surface-2/80 transition-colors">
                        <td className="px-4 py-3">
                          {log.status < 400 ? (
                            <span className="flex items-center gap-1.5 text-xs">
                              <CheckCircle className="w-3.5 h-3.5 text-success" />
                              <span className="text-success font-medium">{log.status}</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs">
                              <XCircle className="w-3.5 h-3.5 text-error" />
                              <span className="text-error font-medium">{log.status}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{log.modelId || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5 text-xs">
                            <span style={{ color: config?.color }}>{config?.icon || "●"}</span>
                            {config?.displayName || log.providerName || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-text-muted">{log.latencyMs ? `${log.latencyMs}ms` : "—"}</td>
                        <td className="px-4 py-3 text-xs text-text-muted">
                          {log.inputTokens || log.outputTokens ? `${log.inputTokens || 0} / ${log.outputTokens || 0}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-text-muted">{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden space-y-2.5">
            {logs.map((log) => {
              const config = log.providerName ? PROVIDER_CONFIG[log.providerName] : null;
              return (
                <div key={log.id} className="p-3.5 rounded-xl bg-surface-2 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {log.status < 400 ? (
                        <span className="flex items-center gap-1 text-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-success" />
                          <span className="text-success font-medium">{log.status}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs">
                          <XCircle className="w-3.5 h-3.5 text-error" />
                          <span className="text-error font-medium">{log.status}</span>
                        </span>
                      )}
                      <span className="text-xs text-text-muted">
                        <span style={{ color: config?.color }}>{config?.icon}</span> {config?.displayName || log.providerName}
                      </span>
                    </div>
                    <span className="text-[10px] text-text-muted">{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="font-mono text-xs text-text truncate mb-1.5">{log.modelId || "—"}</p>
                  <div className="flex gap-4 text-[11px] text-text-muted">
                    <span>{log.latencyMs ? `${log.latencyMs}ms` : "—"}</span>
                    <span>{log.inputTokens || log.outputTokens ? `${log.inputTokens || 0}/${log.outputTokens || 0} tok` : "—"}</span>
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
