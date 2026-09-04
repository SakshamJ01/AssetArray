import * as LocalAuthentication from "expo-local-authentication";
import { IAuthGuard } from "./types";

class NativeAuthGuard implements IAuthGuard {
  async hasHardwareAsync(): Promise<boolean> {
    try {
      return await LocalAuthentication.hasHardwareAsync();
    } catch {
      return false;
    }
  }

  async isEnrolledAsync(): Promise<boolean> {
    try {
      return await LocalAuthentication.isEnrolledAsync();
    } catch {
      return false;
    }
  }

  async authenticateAsync(options?: {
    promptMessage?: string;
    cancelLabel?: string;
    fallbackLabel?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options?.promptMessage || "Authenticate with Biometrics",
        cancelLabel: options?.cancelLabel || "Cancel",
        fallbackLabel: options?.fallbackLabel || "Use PIN",
      });
      return {
        success: result.success,
        error: result.success ? undefined : (result as { error?: string }).error,
      };
    } catch (e: any) {
      return { success: false, error: e?.message || "Authentication failed" };
    }
  }
}

export const localAuth: IAuthGuard = new NativeAuthGuard();
