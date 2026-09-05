import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { AppTheme } from "../theme";
import {
  CalculatorTab,
  CALCULATOR_TABS,
  CASH_FLOW_FREQUENCIES,
  CASH_FLOW_MODES,
  CashFlowFrequency,
  CashFlowMode,
  GoalDraft,
  GOAL_PRIORITY_OPTIONS,
  GOAL_TYPE_OPTIONS,
  SIP_FREQUENCIES,
  SipFrequency,
  VaultDocument,
  VaultDocumentDraft,
} from "../types/wealth";
import { MonteCarloModal } from "../components/modals/MonteCarloModal";

export interface ToolsScreenProps {
  theme: AppTheme;
  activeCalculator: CalculatorTab;
  setActiveCalculator: (tab: CalculatorTab) => void;
  // Cash Flow
  cashFlowAmount: string;
  setCashFlowAmount: (val: string) => void;
  cashFlowRate: string;
  setCashFlowRate: (val: string) => void;
  cashFlowYears: string;
  setCashFlowYears: (val: string) => void;
  cashFlowFrequency: CashFlowFrequency;
  setCashFlowFrequency: (val: CashFlowFrequency) => void;
  cashFlowMode: CashFlowMode;
  setCashFlowMode: (val: CashFlowMode) => void;
  cashFlowResults: {
    ready: boolean;
    payoutPerPeriod: number;
    annualInterest: number;
    totalInterest: number;
    maturityValue: number;
  };
  // SIP
  sipAmount: string;
  setSipAmount: (val: string) => void;
  sipRate: string;
  setSipRate: (val: string) => void;
  sipYears: string;
  setSipYears: (val: string) => void;
  sipFrequency: SipFrequency;
  setSipFrequency: (val: SipFrequency) => void;
  sipResults: {
    ready: boolean;
    totalInvested: number;
    estimatedReturns: number;
    maturityValue: number;
    installments: number;
  };
  // Goal Planner
  goalTargetAmount: string;
  setGoalTargetAmount: (val: string) => void;
  goalExpectedReturn: string;
  setGoalExpectedReturn: (val: string) => void;
  goalYears: string;
  setGoalYears: (val: string) => void;
  goalPlannerResults: {
    ready: boolean;
    requiredMonthlySip: number;
    totalInvested: number;
    estimatedGrowth: number;
  };
  // Retirement Planner
  retirementMonthlyExpense: string;
  setRetirementMonthlyExpense: (val: string) => void;
  retirementInflation: string;
  setRetirementInflation: (val: string) => void;
  retirementReturn: string;
  setRetirementReturn: (val: string) => void;
  retirementYearsToRetire: string;
  setRetirementYearsToRetire: (val: string) => void;
  retirementYearsAfterRetire: string;
  setRetirementYearsAfterRetire: (val: string) => void;
  retirementResults: {
    ready: boolean;
    futureMonthlyExpense: number;
    targetCorpus: number;
    requiredMonthlySip: number;
  };
  // Goal Center
  goalDraft: GoalDraft;
  updateGoalDraft: (key: keyof GoalDraft, val: any) => void;
  saveGoalFromDraft: () => void;
  goalCenterStats: {
    totalTarget: number;
    totalCurrent: number;
    urgentGoals: number;
    rows: any[];
  };
  // Vault
  vaultDocumentDraft: {
    clientName: string;
    fileName: string;
    category: "Report" | "KYC" | "Tax" | "Review";
  };
  setVaultDocumentDraft: React.Dispatch<
    React.SetStateAction<{
      clientName: string;
      fileName: string;
      category: "Report" | "KYC" | "Tax" | "Review";
    }>
  >;
  saveVaultDocumentDraftAction: () => void;
  vaultDocuments: Array<{
    id: string;
    clientName: string;
    fileName: string;
    category: string;
    status: string;
    date: string;
  }>;
  currencyDisplay: (val: string) => string;
  styles: any;
}

