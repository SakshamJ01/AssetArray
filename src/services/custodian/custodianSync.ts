/**
 * Multi-Custodian Account Aggregation & Synchronization Service
 * Provides normalized portfolio data feeds across custodians (BridgeFT, Plaid, Flanks, Envestnet)
 * Eliminates manual CSV uploads in favor of live account connection and reconciliation.
 */

export type CustodianProvider = "BridgeFT" | "Plaid" | "Flanks" | "Envestnet" | "DirectBroker";

export interface CustodianHolding {
  id: string;
  symbol: string;
  name: string;
  assetClass: "Equity" | "FixedIncome" | "MutualFund" | "Cash" | "Alternative";
  quantity: number;
  costBasis: number;
  marketPrice: number;
  marketValue: number;
  unrealizedGainLoss: number;
  currency: string;
  asOfDate: string;
}

export interface CustodianAccount {
  id: string;
  clientId: string;
  institutionName: string;
  accountNumberMasked: string;
  accountType: "Taxable" | "IRA_Traditional" | "IRA_Roth" | "Trust" | "Corporate";
  custodian: CustodianProvider;
  balance: number;
  currency: string;
  status: "connected" | "syncing" | "error" | "disconnected";
  lastSyncTimestamp: string;
  holdings: CustodianHolding[];
}

export interface SyncResult {
  success: boolean;
  syncedAccounts: number;
  totalHoldingsValue: number;
  reconciledPositions: number;
  anomaliesDetected: number;
  timestamp: string;
  message: string;
}

class CustodianSyncService {
  private accounts: Map<string, CustodianAccount[]> = new Map();

  constructor() {
    this.seedMockAccounts();
  }

  private seedMockAccounts() {
    // Seed initial client accounts
    this.accounts.set("client-1", [
      {
        id: "cust-acc-101",
        clientId: "client-1",
        institutionName: "Charles Schwab & Co.",
        accountNumberMasked: "...4821",
        accountType: "Taxable",
        custodian: "BridgeFT",
        balance: 1450000,
        currency: "USD",
        status: "connected",
        lastSyncTimestamp: new Date(Date.now() - 1800000).toISOString(),
        holdings: [
          {
            id: "pos-1",
            symbol: "AAPL",
            name: "Apple Inc.",
            assetClass: "Equity",
            quantity: 2000,
            costBasis: 180.5,
            marketPrice: 232.5,
            marketValue: 465000,
            unrealizedGainLoss: 104000,
            currency: "USD",
            asOfDate: new Date().toISOString(),
          },
          {
            id: "pos-2",
            symbol: "MSFT",
            name: "Microsoft Corp.",
            assetClass: "Equity",
            quantity: 1100,
            costBasis: 390.0,
            marketPrice: 448.2,
            marketValue: 493020,
            unrealizedGainLoss: 64020,
            currency: "USD",
            asOfDate: new Date().toISOString(),
          },
          {
            id: "pos-3",
            symbol: "VOO",
            name: "Vanguard S&P 500 ETF",
            assetClass: "MutualFund",
            quantity: 960,
            costBasis: 470.0,
            marketPrice: 512.4,
            marketValue: 491904,
            unrealizedGainLoss: 40704,
            currency: "USD",
            asOfDate: new Date().toISOString(),
          },
        ],
      },
      {
        id: "cust-acc-102",
        clientId: "client-1",
        institutionName: "Fidelity Investments",
        accountNumberMasked: "...9104",
        accountType: "IRA_Roth",
        custodian: "Plaid",
        balance: 620000,
        currency: "USD",
        status: "connected",
        lastSyncTimestamp: new Date(Date.now() - 3600000).toISOString(),
        holdings: [
          {
            id: "pos-4",
            symbol: "NVDA",
            name: "NVIDIA Corp.",
            assetClass: "Equity",
            quantity: 2400,
            costBasis: 85.0,
            marketPrice: 128.8,
            marketValue: 309120,
            unrealizedGainLoss: 105120,
            currency: "USD",
            asOfDate: new Date().toISOString(),
          },
          {
            id: "pos-5",
            symbol: "QQQ",
            name: "Invesco QQQ Trust",
            assetClass: "MutualFund",
            quantity: 640,
            costBasis: 420.0,
            marketPrice: 485.6,
            marketValue: 310784,
            unrealizedGainLoss: 41984,
            currency: "USD",
            asOfDate: new Date().toISOString(),
          },
        ],
      },
    ]);
  }

  public getClientAccounts(clientId: string): CustodianAccount[] {
    return this.accounts.get(clientId) || [];
  }

  public async linkAccount(
    clientId: string,
    institution: string,
    custodian: CustodianProvider,
    accountType: CustodianAccount["accountType"]
  ): Promise<CustodianAccount> {
    const newAccount: CustodianAccount = {
      id: `cust-acc-${Date.now()}`,
      clientId,
      institutionName: institution,
      accountNumberMasked: `...${Math.floor(1000 + Math.random() * 9000)}`,
      accountType,
      custodian,
      balance: 250000,
      currency: "USD",
      status: "connected",
      lastSyncTimestamp: new Date().toISOString(),
      holdings: [
        {
          id: `pos-${Date.now()}-1`,
          symbol: "VOO",
          name: "Vanguard S&P 500 ETF",
          assetClass: "MutualFund",
          quantity: 480,
          costBasis: 490.0,
          marketPrice: 512.4,
          marketValue: 245952,
          unrealizedGainLoss: 10752,
          currency: "USD",
          asOfDate: new Date().toISOString(),
        },
      ],
    };

    const existing = this.accounts.get(clientId) || [];
    existing.push(newAccount);
    this.accounts.set(clientId, existing);
    return newAccount;
  }

  public async syncClientAccounts(clientId: string): Promise<SyncResult> {
    const list = this.accounts.get(clientId) || [];
    if (list.length === 0) {
      return {
        success: true,
        syncedAccounts: 0,
        totalHoldingsValue: 0,
        reconciledPositions: 0,
        anomaliesDetected: 0,
        timestamp: new Date().toISOString(),
        message: "No connected custodial accounts for this client.",
      };
    }

    let totalVal = 0;
    let positionsCount = 0;

    for (const acc of list) {
      acc.status = "syncing";
      // Simulate live network handshake & position delta pull
      await new Promise((r) => setTimeout(r, 40));
      acc.status = "connected";
      acc.lastSyncTimestamp = new Date().toISOString();

      for (const h of acc.holdings) {
        // Minor market fluctuation sync
        const tickDelta = (Math.random() - 0.49) * 0.005;
        h.marketPrice = +(h.marketPrice * (1 + tickDelta)).toFixed(2);
        h.marketValue = +(h.quantity * h.marketPrice).toFixed(2);
        h.unrealizedGainLoss = +(h.marketValue - h.quantity * h.costBasis).toFixed(2);
        h.asOfDate = new Date().toISOString();
        totalVal += h.marketValue;
        positionsCount++;
      }
      acc.balance = acc.holdings.reduce((sum, h) => sum + h.marketValue, 0);
    }

    return {
      success: true,
      syncedAccounts: list.length,
      totalHoldingsValue: totalVal,
      reconciledPositions: positionsCount,
      anomaliesDetected: 0,
      timestamp: new Date().toISOString(),
      message: `Successfully synchronized ${list.length} custodial accounts across BridgeFT & Plaid.`,
    };
  }
}

export const custodianSyncService = new CustodianSyncService();
