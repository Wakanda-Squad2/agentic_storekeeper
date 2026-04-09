/** Turn API/snake keys like `office_supplies` into short display labels. */
export function humanizeCategoryLabel(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) return key;
  if (!trimmed.includes("_")) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }
  return trimmed
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
