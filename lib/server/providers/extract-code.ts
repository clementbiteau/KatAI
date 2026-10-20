const CODE_BLOCK = /```(javascript|js|jsx|mjs)?[ \t]*\n([\s\S]*?)```/g;

// Returns the first JavaScript code block of a model answer, or null (spec CA4.7).
// Export keywords are removed because the sandbox loads the code as a classic script
// (docs/adr/0006); the rest of the code is kept exactly as generated.
export function extractCode(answer: string): string | null {
  for (const match of answer.matchAll(CODE_BLOCK)) {
    const code = (match[2] ?? "").replace(/^export\s+(default\s+)?/gm, "").trim();
    if (code.length > 0) return code;
  }
  return null;
}
