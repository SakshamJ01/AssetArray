import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform, ActivityIndicator } from "react-native";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              type?: "standard" | "icon";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: number | string;
            }
          ) => void;
          prompt: (momentListener?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
        };
      };
    };
  }
}

export interface GoogleSignInButtonProps {
  clientId?: string;
  onSuccess: (idToken: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

const DEFAULT_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  "902530205082-pn6q621bbjfsdvofpp6svsuljss9ekk7.apps.googleusercontent.com";

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  clientId = DEFAULT_CLIENT_ID,
  onSuccess,
  onError,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      setIsInitializing(false);
      return;
    }

    // Check if script is already injected
    const existingScript = document.getElementById("google-gsi-client");
    if (existingScript) {
      if (window.google?.accounts?.id) {
        setScriptLoaded(true);
        setIsInitializing(false);
      } else {
        existingScript.addEventListener("load", () => {
          setScriptLoaded(true);
          setIsInitializing(false);
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setScriptLoaded(true);
      setIsInitializing(false);
    };
    script.onerror = () => {
      setIsInitializing(false);
      onError("Failed to load Google Identity Services. Check your internet connection.");
    };
    document.head.appendChild(script);
  }, [onError]);

  useEffect(() => {
    if (Platform.OS !== "web" || !scriptLoaded || !window.google?.accounts?.id) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            onSuccess(response.credential);
          } else {
            onError("Google sign-in did not return a credential.");
          }
        },
        cancel_on_tap_outside: true,
      });

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "filled_black",
          size: "large",
          type: "standard",
          text: "signin_with",
          shape: "rectangular",
          width: 320,
          logo_alignment: "left",
        });
      }
    } catch (err) {
      console.error("[GoogleSignIn] Initialization error:", err);
      onError(err instanceof Error ? err.message : "Google Sign-In initialization failed.");
    }
  }, [clientId, scriptLoaded, onSuccess, onError]);

  const handleManualTrigger = () => {
    if (Platform.OS !== "web") {
      onError("Google Sign-In is only supported on Web in this build.");
      return;
    }
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      onError("Google Identity Services is still loading. Please retry in a moment.");
    }
  };

  if (Platform.OS !== "web") {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      {isInitializing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#E0A84C" size="small" />
          <Text style={styles.loadingText}>Initializing Google Sign-In...</Text>
        </View>
      )}

      {/* Official Google GSI Rendered Button Mount Point */}
      <div
        ref={containerRef}
        style={{
          display: isInitializing ? "none" : "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          opacity: disabled ? 0.6 : 1,
          pointerEvents: disabled ? "none" : "auto",
        }}
      />

      {/* Fallback button if script fails or popup needed */}
      {!scriptLoaded && !isInitializing && (
        <Pressable
          style={[styles.fallbackButton, disabled ? styles.buttonDisabled : null]}
          onPress={handleManualTrigger}
          disabled={disabled}
        >
          <View style={styles.googleIconContainer}>
            <Text style={styles.googleIconText}>G</Text>
          </View>
          <Text style={styles.fallbackButtonText}>Sign in with Google</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
    minHeight: 44,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  loadingText: {
    color: "#7f90a8",
    fontSize: 12,
  },
  fallbackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 20,
    width: "100%",
    maxWidth: 320,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 9999,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  googleIconText: {
    color: "#4285F4",
    fontWeight: "700",
    fontSize: 13,
  },
  fallbackButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
