function keepWholeWords(slug: string, maxLength: number): string {
  const [firstWord = "", ...otherWords] = slug.split("-");
  if (firstWord.length > maxLength) return firstWord.slice(0, maxLength);
  let kept = firstWord;
  for (const word of otherWords) {
    if (kept.length + 1 + word.length > maxLength) break;
    kept = `${kept}-${word}`;
  }
  return kept;
}

export function reference(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const shortened = slug.length > 50 ? keepWholeWords(slug, 50) : slug;
  return shortened || "untitled";
}

// What a vague spec ("make a URL slug") typically produces.
export function naive(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 50);
}
