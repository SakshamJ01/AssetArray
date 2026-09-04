export interface IAuthGuard {
  hasHardwareAsync(): Promise<boolean>;
  isEnrolledAsync(): Promise<boolean>;
  authenticateAsync(options?: {
    promptMessage?: string;
    cancelLabel?: string;
    fallbackLabel?: string;
  }): Promise<{ success: boolean; error?: string }>;
}
