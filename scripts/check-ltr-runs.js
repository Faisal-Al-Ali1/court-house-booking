(() => {
  const main = document.querySelector('html[lang="ar"] main');
  if (!main) {
    return { page: location.pathname, skipped: "not an Arabic page" };
  }
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  const offenders = [];
  const isolatedByBdi = [];
  let checked = 0;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const element = node.parentElement;
    if (!element || element.closest("script, style, noscript")) {
      continue;
    }
    checked += 1;
    if (/[A-Za-z0-9]/.test(node.nodeValue) && !element.closest('[dir="ltr"]')) {
      if (element.closest("bdi")) {
        isolatedByBdi.push(node.nodeValue.trim().slice(0, 80));
        continue;
      }
      offenders.push({
        text: node.nodeValue.trim().slice(0, 80),
        parent: element.tagName.toLowerCase() + (element.className ? "." + String(element.className).split(" ")[0] : ""),
      });
    }
  }
  return { page: location.pathname, textNodes: checked, offenders, isolatedByBdi };
})()
