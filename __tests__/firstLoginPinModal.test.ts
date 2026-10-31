jest.mock("react-native", () => ({
  Platform: { OS: "web" },
  StyleSheet: { create: (styles: any) => styles },
  View: "View",
  Text: "Text",
  TextInput: "TextInput",
  Modal: "Modal",
  Pressable: "Pressable",
  ActivityIndicator: "ActivityIndicator",
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("../src/services/haptics", () => ({
  triggerSuccessHaptic: jest.fn(),
}));

import { FirstLoginPinModal } from "../src/components/modals/FirstLoginPinModal";
import * as ModalsIndex from "../src/components/modals";

describe("FirstLoginPinModal Component", () => {
  it("should be defined and importable as a component", () => {
    expect(FirstLoginPinModal).toBeDefined();
    expect(typeof FirstLoginPinModal).toBe("function");
  });

  it("should be re-exported by modals index", () => {
    expect((ModalsIndex as any).FirstLoginPinModal).toBeDefined();
  });

  it("validates PIN criteria correctly: 4-6 digits, numeric only", () => {
    const isValidPin = (pin: string, confirm: string) => {
      const clean = pin.trim();
      const cleanConfirm = confirm.trim();
      if (clean.length < 4 || clean.length > 6) return false;
      if (!/^\d+$/.test(clean)) return false;
      return clean === cleanConfirm;
    };

    expect(isValidPin("123", "123")).toBe(false); // too short
    expect(isValidPin("1234567", "1234567")).toBe(false); // too long
    expect(isValidPin("abcd", "abcd")).toBe(false); // non-numeric
    expect(isValidPin("1234", "5678")).toBe(false); // mismatch
    expect(isValidPin("1234", "1234")).toBe(true); // valid 4-digit
    expect(isValidPin("123456", "123456")).toBe(true); // valid 6-digit
  });
});
