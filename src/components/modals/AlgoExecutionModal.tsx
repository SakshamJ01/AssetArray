import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppTheme } from "../../theme";
import {
  AlgoChildSlice,
  AlgoExecutionParams,
  AlgoParentOrder,
  AlgoSimulationUpdate,
  AlgoStrategyType,
  algoExecutionEngine,
} from "../../services/algoExecution";
import { realTimeMarket } from "../../services/realTimeMarket";

export interface AlgoExecutionModalProps {
  visible: boolean;
  onClose: () => void;
  theme: AppTheme;
  initialSymbol?: string;
  initialQuantity?: number;
  initialSide?: "BUY" | "SELL";
  initialPrice?: number;
  clientRefToken?: string;
}

export const AlgoExecutionModal: React.FC<AlgoExecutionModalProps> = ({
  visible,
  onClose,
  theme,
  initialSymbol = "RELIANCE",
  initialQuantity = 500,
  initialSide = "BUY",
  initialPrice,
  clientRefToken = "CLIENT-DESK",
}) => {
  const isDark =
    theme.colors.background === "#030712" ||
    theme.colors.textPrimary === "#ffffff" ||
    theme.colors.textPrimary === "#FFFFFF";

  const brandColor = theme.colors.brand || "#E0A84C";

  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [side, setSide] = useState<"BUY" | "SELL">(initialSide);
  const [quantityStr, setQuantityStr] = useState<string>(String(initialQuantity));
  const [strategy, setStrategy] = useState<AlgoStrategyType>("TWAP");
  const [timeHorizon, setTimeHorizon] = useState<number>(60);
  const [slicesCount, setSlicesCount] = useState<number>(8);
  const [jitterEnabled, setJitterEnabled] = useState<boolean>(true);
  const [limitBufferPct, setLimitBufferPct] = useState<number>(0.25);
  const [showFixLog, setShowFixLog] = useState<boolean>(false);

  // Live order execution state
  const [parentOrder, setParentOrder] = useState<AlgoParentOrder | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionProgress, setExecutionProgress] = useState<number>(0);
  const [liveSlices, setLiveSlices] = useState<AlgoChildSlice[]>([]);
  const [executionCompleted, setExecutionCompleted] = useState<boolean>(false);

  // Resolve current benchmark price
  const benchmarkPrice = useMemo(() => {
    if (initialPrice && initialPrice > 0) return initialPrice;
    const inst = realTimeMarket.getInstrument(symbol);
    return inst ? inst.price : 2850.0;
  }, [symbol, initialPrice]);

  const parsedQuantity = Math.max(1, parseInt(quantityStr, 10) || 100);

  // Re-generate staged parent order when parameters change
  useEffect(() => {
    if (!visible) return;

    const order = algoExecutionEngine.createParentOrder({
      clientRefToken,
      symbol,
      transactionType: side,
      totalQuantity: parsedQuantity,
      benchmarkPrice,
      params: {
        strategy,
        timeHorizonMinutes: timeHorizon,
        slicesCount,
        jitterPct: jitterEnabled ? 0.12 : 0,
        limitBufferPct,
      },
    });

    setParentOrder(order);
    setLiveSlices(order.slices);
    setExecutionProgress(0);
    setExecutionCompleted(false);
  }, [visible, symbol, side, parsedQuantity, benchmarkPrice, strategy, timeHorizon, slicesCount, jitterEnabled, limitBufferPct]);

  // Handle live simulation dispatch
  const handleExecuteAlgo = async () => {
    if (!parentOrder) return;
    setIsExecuting(true);
    setExecutionProgress(0);
    setExecutionCompleted(false);

    try {
      const completed = await algoExecutionEngine.simulateExecution(
        parentOrder.parentOrderId,
        (update: AlgoSimulationUpdate) => {
          setExecutionProgress(update.progressPct);
          setLiveSlices((prev) =>
            prev.map((s) => (s.sliceId === update.slice.sliceId ? update.slice : s))
          );
        },
        250 // 250ms smooth visual step
      );

      setParentOrder({ ...completed });
      setLiveSlices([...completed.slices]);
      setExecutionCompleted(true);
      setIsExecuting(false);
    } catch (err: any) {
      setIsExecuting(false);
      Alert.alert("Execution Error", err?.message || "Algo execution failed.");
    }
  };

  if (!parentOrder) return null;

  const { marketImpact } = parentOrder;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>INSTITUTIONAL EXECUTION DESK</Text>
                </View>
                <View style={[styles.protocolBadge, { borderColor: brandColor }]}>
                  <Text style={[styles.protocolText, { color: brandColor }]}>FIX 4.4 PROTOCOL</Text>
                </View>
              </View>
              <Text style={styles.title}>Algorithmic Order Slicer & EMS</Text>
              <Text style={styles.subtitle}>
                Almgren-Chriss market impact mitigation, scheduled slice execution, and cryptographic audit proofs.
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} disabled={isExecuting}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Top Order Context Card */}
            <View style={styles.contextCard}>
              <View style={styles.contextRow}>
                <View>
                  <Text style={styles.label}>SECURITY</Text>
                  <Text style={styles.symbolText}>{symbol.toUpperCase()}</Text>
                  <Text style={styles.subtext}>NSE / Equities</Text>
                </View>

                <View>
                  <Text style={styles.label}>BENCHMARK PRICE</Text>
                  <Text style={styles.priceText}>₹{benchmarkPrice.toLocaleString()}</Text>
                  <Text style={styles.subtext}>Arrival Reference</Text>
                </View>

                <View>
                  <Text style={styles.label}>ORDER VALUE</Text>
                  <Text style={styles.valueText}>
                    ₹{(parsedQuantity * benchmarkPrice).toLocaleString()}
                  </Text>
                  <Text style={styles.subtext}>{parsedQuantity} shares</Text>
                </View>

                {/* Side Toggle */}
                <View style={styles.sideToggle}>
                  <Pressable
                    style={[styles.sideBtn, side === "BUY" && styles.buyBtnActive]}
                    onPress={() => !isExecuting && setSide("BUY")}
                    disabled={isExecuting}
                  >
                    <Text style={[styles.sideText, side === "BUY" && styles.activeSideText]}>BUY</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.sideBtn, side === "SELL" && styles.sellBtnActive]}
                    onPress={() => !isExecuting && setSide("SELL")}
                    disabled={isExecuting}
                  >
                    <Text style={[styles.sideText, side === "SELL" && styles.activeSideText]}>SELL</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Strategy Selector */}
            <Text style={styles.sectionTitle}>SELECT EXECUTION ALGORITHM</Text>
            <View style={styles.strategyGrid}>
              {[
                { id: "TWAP", name: "TWAP", desc: "Time-Weighted Average Price with anti-HFT jitter." },
                { id: "VWAP", name: "VWAP", desc: "Volume-Weighted U-curve historical intraday profile." },
                { id: "ICEBERG", name: "Iceberg", desc: "Clips visible L2 book depth (20% disclosed display)." },
                { id: "POV", name: "POV", desc: "Percentage of Volume participation rate ceiling." },
              ].map((strat) => {
                const active = strategy === strat.id;
                return (
                  <Pressable
                    key={strat.id}
                    onPress={() => !isExecuting && setStrategy(strat.id as AlgoStrategyType)}
                    style={[styles.strategyCard, active && styles.strategyCardActive]}
                    disabled={isExecuting}
                  >
                    <View style={styles.strategyCardHeader}>
                      <Text style={[styles.strategyName, active && { color: brandColor }]}>
                        {strat.name}
                      </Text>
                      {active && <View style={[styles.activeDot, { backgroundColor: brandColor }]} />}
                    </View>
                    <Text style={styles.strategyDesc}>{strat.desc}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Parameter Controls */}
            <Text style={styles.sectionTitle}>EXECUTION HORIZON & SLICE CONFIGURATION</Text>
            <View style={styles.paramsGrid}>
              {/* Horizon */}
              <View style={styles.paramBox}>
                <Text style={styles.paramLabel}>TIME HORIZON</Text>
                <View style={styles.pillRow}>
                  {[15, 30, 60, 120, 375].map((mins) => (
                    <Pressable
                      key={mins}
                      onPress={() => !isExecuting && setTimeHorizon(mins)}
                      style={[styles.pill, timeHorizon === mins && styles.pillActive]}
                      disabled={isExecuting}
                    >
                      <Text style={[styles.pillText, timeHorizon === mins && styles.pillTextActive]}>
                        {mins === 375 ? "Full Day" : `${mins}m`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Slices Count */}
              <View style={styles.paramBox}>
                <Text style={styles.paramLabel}>SLICES COUNT</Text>
                <View style={styles.pillRow}>
                  {[4, 6, 8, 12, 16].map((cnt) => (
                    <Pressable
                      key={cnt}
                      onPress={() => !isExecuting && setSlicesCount(cnt)}
                      style={[styles.pill, slicesCount === cnt && styles.pillActive]}
                      disabled={isExecuting}
                    >
                      <Text style={[styles.pillText, slicesCount === cnt && styles.pillTextActive]}>
                        {cnt} slices
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Jitter & Buffer */}
              <View style={styles.paramBox}>
                <Text style={styles.paramLabel}>ANTI-FRONTRUNNING JITTER</Text>
                <Pressable
                  onPress={() => !isExecuting && setJitterEnabled(!jitterEnabled)}
                  style={[styles.pill, jitterEnabled && styles.pillActive]}
                  disabled={isExecuting}
                >
                  <Text style={[styles.pillText, jitterEnabled && styles.pillTextActive]}>
                    {jitterEnabled ? "Enabled (±12% Jitter)" : "Disabled (Strict Uniform)"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Almgren-Chriss Market Impact Card */}
            <View style={styles.impactCard}>
              <View style={styles.impactHeader}>
                <View>
                  <Text style={styles.impactTitle}>Almgren-Chriss Market Impact Analytics</Text>
                  <Text style={styles.impactSubtitle}>
                    Estimated liquidity friction & Transaction Cost Analysis (TCA)
                  </Text>
                </View>
                <View style={styles.savingsBox}>
                  <Text style={styles.savingsLabel}>ESTIMATED TCA SAVINGS</Text>
                  <Text style={styles.savingsValue}>₹{marketImpact.algoSavingsCost.toLocaleString()}</Text>
                  <Text style={styles.savingsBps}>+{marketImpact.algoSavingsBps} bps saved vs Market Order</Text>
                </View>
              </View>

              <View style={styles.impactStatsRow}>
                <View style={styles.impactStat}>
                  <Text style={styles.statLabel}>Participation Rate</Text>
                  <Text style={styles.statVal}>{marketImpact.participationRatePct}% ADV</Text>
                </View>
                <View style={styles.impactStat}>
                  <Text style={styles.statLabel}>Permanent Drift</Text>
                  <Text style={styles.statVal}>+{marketImpact.permanentImpactBps} bps</Text>
                </View>
                <View style={styles.impactStat}>
                  <Text style={styles.statLabel}>Temporary Friction</Text>
                  <Text style={styles.statVal}>+{marketImpact.temporaryImpactBps} bps</Text>
                </View>
                <View style={styles.impactStat}>
                  <Text style={styles.statLabel}>Total Est. Slippage</Text>
                  <Text style={[styles.statVal, { color: "#E0A84C" }]}>{marketImpact.totalSlippageBps} bps</Text>
                </View>
              </View>
            </View>

            {/* Live Progress Bar (when executing) */}
            {isExecuting || executionCompleted ? (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>
                    {executionCompleted ? "EXECUTION COMPLETE" : "TRANSMITTING ALGO SLICES..."}
                  </Text>
                  <Text style={styles.progressPctText}>{executionProgress}%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${executionProgress}%` }]} />
                </View>

                {executionCompleted && parentOrder.vwapAchieved && (
                  <View style={styles.completedBanner}>
                    <Text style={styles.completedText}>
                      ✓ All {parentOrder.slices.length} slices filled | VWAP Achieved: ₹
                      {parentOrder.vwapAchieved.toLocaleString()} | Slippage:{" "}
                      {parentOrder.overallSlippageBps} bps
                    </Text>
                    <Text style={styles.hashText}>
                      Receipt SHA-256: {parentOrder.executionReceiptHash?.slice(0, 32)}...
                    </Text>
                  </View>
                )}
              </View>
            ) : null}

            {/* Slicing Schedule Table */}
            <View style={styles.scheduleHeaderRow}>
              <Text style={styles.sectionTitle}>SCHEDULED CHILD SLICES ({liveSlices.length})</Text>
              <Pressable onPress={() => setShowFixLog(!showFixLog)}>
                <Text style={styles.toggleFixText}>{showFixLog ? "Hide FIX Raw" : "Show FIX 4.4 Tags"}</Text>
              </Pressable>
            </View>

            <View style={styles.slicesList}>
              {liveSlices.map((slice) => {
                const isFilled = slice.status === "FILLED";
                const isTransmitting = slice.status === "TRANSMITTED";

                return (
                  <View key={slice.sliceId} style={[styles.sliceRow, isFilled && styles.sliceRowFilled]}>
                    <View style={styles.sliceIndexCol}>
                      <Text style={styles.sliceIndexText}>#{slice.sliceIndex}</Text>
                      <Text style={styles.sliceTimeOffset}>+{(slice.scheduledTimeOffsetMs / 60000).toFixed(0)}m</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.sliceQtyText}>
                        {slice.quantity.toLocaleString()} shares{" "}
                        <Text style={styles.disclosedText}>
                          ({slice.disclosedQuantity} disclosed)
                        </Text>
                      </Text>
                      <Text style={styles.sliceLimitText}>
                        Limit: ₹{slice.limitPrice.toLocaleString()} | Tag 847: {strategy}
                      </Text>

                      {showFixLog && (
                        <Text style={styles.fixLogText}>{slice.fixMessage.replace(/\x01/g, " | ")}</Text>
                      )}
                    </View>

                    <View style={{ alignItems: "flex-end" }}>
                      <View
                        style={[
                          styles.statusBadge,
                          isFilled
                            ? styles.statusFilled
                            : isTransmitting
                            ? styles.statusTransmitting
                            : styles.statusPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            isFilled
                              ? { color: "#10B981" }
                              : isTransmitting
                              ? { color: "#3B82F6" }
                              : { color: "#94A3B8" },
                          ]}
                        >
                          {slice.status}
                        </Text>
                      </View>
                      {isFilled && slice.avgFillPrice && (
                        <Text style={styles.fillPriceText}>₹{slice.avgFillPrice.toLocaleString()}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer Action Bar */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.closeModalBtn, isExecuting && { opacity: 0.5 }]}
              onPress={onClose}
              disabled={isExecuting}
            >
              <Text style={styles.closeModalBtnText}>Close</Text>
            </Pressable>

            <Pressable
              style={[
                styles.executeBtn,
                side === "BUY" ? styles.executeBuyBtn : styles.executeSellBtn,
                isExecuting && { opacity: 0.7 },
              ]}
              onPress={handleExecuteAlgo}
              disabled={isExecuting}
            >
              <Text style={styles.executeBtnText}>
                {isExecuting
                  ? "Transmitting Slices..."
                  : executionCompleted
                  ? "Re-Execute Algo Slices"
                  : `Transmit Algo Order (FIX 4.4)`}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(3, 7, 18, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  dialog: {
    width: "100%",
    maxWidth: 960,
    maxHeight: "92%",
    backgroundColor: "#0F172A",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  tagBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  tagText: {
    color: "#60A5FA",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  protocolBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  protocolText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
    lineHeight: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    color: "#94A3B8",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  contextCard: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: 16,
    marginBottom: 20,
  },
  contextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  symbolText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F8FAFC",
    marginTop: 2,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F8FAFC",
    marginTop: 2,
  },
  valueText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#10B981",
    marginTop: 2,
  },
  subtext: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
  },
  sideToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  sideBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buyBtnActive: {
    backgroundColor: "#10B981",
  },
  sellBtnActive: {
    backgroundColor: "#EF4444",
  },
  sideText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
  },
  activeSideText: {
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 6,
  },
  strategyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  strategyCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: 14,
  },
  strategyCardActive: {
    borderColor: "#E0A84C",
    backgroundColor: "rgba(224, 168, 76, 0.08)",
  },
  strategyCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  strategyName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  strategyDesc: {
    fontSize: 11,
    color: "#94A3B8",
    lineHeight: 15,
  },
  paramsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  paramBox: {
    flex: 1,
    minWidth: 240,
    backgroundColor: "rgba(30, 41, 59, 0.3)",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  paramLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  pillActive: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    borderColor: "#3B82F6",
  },
  pillText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },
  pillTextActive: {
    color: "#60A5FA",
    fontWeight: "700",
  },
  impactCard: {
    backgroundColor: "rgba(16, 185, 129, 0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    padding: 16,
    marginBottom: 20,
  },
  impactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
    flexWrap: "wrap",
    gap: 12,
  },
  impactTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#34D399",
  },
  impactSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  savingsBox: {
    alignItems: "flex-end",
  },
  savingsLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#10B981",
    letterSpacing: 0.5,
  },
  savingsValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#10B981",
  },
  savingsBps: {
    fontSize: 10,
    color: "#34D399",
    marginTop: 1,
  },
  impactStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(16, 185, 129, 0.15)",
    paddingTop: 12,
    flexWrap: "wrap",
    gap: 12,
  },
  impactStat: {
    minWidth: 100,
  },
  statLabel: {
    fontSize: 10,
    color: "#94A3B8",
  },
  statVal: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F8FAFC",
    marginTop: 2,
  },
  progressSection: {
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#60A5FA",
    letterSpacing: 0.5,
  },
  progressPctText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 4,
  },
  completedBanner: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  completedText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
  },
  hashText: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
    fontFamily: Platform.OS === "web" ? "monospace" : undefined,
  },
  scheduleHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  toggleFixText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#38BDF8",
  },
  slicesList: {
    gap: 8,
    marginBottom: 20,
  },
  sliceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.3)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    padding: 10,
    gap: 12,
  },
  sliceRowFilled: {
    borderColor: "rgba(16, 185, 129, 0.3)",
    backgroundColor: "rgba(16, 185, 129, 0.04)",
  },
  sliceIndexCol: {
    width: 44,
    alignItems: "center",
  },
  sliceIndexText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  sliceTimeOffset: {
    fontSize: 10,
    color: "#64748B",
  },
  sliceQtyText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  disclosedText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "400",
  },
  sliceLimitText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  fixLogText: {
    fontSize: 9,
    color: "#64748B",
    fontFamily: Platform.OS === "web" ? "monospace" : undefined,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusPending: {
    backgroundColor: "rgba(148, 163, 184, 0.1)",
  },
  statusTransmitting: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
  },
  statusFilled: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  fillPriceText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10B981",
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  closeModalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  closeModalBtnText: {
    color: "#F8FAFC",
    fontWeight: "600",
    fontSize: 13,
  },
  executeBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  executeBuyBtn: {
    backgroundColor: "#10B981",
  },
  executeSellBtn: {
    backgroundColor: "#EF4444",
  },
  executeBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
