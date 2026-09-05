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

  async getSecureItem(key: string): Promise<string | null> {
    return this.getItem(`__sec_${key}`);
  }

  async setSecureItem(key: string, value: string): Promise<void> {
    await this.setItem(`__sec_${key}`, value);
  }

  async removeSecureItem(key: string): Promise<void> {
    await this.removeItem(`__sec_${key}`);
  }
}

export const storageService: IStorageService = new WebStorageService();
