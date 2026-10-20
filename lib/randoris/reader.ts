import { collection, doc, onSnapshot, orderBy, query, where, type DocumentData, type Timestamp } from "firebase/firestore";
import { getClientDb } from "../firebase/client.ts";
import { randoriViewFromData, type RandoriView } from "./view.ts";

// Browser-side live reads of the user's randoris, allowed by the rules for their owner only.

const noop = () => undefined;

function toView(id: string, data: DocumentData): RandoriView {
  const startedAt = (data.startedAt as Timestamp).toDate().toISOString();
  return randoriViewFromData(id, data, startedAt, (data.deadline as Timestamp).toDate().toISOString());
}

// One randori, updated live as the server records attempts and results. A missing or
// forbidden randori calls onMissing, the same way for both (CA6.5).
export function watchRandori(id: string, onChange: (randori: RandoriView) => void, onMissing: () => void): () => void {
  const db = getClientDb();
  if (!db || !id || id.includes("/")) {
    onMissing();
    return noop;
  }
  return onSnapshot(
    doc(db, "randoris", id),
    (snapshot) => (snapshot.exists() ? onChange(toView(snapshot.id, snapshot.data())) : onMissing()),
    () => onMissing(),
  );
}

// The user's randoris on one kata, most recent first (CA7.11).
export function watchKataRandoris(
  uid: string,
  kataId: string,
  onChange: (randoris: RandoriView[]) => void,
  onError: () => void,
): () => void {
  const db = getClientDb();
  if (!db) {
    onError();
    return noop;
  }
  const randoris = query(collection(db, "randoris"), where("uid", "==", uid), where("kataId", "==", kataId), orderBy("startedAt", "desc"));
  return onSnapshot(
    randoris,
    (snapshot) => onChange(snapshot.docs.map((document) => toView(document.id, document.data()))),
    () => onError(),
  );
}
