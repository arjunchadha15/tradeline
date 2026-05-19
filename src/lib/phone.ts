export function normalizeE164(input: string, defaultCountry = "US"): string {
  if (!input) return "";
  const digits = input.replace(/\D/g, "");
  if (defaultCountry === "US") {
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  }
  if (digits.length >= 7 && digits.length <= 15) return `+${digits}`;
  return "";
}

export function formatPretty(e164: string): string {
  if (!e164) return "";
  const digits = e164.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    const d = digits.slice(1);
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return e164;
}

export function isE164(s: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(s);
}
