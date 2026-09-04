import AsyncStorage from "@react-native-async-storage/async-storage";
import { IStorageService } from "./types";

class WebStorageService implements IStorageService {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  async getSecureItem(key: string): Promise<string | null> {
    // In web environment, use AsyncStorage or sessionStorage with obfuscated prefix
    return AsyncStorage.getItem(`__sec_${key}`);
  }

  async setSecureItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(`__sec_${key}`, value);
  }

  async removeSecureItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(`__sec_${key}`);
  }
}

export const storageService: IStorageService = new WebStorageService();
