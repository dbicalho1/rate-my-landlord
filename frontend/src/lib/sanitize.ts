export function sanitizeString(input: string | undefined | null): string {
  if (typeof input !== "string") return "";
  // Normalize unicode, strip control chars, trim whitespace
  return input
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

export function sanitizeEmail(input: string | undefined | null): string {
  const value = sanitizeString(input).toLowerCase();
  // Basic email check; adjust to your needs later
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value) ? value : "";
}

