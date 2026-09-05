import React, { useState, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppTheme } from "../theme";
import { streamAiResponse } from "../services/aiStream";

export interface AiChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
  isStreaming?: boolean;
  modelBadge?: string;
  groundedAt?: string;
  actions?: { label: string; actionId: string }[];
}

export interface AiWealthCopilotProps {
  theme: AppTheme;
  clientContext?: {
    clientName?: string;
    totalAum?: number;
    riskProfile?: string;
  };
  bottomOffset?: number;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideFloatingFab?: boolean;
}

const QUICK_PROMPTS = [
  {
    id: "concentration",
    label: "⚡ Concentration Risk Diagnostic",
    prompt: "Perform an institutional concentration risk audit across our client assets.",
    answer:
      "**Portfolio Risk Diagnostic: Low-to-Moderate Concentration**\n\n• **Single Asset Exposure:** Peak holding is capped at 26.2% (Reliance/Large Cap Core). Institutional guidelines recommend maintaining single-stock exposure under 30%.\n• **Sector Clustering:** 38% Financials, 24% Technology, 18% Energy/Commodities. Recommend trimming Financials by 5-8% into sovereign fixed income during the next quarterly review.\n• **Liquidity Profile:** 85% of assets reside in T+1 liquid instruments. Tail-risk exit capacity is rated **AAA**.",
  },
  {
    id: "rebalance_memo",
    label: "📝 Client Rebalancing Memo",
    prompt: "Draft an executive rebalancing memo for our private wealth client.",
    answer:
      "**Subject: Strategic Asset Allocation & Rebalancing Recommendation**\n\nDear Investor,\n\nFollowing our quarterly portfolio review, we observed that strong equity outperformance has shifted your equity allocation to 68% against your target mandate of 60%.\n\n**Recommended Actions:**\n1. Realize ₹18.5 Lakhs from large-cap equity outperformance.\n2. Reallocate proceeds into High-Yield Corporate Bonds (yield: 8.25% YTM) and Sovereign Gold Bonds.\n3. Review ₹4.2 Lakhs in short-term tax offsets to mitigate tax incidence.\n\nPlease reply 'CONFIRM' to authorize execution with your custodian.",
  },
  {
    id: "tax_shield",
    label: "🛡️ Tax Loss Harvesting & Impact Summary",
    prompt: "What is the tax-loss harvesting potential across active holdings?",
    answer:
      "**Capital Gains Tax Impact Analysis**\n\n• **Total Unrealized Short-Term Losses:** ₹6,45,000 available across underperforming mid-cap & international ETF tranches.\n• **Estimated Tax Impact (at 20% STCG):** **₹1,29,000 illustrative tax effect** (non-binding estimate).\n• **Execution Strategy:** Review potential loss realization prior to financial year-end and evaluate reallocating into correlated broad-market index ETFs while considering wash-sale and trading friction.",
  },
  {
    id: "macro_rates",
    label: "🌐 Macro Outlook & Rate Trajectory",
    prompt: "Provide an institutional macro commentary on RBI and Fed interest rate policy.",
    answer:
      "**Macro & Fixed Income Advisory Commentary**\n\n• **Central Bank Trajectory:** RBI and the US Federal Reserve are pivoting toward easing cycles. Benchmark 10Y G-Sec yields expected to soften from 6.95% toward 6.60%.\n• **Fixed Income Strategy:** Lock in current elevated yields via 5Y to 7Y target maturity bond funds and AAA corporate debt to capture capital appreciation as duration expands.\n• **Equities Positioning:** Overweight domestic consumption and infrastructure; maintain defensive allocations in gold as a geopolitical hedge.",
  },
];

