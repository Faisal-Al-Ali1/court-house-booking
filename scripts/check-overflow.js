(() => {
  const viewport = window.innerWidth;
  const offenders = [];
  for (const element of document.body.querySelectorAll("*")) {
    if (element.closest("nextjs-portal, script, style, .sr-only")) {
      continue;
    }
    const style = getComputedStyle(element);
    if (style.display === "inline" || style.display === "none") {
      continue;
    }
    const intentional = /(auto|scroll)/.test(style.overflowX);
    const rect = element.getBoundingClientRect();
    const spills = rect.width > 0 && (rect.right > viewport + 0.5 || rect.left < -0.5);
    if ((element.scrollWidth > element.clientWidth + 0.5 && !intentional) || spills) {
      offenders.push({
        tag: element.tagName.toLowerCase() + (element.className ? "." + String(element.className).split(" ")[0] : ""),
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        right: Math.round(rect.right),
        left: Math.round(rect.left),
        text: (element.textContent || "").trim().slice(0, 40),
      });
    }
  }
  return {
    page: location.pathname,
    viewport,
    documentScrollWidth: document.documentElement.scrollWidth,
    pageOverflows: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    offenders,
  };
})()
