const LINK_ID = "tm-letterboxd-link";
const SLOT_ID = "tm-letterboxd-slot";

function isTitlePath(): boolean {
  return /^(\/[a-z]{2}(-[a-z]{2})?)?\/title\/tt\d+/.test(location.pathname);
}

function isVisibleElement(element: Element | null): element is HTMLElement {
  return element instanceof HTMLElement && element.isConnected && element.getClientRects().length > 0;
}

function parseTitle(): string | null {
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content")?.trim();
  const headerCandidate =
    document.querySelector('h1[data-testid="hero__pageTitle"]') ??
    document.querySelector('h1[data-testid="hero__primary-text"]') ??
    document.querySelector("h1");
  const headerTitle = isVisibleElement(headerCandidate) ? headerCandidate.textContent?.trim() ?? "" : "";

  const raw = ogTitle || headerTitle;
  if (!raw) {
    return null;
  }

  return raw
    .replace(/\s*-\s*IMDb\s*$/i, "")
    .replace(/\s*\(\d{4}\).*$/, "")
    .trim();
}

function getOrCreateLink(): HTMLAnchorElement {
  const existing = document.getElementById(LINK_ID);
  if (existing instanceof HTMLAnchorElement) {
    return existing;
  }

  const link = document.createElement("a");
  link.id = LINK_ID;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Letterboxd";
  link.style.display = "inline-flex";
  link.style.alignItems = "center";
  link.style.justifyContent = "center";
  link.style.padding = "6px 12px";
  link.style.borderRadius = "999px";
  link.style.fontSize = "13px";
  link.style.fontWeight = "600";
  link.style.textDecoration = "none";
  link.style.background = "#f5c518";
  link.style.color = "#111";
  link.style.zIndex = "9999";
  return link;
}

function ensureTitleSlot(): HTMLElement | null {
  const existing = document.getElementById(SLOT_ID);
  if (existing instanceof HTMLElement) {
    return existing;
  }

  const title =
    document.querySelector('h1[data-testid="hero__pageTitle"]') ??
    document.querySelector('h1[data-testid="hero__primary-text"]') ??
    document.querySelector("h1");

  if (!isVisibleElement(title)) {
    return null;
  }

  const slot = document.createElement("div");
  slot.id = SLOT_ID;
  slot.style.marginTop = "8px";
  title.insertAdjacentElement("afterend", slot);
  return slot;
}

function updateLink(link: HTMLAnchorElement, title: string): void {
  link.href = `https://letterboxd.com/search/${encodeURIComponent(title)}/`;
}

function mountInPreferredContainer(link: HTMLAnchorElement): boolean {
  const subnav = document.querySelector('[data-testid="hero-subnav-bar-all-links"]');
  if (isVisibleElement(subnav)) {
    link.style.marginLeft = "8px";
    link.style.position = "static";
    subnav.appendChild(link);
    return true;
  }

  const metadata = document.querySelector('[data-testid="hero-title-block__metadata"]');
  if (isVisibleElement(metadata)) {
    link.style.marginLeft = "8px";
    link.style.position = "static";
    metadata.appendChild(link);
    return true;
  }

  const slot = ensureTitleSlot();
  if (slot) {
    link.style.marginLeft = "0";
    link.style.position = "static";
    slot.appendChild(link);
    return true;
  }

  return false;
}

function mountFallback(link: HTMLAnchorElement): void {
  if (!document.body) {
    return;
  }

  link.style.marginLeft = "0";
  link.style.position = "fixed";
  link.style.right = "12px";
  link.style.bottom = "12px";
  document.body.appendChild(link);
}

function injectLink(): void {
  if (!isTitlePath()) {
    return;
  }

  const title = parseTitle();
  if (!title) {
    console.debug("[letterboxd] title not found, og:title =",
      document.querySelector('meta[property="og:title"]')?.getAttribute("content"),
      "h1 =", document.querySelector("h1")?.textContent?.trim());
    return;
  }

  const link = getOrCreateLink();
  updateLink(link, title);

  if (!mountInPreferredContainer(link)) {
    mountFallback(link);
  }

  console.debug("[letterboxd] link injected for:", title, "parent:", link.parentElement?.id || link.parentElement?.tagName);
}

function installObservers(): void {
  injectLink();

  const observer = new MutationObserver(() => {
    injectLink();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  const rerun = () => {
    setTimeout(() => injectLink(), 0);
  };

  const originalPushState = history.pushState.bind(history);
  history.pushState = function (...args) {
    originalPushState(...args);
    rerun();
  };

  const originalReplaceState = history.replaceState.bind(history);
  history.replaceState = function (...args) {
    originalReplaceState(...args);
    rerun();
  };

  window.addEventListener("popstate", rerun);
  window.addEventListener("hashchange", rerun);
}

console.debug("[letterboxd] script loaded, readyState:", document.readyState, "path:", location.pathname);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", installObservers, { once: true });
} else {
  installObservers();
}
