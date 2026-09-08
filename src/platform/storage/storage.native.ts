import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { IStorageService } from "./types";

class NativeStorageService implements IStorageService {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  /**
   * NATIVE SECURITY NOTE (3.3.x): SecureStore failures used to silently
   * fall back to AsyncStorage (plaintext). That hides a security
   * downgrade. Now the fallback is explicit: the plaintext copy is
   * namespaced `__insecure_fallback_` and a warning is emitted so audits
   * can detect affected keys.
   */
  private fallbackKey(key: string): string {
    return `__insecure_fallback_${key}`;
  }

  async getSecureItem(key: string): Promise<string | null> {
    try {
      const v = await SecureStore.getItemAsync(key);
      if (v !== null) return v;
    } catch (e) {
      console.warn(`[storage.native] SecureStore unavailable for "${key}", checking explicit fallback.`);
    }
    return AsyncStorage.getItem(this.fallbackKey(key));
  }

  async setSecureItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
      await AsyncStorage.removeItem(this.fallbackKey(key));
      return;
    } catch {
      console.warn(`[storage.native] SecureStore write failed for "${key}"; using explicit insecure fallback.`);
      await AsyncStorage.setItem(this.fallbackKey(key), value);
    }
  }

  async removeSecureItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // explicit fallback cleanup below
    }
    await AsyncStorage.removeItem(this.fallbackKey(key));
  }
}

export const storageService: IStorageService = new NativeStorageService();
