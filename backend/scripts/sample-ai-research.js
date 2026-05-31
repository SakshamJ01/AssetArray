require("dotenv").config();

const endpoint = process.env.TEST_BACKEND_URL || `http://127.0.0.1:${process.env.PORT || 4000}`;
const username = process.env.ADMIN_USERNAME || "admin";
const password = process.env.ADMIN_PASSWORD;
const query = process.env.TEST_AI_QUERY || "Reliance Industries";

async function main() {
  if (!password) {
    throw new Error("ADMIN_PASSWORD is required in .env for this smoke test.");
  }

  const loginResponse = await fetch(`${endpoint}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!loginResponse.ok) {
    throw new Error(`Login failed with HTTP ${loginResponse.status}`);
  }

  const login = await loginResponse.json();
  const researchResponse = await fetch(`${endpoint}/api/ai/research`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${login.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const payload = await researchResponse.json();

  if (!researchResponse.ok) {
    throw new Error(`AI research failed with HTTP ${researchResponse.status}: ${payload.error}`);
  }

  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
