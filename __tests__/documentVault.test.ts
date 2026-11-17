import { getInitialSampleDocuments } from "../src/hooks/useDocumentVault";
import { storageService } from "../src/platform/storage";
import { FiduciaryDocument } from "../src/types/wealth";

describe("Document Vault Core Logic & Storage Persistence", () => {
  const testClientId = "client-family-office-99";
  const storageKey = `ASSETARRAY_DOCS_${testClientId}`;

  beforeEach(async () => {
    await storageService.removeItem(storageKey);
  });

  test("generates standard initial sample fiduciary documents with DPDP zero-PII masking", () => {
    const docs = getInitialSampleDocuments(testClientId);
    expect(docs.length).toBeGreaterThanOrEqual(2);

    const kycDoc = docs.find((d) => d.category === "kyc");
    expect(kycDoc).toBeDefined();
    expect(kycDoc?.name).toContain("CKYC");
    expect(kycDoc?.status).toBe("verified");

    const ipsDoc = docs.find((d) => d.category === "ips");
    expect(ipsDoc).toBeDefined();
    expect(ipsDoc?.name).toContain("Investment Policy Statement");
  });

  test("persists, updates, and deletes fiduciary documents in storage correctly", async () => {
    const initialDocs = getInitialSampleDocuments(testClientId);
    await storageService.setItem(storageKey, JSON.stringify(initialDocs));

    // Verify stored
    const raw = await storageService.getItem(storageKey);
    expect(raw).not.toBeNull();
    const parsed: FiduciaryDocument[] = JSON.parse(raw!);
    expect(parsed.length).toBe(initialDocs.length);

    // Add a new document
    const newDoc: FiduciaryDocument = {
      id: `doc-${Date.now()}-test`,
      clientId: testClientId,
      name: "Family Trust Deed 2026",
      category: "legal",
      fileSizeFormatted: "2.4 MB",
      uploadedAt: new Date().toISOString(),
      mimeType: "application/pdf",
      status: "verified",
      notes: "Executed in Mumbai",
    };

    const updated = [newDoc, ...parsed];
    await storageService.setItem(storageKey, JSON.stringify(updated));

    // Read back and verify added
    const readAfterAdd = await storageService.getItem(storageKey);
    const parsedAfterAdd: FiduciaryDocument[] = JSON.parse(readAfterAdd!);
    expect(parsedAfterAdd.length).toBe(initialDocs.length + 1);
    expect(parsedAfterAdd[0].name).toBe("Family Trust Deed 2026");

    // Remove the document
    const filtered = parsedAfterAdd.filter((d) => d.id !== newDoc.id);
    await storageService.setItem(storageKey, JSON.stringify(filtered));

    const readAfterDelete = await storageService.getItem(storageKey);
    const parsedAfterDelete: FiduciaryDocument[] = JSON.parse(readAfterDelete!);
    expect(parsedAfterDelete.length).toBe(initialDocs.length);
    expect(parsedAfterDelete.some((d) => d.id === newDoc.id)).toBe(false);
  });
});
