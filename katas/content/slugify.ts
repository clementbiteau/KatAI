import type { Kata } from "../types.ts";

export const slugify: Kata = {
  id: "slugify",
  title: "Slugify",
  level: "medium",
  summary: "Turn an article title into a clean, bounded URL slug.",
  statement: `Write a function that turns an article title into a URL slug.

Apply these rules in order:
- Accented letters lose their accent: é becomes e, ü becomes u, ç becomes c.
- The slug is lowercase.
- Every run of characters that are not a lowercase ASCII letter (a to z) or a digit (0 to 9) becomes a single hyphen. Letters from other alphabets count as such characters.
- The slug never starts or ends with a hyphen.
- The slug is at most 50 characters long. When it is longer, keep the longest beginning made of whole words (a word is a part between hyphens) that fits in 50 characters. If the first word alone is longer than 50 characters, keep its first 50 characters.
- If nothing is left, return "untitled".`,
  functionName: "slugify",
  signature: "slugify(title: string): string",
  tests: [
    { label: "Lowercases and joins words with hyphens", args: ["Hello World"], expected: "hello-world" },
    { label: "Removes accents", args: ["Crème Brûlée à la Carte"], expected: "creme-brulee-a-la-carte" },
    { label: "Collapses runs of separators", args: ["Rock  &  Roll -- Live!!"], expected: "rock-roll-live" },
    { label: "Trims leading and trailing hyphens", args: ["  --Hello, World--  "], expected: "hello-world" },
    { label: "Keeps digits", args: ["Top 10 Tips for 2026"], expected: "top-10-tips-for-2026" },
    { label: "Turns an apostrophe into a hyphen", args: ["Don't Stop"], expected: "don-t-stop" },
    { label: "Drops letters from other alphabets", args: ["Café 東京 2026"], expected: "cafe-2026" },
    {
      label: "Keeps a slug of exactly 50 characters",
      args: ["Abcdefghij Klmnopqrst Uvwxyzabcd Efghijklmn Opqrst"],
      expected: "abcdefghij-klmnopqrst-uvwxyzabcd-efghijklmn-opqrst",
    },
    {
      label: "Never cuts a word to fit 50 characters",
      args: ["Abcdefghij Klmnopqrst Uvwxyzabcd Efghijklmn Opqrstu"],
      expected: "abcdefghij-klmnopqrst-uvwxyzabcd-efghijklmn",
    },
    {
      label: "Cuts a first word longer than 50 characters",
      args: ["AntidisestablishmentarianismFloccinaucinihilipilification is long"],
      expected: "antidisestablishmentarianismfloccinaucinihilipilif",
    },
    { label: "Returns untitled when only symbols remain", args: ["!!! ???"], expected: "untitled" },
    { label: "Returns untitled for an empty title", args: [""], expected: "untitled" },
  ],
};
