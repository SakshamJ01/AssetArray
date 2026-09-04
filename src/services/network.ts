import { useState, useEffect } from "react";

export interface NetworkStatus {
  isOnline: boolean;
  lastChecked: string;
}

let isOnlineState = true;
const listeners: Set<(status: NetworkStatus) => void> = new Set();

export function setOnlineStatus(online: boolean) {
  isOnlineState = online;
  const status: NetworkStatus = {
    isOnline: online,
    lastChecked: new Date().toISOString(),
  };
  listeners.forEach((listener) => listener(status));
}

export function getOnlineStatus(): boolean {
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
    isOnline: isOnlineState,
    lastChecked: new Date().toISOString(),
  });

  useEffect(() => {
    return subscribeNetworkStatus(setStatus);
  }, []);

  return status;
}
