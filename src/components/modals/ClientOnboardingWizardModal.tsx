import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppTheme } from "../../theme";
import {
  Category,
  Channel,
  Client,
  Goal,
  PortfolioHolding,
  Priority,
  AssetClass,
} from "../../types/wealth";
import { parseStatement, SAMPLE_STATEMENTS, ParsedStatementResult } from "../../services/statementParser";
import { formatWealthAmount } from "../../services/currency";
import { triggerSuccessHaptic } from "../../services/haptics";
import { getClientAvatar } from "../../services/avatars";

export interface ClientOnboardingWizardModalProps {
  visible: boolean;
  isDesktop: boolean;
  theme: AppTheme;
  onClose: () => void;
  onCompleteOnboarding: (newClient: Client, optionalGoal?: Goal) => void;
}

type WizardStep = 1 | 2 | 3;

interface AllocationPreset {
  label: string;
  description: string;
  allocationString: string;
  equity: number;
  debt: number;
  alts: number;
}

const ALLOCATION_PRESETS: AllocationPreset[] = [
  {
    label: "Balanced Wealth",
    description: "Optimal risk-adjusted growth with debt buffer",
    allocationString: "Balanced (60:30:10)",
    equity: 60,
    debt: 30,
    alts: 10,
  },
  {
    label: "Aggressive Growth",
    description: "Maximum equity compounding for long-term mandates",
    allocationString: "Aggressive Growth (75:15:10)",
    equity: 75,
    debt: 15,
    alts: 10,
  },
  {
    label: "Capital Preservation",
    description: "Lower volatility with heavy fixed income focus",
    allocationString: "Capital Preservation (30:60:10)",
    equity: 30,
    debt: 60,
    alts: 10,
  },
];

