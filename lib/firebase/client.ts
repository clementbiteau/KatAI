import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";

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

let clients: { auth: Auth; db: Firestore } | null | undefined;

// Creates the Auth and Firestore clients once, wired to the emulators when asked.
function getClients(): { auth: Auth; db: Firestore } | null {
  if (clients !== undefined) return clients;
  const settings = readConfig();
  if (!settings) {
    clients = null;
    return clients;
  }
  const app: FirebaseApp = getApps()[0] ?? initializeApp(settings.config);
  clients = { auth: getAuth(app), db: getFirestore(app) };
  if (settings.useEmulators) {
    const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";
    const [firestoreHost = "127.0.0.1", firestorePort = "8080"] = (process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080").split(":");
    connectAuthEmulator(clients.auth, `http://${authHost}`, { disableWarnings: true });
    connectFirestoreEmulator(clients.db, firestoreHost, Number(firestorePort));
  }
  return clients;
}

// Returns null when Firebase is not configured, so the UI can say sign-in is unavailable.
export function getClientAuth(): Auth | null {
  return getClients()?.auth ?? null;
}

// Read-only access to the user's own documents, enforced by the Firestore rules (docs/adr/0003).
export function getClientDb(): Firestore | null {
  return getClients()?.db ?? null;
}
