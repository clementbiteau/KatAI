import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";
import { attemptViewFromData, type AttemptView } from "./attempts.ts";
import { getClientDb } from "./firebase/client.ts";

// Browser-side reads of the user's own attempts. The client only reads; the Firestore
// rules allow it for the owner's documents only (docs/adr/0003, S2).

function toView(id: string, data: DocumentData): AttemptView {
  // A just-created document can briefly lack its server timestamp in a live snapshot.
  const createdAt = (data.createdAt as Timestamp | null)?.toDate().toISOString() ?? new Date().toISOString();
  return attemptViewFromData(id, data, createdAt);
}

// Live list of the user's attempts on a kata, most recent first (CA5.1). Returns the unsubscribe function.
export function watchKataAttempts(
  uid: string,
  kataId: string,
  onChange: (attempts: AttemptView[]) => void,
  onError: () => void,
): () => void {
  const db = getClientDb();
  if (!db) {
    onError();
    return () => undefined;
  }
  const attempts = query(
    collection(db, "attempts"),
    where("uid", "==", uid),
    where("kataId", "==", kataId),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(
    attempts,
    (snapshot) => onChange(snapshot.docs.map((document) => toView(document.id, document.data()))),
    () => onError(),
  );
}

// One attempt, or null when it does not exist or belongs to someone else: the rules
// refuse the read, and both cases look the same to the user (CA6.5).
export async function readAttempt(id: string): Promise<AttemptView | null> {
  const db = getClientDb();
  if (!db || id.includes("/")) return null;
  try {
    const snapshot = await getDoc(doc(db, "attempts", id));
    return snapshot.exists() ? toView(snapshot.id, snapshot.data()) : null;
  } catch {
    return null;
  }
}
