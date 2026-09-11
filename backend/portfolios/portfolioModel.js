/**
 * AssetArray 4.0 — Portfolio Domain Model
 * Represents accounts, demats, holdings, and tax lots belonging to a client/household.
 * Reuses and is 100% backward-compatible with existing 3.3.x holdings structures.
 */

class PortfolioModel {
  /**
   * Sanitizes and bounds a Portfolio entity within a Firm tenant.
   */
  static sanitize(portfolio, firmId) {
    if (!portfolio) return null;
    const holdings = Array.isArray(portfolio.holdings) ? portfolio.holdings.map(this.sanitizeHolding) : [];
    const totalValue = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
    const investedValue = holdings.reduce((sum, h) => sum + (Number(h.investedValue) || 0), 0);

    return {
      id: String(portfolio.id || `port_${Date.now()}`),
      firmId: String(firmId || portfolio.firmId || "firm_default_practice"),
      clientId: String(portfolio.clientId || "unassigned"),
      householdId: portfolio.householdId ? String(portfolio.householdId) : null,
      accountNumber: portfolio.accountNumber ? String(portfolio.accountNumber).trim() : null,
      custodianType: portfolio.custodianType || "DIRECT_OR_BROKER", // ZERODHA, CAMS, KFINTECH, NSDL, CDSL
      mandateType: portfolio.mandateType || "GROWTH",
      cashBalance: typeof portfolio.cashBalance === "number" ? portfolio.cashBalance : 0,
      totalValue,
      investedValue,
      unrealizedPnl: totalValue - investedValue,
      unrealizedPnlPct: investedValue > 0 ? ((totalValue - investedValue) / investedValue) * 100 : 0,
      holdings,
      createdAt: portfolio.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  static sanitizeHolding(h) {
    if (!h) return {};
    const curVal = Number(h.currentValue) || 0;
    const invVal = Number(h.investedValue) || 0;
    return {
      id: String(h.id || `h_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
      assetName: String(h.assetName || "Holding").trim(),
      ticker: h.ticker ? String(h.ticker).trim().toUpperCase() : "HOLDING",
      isin: h.isin ? String(h.isin).trim().toUpperCase() : null,
      assetClass: h.assetClass || "Stocks", // Stocks, Bonds, Mutual Funds, Cash, Alternatives
      category: h.category || h.assetClass || "Stocks",
      quantity: Number(h.quantity) || 1,
      buyPrice: Number(h.buyPrice) || 0,
      currentPrice: Number(h.currentPrice) || (h.quantity ? curVal / h.quantity : 0),
      investedValue: invVal,
      currentValue: curVal,
      acquiredAt: h.acquiredAt || null,
      taxLots: Array.isArray(h.taxLots) ? h.taxLots : [],
    };
  }

  static toPublic(portfolio) {
    return this.sanitize(portfolio);
  }
}

module.exports = { PortfolioModel };
