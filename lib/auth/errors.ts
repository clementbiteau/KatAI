export type AuthFlow = "sign-in" | "sign-up" | "reset";

const GENERIC = "Something went wrong. Please try again.";

// Sign-in never says which field is wrong (CA1.4), and sign-up never confirms
// that an email is already registered (CA1.2).
const MESSAGES: Record<AuthFlow, Record<string, string>> = {
  "sign-in": {
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/user-not-found": "Incorrect email or password.",
    "auth/invalid-email": "Incorrect email or password.",
  },
  "sign-up": {
    "auth/email-already-in-use":
      "We could not create an account with these details. If you already have an account, sign in instead.",
    "auth/weak-password": "Choose a password of at least 8 characters.",
    "auth/password-does-not-meet-requirements": "Choose a password of at least 8 characters.",
    "auth/invalid-email": "Enter a valid email address.",
  },
  reset: {
    "auth/invalid-email": "Enter a valid email address.",
  },
};

const SHARED: Record<string, string> = {
  "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
};

export function describeAuthError(code: string, flow: AuthFlow): string {
  return MESSAGES[flow][code] ?? SHARED[code] ?? GENERIC;
}
