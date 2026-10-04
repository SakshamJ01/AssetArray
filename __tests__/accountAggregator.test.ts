import { accountAggregatorService } from "../src/services/accountAggregator";

describe("AccountAggregatorService", () => {
  it("creates a compliant AA consent request in PENDING_OTP status", async () => {
    const consent = await accountAggregatorService.requestConsent("CLIENT-AA-001", [
      "MUTUAL_FUNDS",
      "EQUITIES",
    ]);

    expect(consent.consentId).toMatch(/^AA-REQ-/);
    expect(consent.clientRefToken).toBe("CLIENT-AA-001");
    expect(consent.status).toBe("PENDING_OTP");
    expect(consent.fipTypes).toContain("MUTUAL_FUNDS");
  });

  it("verifies consent with 6-digit OTP and activates the handle", async () => {
    const consent = await accountAggregatorService.requestConsent("CLIENT-AA-002");
    const approved = await accountAggregatorService.verifyConsentOtp(consent.consentId, "123456");

    expect(approved.status).toBe("ACTIVE");
    expect(approved.approvedAt).toBeDefined();
  });

  it("rejects invalid OTP", async () => {
    const consent = await accountAggregatorService.requestConsent("CLIENT-AA-003");
    await expect(
      accountAggregatorService.verifyConsentOtp(consent.consentId, "12")
    ).rejects.toThrow(/Invalid OTP/);
  });

  it("fetches consolidated net worth and unmarshals holdings from active consent", async () => {
    const consent = await accountAggregatorService.requestConsent("CLIENT-AA-004");
    await accountAggregatorService.verifyConsentOtp(consent.consentId, "998877");

    const data = await accountAggregatorService.fetchConsolidatedData(consent.consentId);

    expect(data.consentId).toBe(consent.consentId);
    expect(data.totalNetWorth).toBeGreaterThan(0);
    expect(data.holdings.length).toBeGreaterThan(0);
    expect(data.bankAccounts.length).toBeGreaterThan(0);
    expect(data.signatureHash).toMatch(/^AA-FIP-SIG-/);
  });
});
