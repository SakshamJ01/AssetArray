import React, { useEffect } from "react";
import { Platform } from "react-native";

const GLOBAL_STYLES = `
/* Luxury Dark Scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #030712;
}
::-webkit-scrollbar-thumb {
  background: #1f2d47;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
::-webkit-scrollbar-thumb:hover {
  background: #E0A84C;
}

/* Premium Gold Text Selection */
::selection {
  background: rgba(224, 168, 76, 0.35);
  color: #FFFFFF;
}
::-moz-selection {
  background: rgba(224, 168, 76, 0.35);
  color: #FFFFFF;
}

/* Font Smoothing & Rendering */
html, body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  background-color: #030712 !important;
  color: #F9FAFB;
}

/* Glassmorphism Classes */
.glass-surface {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* Live Market Pulse Animations */
@keyframes liveDotPulse {
  0% {
    transform: scale(0.9);
    opacity: 0.75;
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  }
  70% {
    transform: scale(1.1);
    opacity: 1;
    box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
  }
  100% {
    transform: scale(0.9);
    opacity: 0.75;
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}

@keyframes goldAccentPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(224, 168, 76, 0.45);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(224, 168, 76, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(224, 168, 76, 0);
  }
}

.live-pulse-indicator {
  animation: liveDotPulse 2s infinite ease-in-out;
}

.gold-pulse-indicator {
  animation: goldAccentPulse 2.5s infinite ease-in-out;
}

/* Interactive Card Transitions */
div[role="button"], button {
  transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.15s ease, border-color 0.15s ease !important;
}
`;

export const GlobalStyleInjector: React.FC = () => {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return;
    }

    const styleId = "asset-array-global-styles";
    if (!document.getElementById(styleId)) {
      const styleTag = document.createElement("style");
      styleTag.id = styleId;
      styleTag.innerHTML = GLOBAL_STYLES;
      document.head.appendChild(styleTag);
    }
  }, []);

  return null;
};
