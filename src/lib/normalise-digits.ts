const ARABIC_INDIC_ZERO = 0x0660;
const EASTERN_ARABIC_INDIC_ZERO = 0x06f0;
const NON_ASCII_DIGITS = /[٠-٩۰-۹]/g;
const BIDI_CONTROLS = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
const ASCII_DIGIT = /[0-9]/g;

export function normaliseDigits(input: string): string {
  return input.replace(BIDI_CONTROLS, "").replace(NON_ASCII_DIGITS, (digit) => {
    const code = digit.charCodeAt(0);
    const zero =
      code >= EASTERN_ARABIC_INDIC_ZERO
        ? EASTERN_ARABIC_INDIC_ZERO
        : ARABIC_INDIC_ZERO;
    return String(code - zero);
  });
}

export function countDigits(input: string): number {
  return input.match(ASCII_DIGIT)?.length ?? 0;
}
