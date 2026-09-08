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
    // Web has no OS biometric gate. NEVER auto-succeed: force explicit PIN entry.
    // Callers must present PIN UI when success=false with reason web-pin-required.
    return { success: false, error: "web-pin-required" };
  }
}

export const localAuth: IAuthGuard = new WebAuthGuard();
