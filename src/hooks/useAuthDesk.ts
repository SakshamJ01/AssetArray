import { useState, useCallback } from "react";
import { Alert, Platform, useColorScheme } from "react-native";
import * as Haptics from "expo-haptics";
import { storageService } from "../platform/storage";
import { localAuth } from "../platform/auth";
import { AuthSession } from "../types/wealth";

const PIN_KEY = "@asset_array_pin_v1";
const BIOMETRIC_KEY = "@asset_array_biometric_v1";
const DARK_MODE_KEY = "@asset_array_dark_mode_v1";
const HAPTICS_KEY = "@asset_array_haptics_v1";
const AUTH_SESSION_KEY = "@asset_array_auth_session_v1";

export async function persistBiometric(value: boolean): Promise<void> {
  await storageService.setSecureItem(BIOMETRIC_KEY, JSON.stringify(value));
}

export async function persistDarkMode(value: boolean): Promise<void> {
  await storageService.setSecureItem(DARK_MODE_KEY, JSON.stringify(value));
}

export async function persistHaptics(value: boolean): Promise<void> {
  await storageService.setSecureItem(HAPTICS_KEY, JSON.stringify(value));
}

export async function persistAuthSession(value: AuthSession | null): Promise<void> {
  if (!value) {
    await storageService.removeSecureItem(AUTH_SESSION_KEY);
    return;
  }
  await storageService.setSecureItem(AUTH_SESSION_KEY, JSON.stringify(value));
}

export function useAuthDesk() {
  const systemColorScheme = useColorScheme();
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [darkModeEnabled, setDarkModeEnabled] = useState(systemColorScheme === "dark");
  const [hapticsEnabled, setHapticsEnabledState] = useState(true);
  const [pinInput, setPinInput] = useState("");
  const [pinSetup, setPinSetup] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authPassword, setAuthPassword] = useState("");
  const [authState, setAuthState] = useState("Not connected");
  const [isAuthChecking, setIsAuthChecking] = useState(false);

  const triggerTapHaptic = useCallback(async () => {
    if (!hapticsEnabled || Platform.OS === "web") {
      return;
    }
    try {
      await Haptics.selectionAsync();
    } catch {
      // Haptics not supported or disabled on device
    }
  }, [hapticsEnabled]);

  const triggerSuccessHaptic = useCallback(async () => {
    if (!hapticsEnabled || Platform.OS === "web") {
      return;
    }
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics not supported or disabled on device
    }
  }, [hapticsEnabled]);

  const toggleBiometric = useCallback(async (value: boolean) => {
    setBiometricEnabled(value);
    await persistBiometric(value);
    await triggerTapHaptic();
  }, [triggerTapHaptic]);

  const toggleDarkMode = useCallback(async (value: boolean) => {
    setDarkModeEnabled(value);
    await persistDarkMode(value);
    await triggerTapHaptic();
  }, [triggerTapHaptic]);

  const toggleHaptics = useCallback(async (value: boolean) => {
    setHapticsEnabledState(value);
    await persistHaptics(value);
    if (value && Platform.OS !== "web") {
      try {
        await Haptics.selectionAsync();
      } catch {
        // no-op
      }
    }
  }, []);

  const authenticateWithBiometrics = useCallback(async () => {
    if (!biometricEnabled || !biometricAvailable) {
      return false;
    }
    try {
      const result = await localAuth.authenticateAsync({
        promptMessage: "Unlock Asset Array",
      });
      if (result.success) {
        setIsUnlocked(true);
        await triggerSuccessHaptic();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [biometricAvailable, biometricEnabled, triggerSuccessHaptic]);

  const saveNewPin = useCallback(async () => {
    if (pinSetup.trim().length < 4) {
      Alert.alert("Invalid PIN", "Please enter at least 4 digits for your security PIN.");
      return;
    }
    await storageService.setSecureItem(PIN_KEY, pinSetup.trim());
    setStoredPin(pinSetup.trim());
    setIsUnlocked(true);
    setPinSetup("");
    await triggerSuccessHaptic();
  }, [pinSetup, triggerSuccessHaptic]);

  const verifyPin = useCallback(async () => {
    if (pinInput.trim() === storedPin) {
      setIsUnlocked(true);
      setPinInput("");
      await triggerSuccessHaptic();
      return;
    }
    Alert.alert("Access denied", "The PIN you entered is incorrect.");
  }, [pinInput, storedPin, triggerSuccessHaptic]);

  const resetLock = useCallback(async () => {
    await storageService.removeSecureItem(PIN_KEY);
    setStoredPin(null);
    setIsUnlocked(false);
    setPinInput("");
    setPinSetup("");
  }, []);

  return {
    storedPin,
    setStoredPin,
    darkModeEnabled,
    setDarkModeEnabled,
    toggleDarkMode,
    hapticsEnabled,
    setHapticsEnabledState,
    toggleHaptics,
    triggerTapHaptic,
    triggerSuccessHaptic,
    pinInput,
    setPinInput,
    pinSetup,
    setPinSetup,
    isUnlocked,
    setIsUnlocked,
    biometricEnabled,
    setBiometricEnabled,
    toggleBiometric,
    biometricAvailable,
    setBiometricAvailable,
    authenticateWithBiometrics,
    saveNewPin,
    verifyPin,
    resetLock,
    authSession,
    setAuthSession,
    authPassword,
    setAuthPassword,
    authState,
    setAuthState,
    isAuthChecking,
    setIsAuthChecking,
  };
}
