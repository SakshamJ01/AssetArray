import { CashFlow, MWRResult } from "./types";

export const MWR_METHODOLOGY_VERSION = "xirr-newton-raphson-v1.1";

/**
 * Calculates Money-Weighted Return (MWR) / XIRR from a dated series of cash flows and ending portfolio valuation.
 * Solves: \sum_{k=0}^N \frac{CF_k}{(1 + r)^{(t_k - t_0)/365}} = 0
 * Uses Newton-Raphson with bounded step size and bisection fallback.
 */
export function calculateXIRR(
  cashFlows: CashFlow[],
  endingValue: number,
  asOfDate: string,
  methodologyVersion = MWR_METHODOLOGY_VERSION
): MWRResult {
  const warnings: string[] = [];

  // Filter and format all cash flows
  // Inflows (deposits) are negative for IRR (money invested out of pocket)
  // Outflows (withdrawals) and ending value are positive (cash returned to investor)
  const allEvents: { date: Date; amount: number }[] = [];

  let totalInflows = 0;
  let totalOutflows = 0;

  cashFlows.forEach((cf) => {
    const amt = Number(cf.amount) || 0;
    if (amt === 0) return;

    if (amt > 0) {
      // Deposit / Inflow into portfolio
      totalInflows += amt;
      allEvents.push({ date: new Date(cf.date), amount: -amt });
    } else {
      // Withdrawal / Outflow from portfolio
      const absAmt = Math.abs(amt);
      totalOutflows += absAmt;
      allEvents.push({ date: new Date(cf.date), amount: absAmt });
    }
  });

  if (endingValue > 0) {
    allEvents.push({ date: new Date(asOfDate), amount: endingValue });
  }

  // Sort chronologically
  allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  if (allEvents.length < 2 || totalInflows <= 0) {
    return {
      xirr: null,
      annualizedPercent: null,
      totalInflows,
      totalOutflows,
      netInvested: totalInflows - totalOutflows,
      endingValue,
      iterations: 0,
      converged: false,
      quality: "INSUFFICIENT_DATA",
      methodologyVersion,
      warnings: ["At least one initial cash inflow and an ending valuation are required for XIRR."],
    };
  }

  const t0 = allEvents[0].date.getTime();

  // Net Present Value function
  const npv = (r: number): number => {
    let sum = 0;
    for (const ev of allEvents) {
      const years = (ev.date.getTime() - t0) / (1000 * 60 * 60 * 24 * 365.25);
      sum += ev.amount / Math.pow(1 + r, years);
    }
    return sum;
  };

  // Derivative of NPV with respect to r
  const dnpv = (r: number): number => {
    let sum = 0;
    for (const ev of allEvents) {
      const years = (ev.date.getTime() - t0) / (1000 * 60 * 60 * 24 * 365.25);
      sum += (-years * ev.amount) / Math.pow(1 + r, years + 1);
    }
    return sum;
  };

  // Newton-Raphson Solver
  let rate = 0.1; // initial guess 10%
  const maxIterations = 100;
  const tolerance = 1e-7;
  let converged = false;
  let iter = 0;

  for (iter = 0; iter < maxIterations; iter++) {
    const fValue = npv(rate);
    if (Math.abs(fValue) < tolerance) {
      converged = true;
      break;
    }

    const fPrime = dnpv(rate);
    if (Math.abs(fPrime) < 1e-12) {
      // Derivative too flat; nudge rate
      rate += 0.05;
      continue;
    }

    const nextRate = rate - fValue / fPrime;

    // Dampen large jumps to prevent divergence
    if (nextRate <= -0.99) {
      rate = (rate - 0.99) / 2;
    } else {
      rate = nextRate;
    }
  }

  // Fallback Bisection Search if Newton-Raphson failed to converge
  if (!converged) {
    let low = -0.99;
    let high = 10.0;
    for (let b = 0; b < 100; b++) {
      const mid = (low + high) / 2;
      const fMid = npv(mid);
      if (Math.abs(fMid) < tolerance) {
        rate = mid;
        converged = true;
        iter += b;
        break;
      }
      if (npv(low) * fMid < 0) {
        high = mid;
      } else {
        low = mid;
      }
    }
  }

  if (!converged || isNaN(rate) || !isFinite(rate)) {
    return {
      xirr: null,
      annualizedPercent: null,
      totalInflows,
      totalOutflows,
      netInvested: totalInflows - totalOutflows,
      endingValue,
      iterations: iter,
      converged: false,
      quality: "LOW",
      methodologyVersion,
      warnings: ["XIRR could not converge within numerical tolerances."],
    };
  }

  const cleanRate = parseFloat(rate.toFixed(6));
  const annualizedPercent = parseFloat((rate * 100).toFixed(2));

  return {
    xirr: cleanRate,
    annualizedPercent,
    totalInflows,
    totalOutflows,
    netInvested: totalInflows - totalOutflows,
    endingValue,
    iterations: iter,
    converged: true,
    quality: "HIGH",
    methodologyVersion,
    warnings,
  };
}
