export interface IHapticsAdapter {
  selection(): Promise<void>;
  lightImpact(): Promise<void>;
  mediumImpact(): Promise<void>;
  successNotification(): Promise<void>;
  warningNotification(): Promise<void>;
  errorNotification(): Promise<void>;
}
