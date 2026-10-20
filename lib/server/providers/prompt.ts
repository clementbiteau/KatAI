import type { GenerationRequest } from "./types.ts";

// The prompt protocol: what the model receives, and how its answer is read.

const CODE_BLOCK = /```(javascript|js|jsx|mjs)?[ \t]*\n([\s\S]*?)```/g;

// The model receives the user's spec and the expected signature, nothing else (spec H2):
// the score then measures the spec, not what the model knows about the kata.
export function buildSystemPrompt({ functionName, signature }: Pick<GenerationRequest, "functionName" | "signature">): string {
  return [
    "You are a coding agent. Implement what the user's specification asks for, as one JavaScript function.",
    "Rules:",
    `- The function must be named ${functionName}, with this signature (TypeScript notation, but write plain JavaScript): ${signature}`,
    "- Write plain modern JavaScript that runs in a browser worker: no TypeScript syntax, no import, no export, no require, no network, no file system, no DOM.",
    "- Helper functions are allowed in the same code block.",
    "- The specification is your only source of requirements.",
    "- Answer with exactly one ```javascript code block and nothing else.",
  ].join("\n");
}

export function buildUserMessage(spec: string): string {
  return `<specification>\n${spec}\n</specification>`;
}

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
