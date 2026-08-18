// pages/MenuPage.js
// Page Object: menú hamburguesa (All Items / About / Logout / Reset App State).
//
// EJERCICIO: "Generate a page object for one screen with AI. Audit every
// locator." Escrito A CIEGAS, de memoria, sin inspeccionar el DOM real
// primero. La auditoría de cada locator está en MENU-PAGE-AUDIT.md.

const { BasePage } = require('./BasePage');
const { InventoryPage } = require('./InventoryPage');
const { LoginPage } = require('./LoginPage');

class MenuPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    // ── Locators ────────────────────────────────────────────────────
    // Los botones del propio burger menu (librería react-burger-menu) no
    // tienen data-test — su `id` es la única opción real, así que se queda.
    this.openMenuButton  = page.locator('#react-burger-menu-btn');
    this.closeMenuButton = page.locator('#react-burger-cross-btn');

    // Los 4 links del sidebar SÍ tienen data-test (consistente con el resto
    // del repo) — corregido tras la auditoría, ver MENU-PAGE-AUDIT.md.
    this.allItemsLink   = page.locator('[data-test="inventory-sidebar-link"]');
    this.aboutLink      = page.locator('[data-test="about-sidebar-link"]');
    this.logoutLink     = page.locator('[data-test="logout-sidebar-link"]');
    this.resetStateLink = page.locator('[data-test="reset-sidebar-link"]');
  }

  /** Abre el menú hamburguesa. */
  async open() {
    await this.openMenuButton.click();
    return this;
  }

  /** Cierra el menú hamburguesa. */
  async close() {
    await this.closeMenuButton.click();
    return this;
  }

  /** "All Items" — regresa al catálogo de productos. */
  async goToAllItems() {
    await this.allItemsLink.click();
    return new InventoryPage(this.page);
  }

  /** "Logout" — cierra sesión y regresa al login. */
  async logout() {
    await this.logoutLink.click();
    return new LoginPage(this.page);
  }

  /** "Reset App State" — limpia el carrito/estado sin salir de la página actual. */
  async resetAppState() {
    await this.resetStateLink.click();
    return this;
  }

  /**
   * "About" — navega a saucelabs.com EN LA MISMA PESTAÑA (el link no tiene
   * target="_blank"), no a una pantalla de esta app — así que no hay un
   * Page Object de este repo que retornar, y `this.page` queda apuntando a
   * un dominio totalmente distinto después de llamar esto.
   */
  async clickAbout() {
    await this.aboutLink.click();
  }
}

module.exports = { MenuPage };
