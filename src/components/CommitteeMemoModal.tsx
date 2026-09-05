import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { generateCommitteeMemo } from "../services/committeeMemo";
import { Client } from "../types/wealth";
import { AppTheme } from "../theme";

interface CommitteeMemoModalProps {
  visible: boolean;
  theme: AppTheme;
  client: Client;
  onClose: () => void;
}

export const CommitteeMemoModal: React.FC<CommitteeMemoModalProps> = ({
  visible,
  theme,
  client,
  onClose,
}) => {
  const { colors } = theme;
  const [copied, setCopied] = useState(false);

  const memo = generateCommitteeMemo(client);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Investment Committee Memorandum
              </Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                DPDP-Aligned Privacy Controls • {memo.anonymizedClientRef}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close-circle" size={26} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Metadata Pill Banner */}
            <View
              style={[
                styles.metaBanner,
                { backgroundColor: colors.backgroundMuted, borderColor: colors.border },
              ]}
            >
              <View style={styles.metaCol}>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>
                  Mandate Ref
                </Text>
                <Text style={[styles.metaVal, { color: colors.brand }]}>
                  {memo.anonymizedClientRef}
                </Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>
                  Advisor Governance
                </Text>
                <Text style={[styles.metaVal, { color: colors.accent }]}>
                  SEBI-Aware / DPDP-Aligned
                </Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>
                  Date
                </Text>
                <Text style={[styles.metaVal, { color: colors.textPrimary }]}>
                  {memo.date}
                </Text>
              </View>
            </View>

            {/* Executive Summary */}
            <Text style={[styles.sectionTitle, { color: colors.brand }]}>
              Executive Summary
            </Text>
            <View
              style={[
                styles.sectionBox,
                { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.bodyText, { color: colors.textPrimary }]}>
                {memo.executiveSummary}
              </Text>
            </View>

            {/* Allocation & Health Diagnostic */}
            <Text style={[styles.sectionTitle, { color: colors.brand }]}>
              Portfolio Diagnostic Assessment
            </Text>
            <View
              style={[
                styles.sectionBox,
                { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.bodyText, { color: colors.textPrimary }]}>
                {memo.allocationAndHealth}
              </Text>
            </View>

            {/* Attribution Analysis */}
            <Text style={[styles.sectionTitle, { color: colors.brand }]}>
              Performance Attribution
            </Text>
            <View
              style={[
                styles.sectionBox,
                { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.bodyText, { color: colors.textPrimary }]}>
                {memo.performanceAttribution}
              </Text>
            </View>

            {/* Stress Testing Summary */}
            <Text style={[styles.sectionTitle, { color: colors.brand }]}>
              Downside & Tail Risk Profile
            </Text>
            <View
              style={[
                styles.sectionBox,
                { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.bodyText, { color: colors.textPrimary }]}>
                {memo.stressTestingSummary}
              </Text>
            </View>

            {/* Fiduciary Action Plan */}
            <Text style={[styles.sectionTitle, { color: colors.brand }]}>
              Fiduciary Action Plan & Recommendations
            </Text>
            <View
              style={[
                styles.sectionBox,
                { backgroundColor: colors.accentSoft, borderColor: colors.accent },
              ]}
            >
              {memo.fiduciaryRecommendations.map((rec, i) => (
                <View key={i} style={styles.recItem}>
                  <Ionicons
                    name="checkmark-done"
                    size={16}
                    color={colors.accent}
                    style={{ marginTop: 2, marginRight: 8 }}
                  />
                  <Text style={[styles.recText, { color: colors.textPrimary }]}>
                    {rec}
                  </Text>
                </View>
              ))}
            </View>

            {/* Copy / Export Action Button */}
            <Pressable
              onPress={handleCopy}
              style={[
                styles.actionBtn,
                { backgroundColor: colors.brand, borderColor: colors.brandStrong },
              ]}
            >
              <Ionicons
                name={copied ? "checkmark-circle" : "copy-outline"}
                size={18}
                color={colors.textOnBrand}
              />
              <Text style={[styles.actionBtnText, { color: colors.textOnBrand }]}>
                {copied ? "Memorandum Copied to Clipboard!" : "Copy Full IC Memorandum"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 720,
    maxHeight: "92%",
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.15)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 32,
  },
  metaBanner: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  metaCol: {
    flex: 1,
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 3,
  },
  metaVal: {
    fontSize: 12,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  sectionBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  recItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  recText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: "500",
  },
  actionBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
