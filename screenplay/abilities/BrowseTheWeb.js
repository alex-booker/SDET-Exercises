// screenplay/abilities/BrowseTheWeb.js
// ── Screenplay Pattern — Ability ─────────────────────────────────────────
// Una "Ability" describe algo que un Actor PUEDE hacer. Aquí, la capacidad
// de navegar la web usando la `page` de Playwright. Si mañana necesitas un
// actor que actúe vía API en lugar de UI, le darías otra Ability (p. ej.
// `CallAnApi`) sin tocar las Tasks que no dependen de la UI.

class BrowseTheWeb {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  /** @param {import('@playwright/test').Page} page */
  static using(page) {
    return new BrowseTheWeb(page);
  }
}

module.exports = { BrowseTheWeb };
