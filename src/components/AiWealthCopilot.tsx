import React, { useState, useRef, useEffect, useMemo } from "react";
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
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppTheme } from "../theme";
import { streamAiResponse } from "../services/aiStream";
import { Client, Goal } from "../types/wealth";
import { AiContextEngine } from "../services/aiGateway/contextEngine";

export interface AiChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
  isStreaming?: boolean;
  modelBadge?: string;
  groundedAt?: string;
  clientContextId?: string | null;
  actions?: { label: string; actionId: string }[];
}

export interface AiWealthCopilotProps {
  theme: AppTheme;
  clientContext?: {
    clientName?: string;
    totalAum?: number;
    riskProfile?: string;
  };
  allClients?: Client[];
  selectedClientId?: string | null;
  onSelectClientId?: (id: string | null) => void;
  goals?: Goal[];
  unifiedPortfolioAnalytics?: any;
  onOpenHoldingModal?: (holdingPrefill?: any) => void;
  onDraftWhatsApp?: (client: Client | null, message: string) => void;
  onNavigateToTab?: (tab: string) => void;
  onExportPdf?: (client: Client | null) => void;
  accessToken?: string | null;
  endpoint?: string;
  onUnauthorized?: () => Promise<string | null>;
  bottomOffset?: number;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideFloatingFab?: boolean;
  activeCurrency?: string;
}

const CLIENT_QUICK_PROMPTS = [
  {
    id: "summarize_client",
    label: "📊 Portfolio Summary",
    prompt: "Provide an executive breakdown of this client's portfolio, asset allocation, and current wealth status citing exact figures.",
  },
  {
    id: "tax_shield",
    label: "🛡️ Tax Harvest Opportunities",
    prompt: "Assess tax-loss harvesting potential under Section 70/74 and identify active lots with unrealized losses.",
  },
  {
    id: "rebalance_drift",
    label: "⚖️ Allocation Drift vs Mandate",
    prompt: "Analyze current asset weights vs mandate strategy. Propose specific buy/sell trades to restore target asset allocation.",
  },
  {
    id: "meeting_notes",
    label: "📝 Prep Meeting Brief",
    prompt: "Prepare comprehensive client review meeting talking points covering YTD returns, top holdings, and recommended advisor action items.",
  },
  {
    id: "whatsapp_update",
    label: "💬 WhatsApp Update",
    prompt: "Draft a concise, polished WhatsApp portfolio update message suitable to send directly to this client.",
  },
];

const PRACTICE_QUICK_PROMPTS = [
  {
    id: "practice_briefing",
    label: "🏢 Practice Executive Brief",
    prompt: "Provide an executive briefing of the entire practice: total monitored AUM, high-priority mandates, and allocation health.",
  },
  {
    id: "overdue_reviews",
    label: "⏰ Overdue Client Reviews",
    prompt: "Identify which clients have scheduled reviews due now and summarize their priority levels and required action.",
  },
  {
    id: "firm_concentration",
    label: "⚠️ Concentration & Risk Scan",
    prompt: "Scan all monitored portfolios for sector concentration, equity drift, or single-stock risk flags.",
  },
  {
    id: "firm_tax_scan",
    label: "🛡️ Firm Tax Harvest Scan",
    prompt: "Identify all portfolios across the firm that hold unrealized capital losses eligible for year-end tax harvesting.",
  },
];

