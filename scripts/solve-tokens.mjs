const RED_HEX = "#A32731";
const CHARCOAL_HEX = "#3F3F3D";
const WHITE_HEX = "#FFFFFF";

const decode = (v) =>
  v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
const hexToLinear = (h) =>
  [1, 3, 5].map((i) => decode(parseInt(h.slice(i, i + 2), 16) / 255));

const linearToOklch = ([r, g, b]) => {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(a, bb);
  const h = ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;
  return { L, C, h };
};

const oklchToLinear = (L, C, hDeg) => {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h),
    b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3,
    m = m_ ** 3,
    s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
};

const inGamut = (c) => c.every((v) => v >= -0.0001 && v <= 1.0001);
const cl = (v) => Math.min(1, Math.max(0, v));
const lum = (lin) => {
  const [r, g, b] = lin.map(cl);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const cr = (a, b) => {
  const x = Math.max(a, b),
    y = Math.min(a, b);
  return (x + 0.05) / (y + 0.05);
};
const hex = (lin) =>
  "#" +
  lin
    .map((v) => {
      const c = cl(v);
      const s = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
      return Math.round(s * 255)
        .toString(16)
        .padStart(2, "0");
    })
    .join("");
const ok = (L, C, h) => ({
  L,
  C,
  h,
  hex: hex(oklchToLinear(L, C, h)),
  lum: lum(oklchToLinear(L, C, h)),
});
const css = (o) => `oklch(${o.L} ${o.C} ${o.h})`;

const fromHex = (h) => {
  const lin = hexToLinear(h);
  return { hex: h.toLowerCase(), lum: lum(lin), ...linearToOklch(lin) };
};

const WHITE = fromHex(WHITE_HEX);
const CHARCOAL = fromHex(CHARCOAL_HEX);
const RED = fromHex(RED_HEX);
const TINT_H = +CHARCOAL.h.toFixed(1);
const TINT_C = +Math.min(CHARCOAL.C, 0.006).toFixed(3);

const darken = (C, h, target, against, from = 0.99) => {
  for (let L = from; L >= 0.1; L -= 0.001) {
    for (let c = C; c >= 0; c -= 0.002) {
      const lin = oklchToLinear(L, c, h);
      if (!inGamut(lin)) continue;
      if (cr(lum(lin), against) >= target)
        return {
          ...ok(+L.toFixed(3), +c.toFixed(3), h),
          ratio: +cr(lum(lin), against).toFixed(2),
        };
      break;
    }
  }
  return null;
};

const lightenUntil = (C, h, test, from) => {
  for (let L = from; L <= 1; L += 0.001) {
    const lin = oklchToLinear(L, C, h);
    if (!inGamut(lin)) continue;
    const t = ok(+L.toFixed(3), C, h);
    if (test(t)) return t;
  }
  return null;
};

const INK_TARGET = 10;
const RAISED = lightenUntil(
  0,
  0,
  (t) => cr(CHARCOAL.lum, t.lum) >= INK_TARGET + 0.1,
  0.95,
);
const inkMuted = darken(TINT_C, TINT_H, 4.8, RAISED.lum, 0.9);
const rule = darken(0, 0, 1.25, WHITE.lum);
const ruleStrong = darken(0, 0, 3.1, RAISED.lum);
const slotTakenSurface = darken(0, 0, 1.12, RAISED.lum, RAISED.L);
const slotTakenInk = darken(TINT_C, TINT_H, 4.8, slotTakenSurface.lum, 0.9);

const rows = [
  ["--color-ground", WHITE_HEX, "—"],
  [
    "--color-ground-raised",
    css(RAISED),
    `${RAISED.hex}  ${cr(RAISED.lum, WHITE.lum).toFixed(2)}:1 vs ground`,
  ],
  [
    "--color-ink",
    CHARCOAL_HEX,
    `${cr(CHARCOAL.lum, RAISED.lum).toFixed(2)}:1 on raised, ${cr(CHARCOAL.lum, WHITE.lum).toFixed(2)}:1 on ground`,
  ],
  [
    "--color-ink-muted",
    css(inkMuted),
    `${inkMuted.hex}  ${inkMuted.ratio}:1 on raised, ${cr(inkMuted.lum, WHITE.lum).toFixed(2)}:1 on ground`,
  ],
  [
    "--color-accent",
    RED_HEX,
    `${cr(RED.lum, WHITE.lum).toFixed(2)}:1 on ground, ${cr(RED.lum, RAISED.lum).toFixed(2)}:1 on raised`,
  ],
  [
    "--color-accent-ink",
    WHITE_HEX,
    `${cr(WHITE.lum, RED.lum).toFixed(2)}:1 on accent`,
  ],
  [
    "--color-rule",
    css(rule),
    `${rule.hex}  ${rule.ratio}:1 on ground (decorative, no text)`,
  ],
  [
    "--color-rule-strong",
    css(ruleStrong),
    `${ruleStrong.hex}  ${ruleStrong.ratio}:1 on raised, ${cr(ruleStrong.lum, WHITE.lum).toFixed(2)}:1 on ground`,
  ],
  [
    "--color-slot-taken-surface",
    css(slotTakenSurface),
    `${slotTakenSurface.hex}  ${cr(slotTakenSurface.lum, WHITE.lum).toFixed(2)}:1 vs ground`,
  ],
  [
    "--color-slot-taken-ink",
    css(slotTakenInk),
    `${slotTakenInk.hex}  ${slotTakenInk.ratio}:1 on slot-taken-surface`,
  ],
];

for (const [name, value, note] of rows)
  console.log(`${name.padEnd(28)}${value.padEnd(24)}${note}`);

console.log(
  `\nred on charcoal (banned): ${cr(RED.lum, CHARCOAL.lum).toFixed(2)}:1`,
);

console.log("\nCSS\n");
for (const [name, value] of rows) console.log(`  ${name}: ${value};`);
