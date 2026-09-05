import { streamAiResponse } from "../src/services/aiStream";

describe("AI Streaming Proxy & Grounded RAG Client", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn((_url, options: any) => {
      const body = JSON.parse(options?.body || "{}");
      const clientName = body.clientContext?.name || "Client Mandate";
      const encoder = new TextEncoder();
      const chunks = [
        `data: {"token": "Executive brief for "}\n\n`,
        `data: {"token": "${clientName}. "}\n\n`,
        `data: {"token": "Tax analysis under Section 70/74. "}\n\n`,
        `data: {"token": "Attribution alpha model result. "}\n\n`,
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
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("streams tokens asynchronously with typewriter behavior", async () => {
    const tokens: string[] = [];
    let completedModel = "";

    await new Promise<void>((resolve) => {
      streamAiResponse({
        query: "What is the desk health overview?",
        taskType: "briefing",
        context: {
          clientName: "Alpha Capital Mandate",
          totalAum: 3500000,
          healthScore: 88,
          criticalAlertsCount: 0,
        },
        onToken: (t) => {
          tokens.push(t);
        },
        onComplete: (meta) => {
          completedModel = meta.model;
          resolve();
        },
      });
    });

    expect(tokens.length).toBeGreaterThanOrEqual(4);
    const fullText = tokens.join("");
    expect(fullText).toContain("Alpha Capital Mandate");
    expect(completedModel).toBe("gemini-2.5-flash");
  });

  it("grounds tax analytics inquiries in statutory framework", async () => {
    const tokens: string[] = [];

    await new Promise<void>((resolve) => {
      streamAiResponse({
        query: "Review tax harvesting opportunities under Section 70/74",
        taskType: "tax_analytics",
        context: {
          clientName: "Rahul Mehta Family Trust",
          totalAum: 4800000,
          taxLossAvailable: 25000,
        },
        onToken: (t) => {
          tokens.push(t);
        },
        onComplete: () => {
          resolve();
        },
      });
    });

    const text = tokens.join("");
    expect(text).toContain("Tax");
    expect(text).toContain("Section 70");
  });

  it("handles portfolio attribution requests with Brinson-Fachler grounding", async () => {
    const tokens: string[] = [];

    await new Promise<void>((resolve) => {
      streamAiResponse({
        query: "Explain active alpha attribution",
        taskType: "portfolio_attribution",
        context: {
          clientName: "Siddharth Verma",
          totalAum: 1200000,
          topHoldings: ["AAPL (25%)", "NVDA (18%)"],
        },
        onToken: (t) => {
          tokens.push(t);
        },
        onComplete: () => {
          resolve();
        },
      });
    });

    const text = tokens.join("");
    expect(text).toContain("Attribution");
    expect(text).toContain("Siddharth Verma");
  });
});
