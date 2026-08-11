import type { Lang } from "./i18n/strings";

// Currency is always KD (Kuwaiti Dinar). Numbers grouped with en-US even in Arabic.
export function kd(amount: number | string | null | undefined, lang: Lang = "en"): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  const num = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 3,
    maximumFractionDigits: 3,
  }).format(n || 0);
  return lang === "ar" ? `${num} د.ك` : `KD ${num}`;
}

// KWD to the 3-decimal string MyFatoorah / receipts expect.
export function kwd3(amount: number): string {
  return (Math.round(amount * 1000) / 1000).toFixed(3);
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0] || "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
