import * as fs from "fs";
import * as path from "path";
import { PRODUCT_TERMINOLOGY } from "../src/constants/productCopy";

describe("AssetArray V3.3.1 Claims, Governance & Terminology Regression Tests", () => {
  describe("Canonical Product Terminology Constants", () => {
    it("defines canonical terminology matching V3.3.1 standards", () => {
      expect(PRODUCT_TERMINOLOGY.performanceAlignment).toBe("GIPS-aligned performance methodology");
      expect(PRODUCT_TERMINOLOGY.commandCenter).toBe("Advisor Command Center");
      expect(PRODUCT_TERMINOLOGY.governance).toBe("Advisor Governance & Decision Support");
      expect(PRODUCT_TERMINOLOGY.taxImpact).toBe("Estimated Tax Impact");
      expect(PRODUCT_TERMINOLOGY.privacy).toBe("DPDP-aligned privacy controls");
      expect(PRODUCT_TERMINOLOGY.advisorCompliance).toBe("Suitability-support tooling");
      expect(PRODUCT_TERMINOLOGY.decisionJournal).toBe("Advisor Decision Journal");
      expect(PRODUCT_TERMINOLOGY.advisorBrief).toBe("Grounded AI Advisor Brief");
      expect(PRODUCT_TERMINOLOGY.gipsDisclaimer).toContain("Global Investment Performance Standards (GIPS®)");
      expect(PRODUCT_TERMINOLOGY.gipsDisclaimer).toContain("AssetArray is not itself claiming GIPS compliance, certification, or verification");
    });
  });

  describe("Prohibited Claims in Active Product Source Code", () => {
    const PROHIBITED_PHRASES: { pattern: RegExp; description: string }[] = [
      { pattern: /GIPS-compliant/i, description: "GIPS-compliant" },
      { pattern: /GIPS compliant/i, description: "GIPS compliant" },
      { pattern: /GIPS-certified/i, description: "GIPS-certified" },
      { pattern: /GIPS certified/i, description: "GIPS certified" },
      { pattern: /Fiduciary OS/i, description: "Fiduciary OS" },
      { pattern: /Fiduciary Operating System/i, description: "Fiduciary Operating System" },
      { pattern: /Fiduciary compliance/i, description: "Fiduciary compliance" },
      { pattern: /Fiduciary-compliant/i, description: "Fiduciary-compliant" },
      { pattern: /Fiduciary compliant/i, description: "Fiduciary compliant" },
      { pattern: /SEBI compliant/i, description: "SEBI compliant" },
      { pattern: /SEBI-compliant/i, description: "SEBI-compliant" },
      { pattern: /DPDP compliant/i, description: "DPDP compliant" },
      { pattern: /DPDP-compliant/i, description: "DPDP-compliant" },
      { pattern: /Guaranteed Tax Shield/i, description: "Guaranteed Tax Shield" },
      { pattern: /Guaranteed Tax Saving/i, description: "Guaranteed Tax Saving" },
      { pattern: /Guaranteed Tax Savings/i, description: "Guaranteed Tax Savings" },
      { pattern: /Guaranteed Return/i, description: "Guaranteed Return" },
    ];

    const TARGET_FILES = [
      "src/constants/productCopy.ts",
      "src/services/pdfReport.ts",
      "src/features/advisor/AdvisorCommandCenter.tsx",
      "src/features/advisor/DecisionJournalModal.tsx",
      "src/features/advisor/PriorityActionCard.tsx",
      "src/features/advisor/Client360Modal.tsx",
      "src/features/advisor/DataQualityCenter.tsx",
      "src/features/advisor/AdvisorBriefModal.tsx",
      "src/features/advisor/WorkflowStats.tsx",
      "src/features/advisor/PriorityQueue.tsx",
      "src/components/TaxHarvestStudioModal.tsx",
      "src/components/modals/RebalanceModal.tsx",
      "src/components/CommitteeMemoModal.tsx",
      "src/components/AiWealthCopilot.tsx",
      "src/services/committeeMemo.ts",
      "src/services/aiAdvisor.ts",
      "backend/server.js",
    ];

    for (const relPath of TARGET_FILES) {
      it(`ensures ${relPath} contains zero prohibited regulatory or tax overclaims`, () => {
        const fullPath = path.resolve(__dirname, "..", relPath);
        if (!fs.existsSync(fullPath)) {
          throw new Error(`Target file does not exist: ${relPath}`);
        }
        const content = fs.readFileSync(fullPath, "utf-8");

        for (const { pattern, description } of PROHIBITED_PHRASES) {
          const match = content.match(pattern);
          expect(match).toBeNull();
        }
      });
    }
  });

  describe("Targeted Surface Assertions", () => {
    it("verifies PDF report uses GIPS-informed methodology and estimated tax impact", () => {
      const pdfPath = path.resolve(__dirname, "../src/services/pdfReport.ts");
      const content = fs.readFileSync(pdfPath, "utf-8");

      expect(content).toContain("GIPS-informed methodology");
      expect(content).toContain("Estimated Tax Impact");
      expect(content).toContain("ADVISOR DECISION-SUPPORT RECORD");
      expect(content).not.toContain("Tax Loss Harvesting Shield");
      expect(content).not.toContain("Fiduciary Mandate & Strategy");
    });

    it("verifies AI prompts and backend system instructions use advisor-support framing", () => {
      const backendPath = path.resolve(__dirname, "../backend/server.js");
      const content = fs.readFileSync(backendPath, "utf-8");

      expect(content).toContain("advisor-support assistant");
      expect(content).toContain("You do not guarantee returns");
      expect(content).toContain("You clearly distinguish: FACT, MODEL RESULT, SCENARIO INTERPRETATION, and ADVISOR DECISION");
      expect(content).not.toContain("You are a fiduciary advisor");
    });

    it("verifies Advisor Command Center uses corrected governance terminology", () => {
      const accPath = path.resolve(__dirname, "../src/features/advisor/AdvisorCommandCenter.tsx");
      const content = fs.readFileSync(accPath, "utf-8");

      expect(content).toContain("ADVISOR COMMAND CENTER");
      expect(content).toContain("Daily workflow, governance, analytics and decision support");
      expect(content).not.toContain("FIDUCIARY COMMAND CENTER");
      expect(content).not.toContain("Fiduciary OS");
    });

    it("verifies Decision Journal uses Advisor Decision Journal terminology", () => {
      const djPath = path.resolve(__dirname, "../src/features/advisor/DecisionJournalModal.tsx");
      const content = fs.readFileSync(djPath, "utf-8");

      expect(content).toContain("ADVISOR DECISION JOURNAL");
      expect(content).toContain("EVIDENCE-BACKED ADVISOR DECISION & GOVERNANCE RECORD");
      expect(content).not.toContain("FIDUCIARY DECISION JOURNAL");
    });
  });
});
