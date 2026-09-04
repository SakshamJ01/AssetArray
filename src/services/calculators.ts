export type CashFlowFrequency = "Monthly" | "Quarterly" | "Yearly";
export type CashFlowMode = "Payout" | "Cumulative";
export type SipFrequency = "Monthly" | "Quarterly";

export interface CashFlowInput {
  principal: number;
  annualRate: number;
  years: number;
  frequency: CashFlowFrequency;
  mode: CashFlowMode;
}

export interface CashFlowResult {
  ready: boolean;
  payoutPerPeriod: number;
  totalInterest: number;
  maturityValue: number;
  annualInterest: number;
  periods: number;
}

export function calculateCashFlow({
  principal,
  annualRate,
  years,
  frequency,
  mode,
}: CashFlowInput): CashFlowResult {
  if (!principal || !annualRate || !years || principal <= 0 || annualRate <= 0 || years <= 0) {
    return {
      ready: false,
      payoutPerPeriod: 0,
      totalInterest: 0,
      maturityValue: 0,
      annualInterest: 0,
      periods: 0,
    };
  }

  const periodsPerYear = frequency === "Monthly" ? 12 : frequency === "Quarterly" ? 4 : 1;
  const periods = periodsPerYear * years;
  const annualInterest = principal * (annualRate / 100);

  if (mode === "Payout") {
    const payoutPerPeriod = annualInterest / periodsPerYear;
    const totalInterest = annualInterest * years;
    return {
      ready: true,
      payoutPerPeriod,
      totalInterest,
      maturityValue: principal,
      annualInterest,
      periods,
    };
  }

  const periodRate = annualRate / 100 / periodsPerYear;
  const maturityValue = principal * Math.pow(1 + periodRate, periods);
  const totalInterest = maturityValue - principal;
  const payoutPerPeriod = totalInterest / periods;

  return {
    ready: true,
    payoutPerPeriod,
    totalInterest,
    maturityValue,
    annualInterest,
    periods,
  };
}

export interface SipInput {
  installment: number;
  annualRate: number;
  years: number;
  frequency: SipFrequency;
}

export interface SipResult {
  ready: boolean;
  totalInvested: number;
  estimatedReturns: number;
  maturityValue: number;
  installments: number;
}

export function calculateSip({
  installment,
  annualRate,
  years,
  frequency,
}: SipInput): SipResult {
  if (!installment || !annualRate || !years || installment <= 0 || annualRate <= 0 || years <= 0) {
    return {
      ready: false,
      totalInvested: 0,
      estimatedReturns: 0,
      maturityValue: 0,
      installments: 0,
    };
  }

  const periodsPerYear = frequency === "Monthly" ? 12 : 4;
  const installments = periodsPerYear * years;
  const ratePerPeriod = annualRate / 100 / periodsPerYear;
  const totalInvested = installment * installments;

  const maturityValue =
    ratePerPeriod === 0
      ? totalInvested
      : installment *
        (((Math.pow(1 + ratePerPeriod, installments) - 1) / ratePerPeriod) * (1 + ratePerPeriod));

  const estimatedReturns = maturityValue - totalInvested;

  return {
    ready: true,
    totalInvested,
    estimatedReturns,
    maturityValue,
    installments,
  };
}

export interface GoalPlannerInput {
  targetAmount: number;
  expectedReturn: number;
  years: number;
}

export interface GoalPlannerResult {
  ready: boolean;
  requiredMonthlySip: number;
  totalInvested: number;
  estimatedGrowth: number;
}

export function calculateGoalPlanner({
  targetAmount,
  expectedReturn,
  years,
}: GoalPlannerInput): GoalPlannerResult {
  if (!targetAmount || !expectedReturn || !years || targetAmount <= 0 || expectedReturn <= 0 || years <= 0) {
    return {
      ready: false,
      requiredMonthlySip: 0,
      totalInvested: 0,
      estimatedGrowth: 0,
    };
  }

  const periods = years * 12;
  const monthlyRate = expectedReturn / 100 / 12;
  const requiredMonthlySip =
    monthlyRate === 0
      ? targetAmount / periods
      : targetAmount / (((Math.pow(1 + monthlyRate, periods) - 1) / monthlyRate) * (1 + monthlyRate));
  const totalInvested = requiredMonthlySip * periods;

  return {
    ready: true,
    requiredMonthlySip,
    totalInvested,
    estimatedGrowth: targetAmount - totalInvested,
  };
}

export interface RetirementInput {
  monthlyExpense: number;
  inflation: number;
  returnRate: number;
  yearsToRetire: number;
  retirementYears: number;
}

export interface RetirementResult {
  ready: boolean;
  futureMonthlyExpense: number;
  targetCorpus: number;
  requiredMonthlySip: number;
}

export function calculateRetirement({
  monthlyExpense,
  inflation,
  returnRate,
  yearsToRetire,
  retirementYears,
}: RetirementInput): RetirementResult {
  if (
    !monthlyExpense ||
    !inflation ||
    !returnRate ||
    !yearsToRetire ||
    !retirementYears ||
    monthlyExpense <= 0 ||
    yearsToRetire <= 0 ||
    retirementYears <= 0
  ) {
    return {
      ready: false,
      futureMonthlyExpense: 0,
      targetCorpus: 0,
      requiredMonthlySip: 0,
    };
  }

  const futureMonthlyExpense = monthlyExpense * Math.pow(1 + inflation / 100, yearsToRetire);
  const annualExpenseAtRetirement = futureMonthlyExpense * 12;
  const realReturn = (1 + returnRate / 100) / (1 + inflation / 100) - 1;
  const targetCorpus =
    realReturn > 0
      ? annualExpenseAtRetirement * ((1 - Math.pow(1 + realReturn, -retirementYears)) / realReturn)
      : annualExpenseAtRetirement * retirementYears;
  const monthlyRate = returnRate / 100 / 12;
  const periods = yearsToRetire * 12;
  const requiredMonthlySip =
    monthlyRate === 0
      ? targetCorpus / periods
      : targetCorpus / (((Math.pow(1 + monthlyRate, periods) - 1) / monthlyRate) * (1 + monthlyRate));

  return {
    ready: true,
    futureMonthlyExpense,
    targetCorpus,
    requiredMonthlySip,
  };
}
