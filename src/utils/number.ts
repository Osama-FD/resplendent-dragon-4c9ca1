/** Parses a numeric text input, falling back to 0 for empty/invalid values. */
export function parseNumericInput(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
