import React from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppTheme, AppStyles, styles as defaultStyles } from "../theme";
import { Client } from "../types/wealth";
import { AiResearchResult } from "../services/secureSync";
import { ClientAiRecommendation } from "../services/aiAdvisor";

export interface AiResearchScreenProps {
  theme: AppTheme;
  clients: Client[];
  aiResearchQuery: string;
  setAiResearchQuery: (query: string) => void;
  runAiResearch: () => void | Promise<void>;
  isAiResearchLoading: boolean;
  aiResearchState: string;
  aiResearchResult: AiResearchResult | null;
  selectedAiClient: Client | null;
  setSelectedAiClient: (client: Client | null) => void;
  runClientAiCoPilot: (client: Client) => void | Promise<void>;
  isClientAiLoading: boolean;
  clientAiRecommendation: ClientAiRecommendation | null;
  styles?: AppStyles;
}

export const AiResearchScreen = React.memo(function AiResearchScreen({
  theme,
  clients,
  aiResearchQuery,
  setAiResearchQuery,
  runAiResearch,
  isAiResearchLoading,
  aiResearchState,
  aiResearchResult,
  selectedAiClient,
  setSelectedAiClient,
  runClientAiCoPilot,
  isClientAiLoading,
  clientAiRecommendation,
  styles = defaultStyles,
}: AiResearchScreenProps) {
  return (
    <>
      <View style={[styles.panel, styles.analyticsPanel]}>
        <Text style={styles.panelTitle}>AI Research</Text>
        <Text style={styles.panelSubtitle}>
          Generate a structured market brief for a stock, company, mutual fund, ETF, sector, or market topic.
        </Text>
        <TextInput
          value={aiResearchQuery}
          onChangeText={setAiResearchQuery}
          placeholder="e.g. Reliance Industries, Nifty IT, Gold ETF, banking sector"
          placeholderTextColor="#7f90a8"
          autoCapitalize="words"
          style={styles.input}
        />
        <View style={styles.inlineActions}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => void runAiResearch()}
            disabled={isAiResearchLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isAiResearchLoading ? "Researching..." : "Generate Research"}
            </Text>
          </Pressable>
          <Text style={styles.clientSubMeta}>{aiResearchState}</Text>
        </View>

        {aiResearchResult ? (
          <View style={styles.aiResearchResult}>
            <View style={styles.aiResearchHeader}>
              <Text style={styles.sectionLabel}>Sentiment</Text>
              <Text
                style={[
                  styles.sentimentPill,
                  aiResearchResult.sentiment === "Bullish"
                    ? styles.sentimentBullish
                    : aiResearchResult.sentiment === "Bearish"
                      ? styles.sentimentBearish
                      : styles.sentimentNeutral,
                ]}
              >
                {aiResearchResult.sentiment}
              </Text>
            </View>

            <Text style={styles.sectionLabel}>Summary</Text>
            <Text style={styles.detailBlock}>{aiResearchResult.summary}</Text>

            <View style={styles.dualColumn}>
              <View style={styles.column}>
                <Text style={styles.sectionLabel}>Opportunities</Text>
                {aiResearchResult.opportunities.map((item) => (
                  <Text key={item} style={styles.historyItem}>
                    {item}
                  </Text>
                ))}
              </View>
              <View style={styles.column}>
                <Text style={styles.sectionLabel}>Risks</Text>
                {aiResearchResult.risks.map((item) => (
                  <Text key={item} style={styles.analyticsAlert}>
                    {item}
                  </Text>
                ))}
              </View>
            </View>

            <Text style={styles.sectionLabel}>Short-term outlook</Text>
            <Text style={styles.historyItem}>{aiResearchResult.shortTermOutlook}</Text>
            <Text style={styles.sectionLabel}>Long-term outlook</Text>
            <Text style={styles.historyItem}>{aiResearchResult.longTermOutlook}</Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Research ready</Text>
            <Text style={styles.emptyText}>
              Enter a topic and generate a structured advisor-ready view.
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.panel, styles.analyticsPanel, { marginTop: 16 }]}>
        <Text style={styles.panelTitle}>Client Portfolio Co-Pilot</Text>
        <Text style={styles.panelSubtitle}>
          Select a client to generate personalized rebalancing strategies, risk alerts, and custom advisory messages.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
          {clients.map((c) => {
            const isSelected = selectedAiClient?.id === c.id;
            return (
              <Pressable
                key={c.id}
                style={[
                  styles.darkChip,
                  { marginRight: 8, backgroundColor: isSelected ? theme.colors.brand : theme.colors.surfaceStrong },
                ]}
                onPress={() => setSelectedAiClient(c)}
              >
                <Text style={[styles.darkChipText, { color: isSelected ? "#ffffff" : theme.colors.textPrimary }]}>
                  {c.name} ({c.category})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedAiClient ? (
          <View style={{ marginTop: 8 }}>
            <Pressable
              style={[styles.primaryButton, { alignSelf: "flex-start" }]}
              onPress={() => void runClientAiCoPilot(selectedAiClient)}
              disabled={isClientAiLoading}
            >
              <Text style={styles.primaryButtonText}>
                {isClientAiLoading ? "Analyzing Portfolio..." : `🤖 Analyze ${selectedAiClient.name}'s Portfolio`}
              </Text>
            </Pressable>

            {clientAiRecommendation ? (
              <View style={[styles.aiResearchResult, { marginTop: 16 }]}>
                <Text style={styles.sectionLabel}>Client Strategy & Sentiment</Text>
                <Text style={styles.detailBlock}>{clientAiRecommendation.analysis.summary}</Text>

                <Text style={styles.sectionLabel}>💬 Personal WhatsApp Message Draft</Text>
                <Text style={[styles.detailBlock, { fontStyle: "italic", backgroundColor: "rgba(37, 211, 102, 0.1)" }]}>
                  {clientAiRecommendation.whatsappDraft}
                </Text>
                <Pressable
                  style={[styles.primaryButton, { backgroundColor: "#25D366", marginTop: 8, marginBottom: 16 }]}
                  onPress={() => {
                    const cleanPhone = (selectedAiClient.phone || "").replace(/[^0-9+]/g, "");
                    const encodedText = encodeURIComponent(clientAiRecommendation.whatsappDraft);
                    const url = cleanPhone
                      ? `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`
                      : `whatsapp://send?text=${encodedText}`;
                    Linking.openURL(url).catch(() => {
                      Alert.alert("WhatsApp not found", "Could not open WhatsApp on this device.");
                    });
                  }}
                >
                  <Text style={[styles.primaryButtonText, { color: "#ffffff", fontWeight: "700" }]}>
                    📲 Send to {selectedAiClient.name} via WhatsApp
                  </Text>
                </Pressable>

                <Text style={styles.sectionLabel}>📧 Professional Email Draft</Text>
                <Text style={[styles.detailBlock, { fontStyle: "italic" }]}>
                  {clientAiRecommendation.emailDraft}
                </Text>
                <Pressable
                  style={[styles.primaryButton, { backgroundColor: "#2f6fff", marginTop: 8 }]}
                  onPress={() => {
                    const email = selectedAiClient.email || "";
                    const subject = encodeURIComponent(`Portfolio Strategy & Allocation Review for ${selectedAiClient.name}`);
                    const body = encodeURIComponent(clientAiRecommendation.emailDraft);
                    const url = `mailto:${email}?subject=${subject}&body=${body}`;
                    Linking.openURL(url).catch(() => {
                      Alert.alert("Email client not found", "Could not open your default email app.");
                    });
                  }}
                >
                  <Text style={[styles.primaryButtonText, { color: "#ffffff", fontWeight: "700" }]}>
                    ✉️ Open Draft in Email Client
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={styles.clientSubMeta}>Select a client above to unlock AI Co-Pilot analysis.</Text>
        )}
      </View>
    </>
  );
});
