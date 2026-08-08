/** Lowercase words that stay lowercase in Title Case unless they're the first word. */
const MINOR_WORDS = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of", "on", "or", "the", "to", "with"]);

/**
 * Converts a string to Title Case, e.g. "general extract fan" -> "General
 * Extract Fan". Words are split on whitespace; each word's first letter is
 * capitalized and the rest lowercased, except minor words (articles,
 * conjunctions, short prepositions) which stay lowercase unless they're the
 * first word. Existing internal capitalization (e.g. acronyms) is not
 * preserved - this always normalizes to Title Case.
 */
export function toTitleCase(value: string): string {
  const words = value.trim().split(/\s+/);
  return words
    .map((word, index) => {
      if (!word) {
        return word;
      }
      const lower = word.toLowerCase();
      if (index > 0 && MINOR_WORDS.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}
