/**
 * AssetArray Canonical Product Terminology & Disclosures
 * 
 * Standardized copy definitions to prevent compliance, regulatory,
 * and methodology overclaims across the platform.
 */

export const PRODUCT_TERMINOLOGY = {
  // Performance Analytics
  performanceAlignment: "GIPS-aligned performance methodology",
  performanceAlignmentShort: "GIPS-Informed",
  twrLabel: "Time-Weighted Return (GIPS-Aligned Methodology)",
  twrMethodDailySubperiod: "Method: Daily Subperiod",
  twrMethodApproximation: "Method: Subperiod Approximation",
  twrMethodInsufficient: "Method: Insufficient Data",

  // Positioning & Governance
  commandCenter: "Advisor Command Center",
  commandCenterSubtitle: "Daily workflow, governance, analytics and decision support",
  governance: "Advisor Governance & Decision Support",
  governanceOs: "Advisor Governance & Decision OS",
  decisionJournal: "Advisor Decision Journal",
  decisionJournalSubtitle: "Evidence-backed advisor decision and governance record",
  dailyBrief: "Grounded Advisor Brief",
  advisorBrief: "Grounded AI Advisor Brief",
  client360Header: "Holistic Client Intelligence",
  activityTimeline: "Recent Governance & Activity Timeline",

  // Evidence & Audit
  whyThisMatters: "WHY THIS MATTERS",
  evidenceSections: {
    observedMetric: "Observed Metric",
    policyThreshold: "Policy / Threshold",
    dataConfidence: "Data Confidence",
    sourceEngine: "Source Engine",
    recommendedReview: "Recommended Review",
  },

  // Taxation
  taxImpact: "Estimated Tax Impact",
  potentialTaxEffect: "Potential Tax Effect",
  illustrativeTaxImpact: "Illustrative Tax Impact",
  potentialHarvestOpportunity: "Potential Harvest Opportunity",
  estimatedImmediateTaxEffect: "Estimated Immediate Tax Effect",
  taxRulesAlignment: "Finance Act 2024 Rules Aligned (AY 2026-27)",

  // Regulatory & Privacy
  privacy: "DPDP-aligned privacy controls",
  privacyAiSanitization: "Privacy-focused AI sanitization",
  privacyPiiMinimization: "PII minimization",
  privacyContext: "Privacy-preserving AI context",
  advisorCompliance: "Suitability-support tooling",
  complianceSupportWorkflow: "Compliance-support workflow",
  sebiAwareWorkflow: "SEBI-aware workflow",

  // Analytics Sophistication Framing
  institutionalAnalytics: "Institutional-style analytics",
  institutionalWorkflow: "Institutional workflow design",
  institutionalResearch: "Institutional research workflow",
  professionalWealthAnalytics: "Professional wealth analytics",

  // Mandatory Disclaimers
  gipsDisclaimer:
    "AssetArray provides performance analytics using methodologies informed by the Global Investment Performance Standards (GIPS®). AssetArray is not itself claiming GIPS compliance, certification, or verification. Firms using AssetArray remain responsible for their own policies, data, calculations, disclosures, and applicable GIPS requirements.",

  taxDisclaimer:
    "Tax calculations provided by AssetArray are non-binding estimates based on the provisions of the Indian Income Tax Act, 1961 (as amended by Finance Act 2024 / FY 2025-26, AY 2026-27). They do not constitute statutory tax advice or formal audit certifications. Advisors and investors should consult a certified tax professional or Chartered Accountant prior to execution.",

  governanceDisclaimer:
    "AssetArray provides portfolio analytics, risk intelligence, tax estimation, and advisor decision-support workflows. AssetArray does not provide automated fiduciary advice, return guarantees, or legal compliance certifications. Regulatory, statutory, and fiduciary obligations remain the sole responsibility of the advisor and their registered entity.",

  aiSupportDisclaimer:
    "AI-assisted insights are generated to support advisor analysis. They explain deterministic analytical models and do not represent automated investment recommendations or regulatory determinations.",
} as const;
