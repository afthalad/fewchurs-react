import "server-only";
import { createFewchursClient, DEFAULT_BASE_URL, type FewchursClient } from "@fewchurs/react/core";

export const DEFAULT_API_PATH = "/api/fewchurs";

export interface ServerConfig {
  apiKey?: string;
  baseUrl?: string;
  language?: string;
}

export function resolveApiKey(apiKey?: string): string | undefined {
  return apiKey ?? process.env.FEWCHURS_API_KEY;
}

export function resolveBaseUrl(baseUrl?: string): string {
  return baseUrl ?? process.env.FEWCHURS_BASE_URL ?? DEFAULT_BASE_URL;
}

export function resolveApiPath(apiPath?: string): string {
  return (apiPath ?? process.env.FEWCHURS_API_PATH ?? DEFAULT_API_PATH).replace(/\/$/, "");
}

export function serverClient(deviceId: string | null, config: ServerConfig = {}): FewchursClient {
  const apiKey = resolveApiKey(config.apiKey);
  if (!apiKey) {
    throw new Error(
      "[fewchurs] No API key. Set FEWCHURS_API_KEY in your environment, or pass apiKey to the server component or createHandler().",
    );
  }

  return createFewchursClient({
    apiKey,
    baseUrl: resolveBaseUrl(config.baseUrl),
    deviceId,
    language: config.language,
  });
}
