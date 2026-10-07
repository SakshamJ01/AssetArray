import { FamilyVaultService } from "../src/services/intelligence/familyVaultService";
import { PortfolioHolding } from "../src/types/wealth";

describe("Family Continuity Vault & Nominee Audit Service", () => {
  const mockHoldings: PortfolioHolding[] = [
    {
      id: "h_hdfc",
      assetName: "HDFC Bank Ltd.",
      assetClass: "Stocks",
      ticker: "HDFCBANK",
      quantity: "100",
      investedValue: "150000",
      currentValue: "180000",
      targetWeight: "40",
      notes: "",
    },
    {
      id: "h_mf",
      assetName: "Parag Parikh Flexi Cap Fund",
      assetClass: "Mutual Funds",
      ticker: "PPFAS_FLEXI",
      quantity: "2000",
      investedValue: "100000",
      currentValue: "140000",
      targetWeight: "40",
      notes: "",
    },
    {
      id: "h_cash",
      assetName: "HDFC Savings Account",
      assetClass: "Cash",
      ticker: "HDFC_SAVINGS",
      quantity: "1",
      investedValue: "50000",
      currentValue: "50000",
      targetWeight: "20",
      notes: "",
    },
  ];

  test("correctly audits nominee registrations across asset folios", () => {
    const audit = FamilyVaultService.auditNominees(mockHoldings);

    expect(audit.totalAssetsAudited).toBe(3);
    expect(audit.nominees.length).toBe(3);
    expect(audit.completenessScore).toBeGreaterThanOrEqual(0);
    expect(audit.completenessScore).toBeLessThanOrEqual(100);
    expect(audit.nominees[0].custodian).toContain("Demat");
    expect(audit.nominees[1].custodian).toContain("CAMS");
    expect(audit.nominees[2].custodian).toContain("Bank");
  });

  test("generates complete encrypted Emergency Playbook dossier", () => {
    const audit = FamilyVaultService.auditNominees(mockHoldings);
    const playbook = FamilyVaultService.generateEmergencyPlaybook({
      clientId: "cli_101",
      clientName: "Vikram Malhotra",
      emergencyContact: {
        name: "Pooja Malhotra",
        relationship: "Spouse",
        phone: "+919876543210",
        email: "pooja@malhotra.family",
      },
      holdings: mockHoldings,
      nominees: audit.nominees,
    });

    expect(playbook.clientName).toBe("Vikram Malhotra");
    expect(playbook.totalAssetsCovered).toBe(3);
    expect(playbook.totalEstimatedValue).toBe(370000);
    expect(playbook.accounts.length).toBe(3);
    expect(playbook.criticalChecklist.length).toBeGreaterThan(3);
    expect(playbook.criticalChecklist[0]).toContain("Death Certificate");
  });
});
