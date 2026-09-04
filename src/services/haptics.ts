import { hapticsAdapter } from "../platform/haptics";

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
  await runHaptic(() => hapticsAdapter.selection());
}

export async function triggerPrimaryActionHaptic() {
  await runHaptic(() => hapticsAdapter.lightImpact());
}

export async function triggerCardPressHaptic() {
  await runHaptic(() => hapticsAdapter.mediumImpact());
}

export async function triggerSuccessHaptic() {
  await runHaptic(() => hapticsAdapter.successNotification());
}

export async function triggerWarningHaptic() {
  await runHaptic(() => hapticsAdapter.warningNotification());
}

export async function triggerErrorHaptic() {
  await runHaptic(() => hapticsAdapter.errorNotification());
}
