import React from "react";
import { StyleSheet, Text, View } from "react-native";

type ConnectedAccount = {
  id: string;
  institution: string;
  accountType: "Bank" | "Broker" | "Card" | "Retirement";
  currentValue: string;
  status: "Connected" | "Review";
};

interface AggregationSnapshot {
  connectedCount: number;
  reviewCount: number;
  totalExternalValue: number;
}

interface AggregationScreenProps {
  connectedAccounts: ConnectedAccount[];
  aggregationSnapshot: AggregationSnapshot;
  currencyDisplay: (raw: string) => string;
  styles: ReturnType<typeof StyleSheet.create>;
}

export function AggregationScreen({
  connectedAccounts,
  aggregationSnapshot,
  currencyDisplay,
  styles,
}: AggregationScreenProps) {
  return (
    <View style={styles.column}>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Automated data aggregation</Text>
        <Text style={styles.panelSubtitle}>
          Linked account snapshot for banks, brokerages, cards, and retirement accounts.
        </Text>
        <View style={styles.analyticsSummaryRow}>
          <View style={[styles.analyticsMetricCard, styles.analyticsBlue]}>
            <Text style={styles.analyticsMetricLabel}>Connected accounts</Text>
            <Text style={styles.analyticsMetricValue}>
              {aggregationSnapshot.connectedCount}
            </Text>
          </View>
          <View style={[styles.analyticsMetricCard, styles.analyticsGold]}>
            <Text style={styles.analyticsMetricLabel}>Needs review</Text>
            <Text style={styles.analyticsMetricValue}>
              {aggregationSnapshot.reviewCount}
            </Text>
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
  );
}
