import {
  BroadcastChannel,
  Client,
  ClientDraft,
  HoldingDraft,
  PortfolioHolding,
} from "../types/wealth";

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(date = new Date()) {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatReminderDate(value: string) {
  if (!value) {
    return "Not scheduled";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function isReminderDue(value: string) {
  return Boolean(value) && value <= todayISO();
}

export function numericValue(raw: string) {
  const cleaned = (raw || "").replace(/,/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function currencyDisplay(raw: string) {
  const value = numericValue(raw);
  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

export function compactText(text: string, fallback: string) {
  const cleaned = (text || "").trim().replace(/\s+/g, " ");
  return cleaned || fallback;
}

export function parseStoredJson<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function personalizedClientMessage(client: Client, marketNote: string) {
  return `Hello ${client.name}, based on your ${client.riskProfile || "current"} profile and ${client.category} segment, ${marketNote}`;
}

export function resolveBroadcastContact(client: Client, channel: BroadcastChannel) {
  if (channel === "Email") {
    return client.email.trim();
  }
  if (channel === "SMS" || channel === "WhatsApp") {
    return client.phone.trim();
  }
  if (client.preferredChannel === "Email") {
    return client.email.trim();
  }
  if (client.preferredChannel === "SMS" || client.preferredChannel === "WhatsApp") {
    return client.phone.trim();
  }
  return client.phone.trim() || client.email.trim();
}

export function clientInsightList(client: Client): string[] {
  const insights: string[] = [];
  const holdingCount = client.portfolio.length;
  const totalCurrent = client.portfolio.reduce(
    (sum, item) => sum + numericValue(item.currentValue),
    0
  );
  const biggestHolding = [...client.portfolio].sort(
    (a, b) => numericValue(b.currentValue) - numericValue(a.currentValue)
  )[0];

  if (holdingCount === 0) {
    insights.push("Portfolio data missing. Add holdings to unlock portfolio review insights.");
  } else {
    insights.push(
      `Current portfolio tracks ${holdingCount} holding${holdingCount === 1 ? "" : "s"} worth about ${currencyDisplay(`${totalCurrent}`)}.`
    );
  }
  if (biggestHolding && totalCurrent > 0) {
    const concentration = (numericValue(biggestHolding.currentValue) / totalCurrent) * 100;
    insights.push(
      `${biggestHolding.assetName} is the largest exposure at roughly ${concentration.toFixed(1)}% of tracked current value.`
    );
  }
  if (!client.reminderDate) {
    insights.push("No follow-up reminder is scheduled yet.");
  } else if (isReminderDue(client.reminderDate)) {
    insights.push("Follow-up is due now and should be prioritised.");
  }
  if (!client.notes.trim()) {
    insights.push("Private note section is still empty, so meeting context may be incomplete.");
  }
  return insights;
}

export function buildClientFromDraft(draft: ClientDraft, existing?: Client): Client {
  return {
    id: existing?.id ?? `${Date.now()}`,
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    email: draft.email.trim(),
    category: draft.category,
    riskProfile: draft.riskProfile.trim(),
    preferredChannel: draft.preferredChannel,
    watchlist: draft.watchlist
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    notes: draft.notes.trim(),
    city: draft.city.trim(),
    allocation: draft.allocation.trim(),
    reminderDate: draft.reminderDate,
    priority: draft.priority,
    avatarUrl: draft.avatarUrl?.trim() || existing?.avatarUrl || "",
    lastContact: existing?.lastContact ?? "Not contacted yet",
    updateHistory: existing?.updateHistory ?? [],
    portfolio: existing?.portfolio ?? [],
  };
}

export function buildDraftFromClient(client: Client): ClientDraft {
  return {
    name: client.name,
    phone: client.phone,
    email: client.email,
    category: client.category,
    riskProfile: client.riskProfile,
    preferredChannel: client.preferredChannel,
    watchlist: client.watchlist.join(", "),
    notes: client.notes,
    city: client.city,
    allocation: client.allocation,
    reminderDate: client.reminderDate,
    priority: client.priority,
    avatarUrl: client.avatarUrl || "",
  };
}

export function buildHoldingFromDraft(
  draft: HoldingDraft,
  existing?: PortfolioHolding
): PortfolioHolding {
  return {
    id: existing?.id ?? `${Date.now()}`,
    assetName: draft.assetName.trim(),
    assetClass: draft.assetClass,
    ticker: draft.ticker.trim(),
    quantity: draft.quantity.trim(),
    investedValue: draft.investedValue.trim(),
    currentValue: draft.currentValue.trim(),
    targetWeight: draft.targetWeight.trim(),
    notes: draft.notes.trim(),
  };
}

export function buildHoldingDraftFromHolding(holding: PortfolioHolding): HoldingDraft {
  return {
    assetName: holding.assetName,
    assetClass: holding.assetClass ?? "Stocks",
    ticker: holding.ticker,
    quantity: holding.quantity,
    investedValue: holding.investedValue,
    currentValue: holding.currentValue,
    targetWeight: holding.targetWeight,
    notes: holding.notes,
  };
}
