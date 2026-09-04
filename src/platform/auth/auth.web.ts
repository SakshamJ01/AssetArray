import { IAuthGuard } from "./types";

class WebAuthGuard implements IAuthGuard {
  async hasHardwareAsync(): Promise<boolean> {
    if (typeof window !== "undefined" && window.PublicKeyCredential) {
      return true;
    }
    return false;
  }

  async isEnrolledAsync(): Promise<boolean> {
    return false;
  }

  async authenticateAsync(): Promise<{ success: boolean; error?: string }> {
    // Web fallback delegates to PIN entry
    return { success: true };
  }
}

export const localAuth: IAuthGuard = new WebAuthGuard();
