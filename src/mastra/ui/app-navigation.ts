export type GreatQuestionsPage =
  | "architecture"
  | "demo"
  | "podcast-prep"
  | "research";

const navigationItems = [
  { href: "/great-questions", id: "research", label: "Research" },
  { href: "/podcast-prep", id: "podcast-prep", label: "Podcast prep" },
  { href: "/demo", id: "demo", label: "Memory story" },
  { href: "/architecture", id: "architecture", label: "Architecture" },
] as const;

export const appNavigationCss = String.raw`
  .gq-nav {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .gq-nav a {
    padding: 7px 10px;
    border: 1px solid var(--line);
    border-radius: 999px;
    color: var(--soft, var(--ink-soft));
    text-decoration: none;
    white-space: nowrap;
    font-size: 10px;
    line-height: 1.2;
    transition: color 150ms ease, border-color 150ms ease, background 150ms ease;
  }
  .gq-nav a:hover,
  .gq-nav a[aria-current="page"] {
    color: var(--ink);
    border-color: color-mix(in srgb, var(--nav-tone, var(--mint, var(--green))) 48%, transparent);
    background: color-mix(in srgb, var(--nav-tone, var(--mint, var(--green))) 7%, transparent);
  }
  .gq-nav .studio-link { color: var(--nav-tone, var(--mint, var(--green))); }
  @media (max-width: 760px) {
    .gq-nav {
      width: 100%;
      overflow-x: auto;
      padding-bottom: 2px;
      scrollbar-width: none;
    }
    .gq-nav::-webkit-scrollbar { display: none; }
  }
`;

export const appHeaderCss = String.raw`
  ${appNavigationCss}
  .gq-app-header {
    height: auto;
    width: 100%;
    min-width: 0;
    min-height: 68px;
    padding: 12px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    position: sticky;
    top: 0;
    z-index: 20;
    border-bottom: 1px solid var(--line);
    background: color-mix(in srgb, var(--night, var(--bg)) 88%, transparent);
    backdrop-filter: blur(18px);
  }
  .gq-app-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--ink);
    text-decoration: none;
    white-space: nowrap;
  }
  .gq-app-mark {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border: 1px solid color-mix(in srgb, var(--nav-tone, var(--mint, var(--green))) 52%, transparent);
    border-radius: 50%;
    color: var(--nav-tone, var(--mint, var(--green)));
    background: color-mix(in srgb, var(--nav-tone, var(--mint, var(--green))) 4%, transparent);
    font: 18px Georgia, "Times New Roman", serif;
  }
  .gq-app-brand strong,
  .gq-app-brand span { display: block; }
  .gq-app-brand strong { font-size: 13px; letter-spacing: .01em; }
  .gq-app-brand span { color: var(--soft, var(--ink-soft)); font-size: 9px; letter-spacing: .09em; text-transform: uppercase; }
  @media (max-width: 760px) {
    .gq-app-header {
      min-height: 0;
      padding: 11px 16px 10px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .gq-app-header .gq-nav { width: 100%; max-width: 100%; flex: 1 1 100%; }
  }
`;

export function renderAppNavigation(activePage: GreatQuestionsPage): string {
  const links = navigationItems.map((item) => {
    const current = item.id === activePage ? ' aria-current="page"' : "";
    return `<a href="${item.href}"${current}>${item.label}</a>`;
  });

  links.push(
    '<a class="studio-link" href="/agents" target="_blank" rel="noreferrer">Studio ↗</a>',
  );

  return `<nav class="gq-nav" aria-label="Primary">${links.join("")}</nav>`;
}

export function renderAppHeader(activePage: GreatQuestionsPage): string {
  return `<header class="gq-app-header"><a class="gq-app-brand" href="/great-questions"><span class="gq-app-mark">GQ</span><span><strong>Great Questions AI</strong><span>Evidence memory for better questions</span></span></a>${renderAppNavigation(activePage)}</header>`;
}
