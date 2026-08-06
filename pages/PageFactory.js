// pages/PageFactory.js
// ── Patrón Page Factory ──────────────────────────────────────────────────
// En los tests actuales (01-front_end.spec.ts) cada Page Object se crea a
// mano en cada test: `new LoginPage(page)`, `new InventoryPage(page)`, etc.
// La PageFactory centraliza esa creación y además CACHEA la instancia por
// cada `page` de Playwright, de modo que si dos pasos del mismo test piden
// `factory.cartPage` reciben el mismo objeto en lugar de crear uno nuevo.
//
// Es el equivalente en JS/TS al `PageFactory.initElements(driver, this)` de
// Selenium/Java: allá se usa para inicializar los `@FindBy` con anotaciones;
// aquí, como Playwright ya resuelve los locators de forma perezosa (lazy),
// lo que la fábrica aporta es la inicialización y el cacheo centralizados.

const { LoginPage } = require('./LoginPage');
const { InventoryPage } = require('./InventoryPage');
const { CartPage } = require('./CartPage');

class PageFactory {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this._cache = new Map();
  }

  _get(PageClass) {
    if (!this._cache.has(PageClass)) {
      this._cache.set(PageClass, new PageClass(this.page));
    }
    return this._cache.get(PageClass);
  }

  get loginPage() {
    return this._get(LoginPage);
  }

  get inventoryPage() {
    return this._get(InventoryPage);
  }

  get cartPage() {
    return this._get(CartPage);
  }
}

module.exports = { PageFactory };
