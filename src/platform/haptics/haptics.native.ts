import * as Haptics from "expo-haptics";
import { IHapticsAdapter } from "./types";

class NativeHapticsAdapter implements IHapticsAdapter {
  async selection(): Promise<void> {
    await Haptics.selectionAsync();
  }

  async lightImpact(): Promise<void> {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async mediumImpact(): Promise<void> {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  async successNotification(): Promise<void> {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async warningNotification(): Promise<void> {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  async errorNotification(): Promise<void> {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}

export const hapticsAdapter: IHapticsAdapter = new NativeHapticsAdapter();
