const PLACEHOLDER_PATTERN = /^\s*TODO\b/;

export function isPlaceholderContent(value: string): boolean {
  return value.trim() === "" || PLACEHOLDER_PATTERN.test(value);
}

const HTTP_URL_PATTERN = /^https?:\/\/\S+$/i;

export function isHttpUrl(value: string): boolean {
  return HTTP_URL_PATTERN.test(value.trim());
}
