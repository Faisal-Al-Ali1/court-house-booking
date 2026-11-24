import type { ZodError } from "zod";

export function parseFormErrors(
  error: ZodError,
  translate: (key: string) => string,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field] = translate(issue.message);
    }
  }

  return errors;
}
