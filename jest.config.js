module.exports = {
  // Core-integrity: plain ts-jest+node for deterministic unit tests.
  // Live/production checks are excluded from default CI (see test:production).
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "uatEvidenceVerification",
    "productionTruth",
    "marketTruth",
    "workflowIntegrity",
  ],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
        },
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};
