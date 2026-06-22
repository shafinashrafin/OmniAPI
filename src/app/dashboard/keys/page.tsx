"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getApiKeys, addApiKey, deleteApiKey, ApiKeyData } from "@/lib/firebase-db";
import { v4 as uuidv4 } from "uuid";

interface ApiKeyWithId extends ApiKeyData {
  id: string;
}

export default function KeysPage() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKeyWithId[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadKeys = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getApiKeys(user.uid);
      const list = Object.entries(data).map(([id, key]) => ({
        id,
        ...key,
      }));
      setKeys(list);
    } catch (error) {
      console.error("Error loading keys:", error);
    }
  }, [user]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleCreate = async () => {
    if (!keyName || !user) return;
    setCreating(true);
    try {
      const rawKey = `omni_${uuidv4().replace(/-/g, "")}`;
      const keyPrefix = rawKey.substring(0, 12) + "...";

      await addApiKey(user.uid, {
        name: keyName,
        keyHash: rawKey,
        keyPrefix,
        isActive: true,
        createdAt: Date.now(),
      });

      setNewKey(rawKey);
      setKeyName("");
      await loadKeys();
    } catch (error) {
      console.error("Error creating key:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!confirm("Delete this API key? Any applications using it will stop working.")) return;
    try {
      await deleteApiKey(user.uid, id);
      await loadKeys();
    } catch (error) {
      console.error("Error deleting key:", error);
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">API Keys</h1>
          <p className="text-text-muted text-sm">
            Manage your unified OmniAPI keys
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setNewKey(""); setKeyName(""); }}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors text-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create Key</span>
          <span className="sm:hidden">Create</span>
        </button>
      </div>

      {/* Usage instructions */}
      <div className="p-4 rounded-xl bg-surface-2 border border-border mb-5 sm:mb-6">
        <h3 className="text-sm font-semibold mb-2">Quick Usage</h3>
        <div className="bg-primary rounded-lg p-3 sm:p-4 font-mono text-xs text-white/80 overflow-x-auto space-y-1">
          <p>
            <span className="text-white">Base URL:</span>{" "}
            {typeof window !== "undefined" ? window.location.origin : ""}/api/v1
          </p>
          <p>
            <span className="text-white">API Key:</span>{" "}
            omni_xxxxxxxxx
          </p>
          <p className="text-white/50 mt-1.5">
            # Compatible with any OpenAI SDK or tool
          </p>
        </div>
      </div>

      {/* Keys list - show immediately, no loading state */}
      {keys.length === 0 ? (
        <div className="text-center py-16 sm:py-20 rounded-xl bg-surface-2 border border-border">
          <Key className="w-10 h-10 sm:w-12 sm:h-12 text-text-muted/40 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium mb-2">No API keys yet</h3>
          <p className="text-text-muted text-sm mb-5 sm:mb-6 px-4">
            Create an API key to start using OmniAPI
          </p>
          <button
            onClick={() => { setShowCreate(true); setNewKey(""); setKeyName(""); }}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
          >
            Create Key
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 sm:space-y-3">
          {keys.map((k) => (
            <div
              key={k.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface-2 border border-border"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-surface-3 flex items-center justify-center flex-shrink-0">
                  <Key className="w-4 h-4 sm:w-5 sm:h-5 text-text-muted" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-sm">{k.name}</h3>
                  <p className="text-xs text-text-muted font-mono truncate">{k.keyPrefix}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-12 sm:pl-0">
                <div className="text-right text-xs text-text-muted">
                  <p>{new Date(k.createdAt).toLocaleDateString()}</p>
                  <p>{k.lastUsed ? `Used ${new Date(k.lastUsed).toLocaleDateString()}` : "Never used"}</p>
                </div>
                <button
                  onClick={() => handleDelete(k.id)}
                  className="p-2 text-text-muted hover:text-error hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Key Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && !newKey && !creating && setShowCreate(false)}
        >
          <div className="w-full sm:max-w-md bg-surface-2 border border-border rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 animate-fadeIn">
            {newKey ? (
              <>
                <div className="flex items-center gap-2 mb-4 text-success">
                  <CheckCircle className="w-5 h-5" />
                  <h2 className="text-lg font-bold text-text">Key Created!</h2>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-warning">
                    Copy this key now. You won&apos;t be able to see it again.
                  </p>
                </div>
                <div className="flex items-center gap-2 mb-5 sm:mb-6">
                  <input
                    type="text"
                    readOnly
                    value={newKey}
                    className="flex-1 px-3 py-2.5 bg-surface-3 border border-border rounded-lg font-mono text-xs sm:text-sm text-text min-w-0"
                  />
                  <button
                    onClick={copyKey}
                    className="p-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors flex-shrink-0"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={() => { setShowCreate(false); setNewKey(""); }}
                  className="w-full py-2.5 border border-border hover:bg-surface-3 text-text font-medium rounded-lg transition-colors text-sm"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <h2 className="text-lg sm:text-xl font-bold mb-1">Create API Key</h2>
                <p className="text-sm text-text-muted mb-5 sm:mb-6">
                  Give your key a name to identify it
                </p>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g., My App, Development, Production"
                  className="w-full px-3.5 py-2.5 bg-surface-3 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all mb-5 sm:mb-6"
                  autoFocus
                  disabled={creating}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreate(false)}
                    disabled={creating}
                    className="flex-1 py-2.5 border border-border hover:bg-surface-3 text-text font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!keyName || creating}
                    className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Key"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
