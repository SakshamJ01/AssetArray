import CryptoJS from "crypto-js";

type PushOptions = {
  endpoint: string;
  ownerId: string;
  ciphertext: string;
  accessToken?: string | null;
  onUnauthorized?: () => Promise<string | null>;
};

type PullOptions = {
  endpoint: string;
  ownerId: string;
  accessToken?: string | null;
  onUnauthorized?: () => Promise<string | null>;
};

type BroadcastClient = {
  id: string;
  name: string;
  phone: string;
  email: string;
  preferredChannel: string;
};

type BroadcastOptions = {
  endpoint: string;
  ownerName: string;
  channel: string;
  message: string;
  clients: BroadcastClient[];
  accessToken?: string | null;
  onUnauthorized?: () => Promise<string | null>;
};

export type AiResearchResult = {
  summary: string;
  opportunities: string[];
  risks: string[];
  sentiment: "Bullish" | "Neutral" | "Bearish";
  shortTermOutlook: string;
  longTermOutlook: string;
};

type AiResearchOptions = {
  endpoint: string;
  query: string;
  accessToken?: string | null;
  onUnauthorized?: () => Promise<string | null>;
};

export type AuthUser = {
  id: string;
  username: string;
  role: string;
  createdAt?: string;
  active?: boolean;
};

type LoginOptions = {
  endpoint: string;
  username: string;
  password: string;
};

type RefreshOptions = {
  endpoint: string;
  refreshToken: string;
};

type TokenOptions = {
  endpoint: string;
  accessToken: string;
};

type LogoutOptions = {
  endpoint: string;
  accessToken: string;
  refreshToken: string;
};

function normalizeEndpoint(endpoint: string) {
  return endpoint.trim().replace(/\/+$/, "");
}

async function authorizedFetch(
  url: string,
  init: RequestInit,
  accessToken?: string | null,
  onUnauthorized?: () => Promise<string | null>
) {
  const firstHeaders = new Headers(init.headers);
  if (accessToken) {
    firstHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  let response = await fetch(url, { ...init, headers: firstHeaders });

  if (response.status === 401 && onUnauthorized) {
    const nextToken = await onUnauthorized();
    if (nextToken) {
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set("Authorization", `Bearer ${nextToken}`);
      response = await fetch(url, { ...init, headers: retryHeaders });
    }
  }

  return response;
}

export function buildOwnerId(pin: string) {
  return CryptoJS.SHA256(pin).toString().slice(0, 24);
}

export function encryptPayload(payload: unknown, pin: string) {
  return CryptoJS.AES.encrypt(JSON.stringify(payload), pin).toString();
}

export function decryptPayload<T>(ciphertext: string, pin: string): T {
  const bytes = CryptoJS.AES.decrypt(ciphertext, pin);
  const raw = bytes.toString(CryptoJS.enc.Utf8);

  if (!raw) {
    throw new Error("Unable to decrypt backup. Check your PIN and cloud data.");
  }

  return JSON.parse(raw) as T;
}

export async function pushPayload({
  endpoint,
  ownerId,
  ciphertext,
  accessToken,
  onUnauthorized,
}: PushOptions) {
  const response = await authorizedFetch(
    `${normalizeEndpoint(endpoint)}/api/sync`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ownerId,
        ciphertext,
        updatedAt: new Date().toISOString(),
      }),
    },
    accessToken,
    onUnauthorized
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Session expired. Please login again.");
    }
    throw new Error("Cloud backup request was rejected by the server.");
  }

  return response.json();
}

export async function pullPayload({
  endpoint,
  ownerId,
  accessToken,
  onUnauthorized,
}: PullOptions) {
  const response = await authorizedFetch(
    `${normalizeEndpoint(endpoint)}/api/sync/${ownerId}`,
    { method: "GET" },
    accessToken,
    onUnauthorized
  );

  if (response.status === 404) {
    throw new Error("No encrypted backup was found for this owner.");
  }

  if (response.status === 401) {
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    throw new Error("Cloud restore request failed.");
  }

  return response.json() as Promise<{ ciphertext: string; updatedAt: string }>;
}

export async function sendBroadcastCampaign({
  endpoint,
  ownerName,
  channel,
  message,
  clients,
  accessToken,
  onUnauthorized,
}: BroadcastOptions) {
  const response = await authorizedFetch(
    `${normalizeEndpoint(endpoint)}/api/broadcast`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ownerName,
        channel,
        message,
        clients,
        createdAt: new Date().toISOString(),
      }),
    },
    accessToken,
    onUnauthorized
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Session expired. Please login again.");
    }
    throw new Error("Bulk notification campaign failed on the server.");
  }

  return response.json() as Promise<{
    ok: true;
    totalClients: number;
    campaignId: string;
    status: string;
  }>;
}

export async function requestAiResearch({
  endpoint,
  query,
  accessToken,
  onUnauthorized,
}: AiResearchOptions) {
  const response = await authorizedFetch(
    `${normalizeEndpoint(endpoint)}/api/ai/research`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
    accessToken,
    onUnauthorized
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Session expired. Please login again.");
    }
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || "AI research request failed.");
  }

  return response.json() as Promise<AiResearchResult>;
}

export async function loginAdvisor({ endpoint, username, password }: LoginOptions) {
  try {
    const url = `${normalizeEndpoint(endpoint)}/api/auth/login`;

    alert(`Trying: ${url}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    alert(`Status: ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      alert(`Server Error: ${text}`);
      throw new Error(text);
    }

    return response.json() as Promise<{
      ok: true;
      user: AuthUser;
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }>;
  } catch (error: any) {
    alert(`ERROR: ${error?.message || JSON.stringify(error)}`);
    throw error;
  }
}

export async function refreshAdvisorToken({ endpoint, refreshToken }: RefreshOptions) {
  const response = await fetch(`${normalizeEndpoint(endpoint)}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error("Session refresh failed. Please login again.");
  }

  return response.json() as Promise<{
    ok: true;
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }>;
}

export async function getAdvisorProfile({ endpoint, accessToken }: TokenOptions) {
  const response = await fetch(`${normalizeEndpoint(endpoint)}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to verify session.");
  }

  return response.json() as Promise<{
    ok: true;
    user: AuthUser;
  }>;
}

export async function logoutAdvisor({ endpoint, accessToken, refreshToken }: LogoutOptions) {
  const response = await fetch(`${normalizeEndpoint(endpoint)}/api/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error("Logout failed on the server.");
  }

  return response.json() as Promise<{ ok: true }>;
}
