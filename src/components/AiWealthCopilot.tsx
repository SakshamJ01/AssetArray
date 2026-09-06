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
  },
  {
    id: "rebalance_memo",
    label: "📝 Client Rebalancing Memo",
    prompt: "Draft an executive rebalancing memo for our private wealth client.",
  },
  {
    id: "tax_shield",
    label: "🛡️ Tax Loss Harvesting & Impact Summary",
    prompt: "What is the tax-loss harvesting potential across active holdings?",
  },
  {
    id: "macro_rates",
    label: "🌐 Macro Outlook & Rate Trajectory",
    prompt: "Provide an institutional macro commentary on RBI and Fed interest rate policy.",
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
  const [streamState, setStreamState] = useState<"IDLE" | "CONNECTING" | "STREAMING" | "COMPLETED" | "FAILED" | "RETRYING" | "UNAVAILABLE">("IDLE");
  const [streamStatusText, setStreamStatusText] = useState<string>("ACTIVE • INSTITUTIONAL INTELLIGENCE");
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
    setStreamState("CONNECTING");
    setStreamStatusText("AI Connecting…");
    const requestStartTime = Date.now();

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
      onStateChange: (state, msg) => {
        setStreamState(state);
        if (state === "CONNECTING") {
          setStreamStatusText("AI Connecting…");
        } else if (state === "STREAMING") {
          setStreamStatusText("AI Generating…");
        } else if (state === "RETRYING") {
          setStreamStatusText("AI Retrying with alternate model…");
        } else if (state === "UNAVAILABLE") {
          setStreamStatusText("AI unavailable · Verified portfolio data remains available.");
        } else if (state === "FAILED") {
          setStreamStatusText(`AI failed · ${msg || "Service offline"}`);
        } else if (state === "COMPLETED") {
          const durationSec = ((Date.now() - requestStartTime) / 1000).toFixed(1);
          setStreamStatusText(`AI Complete · ${durationSec}s`);
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
      onError: (err) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  isStreaming: false,
                  text: m.text || "AI temporarily unavailable. Verified portfolio data remains available.",
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

            {/* Trust & Provenance Context Strip */}
            <View
              style={{
                backgroundColor: isDark ? "rgba(14, 23, 44, 0.85)" : "#F1F5F9",
                borderBottomWidth: 1,
                borderBottomColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                paddingHorizontal: 16,
                paddingVertical: 6,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: brandColor,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                CONTEXT
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 11,
                  color: isDark ? "#94A3B8" : "#64748B",
                  flex: 1,
                }}
              >
                Using: {clientContext?.clientName || "Executive Wealth Overview"}{clientContext?.riskProfile ? ` · ${clientContext.riskProfile}` : ""} · As of {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </Text>
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
