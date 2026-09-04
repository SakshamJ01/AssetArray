export interface IStorageService {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getSecureItem(key: string): Promise<string | null>;
  setSecureItem(key: string, value: string): Promise<void>;
  removeSecureItem(key: string): Promise<void>;
}
