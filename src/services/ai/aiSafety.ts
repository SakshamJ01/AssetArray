/**
 * Validates and normalizes structured JSON output from LLMs.
 * Rejects hallucinations, missing keys, and malformed markdown fences.
 */
export function validateAiStructuredJson<T>(
  rawResponse: string,
  validator: (parsed: any) => T | null
): { success: boolean; data: T | null; error?: string } {
  if (!rawResponse || typeof rawResponse !== "string") {
    return { success: false, data: null, error: "Empty LLM response received." };
  }

  try {
    const cleaned = rawResponse
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    const validated = validator(parsed);

    if (validated === null) {
      return {
        success: false,
        data: null,
        error: "LLM output failed schema validation constraints.",
      };
    }

    return { success: true, data: validated };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: `Failed to parse LLM JSON: ${err.message}`,
    };
  }
}
