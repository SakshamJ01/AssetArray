async function testBroadcast() {
  try {
    console.log("1. Logging in as admin...");
    const loginRes = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "admin",
        password: "AssetArrayLocalAdmin2026",
      }),
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    console.log("Logged in successfully! Token acquired.");

    const token = loginData.accessToken;

    console.log("\n2. Sending test bulk notification campaign...");
    const campaignPayload = {
      ownerName: "Sophia Chen (Private Wealth)",
      channel: "Preferred",
      message: "Q3 Asset Allocation Rebalancing Briefing is ready for your review.",
      clients: [
        {
          id: "client-1",
          name: "Marcus Vance",
          phone: "+1 (555) 019-2834",
          email: "marcus@vancecap.com",
          preferredChannel: "WhatsApp",
        },
        {
          id: "client-2",
          name: "Sophia Chen",
          phone: "+1 (555) 018-9281",
          email: "sophia.chen@apexholdings.sg",
          preferredChannel: "Email",
        },
        {
          id: "client-3",
          name: "Elena Rostova",
          phone: "+44 20 7946 0912",
          email: "elena@rostovafamily.ch",
          preferredChannel: "SMS",
        },
      ],
      createdAt: new Date().toISOString(),
    };

    const broadcastRes = await fetch("http://localhost:4000/api/broadcast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(campaignPayload),
    });

    const broadcastData = await broadcastRes.json();
    if (!broadcastRes.ok) {
      throw new Error(`Broadcast failed: ${JSON.stringify(broadcastData)}`);
    }
    console.log("Broadcast Campaign Result:", JSON.stringify(broadcastData, null, 2));

    console.log("\n3. Fetching broadcast campaign history...");
    const historyRes = await fetch("http://localhost:4000/api/broadcast/history?limit=5", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const historyData = await historyRes.json();
    if (!historyRes.ok) {
      throw new Error(`History fetch failed: ${JSON.stringify(historyData)}`);
    }
    const campaigns = historyData.campaigns || [];
    console.log(`Retrieved ${campaigns.length} campaign(s) from history.`);
    console.log("Latest campaign in history:", JSON.stringify(campaigns[0], null, 2));

    console.log("\n>>> BULK NOTIFICATION CAMPAIGN IS FULLY OPERATIONAL! <<<");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

testBroadcast();
