import { useState, useEffect } from "react";

export interface NetworkStatus {
  isOnline: boolean;
  lastChecked: string;
}

let isOnlineState =
  typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
    ? navigator.onLine
    : true;

const listeners: Set<(status: NetworkStatus) => void> = new Set();
let isInitialized = false;

export function initNetworkListeners() {
  if (isInitialized) return;
  isInitialized = true;

  if (typeof window !== "undefined" && window.addEventListener) {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
  }
}

if (typeof window !== "undefined") {
  initNetworkListeners();
}

export function setOnlineStatus(online: boolean) {
  isOnlineState = online;
  const status: NetworkStatus = {
    isOnline: online,
    lastChecked: new Date().toISOString(),
  };
  listeners.forEach((listener) => listener(status));
}

export function getOnlineStatus(): boolean {
  if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean") {
    // If navigator reports offline, respect it
    if (!navigator.onLine && isOnlineState) {
      isOnlineState = false;
    }
  }
  return isOnlineState;
}

export function subscribeNetworkStatus(callback: (status: NetworkStatus) => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: getOnlineStatus(),
    lastChecked: new Date().toISOString(),
  });

  useEffect(() => {
    initNetworkListeners();
    setStatus({
      isOnline: getOnlineStatus(),
      lastChecked: new Date().toISOString(),
    });
    return subscribeNetworkStatus(setStatus);
  }, []);

  return status;
}

