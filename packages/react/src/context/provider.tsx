"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createFewchursClient, type FewchursClient } from "../client/client";
import { readDeviceId, resolveDeviceId } from "../identity/deviceId";
import { createStore, type EventHandler, type Store, type StoreState } from "../store/store";

export interface FewchursContextValue {
  client: FewchursClient;
  store: Store;
  deviceId: string | null;
  /** False only while a direct-to-API board is still waiting for its device id. */
  isReady: boolean;
}

const FewchursContext = createContext<FewchursContextValue | null>(null);

export interface FewchursProviderProps {
  /** Publishable key for direct API calls. Omit when `baseUrl` points at your own proxy. */
  apiKey?: string;
  baseUrl?: string;
  /** A stable per-visitor id — hash it if it comes from your auth. */
  deviceId?: string;
  language?: string;
  pageSize?: number;
  /** Server-rendered data, so the first paint has real content. Set by `@fewchurs/next`. */
  initialState?: Partial<StoreState>;
  onEvent?: EventHandler;
  client?: FewchursClient;
  children: ReactNode;
}

export function FewchursProvider({
  apiKey,
  baseUrl,
  deviceId: deviceIdProp,
  language,
  pageSize = 20,
  initialState,
  onEvent,
  client: clientProp,
  children,
}: FewchursProviderProps): React.JSX.Element {
  // Read during the first render, not in an effect: child hooks fetch in effects that run
  // before this component's own effect, and a request without a device id is rejected.
  const [deviceId, setDeviceId] = useState<string | null>(() => deviceIdProp ?? readDeviceId());
  const deviceIdRef = useRef(deviceId);
  deviceIdRef.current = deviceIdProp ?? deviceId;

  const eventRef = useRef(onEvent);
  eventRef.current = onEvent;

  useEffect(() => {
    if (deviceIdProp) return;
    setDeviceId(resolveDeviceId());
  }, [deviceIdProp]);

  const client = useMemo(
    () =>
      clientProp ??
      createFewchursClient({
        apiKey,
        baseUrl,
        language,
        deviceId: () => deviceIdRef.current,
      }),
    [clientProp, apiKey, baseUrl, language],
  );

  const store = useMemo(
    () =>
      createStore(client, {
        pageSize,
        initialState,
        onEvent: (event) => eventRef.current?.(event),
      }),
    // initialState is a first-paint seed; a new object identity must not wipe live state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, pageSize],
  );

  const value = useMemo<FewchursContextValue>(
    () => ({
      client,
      store,
      deviceId: deviceIdProp ?? deviceId,
      isReady: Boolean(deviceIdProp ?? deviceId) || !apiKey,
    }),
    [client, store, deviceIdProp, deviceId, apiKey],
  );

  return <FewchursContext.Provider value={value}>{children}</FewchursContext.Provider>;
}

export function useFewchurs(): FewchursContextValue {
  const value = useContext(FewchursContext);
  if (!value) {
    throw new Error(
      "Fewchurs components must be rendered inside <FewchursProvider>. In Next.js, <FewchursBoard> from @fewchurs/next provides one for you.",
    );
  }
  return value;
}
