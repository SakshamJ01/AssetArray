/**
 * Test Suite: AssetArray Algorithmic Execution Engine
 * Validates TWAP/VWAP/Iceberg slicing math, Almgren-Chriss impact estimates,
 * FIX 4.4 Tag 847 generation, and cryptographic execution proofs.
 */

import {
  AlgoExecutionEngine,
  algoExecutionEngine,
} from "../src/services/algoExecution/algoExecutionEngine";
import { AlgoScheduler } from "../src/services/algoExecution/algoScheduler";
import { MarketImpactModel } from "../src/services/algoExecution/marketImpactModel";

describe("Algorithmic Execution Engine — Institutional Grade", () => {
  describe("Almgren-Chriss Market Impact Model", () => {
    it("calculates realistic slippage and TCA savings for institutional order size", () => {
      const estimate = MarketImpactModel.calculateEstimate({
        quantity: 10000,
        price: 1500, // 1.5 Crore order value
        dailyVolume: 1000000,
        volatilityDailyPct: 0.015,
        spreadBps: 5.0,
        slicesCount: 10,
        timeHorizonMinutes: 60,
      });

      expect(estimate.parentQuantity).toBe(10000);
      expect(estimate.participationRatePct).toBe(1.0); // 10k / 1M = 1%
      expect(estimate.permanentImpactBps).toBeGreaterThan(0);
      expect(estimate.temporaryImpactBps).toBeGreaterThan(0);
      expect(estimate.totalSlippageBps).toBeGreaterThan(0);
      expect(estimate.naiveMarketSweepCost).toBeGreaterThan(estimate.totalEstimatedImpactCost);
      expect(estimate.algoSavingsBps).toBeGreaterThan(0);
      expect(estimate.algoSavingsCost).toBeGreaterThan(0);
    });
  });

  describe("TWAP Scheduling & Invariants", () => {
    it("maintains 100% quantity invariance across all child slices", () => {
      const totalQty = 1057; // Odd number prime-like quantity
      const order = algoExecutionEngine.createParentOrder({
        symbol: "RELIANCE",
        transactionType: "BUY",
        totalQuantity: totalQty,
        benchmarkPrice: 2850.5,
        params: {
          strategy: "TWAP",
          slicesCount: 7,
          timeHorizonMinutes: 35,
          jitterPct: 0.15,
        },
      });

      expect(order.slices.length).toBe(7);
      const sumSlices = order.slices.reduce((acc, s) => acc + s.quantity, 0);
      expect(sumSlices).toBe(totalQty);
      expect(order.slices[0].status).toBe("PENDING");
      expect(order.slices[0].fixClOrdId).toContain("FIX-SLICE-");
    });
  });

  describe("VWAP U-Curve Slicing", () => {
    it("allocates larger slice quantities during market open and close peaks", () => {
      const totalQty = 10000;
      const order = algoExecutionEngine.createParentOrder({
        symbol: "INFY",
        transactionType: "BUY",
        totalQuantity: totalQty,
        benchmarkPrice: 1850.0,
        params: {
          strategy: "VWAP",
          slicesCount: 9,
          timeHorizonMinutes: 375,
        },
      });

      expect(order.slices.length).toBe(9);
      const sumSlices = order.slices.reduce((acc, s) => acc + s.quantity, 0);
      expect(sumSlices).toBe(totalQty);

      // In the U-Curve: First slice (open) and Last slice (close) should be larger than middle (lunch lull)
      const openSliceQty = order.slices[0].quantity;
      const midSliceQty = order.slices[4].quantity;
      const closeSliceQty = order.slices[8].quantity;

      expect(openSliceQty).toBeGreaterThan(midSliceQty);
      expect(closeSliceQty).toBeGreaterThan(midSliceQty);
    });
  });

  describe("Iceberg Slicing & Disclosed Quantity", () => {
    it("enforces small visible disclosed quantities in child limit orders", () => {
      const totalQty = 5000;
      const order = algoExecutionEngine.createParentOrder({
        symbol: "TCS",
        transactionType: "SELL",
        totalQuantity: totalQty,
        benchmarkPrice: 4200.0,
        params: {
          strategy: "ICEBERG",
          disclosedRatio: 0.20, // 20% visible
          timeHorizonMinutes: 60,
        },
      });

      expect(order.slices.length).toBeGreaterThan(1);
      order.slices.forEach((slice) => {
        expect(slice.disclosedQuantity).toBeLessThanOrEqual(slice.quantity);
        expect(slice.disclosedQuantity).toBeGreaterThan(0);
      });
    });
  });

  describe("FIX 4.4 Algorithmic Tag Generation", () => {
    it("generates valid FIX 4.4 NewOrderSingle with Tag 847 (TargetStrategy) and Tag 10 (Checksum)", () => {
      const order = algoExecutionEngine.createParentOrder({
        symbol: "HDFCBANK",
        transactionType: "BUY",
        totalQuantity: 2000,
        benchmarkPrice: 1650.0,
        params: {
          strategy: "TWAP",
          slicesCount: 4,
          timeHorizonMinutes: 20,
        },
      });

      const firstSlice = order.slices[0];
      expect(firstSlice.fixMessage).toBeDefined();
      expect(firstSlice.fixMessage).toContain("8=FIX.4.4\x01");
      expect(firstSlice.fixMessage).toContain("35=D\x01");
      expect(firstSlice.fixMessage).toContain("847=1\x01"); // Tag 847: 1 = TWAP
      expect(firstSlice.fixMessage).toContain("55=HDFCBANK\x01");
      expect(firstSlice.fixMessage).toContain("10="); // Checksum present at end
    });

    it("generates Tag 847=2 for VWAP and Tag 847=3 for Iceberg", () => {
      const vwapOrder = algoExecutionEngine.createParentOrder({
        symbol: "ITC",
        transactionType: "BUY",
        totalQuantity: 1000,
        benchmarkPrice: 480.0,
        params: { strategy: "VWAP" },
      });
      expect(vwapOrder.slices[0].fixMessage).toContain("847=2\x01");

      const icebergOrder = algoExecutionEngine.createParentOrder({
        symbol: "ITC",
        transactionType: "BUY",
        totalQuantity: 1000,
        benchmarkPrice: 480.0,
        params: { strategy: "ICEBERG" },
      });
      expect(icebergOrder.slices[0].fixMessage).toContain("847=3\x01");
    });
  });

  describe("End-to-End Algorithmic Execution Simulation & Cryptographic Audit", () => {
    it("simulates slice-by-slice execution and generates cryptographic SHA-256 batch proof", async () => {
      const order = algoExecutionEngine.createParentOrder({
        symbol: "SBIN",
        transactionType: "BUY",
        totalQuantity: 3000,
        benchmarkPrice: 820.0,
        params: {
          strategy: "TWAP",
          slicesCount: 4,
          timeHorizonMinutes: 10,
        },
      });

      const progressUpdates: any[] = [];
      const completedOrder = await algoExecutionEngine.simulateExecution(
        order.parentOrderId,
        (u) => progressUpdates.push(u),
        0 // synchronous test execution
      );

      expect(completedOrder.status).toBe("COMPLETED");
      expect(completedOrder.totalFilledQuantity).toBe(3000);
      expect(completedOrder.vwapAchieved).toBeGreaterThan(800);
      expect(completedOrder.executionReceiptHash).toBeDefined();
      expect(completedOrder.executionReceiptHash?.length).toBe(64); // SHA-256 length
      expect(progressUpdates.length).toBe(4);
      expect(progressUpdates[3].isComplete).toBe(true);
      expect(completedOrder.slices.every((s) => s.status === "FILLED")).toBe(true);
    });
  });
});
