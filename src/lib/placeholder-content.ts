const PLACEHOLDER_PATTERN = /^\s*TODO\b/;

export function isPlaceholderContent(value: string): boolean {
  return value.trim() === "" || PLACEHOLDER_PATTERN.test(value);
}
