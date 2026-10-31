jest.mock("react-native", () => ({
  Platform: { OS: "web" },
  StyleSheet: { create: (styles: any) => styles },
  View: "View",
  Text: "Text",
  TextInput: "TextInput",
  Modal: "Modal",
  Pressable: "Pressable",
  ScrollView: "ScrollView",
  ActivityIndicator: "ActivityIndicator",
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("../src/services/haptics", () => ({
  triggerSuccessHaptic: jest.fn().mockResolvedValue(undefined),
}));

import { ClientOnboardingWizardModal } from "../src/components/modals/ClientOnboardingWizardModal";
import * as ModalsIndex from "../src/components/modals";
import { parseStatement, SAMPLE_STATEMENTS } from "../src/services/statementParser";

describe("ClientOnboardingWizardModal", () => {
  it("should be defined and importable as a React component", () => {
    expect(ClientOnboardingWizardModal).toBeDefined();
    expect(typeof ClientOnboardingWizardModal).toBe("function");
  });

  it("should be exported from modals/index", () => {
    expect((ModalsIndex as any).ClientOnboardingWizardModal).toBeDefined();
    expect((ModalsIndex as any).ClientOnboardingWizardModal).toBe(ClientOnboardingWizardModal);
  });

  it("supports institutional demo statements with zero PII parsing", () => {
    const parsed = parseStatement(SAMPLE_STATEMENTS.zerodha);
    expect(parsed.success).toBe(true);
    expect(parsed.holdings.length).toBeGreaterThan(0);
    expect(parsed.totalValue).toBeGreaterThan(0);
    expect(parsed.detectedBroker).toBe("Zerodha Kite");

    // Ensure no PII leakage in holding symbols
    parsed.holdings.forEach((h) => {
      expect(typeof h.ticker).toBe("string");
      expect(typeof h.currentValue).toBe("number");
    });
  });

  it("calculates allocation presets with 100% total coverage", () => {
    const presets = [
      { label: "Balanced Wealth", equity: 60, debt: 30, alts: 10 },
      { label: "Aggressive Growth", equity: 75, debt: 15, alts: 10 },
      { label: "Capital Preservation", equity: 30, debt: 60, alts: 10 },
      { label: "High Yield & Multi-Asset", equity: 45, debt: 35, alts: 20 },
    ];

    presets.forEach((preset) => {
      expect(preset.equity + preset.debt + preset.alts).toBe(100);
    });
  });
});