export const ToolsScreen: React.FC<ToolsScreenProps> = React.memo(({
  theme,
  activeCalculator,
  setActiveCalculator,

  cashFlowAmount,
  setCashFlowAmount,
  cashFlowRate,
  setCashFlowRate,
  cashFlowYears,
  setCashFlowYears,
  cashFlowFrequency,
  setCashFlowFrequency,
  cashFlowMode,
  setCashFlowMode,
  cashFlowResults,
  sipAmount,
  setSipAmount,
  sipRate,
  setSipRate,
  sipYears,
  setSipYears,
  sipFrequency,
  setSipFrequency,
  sipResults,
  goalTargetAmount,
  setGoalTargetAmount,
  goalExpectedReturn,
  setGoalExpectedReturn,
  goalYears,
  setGoalYears,
  goalPlannerResults,
  retirementMonthlyExpense,
  setRetirementMonthlyExpense,
  retirementInflation,
  setRetirementInflation,
  retirementReturn,
  setRetirementReturn,
  retirementYearsToRetire,
  setRetirementYearsToRetire,
  retirementYearsAfterRetire,
  setRetirementYearsAfterRetire,
  retirementResults,
  goalDraft,
  updateGoalDraft,
  saveGoalFromDraft,
  goalCenterStats,
  vaultDocumentDraft,
  setVaultDocumentDraft,
  saveVaultDocumentDraftAction,
  vaultDocuments,
  currencyDisplay,
  styles,
}) => {
  const [showMonteCarlo, setShowMonteCarlo] = React.useState(false);
  const [monteCarloConfig, setMonteCarloConfig] = React.useState({
    target: 100000000,
    years: 15,
    monthlySip: 100000,
  });

  return (
    <>
      <View style={styles.dualColumn}>
        <View style={styles.column}>
          <View style={[styles.panel, styles.calculatorPanel]}>
            <Text style={styles.panelTitle}>Calculator hub</Text>
            <Text style={styles.panelSubtitle}>
              Use one clean tools tab to switch calculator types quickly.
            </Text>
            <View style={styles.optionRow}>
              {CALCULATOR_TABS.map((tab) => {
                const active = activeCalculator === tab;
                return (
                  <Pressable
                    key={tab}
                    style={[styles.optionChip, active ? styles.optionChipActive : null]}
                    onPress={() => setActiveCalculator(tab)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        active ? styles.optionChipTextActive : null,
                      ]}
                    >
                      {tab}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Cash Flow */}
            {activeCalculator === "Cash Flow" ? (
              <>
                <Text style={styles.sectionLabel}>Cash flow calculator</Text>
                <TextInput
                  value={cashFlowAmount}
                  onChangeText={setCashFlowAmount}
                  placeholder="Investment amount"
                  placeholderTextColor="#7f90a8"
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
                <TextInput
                  value={cashFlowRate}
                  onChangeText={setCashFlowRate}
                  placeholder="Annual interest rate (%)"
                  placeholderTextColor="#7f90a8"
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
                <TextInput
                  value={cashFlowYears}
                  onChangeText={setCashFlowYears}
                  placeholder="Duration in years"
                  placeholderTextColor="#7f90a8"
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
                <Text style={styles.inputLabel}>Interest view</Text>
                <View style={styles.optionRow}>
                  {CASH_FLOW_FREQUENCIES.map((option) => {
                    const active = cashFlowFrequency === option;
                    return (
                      <Pressable
                        key={option}
                        style={[
                          styles.optionChip,
                          active ? styles.optionChipActive : null,
                        ]}
                        onPress={() => setCashFlowFrequency(option)}
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
                <Text style={styles.inputLabel}>Calculation type</Text>
                <View style={styles.optionRow}>
                  {CASH_FLOW_MODES.map((option) => {
                    const active = cashFlowMode === option;
                    return (
                      <Pressable
                        key={option}
                        style={[
                          styles.optionChip,
                          active ? styles.optionChipActive : null,
                        ]}
                        onPress={() => setCashFlowMode(option)}
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
                {cashFlowResults.ready ? (
                  <View style={styles.calculatorResultGrid}>
                    <View style={[styles.miniStat, styles.calculatorStat]}>
                      <Text style={styles.miniStatValue}>
                        {currencyDisplay(`${cashFlowResults.payoutPerPeriod}`)}
                      </Text>
                      <Text style={styles.miniStatLabel}>
                        {cashFlowMode === "Payout"
                          ? `${cashFlowFrequency} interest`
                          : `${cashFlowFrequency} avg growth`}
                      </Text>
                    </View>
                    <View style={[styles.miniStat, styles.calculatorStat]}>
                      <Text style={styles.miniStatValue}>
                        {currencyDisplay(`${cashFlowResults.annualInterest}`)}
                      </Text>
                      <Text style={styles.miniStatLabel}>Yearly interest</Text>
                    </View>
                    <View style={[styles.miniStat, styles.calculatorStat]}>
                      <Text style={styles.miniStatValue}>
                        {currencyDisplay(`${cashFlowResults.totalInterest}`)}
                      </Text>
                      <Text style={styles.miniStatLabel}>Total interest</Text>
                    </View>
                    <View style={[styles.miniStat, styles.calculatorStat]}>
                      <Text style={styles.miniStatValue}>
                        {currencyDisplay(`${cashFlowResults.maturityValue}`)}
                      </Text>
                      <Text style={styles.miniStatLabel}>
                        {cashFlowMode === "Payout"
                          ? "Principal at end"
                          : "Maturity value"}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Calculator ready</Text>
                    <Text style={styles.emptyText}>
                      Add amount, rate, and duration to see the interest calculation here.
                    </Text>
                  </View>
                )}
              </>
            ) : null}

            {/* SIP */}
            {activeCalculator === "SIP" ? (
              <>
                <Text style={styles.sectionLabel}>SIP calculator</Text>
                <TextInput
                  value={sipAmount}
                  onChangeText={setSipAmount}
                  placeholder="SIP amount per installment"
                  placeholderTextColor="#7f90a8"
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
                <TextInput
                  value={sipRate}
                  onChangeText={setSipRate}
                  placeholder="Expected annual return (%)"
                  placeholderTextColor="#7f90a8"
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
                <TextInput
                  value={sipYears}
                  onChangeText={setSipYears}
                  placeholder="Duration in years"
                  placeholderTextColor="#7f90a8"
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
                <Text style={styles.inputLabel}>SIP frequency</Text>
                <View style={styles.optionRow}>
                  {SIP_FREQUENCIES.map((option) => {
                    const active = sipFrequency === option;
                    return (
                      <Pressable
                        key={option}
                        style={[
                          styles.optionChip,
                          active ? styles.optionChipActive : null,
                        ]}
                        onPress={() => setSipFrequency(option)}
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
                {sipResults.ready ? (
                  <View style={styles.calculatorResultGrid}>
                    <View style={[styles.miniStat, styles.calculatorStat]}>
                      <Text style={styles.miniStatValue}>
                        {currencyDisplay(`${sipResults.totalInvested}`)}
                      </Text>
                      <Text style={styles.miniStatLabel}>Total invested</Text>
                    </View>
                    <View style={[styles.miniStat, styles.calculatorStat]}>
                      <Text style={styles.miniStatValue}>
                        {currencyDisplay(`${sipResults.estimatedReturns}`)}
                      </Text>
                      <Text style={styles.miniStatLabel}>Estimated returns</Text>
                    </View>
                    <View style={[styles.miniStat, styles.calculatorStat]}>
                      <Text style={styles.miniStatValue}>
                        {currencyDisplay(`${sipResults.maturityValue}`)}
                      </Text>
                      <Text style={styles.miniStatLabel}>Estimated maturity</Text>
                    </View>
                    <View style={[styles.miniStat, styles.calculatorStat]}>
                      <Text style={styles.miniStatValue}>{sipResults.installments}</Text>
                      <Text style={styles.miniStatLabel}>Installments</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>SIP calculator ready</Text>
                    <Text style={styles.emptyText}>
                      Add SIP amount, expected rate, and duration to see the projection here.
                    </Text>
                  </View>
                )}
              </>
            ) : null}

            {/* Goal Planner */}
            {activeCalculator === "Goal Planner" ? (
              <>
                <Text style={styles.sectionLabel}>Goal planner</Text>
                <TextInput
                  value={goalTargetAmount}
                  onChangeText={setGoalTargetAmount}
                  placeholder="Target amount"
                  placeholderTextColor="#7f90a8"
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
                <TextInput
                  value={goalExpectedReturn}
                  onChangeText={setGoalExpectedReturn}
                  placeholder="Expected annual return (%)"
                  placeholderTextColor="#7f90a8"
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
                <TextInput
                  value={goalYears}
                  onChangeText={setGoalYears}
                  placeholder="Years to goal"
                  placeholderTextColor="#7f90a8"
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
                {goalPlannerResults.ready ? (
                  <>
                    <View style={styles.calculatorResultGrid}>
                      <View style={[styles.miniStat, styles.calculatorStat]}>
                        <Text style={styles.miniStatValue}>
                          {currencyDisplay(`${goalPlannerResults.requiredMonthlySip}`)}
                        </Text>
                        <Text style={styles.miniStatLabel}>Required monthly SIP</Text>
                      </View>
                      <View style={[styles.miniStat, styles.calculatorStat]}>
                        <Text style={styles.miniStatValue}>
                          {currencyDisplay(`${goalPlannerResults.totalInvested}`)}
                        </Text>
                        <Text style={styles.miniStatLabel}>Estimated invested</Text>
                      </View>
                      <View style={[styles.miniStat, styles.calculatorStat]}>
                        <Text style={styles.miniStatValue}>
                          {currencyDisplay(`${goalPlannerResults.estimatedGrowth}`)}
                        </Text>
                        <Text style={styles.miniStatLabel}>Expected growth</Text>
                      </View>
                    </View>
                    <Pressable
                      style={[styles.goldButton, { marginTop: 12 }]}
                      onPress={() => {
                        setMonteCarloConfig({
                          target: Number(goalTargetAmount) || 100000000,
                          years: Number(goalYears) || 15,
                          monthlySip: goalPlannerResults.requiredMonthlySip || 50000,
                        });
                        setShowMonteCarlo(true);
                      }}
                    >
                      <Text style={styles.goldButtonText}>Run Monte Carlo Goal Simulator (1,000 Paths)</Text>
                    </Pressable>
                  </>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Goal planner ready</Text>
                    <Text style={styles.emptyText}>
                      Add target amount, return, and years to calculate the required SIP.
                    </Text>
                  </View>
                )}
              </>
            ) : null}

            {/* Retirement */}
            {activeCalculator === "Retirement" ? (
              <>
                <Text style={styles.sectionLabel}>Retirement planner</Text>
                <TextInput
                  value={retirementMonthlyExpense}
                  onChangeText={setRetirementMonthlyExpense}
                  placeholder="Current monthly expense"
                  placeholderTextColor="#7f90a8"
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
                <TextInput
                  value={retirementInflation}
                  onChangeText={setRetirementInflation}
                  placeholder="Inflation (%)"
                  placeholderTextColor="#7f90a8"
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
                <TextInput
                  value={retirementReturn}
                  onChangeText={setRetirementReturn}
                  placeholder="Expected return before retirement (%)"
                  placeholderTextColor="#7f90a8"
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
                <TextInput
                  value={retirementYearsToRetire}
                  onChangeText={setRetirementYearsToRetire}
                  placeholder="Years to retirement"
                  placeholderTextColor="#7f90a8"
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
                <TextInput
                  value={retirementYearsAfterRetire}
                  onChangeText={setRetirementYearsAfterRetire}
                  placeholder="Years after retirement"
                  placeholderTextColor="#7f90a8"
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
                {retirementResults.ready ? (
                  <>
                    <View style={styles.calculatorResultGrid}>
                      <View style={[styles.miniStat, styles.calculatorStat]}>
                        <Text style={styles.miniStatValue}>
                          {currencyDisplay(`${retirementResults.futureMonthlyExpense}`)}
                        </Text>
                        <Text style={styles.miniStatLabel}>Future monthly expense</Text>
                      </View>
                      <View style={[styles.miniStat, styles.calculatorStat]}>
                        <Text style={styles.miniStatValue}>
                          {currencyDisplay(`${retirementResults.targetCorpus}`)}
                        </Text>
                        <Text style={styles.miniStatLabel}>Target corpus</Text>
                      </View>
                      <View style={[styles.miniStat, styles.calculatorStat]}>
                        <Text style={styles.miniStatValue}>
                          {currencyDisplay(`${retirementResults.requiredMonthlySip}`)}
                        </Text>
                        <Text style={styles.miniStatLabel}>Required monthly SIP</Text>
                      </View>
                    </View>
                    <Pressable
                      style={[styles.goldButton, { marginTop: 12 }]}
                      onPress={() => {
                        setMonteCarloConfig({
                          target: retirementResults.targetCorpus || 100000000,
                          years: Number(retirementYearsToRetire) || 15,
                          monthlySip: retirementResults.requiredMonthlySip || 50000,
                        });
                        setShowMonteCarlo(true);
                      }}
                    >
                      <Text style={styles.goldButtonText}>Run Monte Carlo Retirement Simulator (1,000 Paths)</Text>
                    </Pressable>
                  </>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Retirement planner ready</Text>
                    <Text style={styles.emptyText}>
                      Add expense, inflation, returns, and timeline to estimate retirement corpus.
                    </Text>
                  </View>
                )}
              </>
            ) : null}
          </View>
        </View>
      </View>

      {/* Goal Center */}
      <View style={styles.dualColumn}>
        <View style={styles.column}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Goal center</Text>
            <Text style={styles.panelSubtitle}>
              Retirement, education, emergency, and wealth goals ko track karo with progress visibility.
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
              onChangeText={(value) => updateGoalDraft("title", value)}
              placeholder="Goal name"
              placeholderTextColor="#7f90a8"
              style={styles.input}
            />
            <View style={styles.optionRow}>
              {GOAL_TYPE_OPTIONS.map((option) => {
                const active = goalDraft.goalType === option;
                return (
                  <Pressable
                    key={option}
                    style={[styles.optionChip, active ? styles.optionChipActive : null]}
                    onPress={() => updateGoalDraft("goalType", option)}
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
              onChangeText={(value) => updateGoalDraft("targetAmount", value)}
              placeholder="Target amount"
              placeholderTextColor="#7f90a8"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              value={goalDraft.currentAmount}
              onChangeText={(value) => updateGoalDraft("currentAmount", value)}
              placeholder="Current amount"
              placeholderTextColor="#7f90a8"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              value={goalDraft.targetYear}
              onChangeText={(value) => updateGoalDraft("targetYear", value)}
              placeholder="Target year"
              placeholderTextColor="#7f90a8"
              keyboardType="number-pad"
              style={styles.input}
            />
            <TextInput
              value={goalDraft.monthlyContribution}
              onChangeText={(value) => updateGoalDraft("monthlyContribution", value)}
              placeholder="Monthly contribution"
              placeholderTextColor="#7f90a8"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <View style={styles.optionRow}>
              {GOAL_PRIORITY_OPTIONS.map((option) => {
                const active = goalDraft.priority === option;
                return (
                  <Pressable
                    key={option}
                    style={[styles.optionChip, active ? styles.optionChipActive : null]}
                    onPress={() => updateGoalDraft("priority", option)}
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
            <Pressable style={styles.goldButton} onPress={saveGoalFromDraft}>
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
        </View>
      </View>

      {/* Document Vault */}
      <View style={styles.dualColumn}>
        <View style={styles.column}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Document vault</Text>
            <Text style={styles.panelSubtitle}>
              Secure document metadata storage for reports, KYC, tax files, and review packs.
            </Text>
            <TextInput
              value={vaultDocumentDraft.clientName}
              onChangeText={(value) =>
                setVaultDocumentDraft((current) => ({ ...current, clientName: value }))
              }
              placeholder="Client name"
              placeholderTextColor="#7f90a8"
              style={styles.input}
            />
            <TextInput
              value={vaultDocumentDraft.fileName}
              onChangeText={(value) =>
                setVaultDocumentDraft((current) => ({ ...current, fileName: value }))
              }
              placeholder="Document file name"
              placeholderTextColor="#7f90a8"
              style={styles.input}
            />
            <View style={styles.optionRow}>
              {(["Report", "KYC", "Tax", "Review"] as const).map((option) => {
                const active = vaultDocumentDraft.category === option;
                return (
                  <Pressable
                    key={option}
                    style={[styles.optionChip, active ? styles.optionChipActive : null]}
                    onPress={() =>
                      setVaultDocumentDraft((current) => ({
                        ...current,
                        category: option,
                      }))
                    }
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
            <Pressable style={styles.goldButton} onPress={saveVaultDocumentDraftAction}>
              <Text style={styles.goldButtonText}>Add to Vault</Text>
            </Pressable>
            {(vaultDocuments || []).length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Vault is empty</Text>
                <Text style={styles.emptyText}>
                  Store report, KYC, tax, and review document entries here.
                </Text>
              </View>
            ) : (
              (vaultDocuments || []).slice(0, 5).map((doc) => (
                <View key={doc.id} style={styles.analyticsListCard}>
                  <Text style={styles.clientName}>{doc.fileName}</Text>
                  <Text style={styles.clientMeta}>
                    {doc.clientName} | {doc.category} | {doc.status}
                  </Text>
                  <Text style={styles.clientSubMeta}>{doc.date}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </View>

      <MonteCarloModal
        visible={showMonteCarlo}
        onClose={() => setShowMonteCarlo(false)}
        theme={theme}
        targetCorpus={monteCarloConfig.target}
        years={monteCarloConfig.years}
        monthlyContribution={monteCarloConfig.monthlySip}
        clientName="Private Wealth Client"
      />
    </>
  );
});

