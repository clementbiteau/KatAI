export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Client-side checks, run before contacting Firebase. Returns an error message or null.
export function validateCredentials(email: string, password: string): string | null {
  if (!EMAIL_PATTERN.test(email.trim())) return "Enter a valid email address.";
  if (password.length < MIN_PASSWORD_LENGTH) return `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`;
  return null;
}

// Only internal paths are allowed after sign-in, to prevent open redirects.
export function safeRedirectPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}
