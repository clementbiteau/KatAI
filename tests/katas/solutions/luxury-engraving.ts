type Item = "ring" | "watch" | "bag";

const LIMITS: Record<Item, number> = { ring: 12, watch: 20, bag: 30 };

function cleanUp(text: string): string {
  return text
    .replace(/’/g, "'")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "AE")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/ +/g, " ")
    .trim();
}

export function reference(text: string, item: Item): string {
  const engraving = cleanUp(text);
  if (engraving.length === 0) throw new RangeError("An engraving cannot be empty");
  if (!/^[A-Z0-9 &.'-]+$/.test(engraving)) throw new RangeError("Unsupported character");
  if (engraving.length > LIMITS[item]) throw new RangeError(`Too long for a ${item}`);
  return engraving;
}

// What a vague spec ("uppercase the engraving and check its length") typically produces.
export function naive(text: string, item: Item): string {
  const engraving = text.trim().toUpperCase();
  if (engraving.length > LIMITS[item]) throw new RangeError("Too long");
  return engraving;
}
