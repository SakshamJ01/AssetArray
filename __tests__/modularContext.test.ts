jest.mock("react-native", () => ({
  Platform: { OS: "web" },
  StyleSheet: { create: (styles: any) => styles },
  View: "View",
  Text: "Text",
  TextInput: "TextInput",
  Modal: "Modal",
  Pressable: "Pressable",
  Alert: { alert: jest.fn() },
}));

jest.mock("../src/platform/storage", () => ({
  storageService: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    getSecureItem: jest.fn().mockResolvedValue(null),
    setSecureItem: jest.fn().mockResolvedValue(undefined),
    removeSecureItem: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("../src/services/haptics", () => ({
  triggerSuccessHaptic: jest.fn().mockResolvedValue(undefined),
}));

import React from "react";
import {
  AuthSecurityProvider,
  useAuthSecurityContext,
  WealthProvider,
  useWealthContext,
  MarketProvider,
  useMarketContext,
  ModalProvider,
  useModalContext,
  AppProviders,
} from "../src/context";

describe("Modular Architecture - Context Providers & Hooks", () => {
  it("exports all providers and consumer hooks correctly", () => {
    expect(AuthSecurityProvider).toBeDefined();
    expect(typeof AuthSecurityProvider).toBe("function");
    expect(useAuthSecurityContext).toBeDefined();
    expect(typeof useAuthSecurityContext).toBe("function");

    expect(WealthProvider).toBeDefined();
    expect(typeof WealthProvider).toBe("function");
    expect(useWealthContext).toBeDefined();
    expect(typeof useWealthContext).toBe("function");

    expect(MarketProvider).toBeDefined();
    expect(typeof MarketProvider).toBe("function");
    expect(useMarketContext).toBeDefined();
    expect(typeof useMarketContext).toBe("function");

    expect(ModalProvider).toBeDefined();
    expect(typeof ModalProvider).toBe("function");
    expect(useModalContext).toBeDefined();
    expect(typeof useModalContext).toBe("function");

    expect(AppProviders).toBeDefined();
    expect(typeof AppProviders).toBe("function");
  });

  it("can construct AppProviders element tree cleanly", () => {
    const element = React.createElement(
      AppProviders,
      { initialClients: [], initialGoals: [] },
      React.createElement("div", null, "Child Content")
    );
    expect(element).toBeDefined();
    expect(element.type).toBe(AppProviders);
    expect(element.props.children).toBeDefined();
  });
});
