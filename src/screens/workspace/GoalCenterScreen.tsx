import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { AnimatedPressable as Pressable } from "../../components/AnimatedPressable";

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
        <Text style={styles.panelTitle}>Goal center</Text>
        <Pressable onPress={onBack} style={styles.linkButton}>
          <Text style={styles.linkButtonText}>Back</Text>
        </Pressable>
      </View>
      <Text style={styles.panelSubtitle}>
        Track retirement, education, emergency, and wealth goals in one place.
      </Text>
      <View style={styles.analyticsSummaryRow}>
        <View style={[styles.analyticsMetricCard, styles.analyticsGold]}>
          <Text style={styles.analyticsMetricLabel}>Target corpus</Text>
          <Text style={styles.analyticsMetricValue}>
            {currencyDisplay(`${goalCenterStats.totalTarget}`)}
          </Text>
        </View>
        <View style={[styles.analyticsMetricCard, styles.analyticsBlue]}>
          <Text style={styles.analyticsMetricLabel}>Current progress</Text>
          <Text style={styles.analyticsMetricValue}>
            {currencyDisplay(`${goalCenterStats.totalCurrent}`)}
          </Text>
        </View>
        <View style={[styles.analyticsMetricCard, styles.analyticsRed]}>
          <Text style={styles.analyticsMetricLabel}>Urgent goals</Text>
          <Text style={styles.analyticsMetricValue}>{goalCenterStats.urgentGoals}</Text>
        </View>
      </View>
      <TextInput
        value={goalDraft.title}
        onChangeText={(value) => onUpdateGoalDraft("title", value)}
        placeholder="Goal name"
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
        placeholder="Target amount"
        placeholderTextColor="#7f90a8"
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <TextInput
        value={goalDraft.currentAmount}
        onChangeText={(value) => onUpdateGoalDraft("currentAmount", value)}
        placeholder="Current amount"
        placeholderTextColor="#7f90a8"
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <TextInput
        value={goalDraft.targetYear}
        onChangeText={(value) => onUpdateGoalDraft("targetYear", value)}
        placeholder="Target year"
        placeholderTextColor="#7f90a8"
        keyboardType="number-pad"
        style={styles.input}
      />
      <TextInput
        value={goalDraft.monthlyContribution}
        onChangeText={(value) => onUpdateGoalDraft("monthlyContribution", value)}
        placeholder="Monthly contribution"
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
        <Text style={styles.goldButtonText}>Add Goal</Text>
      </Pressable>
      {goalCenterStats.rows.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No goals added yet</Text>
          <Text style={styles.emptyText}>
            Add target-based goals and track funding progress here.
          </Text>
        </View>
      ) : (
        goalCenterStats.rows.map((goal) => (
          <View key={goal.id} style={styles.analyticsListCard}>
            <Text style={styles.clientName}>{goal.title}</Text>
            <Text style={styles.clientMeta}>
              {goal.goalType} | {goal.priority} | Target year {goal.targetYear}
            </Text>
            <Text style={styles.clientSubMeta}>
              Current {currencyDisplay(goal.currentAmount)} / Target {currencyDisplay(goal.targetAmount)}
            </Text>
            <View style={styles.allocationBarTrack}>
              <View
                style={[
                  styles.allocationBarFill,
                  { width: `${Math.min(goal.progress, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.clientSubMeta}>
              Progress {goal.progress.toFixed(1)}% | Gap {currencyDisplay(`${goal.gap}`)}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}