export const AiWealthCopilot: React.FC<AiWealthCopilotProps> = ({
  theme,
  clientContext,
  allClients = [],
  selectedClientId: propSelectedClientId,
  onSelectClientId,
  goals = [],
  unifiedPortfolioAnalytics,
  onOpenHoldingModal,
  onDraftWhatsApp,
  onNavigateToTab,
  onExportPdf,
  accessToken,
  endpoint,
  onUnauthorized,
  bottomOffset,
  isOpen: controlledIsOpen,
  onOpenChange,
  hideFloatingFab = false,
  activeCurrency = "INR",
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 600;

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

  // Internal client scope switcher
  const [activeClientId, setActiveClientId] = useState<string | null>(propSelectedClientId || null);
  const [isClientPickerOpen, setIsClientPickerOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (propSelectedClientId !== undefined) {
      setActiveClientId(propSelectedClientId);
    }
  }, [propSelectedClientId]);

  const activeClient = useMemo(
    () => allClients.find((c) => c.id === activeClientId) || null,
    [allClients, activeClientId]
  );

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamState, setStreamState] = useState<
    "IDLE" | "CONNECTING" | "STREAMING" | "COMPLETED" | "FAILED" | "RETRYING" | "UNAVAILABLE"
  >("IDLE");
  const [streamStatusText, setStreamStatusText] = useState<string>("ACTIVE • INSTITUTIONAL INTELLIGENCE");
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: "m0",
      sender: "ai",
      text: `Good day. I am your **Asset Array Wealth Copilot**, configured for Swiss Private Banking standards and powered by real-time client ledger verification. Select any client or audit the Entire Practice below. How may I assist your investment committee today?`,
      timestamp: "Just now",
      clientContextId: null,
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isOpen, messages]);

  const handleSelectClientScope = (clientId: string | null) => {
    setActiveClientId(clientId);
    setIsClientPickerOpen(false);
    onSelectClientId?.(clientId);

    const clientObj = allClients.find((c) => c.id === clientId);
    const scopeName = clientObj ? clientObj.name : "Entire Practice (All Clients)";
    
    // Add brief system note to message stream
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: "ai",
        text: `Switched copilot context to **${scopeName}**. Full holdings, asset allocation, and goal ledgers loaded.`,
        timestamp: "Just now",
        clientContextId: clientId,
      },
    ]);
  };

  const handleCopyText = (text: string, msgId: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };

  const handleSend = (textToSend?: string) => {
    const q = (textToSend || inputText).trim();
    if (!q || isLoading) return;

    const userMsg: AiChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: "Just now",
      clientContextId: activeClientId,
    };

    const aiMsgId = `ai-${Date.now()}`;
    const initialAiMsg: AiChatMessage = {
      id: aiMsgId,
      sender: "ai",
      text: "",
      timestamp: "Just now",
      isStreaming: true,
      clientContextId: activeClientId,
    };

    setMessages((prev) => [...prev, userMsg, initialAiMsg]);
    setInputText("");
    setIsLoading(true);
    setStreamState("CONNECTING");
    setStreamStatusText("AI Connecting…");
    const requestStartTime = Date.now();

    // Map query to institutional task type
    let taskType: "briefing" | "tax_analytics" | "portfolio_attribution" | "scenario_stress" = "briefing";
    const lower = q.toLowerCase();
    if (lower.includes("tax") || lower.includes("harvest")) {
      taskType = "tax_analytics";
    } else if (lower.includes("attribution") || lower.includes("alpha") || lower.includes("brinson")) {
      taskType = "portfolio_attribution";
    } else if (lower.includes("scenario") || lower.includes("stress") || lower.includes("shock")) {
      taskType = "scenario_stress";
    }

    // Build grounded rich context payload
    let groundedPayload: {
      clientName?: string;
      totalAum?: number;
      riskProfile?: string;
      topHoldings?: string[];
      rawContextPrompt?: string;
    } = {};

    if (activeClient) {
      const cCtx = AiContextEngine.buildClientContext(activeClient, goals, activeCurrency);
      const rawPrompt = AiContextEngine.formatContextForPrompt(cCtx, null, activeCurrency);
      groundedPayload = {
        clientName: activeClient.name,
        totalAum: cCtx.totalCurrent,
        riskProfile: activeClient.riskProfile,
        topHoldings: cCtx.holdings.slice(0, 6).map((h) => `${h.ticker || h.name} (${h.weightPct}%)`),
        rawContextPrompt: rawPrompt,
      };
    } else if (allClients.length > 0) {
      const fCtx = AiContextEngine.buildFirmContext(allClients, unifiedPortfolioAnalytics, goals);
      const rawPrompt = AiContextEngine.formatContextForPrompt(null, fCtx, activeCurrency);
      groundedPayload = {
        clientName: "Entire Practice (All Clients)",
        totalAum: fCtx.totalAum,
        topHoldings: fCtx.topConcentratedAssets.slice(0, 6).map((a) => a.assetName),
        rawContextPrompt: rawPrompt,
      };
    } else {
      groundedPayload = {
        clientName: clientContext?.clientName,
        totalAum: clientContext?.totalAum,
        riskProfile: clientContext?.riskProfile,
      };
    }

    streamAiResponse({
      query: q,
      taskType,
      context: groundedPayload,
      accessToken,
      endpoint,
      onUnauthorized,
      onStateChange: (state) => {
        setStreamState(state);
        if (state === "CONNECTING") {
          setStreamStatusText("Connecting…");
        } else if (state === "STREAMING") {
          setStreamStatusText("Generating…");
        } else if (state === "RETRYING") {
          setStreamStatusText("Thinking…");
        } else if (state === "UNAVAILABLE") {
          setStreamStatusText("AI unavailable");
        } else if (state === "FAILED") {
          setStreamStatusText("AI unavailable");
        } else if (state === "COMPLETED") {
          setStreamStatusText("Complete");
        }
      },
      onToken: (token) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, text: m.text + token } : m))
        );
      },
      onComplete: (meta) => {
        const durationSec = ((Date.now() - requestStartTime) / 1000).toFixed(1);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  isStreaming: false,
                  modelBadge: `${meta.model} · ${durationSec}s`,
                  groundedAt: meta.groundedAt,
                }
              : m
          )
        );
        setIsLoading(false);
        setStreamState("COMPLETED");
        setStreamStatusText(`AI Complete · ${meta.model} · ${durationSec}s`);
      },
      onError: () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  isStreaming: false,
                  text: m.text || "AI temporarily unavailable. Verified portfolio data remains active.",
                }
              : m
          )
        );
        setIsLoading(false);
        setStreamState("UNAVAILABLE");
        setStreamStatusText("AI unavailable · 1 retry failed");
      },
    });
  };

  const activePrompts = activeClient ? CLIENT_QUICK_PROMPTS : PRACTICE_QUICK_PROMPTS;

  return (
    <>
      {/* Floating Launcher Button (Bottom Right) */}
      {!hideFloatingFab && (
        <Pressable
          onPress={() => setIsOpen(true)}
          style={[
            styles.fab,
            isMobile && styles.fabMobile,
            {
              backgroundColor: isDark ? "#0E182F" : "#FFFFFF",
              borderColor: brandColor,
              shadowColor: brandColor,
              bottom: bottomOffset !== undefined ? bottomOffset : 24,
            },
          ]}
        >
          {isMobile ? (
            <View style={styles.fabInnerMobile}>
              <Ionicons name="sparkles" size={20} color={brandColor} />
            </View>
          ) : (
            <View style={styles.fabInner}>
              <View style={[styles.aiDot, { backgroundColor: brandColor }]} />
              <Text style={[styles.fabText, { color: brandColor }]}>
                Ask Wealth AI
              </Text>
            </View>
          )}
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
                    <View
                      style={[
                        styles.onlineDot,
                        {
                          backgroundColor:
                            streamState === "STREAMING" || streamState === "CONNECTING"
                              ? "#F59E0B"
                              : streamState === "UNAVAILABLE" || streamState === "FAILED"
                              ? "#EF4444"
                              : "#10B981",
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        (streamState === "STREAMING" || streamState === "CONNECTING") && { color: "#F59E0B" },
                        (streamState === "UNAVAILABLE" || streamState === "FAILED") && { color: "#EF4444" },
                      ]}
                    >
                      {streamStatusText}
                    </Text>
                    {(streamState === "UNAVAILABLE" || streamState === "FAILED") && (
                      <Pressable
                        onPress={() => {
                          const lastUser = [...messages].reverse().find((m) => m.sender === "user");
                          handleSend(lastUser?.text || "Summarize portfolio");
                        }}
                        style={styles.retryBadge}
                      >
                        <Text style={styles.retryBadgeText}>Retry</Text>
                      </Pressable>
                    )}
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

            {/* Persistent Client Scope Selector Strip */}
            <View
              style={{
                backgroundColor: isDark ? "rgba(14, 23, 44, 0.95)" : "#F1F5F9",
                borderBottomWidth: 1,
                borderBottomColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                paddingHorizontal: 12,
                paddingVertical: 8,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "800",
                    color: brandColor,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                  }}
                >
                  SCOPE:
                </Text>
                <Pressable
                  onPress={() => setIsClientPickerOpen(!isClientPickerOpen)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: isDark ? "rgba(224, 168, 76, 0.12)" : "rgba(179, 126, 40, 0.12)",
                    borderColor: brandColor,
                    borderWidth: 1,
                    borderRadius: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                  }}
                >
                  <Ionicons
                    name={activeClient ? "person" : "globe-outline"}
                    size={13}
                    color={brandColor}
                  />
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: isDark ? "#FFFFFF" : "#0F172A",
                      maxWidth: 220,
                    }}
                  >
                    {activeClient ? activeClient.name : "Entire Practice (All Clients)"}
                  </Text>
                  <Ionicons
                    name={isClientPickerOpen ? "chevron-up" : "chevron-down"}
                    size={12}
                    color={brandColor}
                  />
                </Pressable>
              </View>

              {activeClient && (
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: isDark ? "#94A3B8" : "#64748B",
                  }}
                >
                  {activeClient.portfolio?.length || 0} holdings
                </Text>
              )}
            </View>

            {/* Interactive Scope Dropdown Popover */}
            {isClientPickerOpen && (
              <View
                style={{
                  maxHeight: 220,
                  backgroundColor: isDark ? "#0A1327" : "#FFFFFF",
                  borderBottomWidth: 1,
                  borderBottomColor: brandColor,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  zIndex: 100,
                }}
              >
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
                  <Pressable
                    onPress={() => handleSelectClientScope(null)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                      backgroundColor: activeClientId === null ? (isDark ? "rgba(224, 168, 76, 0.15)" : "rgba(179, 126, 40, 0.15)") : "transparent",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Ionicons name="globe-outline" size={16} color={brandColor} />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: activeClientId === null ? brandColor : (isDark ? "#F8FAFC" : "#0F172A"),
                        }}
                      >
                        Entire Practice (All Clients)
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: isDark ? "#94A3B8" : "#64748B" }}>
                      {allClients.length} accounts
                    </Text>
                  </Pressable>

                  {allClients.map((c) => {
                    const isSelected = c.id === activeClientId;
                    const aum = (c.portfolio || []).reduce(
                      (sum, h) => sum + (parseFloat(h.currentValue) || 0),
                      0
                    );
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => handleSelectClientScope(c.id)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingHorizontal: 14,
                          paddingVertical: 9,
                          borderBottomWidth: 1,
                          borderBottomColor: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)",
                          backgroundColor: isSelected ? (isDark ? "rgba(224, 168, 76, 0.15)" : "rgba(179, 126, 40, 0.15)") : "transparent",
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Ionicons name="person" size={14} color={isSelected ? brandColor : (isDark ? "#94A3B8" : "#64748B")} />
                          <View>
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: isSelected ? "700" : "600",
                                color: isSelected ? brandColor : (isDark ? "#F8FAFC" : "#0F172A"),
                              }}
                            >
                              {c.name}
                            </Text>
                            <Text style={{ fontSize: 10, color: isDark ? "#64748B" : "#94A3B8" }}>
                              {c.riskProfile || "Moderate"} · {c.category || "Standard"}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 11, fontWeight: "600", color: brandColor }}>
                          {activeCurrency} {aum >= 10000000 ? `${(aum / 10000000).toFixed(2)} Cr` : aum >= 100000 ? `${(aum / 100000).toFixed(1)} L` : aum.toLocaleString("en-IN")}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

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
                {activePrompts.map((qp) => (
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
                          • Verified Ledger Grounded
                        </Text>
                      </View>
                    )}

                    {/* Action Automation Bar for AI Responses */}
                    {m.sender === "ai" && !m.isStreaming && m.text.length > 30 && (
                      <View
                        style={{
                          marginTop: 10,
                          paddingTop: 8,
                          borderTopWidth: 1,
                          borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                          flexDirection: "row",
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        {/* 1. Copy text */}
                        <Pressable
                          onPress={() => handleCopyText(m.text, m.id)}
                          style={[styles.actionChip, { borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#CBD5E1" }]}
                        >
                          <Ionicons
                            name={copiedMessageId === m.id ? "checkmark" : "copy-outline"}
                            size={12}
                            color={copiedMessageId === m.id ? "#10B981" : brandColor}
                          />
                          <Text style={[styles.actionChipText, { color: copiedMessageId === m.id ? "#10B981" : (isDark ? "#E2E8F0" : "#334155") }]}>
                            {copiedMessageId === m.id ? "Copied" : "Copy"}
                          </Text>
                        </Pressable>

                        {/* 2. Rebalance trade */}
                        {onOpenHoldingModal && (
                          <Pressable
                            onPress={() => onOpenHoldingModal()}
                            style={[styles.actionChip, { borderColor: brandColor }]}
                          >
                            <Ionicons name="swap-horizontal" size={12} color={brandColor} />
                            <Text style={[styles.actionChipText, { color: brandColor }]}>
                              Rebalance Holdings
                            </Text>
                          </Pressable>
                        )}

                        {/* 3. Draft WhatsApp update */}
                        {onDraftWhatsApp && activeClient && (
                          <Pressable
                            onPress={() => onDraftWhatsApp(activeClient, m.text)}
                            style={[styles.actionChip, { borderColor: "#10B981" }]}
                          >
                            <Ionicons name="logo-whatsapp" size={12} color="#10B981" />
                            <Text style={[styles.actionChipText, { color: "#10B981" }]}>
                              Draft WhatsApp
                            </Text>
                          </Pressable>
                        )}

                        {/* 4. View client goals */}
                        {onNavigateToTab && (
                          <Pressable
                            onPress={() => onNavigateToTab("Goals")}
                            style={[styles.actionChip, { borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#CBD5E1" }]}
                          >
                            <Ionicons name="flag-outline" size={12} color={brandColor} />
                            <Text style={[styles.actionChipText, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                              Goals
                            </Text>
                          </Pressable>
                        )}

                        {/* 5. Export PDF Report */}
                        {onExportPdf && activeClient && (
                          <Pressable
                            onPress={() => onExportPdf(activeClient)}
                            style={[styles.actionChip, { borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#CBD5E1" }]}
                          >
                            <Ionicons name="document-text-outline" size={12} color={brandColor} />
                            <Text style={[styles.actionChipText, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                              PDF Report
                            </Text>
                          </Pressable>
                        )}
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
                      Analyzing verified holdings & calculating metrics...
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
                placeholder={
                  activeClient
                    ? `Ask about ${activeClient.name}'s holdings, drift, tax, or trades...`
                    : "Ask about practice AUM, overdue reviews, tax scan, or risks..."
                }
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
    borderRadius: 12,
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
  fabMobile: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    width: 44,
    height: 44,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
    right: 14,
  },
  fabInnerMobile: {
    justifyContent: "center",
    alignItems: "center",
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
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  monogramBadge: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  monogramText: {
    fontSize: 13,
    fontWeight: "900",
  },
  copilotTitle: {
    fontSize: 14,
    fontWeight: "700",
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
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  statusText: {
    fontSize: 10,
    color: "#10B981",
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  retryBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  retryBadgeText: {
    fontSize: 10,
    color: "#EF4444",
    fontWeight: "700",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 4,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  chipsContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  promptChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 1,
  },
  promptChipText: {
    fontSize: 11,
    fontWeight: "600",
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
    maxWidth: "88%",
    padding: 12,
    borderRadius: 8,
  },
  aiBubble: {
    borderWidth: 1,
    borderTopLeftRadius: 0,
  },
  userBubble: {
    borderTopRightRadius: 0,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  aiText: {},
  userText: {
    color: "#030712",
    fontWeight: "600",
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  actionChipText: {
    fontSize: 10,
    fontWeight: "700",
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
    padding: 10,
    gap: 8,
    borderTopWidth: 1,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  sendBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnText: {
    color: "#030712",
    fontSize: 12,
    fontWeight: "700",
  },
});