export const ClientOnboardingWizardModal: React.FC<ClientOnboardingWizardModalProps> = ({
  visible,
  isDesktop,
  theme,
  onClose,
  onCompleteOnboarding,
}) => {
  const [step, setStep] = useState<WizardStep>(1);

  // Step 1: Profile State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<Category>("HNI");
  const [riskProfile, setRiskProfile] = useState("Balanced Growth");
  const [preferredChannel, setPreferredChannel] = useState<Channel>("WhatsApp");
  const [city, setCity] = useState("Mumbai");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 2: Holdings & Statement Ingestion State
  const [ingestionMode, setIngestionMode] = useState<"paste" | "sample" | "skip">("paste");
  const [statementText, setStatementText] = useState("");
  const [parsedResult, setParsedResult] = useState<ParsedStatementResult | null>(null);

  // Step 3: Mandate & Goal State
  const [selectedPreset, setSelectedPreset] = useState<AllocationPreset>(ALLOCATION_PRESETS[0]);
  const [addGoal, setAddGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState("Retirement Corpus");
  const [goalTargetAmount, setGoalTargetAmount] = useState("50000000"); // 5 Cr default
  const [goalYears, setGoalYears] = useState("10");

  if (!visible) return null;

  const handleParseStatement = (text: string) => {
    setStatementText(text);
    if (!text.trim()) {
      setParsedResult(null);
      return;
    }
    const res = parseStatement(text);
    setParsedResult(res);
  };

  const handleLoadSample = (key: "zerodha" | "camsCas" | "iciciDirect") => {
    const raw = SAMPLE_STATEMENTS[key];
    setStatementText(raw);
    const res = parseStatement(raw);
    setParsedResult(res);
  };

  const validateStep1 = (): boolean => {
    if (!name.trim()) {
      setErrorMsg("Please enter the client's full legal or mandate name.");
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as WizardStep);
    }
  };

  const handleFinish = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const clientId = `client_${Date.now()}`;

    // Convert parsed holdings to PortfolioHolding[]
    const portfolioHoldings: PortfolioHolding[] = (parsedResult?.holdings || []).map((h, i) => {
      let cls: AssetClass = "Stocks";
      const c = (h.assetClass || "").toLowerCase();
      if (c.includes("bond") || c.includes("debt") || c.includes("fixed")) cls = "Bonds";
      else if (c.includes("fund") || c.includes("mutual")) cls = "Mutual Funds";
      else if (c.includes("cash") || c.includes("liquid")) cls = "Cash";
      else if (c.includes("alt") || c.includes("gold") || c.includes("commodity")) cls = "Alternatives";

      const totalVal = parsedResult?.totalValue || 0;
      const weight = totalVal > 0 ? `${((h.currentValue / totalVal) * 100).toFixed(1)}%` : "0%";

      return {
        id: `h_${Date.now()}_${i + 1}`,
        assetName: h.assetName,
        assetClass: cls,
        ticker: h.ticker || h.symbol || `HOLDING-${i + 1}`,
        quantity: String(h.quantity || 1),
        investedValue: String(h.investedValue || h.currentValue || 0),
        currentValue: String(h.currentValue || 0),
        targetWeight: weight,
        notes: `Ingested via Onboarding Wizard (${parsedResult?.detectedBroker || "Manual Statement"})`,
      };
    });

    const newClient: Client = {
      id: clientId,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      category,
      riskProfile,
      preferredChannel,
      watchlist: portfolioHoldings.slice(0, 5).map((h) => h.ticker).filter(Boolean),
      notes: notes.trim() || `Onboarded via 1-Click Institutional Wizard on ${today}.`,
      city: city.trim() || "Mumbai",
      allocation: selectedPreset.allocationString,
      reminderDate: today,
      priority: category === "HNI" || category === "Family Office" ? "High" : "Medium",
      lastContact: today,
      updateHistory: [`Client onboarded with ${portfolioHoldings.length} initial holdings on ${today}`],
      portfolio: portfolioHoldings,
      avatarUrl: getClientAvatar({ name, category, riskProfile } as any),
    };

    let optionalGoal: Goal | undefined;
    if (addGoal && goalTitle.trim()) {
      optionalGoal = {
        id: `goal_${Date.now()}`,
        clientId: newClient.id,
        title: goalTitle.trim(),
        goalType: "Wealth",
        targetAmount: goalTargetAmount || "10000000",
        currentAmount: String(parsedResult?.totalValue || 0),
        targetYear: String(new Date().getFullYear() + (parseInt(goalYears, 10) || 5)),
        monthlyContribution: "50000",
        priority: "Core",
      };
    }

    await triggerSuccessHaptic();
    onCompleteOnboarding(newClient, optionalGoal);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType={isDesktop ? "fade" : "slide"}>
      <View style={[styles.backdrop, isDesktop && styles.backdropCenter]}>
        <View
          style={[
            styles.card,
            isDesktop && styles.cardCenter,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          {/* Top Progress Header */}
          <View style={styles.topBar}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <Ionicons name="sparkles" size={14} color="#E0A84C" />
                <Text style={[styles.eyebrow, { color: theme.colors.brand }]}>
                  INSTITUTIONAL CLIENT ONBOARDING
                </Text>
              </View>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                {step === 1 && "Client Identity & Risk Profile"}
                {step === 2 && "Portfolio & Statement Ingestion"}
                {step === 3 && "Asset Target Mandate & Goals"}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          {/* Stepper Dots */}
          <View style={styles.stepperContainer}>
            <View style={[styles.stepItem, step >= 1 && styles.stepItemActive]}>
              <View style={[styles.stepCircle, step >= 1 && { backgroundColor: theme.colors.brand }]}>
                <Text style={[styles.stepNumber, step >= 1 && { color: "#000" }]}>1</Text>
              </View>
              <Text style={[styles.stepLabel, { color: step >= 1 ? theme.colors.textPrimary : "#64748B" }]}>
                Profile
              </Text>
            </View>
            <View style={[styles.stepConnector, step >= 2 && { backgroundColor: theme.colors.brand }]} />
            <View style={[styles.stepItem, step >= 2 && styles.stepItemActive]}>
              <View style={[styles.stepCircle, step >= 2 && { backgroundColor: theme.colors.brand }]}>
                <Text style={[styles.stepNumber, step >= 2 && { color: "#000" }]}>2</Text>
              </View>
              <Text style={[styles.stepLabel, { color: step >= 2 ? theme.colors.textPrimary : "#64748B" }]}>
                Holdings
              </Text>
            </View>
            <View style={[styles.stepConnector, step >= 3 && { backgroundColor: theme.colors.brand }]} />
            <View style={[styles.stepItem, step >= 3 && styles.stepItemActive]}>
              <View style={[styles.stepCircle, step >= 3 && { backgroundColor: theme.colors.brand }]}>
                <Text style={[styles.stepNumber, step >= 3 && { color: "#000" }]}>3</Text>
              </View>
              <Text style={[styles.stepLabel, { color: step >= 3 ? theme.colors.textPrimary : "#64748B" }]}>
                Mandate
              </Text>
            </View>
          </View>

          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#F87171" />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Step 1: Profile Body */}
          {step === 1 && (
            <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                Client / Mandate Name *
              </Text>
              <TextInput
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="e.g. Vikram Singhania or Singhania Family Trust"
                placeholderTextColor="#64748B"
                style={[styles.input, { backgroundColor: theme.colors.surfaceStrong, color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
              />

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Wealth Segment</Text>
                  <View style={styles.pillRow}>
                    {(["HNI", "Family Office", "Retail", "Trader", "Long Term"] as Category[]).map((cat) => (
                      <Pressable
                        key={cat}
                        onPress={() => setCategory(cat)}
                        style={[
                          styles.pill,
                          category === cat && { backgroundColor: "rgba(224, 168, 76, 0.15)", borderColor: theme.colors.brand },
                        ]}
                      >
                        <Text style={[styles.pillText, category === cat && { color: theme.colors.brand, fontWeight: "700" }]}>
                          {cat}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                Risk Appetite / Mandate Profile
              </Text>
              <View style={styles.pillRow}>
                {["Conservative", "Moderate", "Balanced Growth", "Aggressive Growth"].map((risk) => (
                  <Pressable
                    key={risk}
                    onPress={() => setRiskProfile(risk)}
                    style={[
                      styles.pill,
                      riskProfile === risk && { backgroundColor: "rgba(224, 168, 76, 0.15)", borderColor: theme.colors.brand },
                    ]}
                  >
                    <Text style={[styles.pillText, riskProfile === risk && { color: theme.colors.brand, fontWeight: "700" }]}>
                      {risk}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={{ flexDirection: isDesktop ? "row" : "column", gap: 12, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Email Address</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="client@mandate.in"
                    placeholderTextColor="#64748B"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[styles.input, { backgroundColor: theme.colors.surfaceStrong, color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Phone / WhatsApp</Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+91 98200 12345"
                    placeholderTextColor="#64748B"
                    keyboardType="phone-pad"
                    style={[styles.input, { backgroundColor: theme.colors.surfaceStrong, color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                  />
                </View>
              </View>

              <View style={{ flexDirection: isDesktop ? "row" : "column", gap: 12, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>City / Jurisdiction</Text>
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="e.g. Mumbai, Delhi, London, Dubai"
                    placeholderTextColor="#64748B"
                    style={[styles.input, { backgroundColor: theme.colors.surfaceStrong, color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Preferred Outreach</Text>
                  <View style={styles.pillRow}>
                    {(["WhatsApp", "Email", "Phone"] as Channel[]).map((ch) => (
                      <Pressable
                        key={ch}
                        onPress={() => setPreferredChannel(ch)}
                        style={[
                          styles.pill,
                          preferredChannel === ch && { backgroundColor: "rgba(224, 168, 76, 0.15)", borderColor: theme.colors.brand },
                        ]}
                      >
                        <Text style={[styles.pillText, preferredChannel === ch && { color: theme.colors.brand, fontWeight: "700" }]}>
                          {ch}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>
          )}

          {/* Step 2: Holdings Body */}
          {step === 2 && (
            <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary, marginBottom: 12 }]}>
                Choose how you want to seed this client's initial portfolio:
              </Text>

              {/* Mode Toggle */}
              <View style={styles.segmentedRow}>
                <Pressable
                  onPress={() => setIngestionMode("paste")}
                  style={[styles.segmentBtn, ingestionMode === "paste" && styles.segmentBtnActive]}
                >
                  <Ionicons name="document-text-outline" size={14} color={ingestionMode === "paste" ? "#000" : "#94A3B8"} />
                  <Text style={[styles.segmentText, ingestionMode === "paste" && styles.segmentTextActive]}>
                    Paste Statement
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setIngestionMode("sample");
                    if (!parsedResult) handleLoadSample("zerodha");
                  }}
                  style={[styles.segmentBtn, ingestionMode === "sample" && styles.segmentBtnActive]}
                >
                  <Ionicons name="flash-outline" size={14} color={ingestionMode === "sample" ? "#000" : "#94A3B8"} />
                  <Text style={[styles.segmentText, ingestionMode === "sample" && styles.segmentTextActive]}>
                    1-Click Sample
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setIngestionMode("skip");
                    setParsedResult(null);
                    setStatementText("");
                  }}
                  style={[styles.segmentBtn, ingestionMode === "skip" && styles.segmentBtnActive]}
                >
                  <Ionicons name="arrow-forward-outline" size={14} color={ingestionMode === "skip" ? "#000" : "#94A3B8"} />
                  <Text style={[styles.segmentText, ingestionMode === "skip" && styles.segmentTextActive]}>
                    Skip for Now
                  </Text>
                </Pressable>
              </View>

              {ingestionMode === "paste" && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    Paste CSV or Tab-Separated Statement (Zerodha, CAMS CAS, Groww, ICICI Direct)
                  </Text>
                  <TextInput
                    value={statementText}
                    onChangeText={handleParseStatement}
                    placeholder="Paste CSV rows here: Symbol, Instrument, Quantity, Avg Price, LTP, Current Value..."
                    placeholderTextColor="#64748B"
                    multiline
                    numberOfLines={6}
                    style={[
                      styles.input,
                      styles.textArea,
                      { backgroundColor: theme.colors.surfaceStrong, color: theme.colors.textPrimary, borderColor: theme.colors.border },
                    ]}
                  />
                </View>
              )}

              {ingestionMode === "sample" && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Select an Institutional Demo Portfolio</Text>
                  <View style={{ flexDirection: isDesktop ? "row" : "column", gap: 10, marginTop: 4 }}>
                    <Pressable
                      onPress={() => handleLoadSample("zerodha")}
                      style={[styles.sampleCard, { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border }]}
                    >
                      <Text style={{ color: theme.colors.textPrimary, fontWeight: "700", fontSize: 13 }}>
                        🏛️ Equity + Gold BeES (Zerodha)
                      </Text>
                      <Text style={{ color: "#94A3B8", fontSize: 11, marginTop: 4 }}>
                        6 Bluechip holdings (Reliance, TCS, HDFC Bank, Infosys, Gold BeES)
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleLoadSample("camsCas")}
                      style={[styles.sampleCard, { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border }]}
                    >
                      <Text style={{ color: theme.colors.textPrimary, fontWeight: "700", fontSize: 13 }}>
                        📈 Mutual Fund CAS (CAMS/KFintech)
                      </Text>
                      <Text style={{ color: "#94A3B8", fontSize: 11, marginTop: 4 }}>
                        5 Institutional schemes (Parag Parikh, Mirae Asset, HDFC Bond, SBI)
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Parsed Summary Preview Box */}
              {parsedResult && parsedResult.success ? (
                <View style={[styles.previewBox, { backgroundColor: "rgba(16, 185, 129, 0.08)", borderColor: "rgba(16, 185, 129, 0.3)" }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={{ color: "#10B981", fontSize: 12, fontWeight: "700" }}>
                        {parsedResult.detectedBroker || "Detected Format"} Verified
                      </Text>
                    </View>
                    <Text style={{ color: "#94A3B8", fontSize: 11 }}>
                      {parsedResult.holdings.length} Positions Ingested
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <View>
                      <Text style={{ color: "#94A3B8", fontSize: 10, fontWeight: "600" }}>TOTAL PORTFOLIO VALUE</Text>
                      <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>
                        {formatWealthAmount(parsedResult.totalValue, "INR")}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ color: "#94A3B8", fontSize: 10, fontWeight: "600" }}>UNREALIZED P&L</Text>
                      <Text style={{ color: parsedResult.totalGainLoss >= 0 ? "#10B981" : "#EF4444", fontSize: 14, fontWeight: "700" }}>
                        {parsedResult.totalGainLoss >= 0 ? "+" : ""}{formatWealthAmount(parsedResult.totalGainLoss, "INR")}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {ingestionMode === "skip" && (
                <View style={[styles.previewBox, { backgroundColor: "rgba(255, 255, 255, 0.04)", borderColor: "rgba(255, 255, 255, 0.1)" }]}>
                  <Text style={{ color: "#94A3B8", fontSize: 12, textAlign: "center" }}>
                    Portfolio holdings can be imported anytime from the client view using Account Aggregator or CAS import.
                  </Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* Step 3: Mandate & Goal Body */}
          {step === 3 && (
            <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                Target Asset Allocation Model
              </Text>
              <View style={{ gap: 8, marginTop: 4 }}>
                {ALLOCATION_PRESETS.map((p) => {
                  const isSelected = selectedPreset.label === p.label;
                  return (
                    <Pressable
                      key={p.label}
                      onPress={() => setSelectedPreset(p)}
                      style={[
                        styles.presetCard,
                        { backgroundColor: theme.colors.surfaceStrong, borderColor: isSelected ? theme.colors.brand : theme.colors.border },
                        isSelected && { backgroundColor: "rgba(224, 168, 76, 0.08)" },
                      ]}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ color: isSelected ? theme.colors.brand : theme.colors.textPrimary, fontWeight: "700", fontSize: 14 }}>
                          {p.label}
                        </Text>
                        <Text style={{ color: isSelected ? theme.colors.brand : "#94A3B8", fontWeight: "800", fontSize: 12 }}>
                          {p.equity}% Eq • {p.debt}% Debt • {p.alts}% Alt
                        </Text>
                      </View>
                      <Text style={{ color: "#94A3B8", fontSize: 11, marginTop: 4 }}>{p.description}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Primary Financial Goal */}
              <View style={{ marginTop: 20 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary, marginBottom: 0 }]}>
                    Attach Primary Financial Goal
                  </Text>
                  <Pressable onPress={() => setAddGoal(!addGoal)}>
                    <Text style={{ color: theme.colors.brand, fontSize: 12, fontWeight: "700" }}>
                      {addGoal ? "Remove Goal" : "+ Add Goal"}
                    </Text>
                  </Pressable>
                </View>

                {addGoal && (
                  <View style={[styles.goalBox, { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border }]}>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Goal Objective</Text>
                    <TextInput
                      value={goalTitle}
                      onChangeText={setGoalTitle}
                      placeholder="e.g. Retirement Corpus, Offshore Education Fund"
                      placeholderTextColor="#64748B"
                      style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                    />

                    <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Target Amount (₹)</Text>
                        <TextInput
                          value={goalTargetAmount}
                          onChangeText={setGoalTargetAmount}
                          placeholder="50000000"
                          keyboardType="numeric"
                          placeholderTextColor="#64748B"
                          style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Horizon (Years)</Text>
                        <TextInput
                          value={goalYears}
                          onChangeText={setGoalYears}
                          placeholder="10"
                          keyboardType="numeric"
                          placeholderTextColor="#64748B"
                          style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          )}

          {/* Footer Navigation Actions */}
          <View style={styles.footer}>
            {step > 1 ? (
              <Pressable
                onPress={handleBack}
                style={[styles.secondaryBtn, { borderColor: theme.colors.border }]}
              >
                <Ionicons name="arrow-back" size={16} color={theme.colors.textPrimary} />
                <Text style={[styles.secondaryBtnText, { color: theme.colors.textPrimary }]}>Back</Text>
              </Pressable>
            ) : (
              <Pressable onPress={onClose} style={[styles.secondaryBtn, { borderColor: theme.colors.border }]}>
                <Text style={[styles.secondaryBtnText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </Pressable>
            )}

            {step < 3 ? (
              <Pressable
                onPress={handleNext}
                style={[styles.primaryBtn, { backgroundColor: theme.colors.brand }]}
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={16} color="#000" />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => void handleFinish()}
                style={[styles.primaryBtn, { backgroundColor: theme.colors.brand }]}
              >
                <Text style={styles.primaryBtnText}>Launch Client Desk</Text>
                <Ionicons name="checkmark-done" size={16} color="#000" />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  backdropCenter: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    padding: 20,
    width: "100%",
    maxHeight: "90%",
  },
  cardCenter: {
    borderRadius: 12,
    maxWidth: 620,
    maxHeight: 700,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 4,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    opacity: 0.5,
  },
  stepItemActive: {
    opacity: 1,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  stepConnector: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    marginHorizontal: 8,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  errorBannerText: {
    color: "#FCA5A5",
    fontSize: 12,
    flex: 1,
  },
  stepContent: {
    flexGrow: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  pillText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "500",
  },
  segmentedRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: "#E0A84C",
  },
  segmentText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: "#000",
    fontWeight: "800",
  },
  sampleCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  previewBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    marginTop: 12,
  },
  presetCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  goalBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 8,
    gap: 8,
  },
  primaryBtnText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 13,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
