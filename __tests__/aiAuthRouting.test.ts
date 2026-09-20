import { streamAiResponse } from "../src/services/aiStream";

/**
 * Regression guard for the authenticated AI stream path:
 * every provider request must carry the session bearer token, and a 401
 * must trigger exactly one token refresh + retry before giving up.
 */
describe("AI Streaming Authenticated Proxy", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network offline"));
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("sends the session access token and refreshes once on 401", async () => {
    let fetchCalls = 0;
    const seenAuthorization: Array<string | undefined> = [];

    global.fetch = jest.fn((_url: any, options?: RequestInit) => {
      fetchCalls += 1;
      const headers = (options?.headers || {}) as Record<string, string>;
      seenAuthorization.push(headers.Authorization);

      // First attempt always 401 to force a refresh
      if (fetchCalls === 1) {
        return Promise.resolve({ ok: false, status: 401 } as Response);
      }

      const encoder = new TextEncoder();
      const chunks = [
        `data: {"token": "Authenticated "}\n\n`,
        `data: {"token": "executive brief. "}\n\n`,
        `data: {"done": true, "model": "gemini-2.5-flash", "groundedAt": "2026-09-05T20:00:00.000Z"}\n\n`,
      ];
      let i = 0;
      return Promise.resolve({
        ok: true,
        body: {
          getReader() {
            return {
              read() {
                if (i < chunks.length) {
                  return Promise.resolve({ done: false, value: encoder.encode(chunks[i++]) });
                }
                return Promise.resolve({ done: true, value: undefined });
              },
            };
          },
        },
      } as any);
    });

    const tokens: string[] = [];
    let refreshes = 0;

    await new Promise<void>((resolve) => {
      streamAiResponse({
        query: "How healthy is the desk?",
        taskType: "briefing",
        context: { clientName: "Aurora Trust", totalAum: 5200000, healthScore: 82 },
        accessToken: "session-token-A",
        endpoint: "https://backend.example.com",
        onUnauthorized: async () => {
          refreshes += 1;
          return "session-token-B";
        },
        onToken: (t) => tokens.push(t),
        onComplete: () => resolve(),
      });
    });

    expect(fetchCalls).toBeGreaterThanOrEqual(2);
    expect(seenAuthorization[0]).toBe("Bearer session-token-A");
    expect(seenAuthorization[1]).toBe("Bearer session-token-B");
    expect(refreshes).toBe(1);
    expect(tokens.join("")).toContain("Authenticated");
  });

  it("falls back to the rule engine when no access token is supplied", async () => {
    const tokens: string[] = [];
    let stateMessage = "";

    await new Promise<void>((resolve) => {
      streamAiResponse({
        query: "Summarize the book.",
        taskType: "briefing",
        context: { clientName: "Checklist Fund", totalAum: 1200000 },
        onToken: (t) => tokens.push(t),
        onStateChange: (state, msg) => {
          if (state === "UNAVAILABLE") stateMessage = msg || "";
        },
        onComplete: () => resolve(),
      });
    });

    expect(tokens.join("")).toContain("Verified Local Advisory Summary");
    expect(stateMessage).toContain("AI unavailable");
  });
});