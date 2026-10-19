import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const EMULATOR_PROJECT_ID = "demo-katai";

function usesEmulators(): boolean {
  return Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST);
}

// With emulator variables set, the Admin SDK accepts unsigned emulator tokens. They are
// therefore refused next to a real service account and on any Vercel deployment.
function createAdminApp(): App {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (usesEmulators()) {
    if (serviceAccount || process.env.VERCEL_ENV) throw new Error("Firebase emulator settings are not allowed here.");
    return initializeApp({ projectId: EMULATOR_PROJECT_ID });
  }
  if (!serviceAccount) throw new Error("FIREBASE_SERVICE_ACCOUNT is not configured.");
  return initializeApp({ credential: cert(JSON.parse(Buffer.from(serviceAccount, "base64").toString("utf8"))) });
}

export function getAdminApp(): App {
  return getApps()[0] ?? createAdminApp();
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

// Bypasses the Firestore rules: only the data modules in lib/server/data may use it (docs/adr/0003).
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
