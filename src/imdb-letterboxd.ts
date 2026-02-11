const LINK_ID = "tm-letterboxd-link";

function parseTitle(): string | null {
  const ogTitle = document
    .querySelector('meta[property="og:title"]')
    ?.getAttribute("content")
    ?.trim();

  if (!ogTitle) {
    return null;
  }

  return ogTitle
    .replace(/\s*-\s*IMDb\s*$/i, "")
    .replace(/\s*\(\d{4}\)\s*$/, "")
    .trim();
}

function linkAlreadyExists(): boolean {
  return Boolean(document.getElementById(LINK_ID));
}

function findMountTarget(): Element | null {
  return (
    document.querySelector('[data-testid="hero-subnav-bar-all-links"]') ??
    document.querySelector('[data-testid="hero-title-block__metadata"]') ??
    document.querySelector('h1[data-testid="hero__pageTitle"]')?.parentElement ??
    null
  );
}

function createLink(title: string): HTMLAnchorElement {
  const link = document.createElement("a");
  link.id = LINK_ID;
  link.href = `https://letterboxd.com/search/${encodeURIComponent(title)}/`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Letterboxd";
  link.style.display = "inline-flex";
  link.style.alignItems = "center";
  link.style.justifyContent = "center";
  link.style.padding = "6px 12px";
  link.style.marginLeft = "8px";
  link.style.borderRadius = "999px";
  link.style.fontSize = "13px";
  link.style.fontWeight = "600";
  link.style.textDecoration = "none";
  link.style.background = "#f5c518";
  link.style.color = "#111";

  return link;
}

function injectLink(): void {
  if (linkAlreadyExists()) {
    return;
  }

  const title = parseTitle();
  const mount = findMountTarget();

  if (!title || !mount) {
    return;
  }

  mount.appendChild(createLink(title));
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
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", installObservers, { once: true });
} else {
  installObservers();
}