export const AiWealthCopilot: React.FC<AiWealthCopilotProps> = ({
  theme,
  clientContext,
  bottomOffset,
  isOpen: controlledIsOpen,
  onOpenChange,
  hideFloatingFab = false,
}) => {
  const isDark =
    theme.colors.background === "#030712" ||
    theme.colors.textPrimary === "#ffffff" ||
    theme.colors.textPrimary === "#FFFFFF";

  const brandColor = theme.colors.brand || "#E0A84C";

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (next: boolean) => {
    if (onOpenChange) onOpenChange(next);
    if (!isControlled) setInternalIsOpen(next);
  };
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: "m0",
      sender: "ai",
      text: `Good day. I am your **Asset Array Wealth Copilot**, configured for Swiss Private Banking and family office standards. How may I assist your investment committee today?`,
      timestamp: "Just now",
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isOpen, messages]);

  const handleSend = (textToSend?: string) => {
    const q = (textToSend || inputText).trim();
    if (!q || isLoading) return;

    const userMsg: AiChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: "Just now",
    };

    const aiMsgId = `ai-${Date.now()}`;
    const initialAiMsg: AiChatMessage = {
      id: aiMsgId,
      sender: "ai",
      text: "",
      timestamp: "Just now",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, initialAiMsg]);
    setInputText("");
    setIsLoading(true);

    let taskType: "briefing" | "tax_analytics" | "portfolio_attribution" | "scenario_stress" = "briefing";
    const lower = q.toLowerCase();
    if (lower.includes("tax") || lower.includes("harvest")) {
      taskType = "tax_analytics";
    } else if (lower.includes("attribution") || lower.includes("alpha") || lower.includes("brinson")) {
      taskType = "portfolio_attribution";
    } else if (lower.includes("scenario") || lower.includes("stress") || lower.includes("shock")) {
      taskType = "scenario_stress";
    }

    streamAiResponse({
      query: q,
      taskType,
      context: {
        clientName: clientContext?.clientName,
        totalAum: clientContext?.totalAum,
        riskProfile: clientContext?.riskProfile,
      },
      onToken: (token) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, text: m.text + token } : m))
        );
      },
      onComplete: (meta) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  isStreaming: false,
                  modelBadge: meta.model,
                  groundedAt: meta.groundedAt,
                }
              : m
          )
        );
        setIsLoading(false);
      },
      onError: () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  isStreaming: false,
                  text: m.text || "An unexpected error occurred while streaming response. Please retry.",
                }
              : m
          )
        );
        setIsLoading(false);
      },
    });
  };

  return (
    <>
      {/* Floating Launcher Button (Bottom Right) */}
      {!hideFloatingFab && (
        <Pressable
          onPress={() => setIsOpen(true)}
          style={[
            styles.fab,
            {
              backgroundColor: isDark ? "#0E182F" : "#FFFFFF",
              borderColor: brandColor,
              shadowColor: brandColor,
              bottom: bottomOffset !== undefined ? bottomOffset : 24,
            },
          ]}
        >
          <View style={styles.fabInner}>
            <View style={[styles.aiDot, { backgroundColor: brandColor }]} />
            <Text style={[styles.fabText, { color: brandColor }]}>
              Ask Wealth AI
            </Text>
          </View>
        </Pressable>
      )}

      {/* Slide-Up / Dialog Copilot Modal */}
      <Modal
        visible={isOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.backdrop}>
          <View
            style={[
              styles.copilotDialog,
              {
                backgroundColor: isDark ? "#070D1B" : "#FFFFFF",
                borderColor: isDark
                  ? "rgba(224, 168, 76, 0.35)"
                  : "rgba(179, 126, 40, 0.35)",
              },
            ]}
          >
            {/* Header */}
            <View
              style={[
                styles.header,
                {
                  borderBottomColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(15, 23, 42, 0.08)",
                },
              ]}
            >
              <View style={styles.headerLeft}>
                <View
                  style={[
                    styles.monogramBadge,
                    {
                      borderColor: brandColor,
                      backgroundColor: isDark
                        ? "rgba(224, 168, 76, 0.15)"
                        : "rgba(179, 126, 40, 0.15)",
                    },
                  ]}
                >
                  <Text style={[styles.monogramText, { color: brandColor }]}>
                    AA
                  </Text>
                </View>
                <View>
                  <Text
                    style={[
                      styles.copilotTitle,
                      { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                    ]}
                  >
                    Asset Array Wealth Copilot
                  </Text>
                  <View style={styles.statusRow}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.statusText}>
                      ACTIVE • INSTITUTIONAL INTELLIGENCE
                    </Text>
                  </View>
                </View>
              </View>

              <Pressable
                onPress={() => setIsOpen(false)}
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.06)"
                      : "rgba(15, 23, 42, 0.06)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.closeBtnText,
                    { color: isDark ? "#94A3B8" : theme.colors.textSecondary },
                  ]}
                >
                  ✕
                </Text>
              </Pressable>
            </View>

            {/* Quick Prompt Chips */}
            <View
              style={[
                styles.chipsContainer,
                {
                  backgroundColor: isDark
                    ? "rgba(11, 19, 38, 0.5)"
                    : "rgba(248, 250, 252, 0.8)",
                  borderBottomColor: isDark
                    ? "rgba(255, 255, 255, 0.06)"
                    : "rgba(15, 23, 42, 0.06)",
                },
              ]}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              >
                {QUICK_PROMPTS.map((qp) => (
                  <Pressable
                    key={qp.id}
                    onPress={() => handleSend(qp.prompt)}
                    style={[
                      styles.promptChip,
                      {
                        backgroundColor: isDark
                          ? "rgba(224, 168, 76, 0.1)"
                          : "rgba(179, 126, 40, 0.1)",
                        borderColor: isDark
                          ? "rgba(224, 168, 76, 0.3)"
                          : "rgba(179, 126, 40, 0.3)",
                      },
                    ]}
                  >
                    <Text style={[styles.promptChipText, { color: brandColor }]}>
                      {qp.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Chat Message List */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesScroll}
              contentContainerStyle={{ padding: 16, gap: 14 }}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.messageRow,
                    m.sender === "user"
                      ? styles.messageRowUser
                      : styles.messageRowAi,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      m.sender === "user"
                        ? [
                            styles.userBubble,
                            { backgroundColor: brandColor },
                          ]
                        : [
                            styles.aiBubble,
                            {
                              backgroundColor: isDark
                                ? "rgba(11, 19, 38, 0.9)"
                                : "#FFFFFF",
                              borderColor: isDark
                                ? "rgba(224, 168, 76, 0.2)"
                                : "rgba(179, 126, 40, 0.2)",
                            },
                          ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        m.sender === "user"
                          ? styles.userText
                          : [
                              styles.aiText,
                              {
                                color: isDark
                                  ? "#F8FAFC"
                                  : theme.colors.textPrimary,
                              },
                            ],
                      ]}
                    >
                      {m.text}
                      {m.isStreaming && (
                        <Text style={{ color: brandColor, fontWeight: "800" }}>
                          {" "}▌
                        </Text>
                      )}
                    </Text>
                    {m.modelBadge && (
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, gap: 6 }}>
                        <Text style={{ fontSize: 10, color: brandColor, fontWeight: "600" }}>
                          ⚡ {m.modelBadge}
                        </Text>
                        <Text style={{ fontSize: 10, color: "#64748B" }}>
                          • Grounded in Portfolio Data
                        </Text>
                      </View>
                    )}
                    <Text
                      style={[
                        styles.messageTimestamp,
                        m.sender === "user"
                          ? styles.userTimestamp
                          : styles.aiTimestamp,
                      ]}
                    >
                      {m.timestamp}
                    </Text>
                  </View>
                </View>
              ))}

              {isLoading && messages[messages.length - 1]?.text === "" && (
                <View style={[styles.messageRow, styles.messageRowAi]}>
                  <View
                    style={[
                      styles.aiBubble,
                      {
                        backgroundColor: isDark
                          ? "rgba(11, 19, 38, 0.9)"
                          : "#FFFFFF",
                        borderColor: isDark
                          ? "rgba(224, 168, 76, 0.2)"
                          : "rgba(179, 126, 40, 0.2)",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      },
                    ]}
                  >
                    <ActivityIndicator size="small" color={brandColor} />
                    <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                      Analyzing portfolio data...
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input Bar */}
            <View
              style={[
                styles.inputBar,
                {
                  borderTopColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(15, 23, 42, 0.08)",
                  backgroundColor: isDark ? "#070D1B" : "#FFFFFF",
                },
              ]}
            >
              <TextInput
                style={[
                  styles.input,
                  {
                    color: isDark ? "#F8FAFC" : theme.colors.textPrimary,
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.04)"
                      : "rgba(15, 23, 42, 0.04)",
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.12)"
                      : "rgba(15, 23, 42, 0.12)",
                  },
                ]}
                placeholder="Ask about concentration, tax impact, macro, or client queries..."
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSend()}
              />
              <Pressable
                onPress={() => handleSend()}
                disabled={isLoading || !inputText.trim()}
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: inputText.trim()
                      ? brandColor
                      : "rgba(148, 163, 184, 0.2)",
                  },
                ]}
              >
                <Text style={styles.sendBtnText}>Send</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    zIndex: 9999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  fabInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fabText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(3, 7, 18, 0.78)",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: 16,
  },
  copilotDialog: {
    width: "100%",
    maxWidth: 540,
    height: "85%",
    maxHeight: 720,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 8 },
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  monogramBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  monogramText: {
    fontSize: 14,
    fontWeight: "900",
  },
  copilotTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  statusText: {
    fontSize: 9,
    color: "#10B981",
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  chipsContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  promptChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  promptChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  messagesScroll: {
    flex: 1,
  },
  messageRow: {
    flexDirection: "row",
  },
  messageRowAi: {
    justifyContent: "flex-start",
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 14,
    borderRadius: 14,
  },
  aiBubble: {
    borderWidth: 1,
    borderTopLeftRadius: 4,
  },
  userBubble: {
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 20,
  },
  aiText: {},
  userText: {
    color: "#030712",
    fontWeight: "600",
  },
  messageTimestamp: {
    fontSize: 9,
    marginTop: 6,
    alignSelf: "flex-end",
  },
  aiTimestamp: {
    color: "#64748B",
  },
  userTimestamp: {
    color: "rgba(3, 7, 18, 0.6)",
  },
  inputBar: {
    flexDirection: "row",
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  sendBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnText: {
    color: "#030712",
    fontSize: 13,
    fontWeight: "800",
  },
});
