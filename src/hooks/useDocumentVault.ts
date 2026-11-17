import { useState, useEffect, useCallback } from "react";
import { FiduciaryDocument, ReconciliationReport, PortfolioHolding, DocumentCategory } from "../types/wealth";
import { storageService } from "../platform/storage";
import { SimpleHolding } from "../services/rebalancer";
import { generateReconciliationDiff, applyReconciliation } from "../services/reconciliationEngine";
import { subscribeToShowSampleData, getCachedShowSampleDataSetting } from "../services/sampleDataSettings";

const DOCS_STORAGE_PREFIX = "ASSETARRAY_DOCS_";

export function getInitialSampleDocuments(clientId: string): FiduciaryDocument[] {
  return [
    {
      id: `doc-${clientId}-kyc-1`,
      clientId,
      name: "Client Identity & CKYC Record (PAN / Aadhaar DPDP Redacted)",
      category: "kyc",
      fileSizeFormatted: "1.4 MB",
      uploadedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      mimeType: "application/pdf",
      status: "verified",
      notes: "DigiLocker verified with zero-PII masking.",
    },
    {
      id: `doc-${clientId}-ips-1`,
      clientId,
      name: "Investment Policy Statement & Discretionary Mandate (FY 2026-27)",
      category: "ips",
      fileSizeFormatted: "620 KB",
      uploadedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      mimeType: "application/pdf",
      status: "verified",
      notes: "Signed dual-mandate: 60% Equity / 25% Fixed Income / 15% Alternatives.",
    },
  ];
}

export function useDocumentVault(clientId?: string | null) {
  const [documents, setDocuments] = useState<FiduciaryDocument[]>([]);
  const [activeReport, setActiveReport] = useState<ReconciliationReport | null>(null);
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [sampleDataEnabled, setSampleDataEnabled] = useState<boolean>(getCachedShowSampleDataSetting());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Subscribe to sample data settings
  useEffect(() => {
    const unsub = subscribeToShowSampleData((enabled) => {
      setSampleDataEnabled(enabled);
    });
    return unsub;
  }, []);

  const storageKey = clientId ? `${DOCS_STORAGE_PREFIX}${clientId}` : null;

  // Load documents when clientId changes
  useEffect(() => {
    if (!storageKey || !clientId) {
      setDocuments([]);
      setActiveReport(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    void storageService.getItem(storageKey).then((raw) => {
      if (!isMounted) return;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setDocuments(Array.isArray(parsed) ? parsed : []);
        } catch {
          setDocuments([]);
        }
      } else {
        // If sample data is enabled, provide standard initial documents
        const initial = sampleDataEnabled ? getInitialSampleDocuments(clientId) : [];
        setDocuments(initial);
        if (initial.length > 0) {
          void storageService.setItem(storageKey, JSON.stringify(initial));
        }
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [storageKey, clientId, sampleDataEnabled]);

  const saveDocuments = useCallback(
    async (newDocs: FiduciaryDocument[]) => {
      setDocuments(newDocs);
      if (storageKey) {
        await storageService.setItem(storageKey, JSON.stringify(newDocs));
      }
    },
    [storageKey]
  );

  const addDocument = useCallback(
    async (
      name: string,
      category: DocumentCategory,
      fileSizeFormatted = "245 KB",
      extractedHoldingsCount?: number,
      notes?: string
    ) => {
      if (!clientId) return null;
      const newDoc: FiduciaryDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        clientId,
        name,
        category,
        fileSizeFormatted,
        uploadedAt: new Date().toISOString(),
        mimeType: "application/pdf",
        extractedHoldingsCount,
        status: "verified",
        notes,
      };
      const updated = [newDoc, ...documents];
      await saveDocuments(updated);
      return newDoc;
    },
    [clientId, documents, saveDocuments]
  );

  const removeDocument = useCallback(
    async (docId: string) => {
      const updated = documents.filter((d) => d.id !== docId);
      await saveDocuments(updated);
    },
    [documents, saveDocuments]
  );

  const updateDocumentNotes = useCallback(
    async (docId: string, notes: string) => {
      const updated = documents.map((d) => (d.id === docId ? { ...d, notes } : d));
      await saveDocuments(updated);
    },
    [documents, saveDocuments]
  );

  // Generate reconciliation report against incoming statement holdings
  const runReconciliation = useCallback(
    (
      statementHoldings: SimpleHolding[],
      existingHoldings: PortfolioHolding[],
      sourceName = "Consolidated Account Statement"
    ) => {
      if (!clientId) return null;
      const report = generateReconciliationDiff(existingHoldings, statementHoldings, clientId, sourceName);
      setActiveReport(report);
      // Pre-select all new and modified items by default
      const defaultApproved = report.items
        .filter((i) => i.diffType === "new" || i.diffType === "modified")
        .map((i) => i.ticker);
      setSelectedTickers(defaultApproved);
      return report;
    },
    [clientId]
  );

  const toggleTickerSelection = useCallback((ticker: string) => {
    setSelectedTickers((prev) =>
      prev.includes(ticker) ? prev.filter((t) => t !== ticker) : [...prev, ticker]
    );
  }, []);

  const selectAllTickers = useCallback(() => {
    if (!activeReport) return;
    setSelectedTickers(activeReport.items.map((i) => i.ticker));
  }, [activeReport]);

  const clearTickerSelection = useCallback(() => {
    setSelectedTickers([]);
  }, []);

  // Commit approved reconciliation changes to portfolio and record the statement document
  const commitReconciliation = useCallback(
    async (
      existingHoldings: PortfolioHolding[],
      onApplyHoldings: (updated: PortfolioHolding[]) => void,
      documentName = "Reconciled Broker Statement"
    ) => {
      if (!activeReport) return;
      const updatedHoldings = applyReconciliation(existingHoldings, activeReport.items, selectedTickers);
      onApplyHoldings(updatedHoldings);

      // Auto-record the statement into the vault
      await addDocument(
        documentName,
        "statement",
        "1.1 MB",
        selectedTickers.length,
        `Reconciled ${selectedTickers.length} holdings. Signature: ${activeReport.auditSignature}`
      );

      setActiveReport(null);
      setSelectedTickers([]);
    },
    [activeReport, selectedTickers, addDocument]
  );

  const dismissReconciliation = useCallback(() => {
    setActiveReport(null);
    setSelectedTickers([]);
  }, []);

  return {
    documents,
    isLoading,
    addDocument,
    removeDocument,
    updateDocumentNotes,
    activeReport,
    selectedTickers,
    toggleTickerSelection,
    selectAllTickers,
    clearTickerSelection,
    runReconciliation,
    commitReconciliation,
    dismissReconciliation,
    sampleDataEnabled,
  };
}
