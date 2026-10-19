import type { Kata } from "../types.ts";

export const luxuryEngraving: Kata = {
  id: "luxury-engraving",
  title: "Engraving request",
  level: "medium",
  sector: "luxury",
  stage: "specification",
  practice: "Specifying text normalization and validation exhaustively: character set, edge cases and limits.",
  summary: "A luxury house validates the personal engravings clients order online before they reach the workshop.",
  brief: `Client: a leather goods and jewellery house with its own workshops.
Requested by: the clienteling product manager, for the online personalization service.

"Clients type their engraving on the website or in our app. Our engraving machines only handle a limited set of characters, and an engraving can never be changed once done. We need one function that turns what the client typed into the exact text sent to the workshop, or refuses it so the client can correct it. We never silently drop a character from a client's message."

Business rules agreed with the workshop:
- The workshop engraves capital letters only, without accents: é becomes E, ü becomes U, ç becomes C.
- The ligatures œ and æ are engraved as OE and AE.
- Phones type a curly apostrophe (’); it is engraved as a straight apostrophe (').
- Spaces at the start and end are removed, and several spaces in a row become one.
- After these steps, the only engravable characters are A to Z, 0 to 9, the space, and the symbols & . ' -
- Any other character, an engraving left empty, or an engraving longer than the item's limit is refused with a RangeError.
- Limits, counted after cleanup and including spaces: ring 12 characters, watch 20, bag 30.`,
  functionName: "formatEngraving",
  signature: 'formatEngraving(text: string, item: "ring" | "watch" | "bag"): string',
  tests: [
    { label: "Engraves in capital letters", args: ["Love", "ring"], expected: "LOVE" },
    { label: "Removes accents", args: ["Hélène & Noël", "bag"], expected: "HELENE & NOEL" },
    {
      label: "Trims and collapses spaces",
      args: ["  Forever   yours ", "watch"],
      expected: "FOREVER YOURS",
    },
    { label: "Keeps the allowed punctuation", args: ["J.-M. D'Arc", "bag"], expected: "J.-M. D'ARC" },
    { label: "Straightens a curly apostrophe", args: ["D’Artagnan", "watch"], expected: "D'ARTAGNAN" },
    { label: "Expands the oe ligature", args: ["Mon cœur", "ring"], expected: "MON COEUR" },
    { label: "Accepts exactly 12 characters on a ring", args: ["Always yours", "ring"], expected: "ALWAYS YOURS" },
    { label: "Refuses 13 characters on a ring", args: ["Always & ever", "ring"], throws: "RangeError" },
    { label: "Allows the same text on a watch", args: ["Always & ever", "watch"], expected: "ALWAYS & EVER" },
    {
      label: "Measures the length after cleanup",
      args: ["  Always    yours  ", "ring"],
      expected: "ALWAYS YOURS",
    },
    { label: "Refuses a character the workshop cannot engrave", args: ["I ♥ U", "ring"], throws: "RangeError" },
    { label: "Refuses an empty engraving", args: ["   ", "bag"], throws: "RangeError" },
  ],
};
