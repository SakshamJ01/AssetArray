import { useState, useMemo } from "react";
import {
  CalculatorTab,
  CashFlowFrequency,
  CashFlowMode,
  SipFrequency,
} from "../types/wealth";
import { numericValue } from "../services/wealthHelpers";

export function useCalculators() {
  const [activeCalculator, setActiveCalculator] = useState<CalculatorTab>("Cash Flow");

  // Cash flow calculator
  const [cashFlowAmount, setCashFlowAmount] = useState("");
  const [cashFlowRate, setCashFlowRate] = useState("");
  const [cashFlowYears, setCashFlowYears] = useState("1");
  const [cashFlowFrequency, setCashFlowFrequency] = useState<CashFlowFrequency>("Monthly");
  const [cashFlowMode, setCashFlowMode] = useState<CashFlowMode>("Payout");

  // SIP calculator
  const [sipAmount, setSipAmount] = useState("");
  const [sipRate, setSipRate] = useState("");
  const [sipYears, setSipYears] = useState("5");
  const [sipFrequency, setSipFrequency] = useState<SipFrequency>("Monthly");

  // Goal planner
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalExpectedReturn, setGoalExpectedReturn] = useState("");
  const [goalYears, setGoalYears] = useState("5");

  // Retirement planner
  const [retirementMonthlyExpense, setRetirementMonthlyExpense] = useState("");
  const [retirementInflation, setRetirementInflation] = useState("6");
  const [retirementReturn, setRetirementReturn] = useState("12");
  const [retirementYearsToRetire, setRetirementYearsToRetire] = useState("15");
  const [retirementYearsAfterRetire, setRetirementYearsAfterRetire] = useState("25");

  const cashFlowResults = useMemo(() => {
    const principal = numericValue(cashFlowAmount);
    const annualRate = numericValue(cashFlowRate);
    const years = numericValue(cashFlowYears);

    if (!principal || !annualRate || !years) {
      return {
        ready: false,
        payoutPerPeriod: 0,
        totalInterest: 0,
        maturityValue: 0,
        annualInterest: 0,
        periods: 0,
      };
    }

    const periodsPerYear =
      cashFlowFrequency === "Monthly"
        ? 12
        : cashFlowFrequency === "Quarterly"
        ? 4
        : 1;
    const periods = periodsPerYear * years;
    const annualInterest = (principal * annualRate) / 100;

    if (cashFlowMode === "Payout") {
      const payoutPerPeriod = annualInterest / periodsPerYear;
      const totalInterest = payoutPerPeriod * periods;
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
  }, [
    cashFlowAmount,
    cashFlowFrequency,
    cashFlowMode,
    cashFlowRate,
    cashFlowYears,
  ]);

  const sipResults = useMemo(() => {
    const installment = numericValue(sipAmount);
    const annualRate = numericValue(sipRate);
    const years = numericValue(sipYears);

    if (!installment || !annualRate || !years) {
      return {
        ready: false,
        totalInvested: 0,
        estimatedReturns: 0,
        maturityValue: 0,
        installments: 0,
      };
    }

    const periodsPerYear = sipFrequency === "Monthly" ? 12 : 4;
    const installments = periodsPerYear * years;
    const ratePerPeriod = annualRate / 100 / periodsPerYear;
    const totalInvested = installment * installments;

    const maturityValue =
      ratePerPeriod === 0
        ? totalInvested
        : installment *
          (((Math.pow(1 + ratePerPeriod, installments) - 1) / ratePerPeriod) *
            (1 + ratePerPeriod));

    const estimatedReturns = maturityValue - totalInvested;

    return {
      ready: true,
      totalInvested,
      estimatedReturns,
      maturityValue,
      installments,
    };
  }, [sipAmount, sipFrequency, sipRate, sipYears]);

  const goalPlannerResults = useMemo(() => {
    const targetAmount = numericValue(goalTargetAmount);
    const annualRate = numericValue(goalExpectedReturn);
    const years = numericValue(goalYears);

    if (!targetAmount || !annualRate || !years) {
      return {
        ready: false,
        requiredMonthlySip: 0,
        totalInvested: 0,
        estimatedGrowth: 0,
      };
    }

    const periods = years * 12;
    const monthlyRate = annualRate / 100 / 12;
    const requiredMonthlySip =
      monthlyRate === 0
        ? targetAmount / periods
        : targetAmount /
          (((Math.pow(1 + monthlyRate, periods) - 1) / monthlyRate) *
            (1 + monthlyRate));
    const totalInvested = requiredMonthlySip * periods;

    return {
      ready: true,
      requiredMonthlySip,
      totalInvested,
      estimatedGrowth: targetAmount - totalInvested,
    };
  }, [goalExpectedReturn, goalTargetAmount, goalYears]);

  const retirementResults = useMemo(() => {
    const monthlyExpense = numericValue(retirementMonthlyExpense);
    const inflation = numericValue(retirementInflation);
    const returnRate = numericValue(retirementReturn);
    const yearsToRetire = numericValue(retirementYearsToRetire);
    const retirementYears = numericValue(retirementYearsAfterRetire);

    if (
      !monthlyExpense ||
      !inflation ||
      !returnRate ||
      !yearsToRetire ||
      !retirementYears
    ) {
      return {
        ready: false,
        futureMonthlyExpense: 0,
        targetCorpus: 0,
        requiredMonthlySip: 0,
      };
    }

    const futureMonthlyExpense =
      monthlyExpense * Math.pow(1 + inflation / 100, yearsToRetire);
    const annualExpenseAtRetirement = futureMonthlyExpense * 12;
    const realReturn = (1 + returnRate / 100) / (1 + inflation / 100) - 1;
    const targetCorpus =
      realReturn > 0
        ? annualExpenseAtRetirement *
          ((1 - Math.pow(1 + realReturn, -retirementYears)) / realReturn)
        : annualExpenseAtRetirement * retirementYears;
    const monthlyRate = returnRate / 100 / 12;
    const periods = yearsToRetire * 12;
    const requiredMonthlySip =
      monthlyRate === 0
        ? targetCorpus / periods
        : targetCorpus /
          (((Math.pow(1 + monthlyRate, periods) - 1) / monthlyRate) *
            (1 + monthlyRate));

    return {
      ready: true,
      futureMonthlyExpense,
      targetCorpus,
      requiredMonthlySip,
    };
  }, [
    retirementInflation,
    retirementMonthlyExpense,
    retirementReturn,
    retirementYearsAfterRetire,
    retirementYearsToRetire,
  ]);

  return {
    activeCalculator,
    setActiveCalculator,
    // Cash Flow
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
    // SIP
    sipAmount,
    setSipAmount,
    sipRate,
    setSipRate,
    sipYears,
    setSipYears,
    sipFrequency,
    setSipFrequency,
    sipResults,
    // Goal
    goalTargetAmount,
    setGoalTargetAmount,
    goalExpectedReturn,
    setGoalExpectedReturn,
    goalYears,
    setGoalYears,
    goalPlannerResults,
    // Retirement
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
  };
}
