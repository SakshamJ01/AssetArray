import { useState, useEffect, useCallback } from "react";
import { Platform, Alert } from "react-native";
import { storageService } from "../platform/storage";
import { triggerSuccessHaptic } from "../services/haptics";
import {
  isPinLocked,
  recordPinFailure,
  clearPinFailures,
  pinLockDelayMs,
} from "../services/pinCrypto";
import { AuthSession } from "../types/wealth";

export const PIN_KEY = "asset_array_pin";

export interface UseInactivityLockOptions {
  authSession: AuthSession | null;
  onLock?: () => void;
  inactivityTimeoutMs?: number;
}

export function useInactivityLock({
  authSession,
  onLock,
  inactivityTimeoutMs = 15 * 60 * 1000, // 15 minutes canonical
}: UseInactivityLockOptions) {
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinSetup, setPinSetup] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [lockedDueToInactivity, setLockedDueToInactivity] = useState(false);
  const [isFirstLoginPinSetupOpen, setIsFirstLoginPinSetupOpen] = useState(false);

  // Inactivity auto-lock listener
  useEffect(() => {
    if (!isUnlocked || !authSession) return;
    let timer: any = null;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setLockedDueToInactivity(true);
        setIsUnlocked(false);
        onLock?.();
      }, inactivityTimeoutMs);
    };

    resetTimer();

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
      events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));
      return () => {
        if (timer) clearTimeout(timer);
        events.forEach((evt) => window.removeEventListener(evt, resetTimer));
      };
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isUnlocked, authSession, inactivityTimeoutMs, onLock]);

  const handleSaveNewDeskPin = useCallback(async (newPin: string) => {
    await storageService.setSecureItem(PIN_KEY, newPin);
    setStoredPin(newPin);
    setIsFirstLoginPinSetupOpen(false);
    await triggerSuccessHaptic();
    if (Platform.OS === "web") {
      window.alert("Personal Desk PIN successfully set!");
    } else {
      Alert.alert("PIN Updated", "Your personal desk PIN is now configured.");
    }
  }, []);

  const setupPinAction = useCallback(async () => {
    if (pinSetup.length < 4) {
      Alert.alert("PIN too short", "Please create a PIN with at least 4 digits.");
      return;
    }
    await storageService.setSecureItem(PIN_KEY, pinSetup);
    setStoredPin(pinSetup);
    setPinSetup("");
    setLockedDueToInactivity(false);
    setIsUnlocked(true);
  }, [pinSetup]);

  const unlockAction = useCallback(() => {
    if (isPinLocked()) {
      const waitSec = Math.max(1, Math.ceil(pinLockDelayMs() / 1000));
      const msg = `Desk is temporarily locked due to repeated incorrect PIN attempts. Please wait ${waitSec} second${waitSec === 1 ? "" : "s"}.`;
      if (Platform.OS === "web") {
        window.alert(msg);
      } else {
        Alert.alert("Desk Locked", msg);
      }
      return;
    }

    if (pinInput === storedPin) {
      clearPinFailures();
      setLockedDueToInactivity(false);
      setIsUnlocked(true);
      setPinInput("");
      return;
    }

    const { count, lockedUntil } = recordPinFailure();
    if (lockedUntil > Date.now()) {
      const waitSec = Math.max(1, Math.ceil((lockedUntil - Date.now()) / 1000));
      const msg = `Incorrect PIN. Desk is locked for ${waitSec} seconds due to repeated failed attempts.`;
      if (Platform.OS === "web") {
        window.alert(msg);
      } else {
        Alert.alert("Desk Locked", msg);
      }
    } else {
      const remaining = 5 - (count % 5);
      const msg = `Incorrect PIN. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining before lockout.`;
      if (Platform.OS === "web") {
        window.alert(msg);
      } else {
        Alert.alert("Access Denied", msg);
      }
    }
  }, [pinInput, storedPin]);

  const resetLock = useCallback(() => {
    setLockedDueToInactivity(false);
    setIsUnlocked(false);
    setPinInput("");
  }, []);

  return {
    storedPin,
    setStoredPin,
    pinInput,
    setPinInput,
    pinSetup,
    setPinSetup,
    isUnlocked,
    setIsUnlocked,
    lockedDueToInactivity,
    setLockedDueToInactivity,
    isFirstLoginPinSetupOpen,
    setIsFirstLoginPinSetupOpen,
    handleSaveNewDeskPin,
    setupPinAction,
    unlockAction,
    resetLock,
  };
}
