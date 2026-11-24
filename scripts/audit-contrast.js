(() => {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const SENTINEL = "#123456";

  function toRgba(css) {
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = SENTINEL;
    context.fillStyle = css;
    if (context.fillStyle === SENTINEL && css.trim().toLowerCase() !== SENTINEL) {
      throw new Error("canvas could not parse colour: " + css);
    }
    context.fillRect(0, 0, 1, 1);
    const data = context.getImageData(0, 0, 1, 1).data;
    return [data[0], data[1], data[2], data[3] / 255];
  }

  function over(top, bottom) {
    const alpha = top[3];
    return [
      top[0] * alpha + bottom[0] * (1 - alpha),
      top[1] * alpha + bottom[1] * (1 - alpha),
      top[2] * alpha + bottom[2] * (1 - alpha),
      1,
    ];
  }

  function luminance(rgb) {
    const [r, g, b] = rgb.slice(0, 3).map((value) => {
      const channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function ratio(a, b) {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
  }

  function backdrop(element) {
    const layers = [];
    let unknown = false;
    for (let node = element; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.backgroundImage !== "none") {
        unknown = true;
      }
      const colour = toRgba(style.backgroundColor);
      if (colour[3] > 0) {
        layers.push(colour);
        if (colour[3] === 1) {
          break;
        }
      }
    }
    let result = [255, 255, 255, 1];
    for (const layer of layers.reverse()) {
      result = over(layer, result);
    }
    return { rgb: result, unknown };
  }

  function chainOpacity(element) {
    let value = 1;
    for (let node = element; node; node = node.parentElement) {
      value *= Number(getComputedStyle(node).opacity);
    }
    return value;
  }

  const results = [];
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const element = node.parentElement;
    if (!element || seen.has(element) || !node.nodeValue.trim()) {
      continue;
    }
    if (element.closest("script, style, noscript, nextjs-portal")) {
      continue;
    }
    seen.add(element);
    const style = getComputedStyle(element);
    if (style.visibility === "hidden" || style.display === "none" || element.getClientRects().length === 0) {
      continue;
    }
    const { rgb: background, unknown } = backdrop(element);
    const raw = toRgba(style.color);
    const withOpacity = [raw[0], raw[1], raw[2], raw[3] * chainOpacity(element)];
    const foreground = over(withOpacity, background);
    const size = parseFloat(style.fontSize);
    const weight = Number(style.fontWeight);
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const required = large ? 3 : 4.5;
    const value = ratio(foreground, background);
    const disabled = Boolean(element.closest(":disabled, [aria-disabled='true']"));
    results.push({
      text: node.nodeValue.trim().slice(0, 40),
      tag: element.tagName.toLowerCase() + (element.className ? "." + String(element.className).split(" ")[0] : ""),
      ratio: Math.round(value * 100) / 100,
      required,
      size,
      weight,
      fg: foreground.slice(0, 3).map(Math.round).join(","),
      bg: background.slice(0, 3).map(Math.round).join(","),
      disabled,
      imageBackdrop: unknown,
      pass: value >= required,
    });
  }
  const failures = results.filter((entry) => !entry.pass);
  return {
    page: location.pathname,
    viewport: innerWidth,
    checked: results.length,
    minRatio: Math.min(...results.map((entry) => entry.ratio)),
    minEnabledRatio: Math.min(...results.filter((entry) => !entry.disabled).map((entry) => entry.ratio)),
    failures,
    imageBackdrops: results.filter((entry) => entry.imageBackdrop).map((entry) => entry.text),
  };
})()
