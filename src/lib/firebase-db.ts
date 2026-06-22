import {
  database,
  ref,
  set,
  get,
  push,
  remove,
} from "./firebase";

// ─── User Profile ───
export async function createUserProfile(
  userId: string,
  data: { email: string; name: string }
) {
  await set(ref(database, `users/${userId}`), {
    ...data,
    createdAt: Date.now(),
  });
}

export async function getUserProfile(userId: string) {
  const snapshot = await get(ref(database, `users/${userId}`));
  return snapshot.exists() ? snapshot.val() : null;
}

// ─── Providers ───
export interface ProviderData {
  name: string;
  apiKey: string;
  baseUrl?: string;
  status: string;
  isActive: boolean;
  createdAt: number;
  lastChecked?: number;
}

export async function addProvider(userId: string, data: ProviderData): Promise<string> {
  const newRef = push(ref(database, `providers/${userId}`));
  await set(newRef, data);
  return newRef.key!;
}

export async function getProviders(userId: string): Promise<Record<string, ProviderData>> {
  const snapshot = await get(ref(database, `providers/${userId}`));
  return snapshot.exists() ? snapshot.val() : {};
}

export async function deleteProvider(userId: string, providerId: string) {
  await remove(ref(database, `providers/${userId}/${providerId}`));
  await remove(ref(database, `models/${userId}/${providerId}`));
}

// ─── Models ───
export interface ModelData {
  modelId: string;
  displayName: string;
  providerName: string;
  providerId: string;
  contextLength?: number;
  isAvailable: boolean;
  createdAt: number;
}

export async function addModels(userId: string, providerId: string, models: ModelData[]) {
  for (const model of models) {
    const key = model.modelId.replace(/[.#$[\]/]/g, "_");
    await set(ref(database, `models/${userId}/${providerId}/${key}`), model);
  }
}

export async function getModels(userId: string): Promise<ModelData[]> {
  const snapshot = await get(ref(database, `models/${userId}`));
  if (!snapshot.exists()) return [];

  const providers = snapshot.val();
  const models: ModelData[] = [];

  Object.values(providers).forEach((providerModels) => {
    if (providerModels && typeof providerModels === "object") {
      Object.values(providerModels as Record<string, ModelData>).forEach((model) => {
        models.push(model);
      });
    }
  });

  return models;
}

// ─── API Keys ───
export interface ApiKeyData {
  name: string;
  keyHash: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsed?: number;
  createdAt: number;
}

export async function addApiKey(userId: string, data: ApiKeyData): Promise<string> {
  const newRef = push(ref(database, `apiKeys/${userId}`));
  await set(newRef, data);
  return newRef.key!;
}

export async function getApiKeys(userId: string): Promise<Record<string, ApiKeyData>> {
  const snapshot = await get(ref(database, `apiKeys/${userId}`));
  return snapshot.exists() ? snapshot.val() : {};
}

export async function deleteApiKey(userId: string, keyId: string) {
  await remove(ref(database, `apiKeys/${userId}/${keyId}`));
}

// ─── Request Logs ───
export interface RequestLogData {
  modelId?: string;
  providerName?: string;
  providerId?: string;
  status: number;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  errorMessage?: string;
  createdAt: number;
}

export async function addRequestLog(userId: string, data: RequestLogData) {
  try {
    const newRef = push(ref(database, `logs/${userId}`));
    await set(newRef, data);
  } catch {
    // Don't fail the main operation
  }
}

export async function getRequestLogs(
  userId: string,
  maxResults = 100
): Promise<Array<RequestLogData & { id: string }>> {
  const snapshot = await get(ref(database, `logs/${userId}`));
  if (!snapshot.exists()) return [];

  const logsObj = snapshot.val();
  const logs: Array<RequestLogData & { id: string }> = [];

  Object.entries(logsObj).forEach(([id, data]) => {
    logs.push({ id, ...(data as RequestLogData) });
  });

  return logs
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, maxResults);
}

// ─── Stats ───
export async function getStats(userId: string) {
  const [providers, models, apiKeys, logs] = await Promise.all([
    getProviders(userId),
    getModels(userId),
    getApiKeys(userId),
    getRequestLogs(userId, 1000),
  ]);

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentLogs = logs.filter((l) => l.createdAt >= sevenDaysAgo);

  const totalInputTokens = logs.reduce((sum, l) => sum + (l.inputTokens || 0), 0);
  const totalOutputTokens = logs.reduce((sum, l) => sum + (l.outputTokens || 0), 0);
  const avgLatency =
    logs.length > 0
      ? Math.round(logs.reduce((sum, l) => sum + (l.latencyMs || 0), 0) / logs.length)
      : 0;
  const errorCount = logs.filter((l) => l.status >= 400).length;

  const dailyMap = new Map<string, { count: number; tokens: number }>();
  recentLogs.forEach((l) => {
    const date = new Date(l.createdAt).toISOString().split("T")[0];
    const existing = dailyMap.get(date) || { count: 0, tokens: 0 };
    dailyMap.set(date, {
      count: existing.count + 1,
      tokens: existing.tokens + (l.inputTokens || 0) + (l.outputTokens || 0),
    });
  });
  const dailyStats = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const providerMap = new Map<string, number>();
  logs.forEach((l) => {
    const provider = l.providerName || "unknown";
    providerMap.set(provider, (providerMap.get(provider) || 0) + 1);
  });
  const providerStats = Array.from(providerMap.entries()).map(
    ([provider, count]) => ({ provider, count })
  );

  return {
    totalRequests: logs.length,
    recentRequests: recentLogs.length,
    providerCount: Object.keys(providers).length,
    modelCount: models.length,
    keyCount: Object.keys(apiKeys).length,
    totalInputTokens,
    totalOutputTokens,
    avgLatency,
    errorCount,
    dailyStats,
    providerStats,
  };
}
