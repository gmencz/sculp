export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function toPostgresQuery(str: string) {
  return str
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" | ");
}
