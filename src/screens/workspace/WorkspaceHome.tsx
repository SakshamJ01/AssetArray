import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { AnimatedPressable as Pressable } from "../../components/AnimatedPressable";

type WorkspacePage = "Home" | "Goals" | "Vault" | "Messages" | "Aggregation" | "Settings";

type CategorySummaryItem = {
  label: string;
  value: string;
};

interface WorkspaceHomeProps {
  aiResearchState: string;
  broadcastState: string;
  categorySummary: CategorySummaryItem[];
  marketMessage: string;
  onChangeMarketMessage: (value: string) => void;
  onNavigate: (page: Exclude<WorkspacePage, "Home">) => void;
  styles: ReturnType<typeof StyleSheet.create>;
  syncState: string;
}

const workspaceMenu: Array<{
  description: string;
  key: Exclude<WorkspacePage, "Home">;
  label: string;
}> = [
  { key: "Goals", label: "Goal Center", description: "Track target funding progress" },
  { key: "Vault", label: "Document Vault", description: "Reports, KYC, tax, review docs" },
  { key: "Messages", label: "Advisor Messages", description: "Protected client drafts" },
  { key: "Aggregation", label: "Aggregation", description: "Linked external account snapshot" },
  { key: "Settings", label: "Settings", description: "Security, sync, campaigns" },
];

export function WorkspaceHome({
  aiResearchState,
  broadcastState,
  categorySummary,
  marketMessage,
  onChangeMarketMessage,
  onNavigate,
  styles,
  syncState,
}: WorkspaceHomeProps) {
  return (
    <>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Daily market message</Text>
        <Text style={styles.panelSubtitle}>
          Default advisor update for outreach and campaigns.
        </Text>
        <TextInput
          multiline
          value={marketMessage}
          onChangeText={onChangeMarketMessage}
          style={[styles.input, styles.messageInput]}
        />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Workspace</Text>
        <Text style={styles.panelSubtitle}>
          Open a focused subpage instead of one long workspace feed.
        </Text>
        {workspaceMenu.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => onNavigate(item.key)}
            pressOpacity={0.98}
            pressScale={0.99}
            pressTranslateY={-4}
            style={styles.analyticsListCard}
          >
            <View style={styles.clientRowMain}>
              <Text style={styles.clientName}>{item.label}</Text>
              <Text style={styles.clientMeta}>{item.description}</Text>
            </View>
            <Text style={styles.clientMeta}>{">"}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.dualColumn}>
        <View style={styles.column}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Smart segmentation</Text>
            <Text style={styles.panelSubtitle}>
              Client mix snapshot for campaign targeting.
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
        </View>

        <View style={styles.column}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Workspace status</Text>
            <Text style={styles.historyItem}>AI research: {aiResearchState}</Text>
            <Text style={styles.historyItem}>Campaigns: {broadcastState}</Text>
            <Text style={styles.historyItem}>Cloud sync: {syncState}</Text>
          </View>
        </View>
      </View>
    </>
  );
}
