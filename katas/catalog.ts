import { bankingTransferGuard } from "./content/banking-transfer-guard.ts";
import { luxuryEngraving } from "./content/luxury-engraving.ts";
import { retailCart } from "./content/retail-cart.ts";
import type { Kata, KataLevel } from "./types.ts";

export const KATAS: readonly Kata[] = [retailCart, luxuryEngraving, bankingTransferGuard];

const RANDORI_MINUTES: Record<KataLevel, number> = { easy: 10, medium: 15, hard: 20 };

export function findKata(id: string): Kata | undefined {
  return KATAS.find((kata) => kata.id === id);
}

export function randoriMinutes(level: KataLevel): number {
  return RANDORI_MINUTES[level];
}
