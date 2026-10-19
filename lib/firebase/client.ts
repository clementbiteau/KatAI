import { getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

// Public Firebase web configuration (identifiers, not secrets: security relies on
// the rules and on server-side token checks). With NEXT_PUBLIC_FIREBASE_USE_EMULATORS=1,
// the app talks to the local emulators of the demo-katai project instead.
const EMULATOR_CONFIG: FirebaseOptions = {
  apiKey: "demo-api-key",
  authDomain: "demo-katai.firebaseapp.com",
  projectId: "demo-katai",
};

function readConfig(): { config: FirebaseOptions; useEmulators: boolean } | null {
  if (process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === "1") return { config: EMULATOR_CONFIG, useEmulators: true };
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  return Object.values(config).every(Boolean) ? { config, useEmulators: false } : null;
}

// True when the app has a Firebase configuration (real project or emulators).
export function isFirebaseConfigured(): boolean {
  return readConfig() !== null;
}

let clientAuth: Auth | null | undefined;

// Returns null when Firebase is not configured, so the UI can say sign-in is unavailable.
export function getClientAuth(): Auth | null {
  if (clientAuth !== undefined) return clientAuth;
  const settings = readConfig();
  if (!settings) {
    clientAuth = null;
    return clientAuth;
  }
  clientAuth = getAuth(getApps()[0] ?? initializeApp(settings.config));
  if (settings.useEmulators) {
    const host = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";
    connectAuthEmulator(clientAuth, `http://${host}`, { disableWarnings: true });
  }
  return clientAuth;
}
