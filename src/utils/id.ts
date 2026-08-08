/** Generates a unique id for locally-created records (materials, estimate lines, ...). */
export function generateId(): string {
  return crypto.randomUUID();
}
