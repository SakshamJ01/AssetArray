import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { AppTheme } from "../theme";
import { AdvisorMessagesScreen } from "./workspace/AdvisorMessagesScreen";

export interface WorkspaceScreenProps {
  theme: AppTheme;
  marketMessage: string;
  setMarketMessage: (msg: string) => void;
  setBroadcastMessage: (msg: string) => void;
  marketResearchNotes: string;
  setMarketResearchNotes: (notes: string) => void;
  runWorkspaceAiBrief: () => Promise<void>;
  useAiBriefAsDailyMessage: () => void;
  isAiResearchLoading: boolean;
  aiResearchState: string;
  aiResearchResult: {
    sentiment: string;
    summary: string;
    shortTermOutlook: string;
    longTermOutlook: string;
    opportunities: string[];
    risks: string[];
  } | null;
  categorySummary: { label: string; value: string }[];
  advisorMessages: any[];
  advisorMessageDraft: {
    clientName: string;
    title: string;
    body: string;
  };
  updateAdvisorMessageDraft: (field: any, val: any) => void;
  saveAdvisorMessageDraftAction: () => void;
  aggregationSnapshot: {
    connectedCount: number;
    reviewCount: number;
    totalExternalValue: number;
  };
  connectedAccounts: Array<{
    id: string;
    institution: string;
    accountType: string;
    status: string;
    currentValue: string;
  }>;
  currencyDisplay: (val: string) => string;
  styles: any;
}

export const WorkspaceScreen: React.FC<WorkspaceScreenProps> = ({
  theme,
  marketMessage,
  setMarketMessage,
  setBroadcastMessage,
  marketResearchNotes,
  setMarketResearchNotes,
  runWorkspaceAiBrief,
  useAiBriefAsDailyMessage,
  isAiResearchLoading,
  aiResearchState,
  aiResearchResult,
  categorySummary,
  advisorMessages,
  advisorMessageDraft,
  updateAdvisorMessageDraft,
  saveAdvisorMessageDraftAction,
  aggregationSnapshot,
  connectedAccounts,
  currencyDisplay,
  styles,
}) => {
  return (
    <>
      {/* Daily Market Message */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Daily market message</Text>
        <Text style={styles.panelSubtitle}>
          This message becomes your default update for direct outreach and campaigns.
        </Text>
        <TextInput
          multiline
          value={marketMessage}
          onChangeText={(value) => {
            setMarketMessage(value);
            setBroadcastMessage(value);
          }}
          style={[styles.input, styles.messageInput]}
        />
      </View>

      {/* AI Market Research Brief */}
      <View style={styles.dualColumn}>
        <View style={styles.column}>
          <View style={[styles.panel, styles.calculatorPanel]}>
            <Text style={styles.panelTitle}>AI market research</Text>
            <Text style={styles.panelSubtitle}>
              Run a real Gemini-powered brief for a stock, fund, sector, or macro topic and turn it into advisor-ready outreach.
            </Text>
            <TextInput
              value={marketResearchNotes}
              onChangeText={setMarketResearchNotes}
              placeholder="e.g. Nifty IT, Reliance Industries, banking sector, gold ETF"
              placeholderTextColor="#7f90a8"
              style={styles.input}
            />
            <View style={styles.inlineActions}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => void runWorkspaceAiBrief()}
                disabled={isAiResearchLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {isAiResearchLoading ? "Researching..." : "Generate Brief"}
                </Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={useAiBriefAsDailyMessage}>
                <Text style={styles.secondaryButtonText}>Use for Broadcast</Text>
              </Pressable>
            </View>
            <Text style={styles.detailBlock}>{aiResearchState}</Text>
            {aiResearchResult ? (
              <View style={styles.aiResearchResult}>
                <View style={styles.aiResearchHeader}>
                  <Text style={styles.sectionLabel}>Live brief</Text>
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
                <Text style={styles.historyItem}>{aiResearchResult.summary}</Text>
                <Text style={styles.sectionLabel}>Outlook</Text>
                <Text style={styles.historyItem}>
                  Short term: {aiResearchResult.shortTermOutlook}
                </Text>
                <Text style={styles.historyItem}>
                  Long term: {aiResearchResult.longTermOutlook}
                </Text>
                {aiResearchResult.opportunities.slice(0, 2).map((item, index) => (
                  <Text key={`opp-${index}`} style={styles.historyItem}>
                    Opportunity: {item}
                  </Text>
                ))}
                {aiResearchResult.risks.slice(0, 2).map((item, index) => (
                  <Text key={`risk-${index}`} style={styles.historyItem}>
                    Risk: {item}
                  </Text>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No AI brief yet</Text>
                <Text style={styles.emptyText}>
                  Run a topic through Gemini to generate a real market brief here.
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Smart Segmentation */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Smart segmentation</Text>
        <Text style={styles.panelSubtitle}>
          Client mix snapshot for campaign targeting and advisor review.
        </Text>
        <View style={styles.categoryGrid}>
          {categorySummary.map((item) => (
            <View key={item.label} style={styles.categoryCard}>
              <Text style={styles.categoryValue}>{item.value}</Text>
              <Text style={styles.categoryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Advisor Portal & Data Aggregation */}
      <View style={styles.dualColumn}>
        <View style={styles.column}>
          <AdvisorMessagesScreen
            advisorMessages={advisorMessages}
            advisorMessageDraft={advisorMessageDraft}
            onUpdateDraft={updateAdvisorMessageDraft}
            onSaveDraft={saveAdvisorMessageDraftAction}
            styles={styles}
          />
        </View>

        <View style={styles.column}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Automated data aggregation</Text>
            <Text style={styles.panelSubtitle}>
              Linked account snapshot for banks, brokerages, cards, and retirement accounts.
            </Text>
            <View style={styles.analyticsSummaryRow}>
              <View style={[styles.analyticsMetricCard, styles.analyticsBlue]}>
                <Text style={styles.analyticsMetricLabel}>Connected accounts</Text>
                <Text style={styles.analyticsMetricValue}>{aggregationSnapshot.connectedCount}</Text>
              </View>
              <View style={[styles.analyticsMetricCard, styles.analyticsGold]}>
                <Text style={styles.analyticsMetricLabel}>Needs review</Text>
                <Text style={styles.analyticsMetricValue}>{aggregationSnapshot.reviewCount}</Text>
              </View>
              <View style={[styles.analyticsMetricCard, styles.analyticsSlate]}>
                <Text style={styles.analyticsMetricLabel}>Total external value</Text>
                <Text style={styles.analyticsMetricValue}>
                  {currencyDisplay(`${aggregationSnapshot.totalExternalValue}`)}
                </Text>
              </View>
            </View>
            {connectedAccounts.slice(0, 2).map((account) => (
              <View key={account.id} style={styles.analyticsListCard}>
                <Text style={styles.clientName}>{account.institution}</Text>
                <Text style={styles.clientMeta}>
                  {account.accountType} | {account.status}
                </Text>
                <Text style={styles.clientSubMeta}>
                  {currencyDisplay(account.currentValue)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </>
  );
};
