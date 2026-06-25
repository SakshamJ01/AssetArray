import * as Haptics from "expo-haptics";

let hapticsEnabled = true;

export function setHapticsEnabled(value: boolean) {
  hapticsEnabled = value;
}

async function runHaptic(effect: () => Promise<void>) {
  if (!hapticsEnabled) {
    return;
  }

  try {
    await effect();
  } catch {
    // Haptics should never interrupt a core workflow.
  }
}

export async function triggerSelectionHaptic() {
  await runHaptic(() => Haptics.selectionAsync());
}

export async function triggerPrimaryActionHaptic() {
  await runHaptic(() =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  );
}

export async function triggerCardPressHaptic() {
  await runHaptic(() =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  );
}

export async function triggerSuccessHaptic() {
  await runHaptic(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  );
}

export async function triggerWarningHaptic() {
  await runHaptic(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  );
}

export async function triggerErrorHaptic() {
  await runHaptic(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  );
}
