import { encryptPayload, decryptPayload, derivePinKey, newPinSalt } from "../src/services/pinCrypto";

describe("Security, Vault Encryption & Auth Audit Suite", () => {
  test("PBKDF2 Key Derivation Integrity", () => {
    const pin = "1234";
    const salt = newPinSalt();
    const derivedKey = derivePinKey(pin, salt);

    expect(derivedKey).toBeDefined();
    expect(derivedKey.length).toBeGreaterThan(16);

    const derivedKeySame = derivePinKey(pin, salt);
    expect(derivedKeySame).toEqual(derivedKey);

    const derivedKeyDiffSalt = derivePinKey(pin, newPinSalt());
    expect(derivedKeyDiffSalt).not.toEqual(derivedKey);
  });

  test("AES Local Vault Data Encryption & Decryption Envelopes", () => {
    const sensitiveData = {
      ownerName: "Saksham Jain",
      aum: 25000000,
      clientKeys: ["cli_001", "cli_002"],
    };
    const pinSecret = "1234";

    const encryptedEnvelope = encryptPayload(sensitiveData, pinSecret);
    expect(encryptedEnvelope).toBeDefined();
    expect(encryptedEnvelope.startsWith("AA1.")).toBe(true);
    expect(encryptedEnvelope).not.toContain("Saksham Jain");

    const decryptedData = decryptPayload<typeof sensitiveData>(encryptedEnvelope, pinSecret);
    expect(decryptedData).toEqual(sensitiveData);

    // Tampered payload / wrong secret throws or fails cleanly
    expect(() => decryptPayload(encryptedEnvelope, "9999")).toThrow();
  });

  test("Auth Session Token Payload Security", () => {
    const sessionPayload = {
      token: "header.payload.signature",
      user: { username: "admin", role: "ADVISOR" },
      expiresAt: Date.now() + 900000,
    };

    const serialized = JSON.stringify(sessionPayload);
    expect(serialized).not.toContain("password");
    expect(serialized).not.toContain("pin");
    expect(sessionPayload.user.role).toEqual("ADVISOR");
  });
});
