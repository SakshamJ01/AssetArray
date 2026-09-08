import AsyncStorage from "@react-native-async-storage/async-storage";
import { IStorageService } from "./types";

class WebStorageService implements IStorageService {
  private memMap = new Map<string, string>();

  private isWindowAvailable(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  }

  async getItem(key: string): Promise<string | null> {
    if (!this.isWindowAvailable()) {
      return this.memMap.get(key) ?? null;
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return this.memMap.get(key) ?? null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    this.memMap.set(key, value);
    if (this.isWindowAvailable()) {
      try {
        await AsyncStorage.setItem(key, value);
      } catch {
        // Handled via memory map
      }
    }
  }

  async removeItem(key: string): Promise<void> {
    this.memMap.delete(key);
    if (this.isWindowAvailable()) {
      try {
        await AsyncStorage.removeItem(key);
      } catch {
        // Handled via memory map
      }
    }
  }

  /**
   * WEB SECURITY NOTE (3.3.x core-integrity): browsers have no SecureStore.
   * Secure items are persisted to AsyncStorage/localStorage and are readable
   * by same-origin JS. Do NOT store raw PINs, full tokens, or unencrypted
   * PII via setSecureItem on web. Callers must encrypt first or keep
   * secrets in memory only. This downgrade is explicit by design.
   */
  private devWarn(msg: string): void {
    try {
      const g = globalThis as Record<string, unknown>;
      if (g.__DEV__) {
        console.warn(msg);
      }
    } catch {
      // never throw from storage diagnostics
    }
  }

  async getSecureItem(key: string): Promise<string | null> {
    this.devWarn(`[storage.web] getSecureItem("${key}") is NOT hardware-backed on web.`);
    return this.getItem(`__sec_${key}`);
  }

  async setSecureItem(key: string, value: string): Promise<void> {
    this.devWarn(`[storage.web] setSecureItem("${key}") persists to web storage (not secure).`);
    await this.setItem(`__sec_${key}`, value);
  }

  async removeSecureItem(key: string): Promise<void> {
    await this.removeItem(`__sec_${key}`);
  }
}

export const storageService: IStorageService = new WebStorageService();
