import { cartTotal } from "./content/cart-total.ts";
import { freeSlots } from "./content/free-slots.ts";
import { slugify } from "./content/slugify.ts";
import type { Kata, KataLevel } from "./types.ts";

export const KATAS: readonly Kata[] = [cartTotal, slugify, freeSlots];

const RANDORI_MINUTES: Record<KataLevel, number> = { easy: 10, medium: 15, hard: 20 };

export function findKata(id: string): Kata | undefined {
  return KATAS.find((kata) => kata.id === id);
}

export function randoriMinutes(level: KataLevel): number {
  return RANDORI_MINUTES[level];
}
