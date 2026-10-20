export const MAX_SPEC_LENGTH = 4000;

// Checked in the editor and again by the server (spec CA4.4).
export function validateSpec(spec: string): string | null {
  if (spec.trim().length === 0) return "Write a specification first.";
  if (spec.length > MAX_SPEC_LENGTH) return `Your specification is longer than ${MAX_SPEC_LENGTH} characters.`;
  return null;
}
