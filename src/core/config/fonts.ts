import { Cairo, Livvic } from "next/font/google";

export const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: "variable",
  variable: "--font-cairo",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Segoe UI", "Tahoma", "system-ui", "sans-serif"],
});

export const livvic = Livvic({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-livvic",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Segoe UI", "Tahoma", "system-ui", "sans-serif"],
});
