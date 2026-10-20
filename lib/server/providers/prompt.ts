import type { GenerationRequest } from "./types.ts";

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
