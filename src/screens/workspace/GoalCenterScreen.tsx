import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { AnimatedPressable as Pressable } from "../../components/AnimatedPressable";
import { GoalTableWorkstation } from "../../components/goals/GoalTableWorkstation";

type GoalType = "Retirement" | "Education" | "Wealth" | "Emergency";
type GoalPriority = "Core" | "Growth" | "Optional";

type GoalDraft = {
  title: string;
  goalType: GoalType;
  targetAmount: string;
  currentAmount: string;
  targetYear: string;
  monthlyContribution: string;
  priority: GoalPriority;
};

type GoalRow = {
  id: string;
  title: string;
  goalType: GoalType;
  priority: GoalPriority;
  targetYear: string;
  targetAmount: string;
  currentAmount: string;
  progress: number;
  gap: number;
};

type GoalCenterStats = {
  rows: GoalRow[];
  totalTarget: number;
  totalCurrent: number;
  urgentGoals: number;
};

interface GoalCenterScreenProps {
  currencyDisplay: (raw: string) => string;
  goalCenterStats: GoalCenterStats;
  goalDraft: GoalDraft;
  goalPriorityOptions: GoalPriority[];
  goalTypeOptions: GoalType[];
  onBack: () => void;
  onSaveGoal: () => void;
  onUpdateGoalDraft: <K extends keyof GoalDraft>(key: K, value: GoalDraft[K]) => void;
  styles: ReturnType<typeof StyleSheet.create>;
}

export function GoalCenterScreen({
  currencyDisplay,
  goalCenterStats,
  goalDraft,
  goalPriorityOptions,
  goalTypeOptions,
  onBack,
  onSaveGoal,
  onUpdateGoalDraft,
  styles,
}: GoalCenterScreenProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.sectionHeader}>
        <Text style={styles.panelTitle}>Goal Center</Text>
        <Pressable onPress={onBack} style={styles.linkButton}>
          <Text style={styles.linkButtonText}>Back</Text>
        </Pressable>
      </View>
      <Text style={styles.panelSubtitle}>
        Track retirement, education, emergency, and wealth objectives with funding gap analysis and completion probability.
      </Text>
      <View style={styles.analyticsSummaryRow}>
        <View style={[styles.analyticsMetricCard, styles.analyticsGold]}>
          <Text style={styles.analyticsMetricLabel}>Target Corpus</Text>
          <Text style={[styles.analyticsMetricValue, { fontVariant: ["tabular-nums"] }]}>
            {currencyDisplay(`${goalCenterStats.totalTarget}`)}
          </Text>
        </View>
        <View style={[styles.analyticsMetricCard, styles.analyticsBlue]}>
          <Text style={styles.analyticsMetricLabel}>Current Progress</Text>
          <Text style={[styles.analyticsMetricValue, { fontVariant: ["tabular-nums"] }]}>
            {currencyDisplay(`${goalCenterStats.totalCurrent}`)}
          </Text>
        </View>
        <View style={[styles.analyticsMetricCard, styles.analyticsRed]}>
          <Text style={styles.analyticsMetricLabel}>Urgent Goals</Text>
          <Text style={[styles.analyticsMetricValue, { fontVariant: ["tabular-nums"] }]}>{goalCenterStats.urgentGoals}</Text>
        </View>
      </View>

      <View style={{ marginVertical: 16 }}>
        <Text style={[styles.panelSubtitle, { fontWeight: "700", marginBottom: 8, color: "#f8fafc" }]}>
          Active Client Goals ({goalCenterStats.rows.length})
        </Text>
        <GoalTableWorkstation
          goals={goalCenterStats.rows}
          currencyDisplay={currencyDisplay}
        />
      </View>

      <Text style={[styles.panelSubtitle, { fontWeight: "700", marginTop: 12, marginBottom: 8, color: "#f8fafc" }]}>
        Add New Financial Goal
      </Text>
      <TextInput
        value={goalDraft.title}
        onChangeText={(value) => onUpdateGoalDraft("title", value)}
        placeholder="Goal Title (e.g., Retirement 2040)"
        placeholderTextColor="#7f90a8"
        style={styles.input}
      />
      <View style={styles.optionRow}>
        {goalTypeOptions.map((option) => {
          const active = goalDraft.goalType === option;
          return (
            <Pressable
              key={option}
              style={[styles.optionChip, active ? styles.optionChipActive : null]}
              onPress={() => onUpdateGoalDraft("goalType", option)}
            >
              <Text
                style={[
                  styles.optionChipText,
                  active ? styles.optionChipTextActive : null,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        value={goalDraft.targetAmount}
        onChangeText={(value) => onUpdateGoalDraft("targetAmount", value)}
        placeholder="Target Amount (INR)"
        placeholderTextColor="#7f90a8"
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <TextInput
        value={goalDraft.currentAmount}
        onChangeText={(value) => onUpdateGoalDraft("currentAmount", value)}
        placeholder="Current Allocated Amount (INR)"
        placeholderTextColor="#7f90a8"
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <TextInput
        value={goalDraft.targetYear}
        onChangeText={(value) => onUpdateGoalDraft("targetYear", value)}
        placeholder="Target Horizon Year (e.g., 2035)"
        placeholderTextColor="#7f90a8"
        keyboardType="number-pad"
        style={styles.input}
      />
      <TextInput
        value={goalDraft.monthlyContribution}
        onChangeText={(value) => onUpdateGoalDraft("monthlyContribution", value)}
        placeholder="Planned Monthly SIP (INR)"
        placeholderTextColor="#7f90a8"
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <View style={styles.optionRow}>
        {goalPriorityOptions.map((option) => {
          const active = goalDraft.priority === option;
          return (
            <Pressable
              key={option}
              style={[styles.optionChip, active ? styles.optionChipActive : null]}
              onPress={() => onUpdateGoalDraft("priority", option)}
            >
              <Text
                style={[
                  styles.optionChipText,
                  active ? styles.optionChipTextActive : null,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable style={styles.goldButton} onPress={onSaveGoal}>
        <Text style={styles.goldButtonText}>Save Goal</Text>
      </Pressable>
    </View>
  );
}
