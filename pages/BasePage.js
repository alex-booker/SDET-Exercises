// pages/BasePage.js
// Clase base de la que heredan todas las páginas. Centraliza lo que es común
// a cualquier página de la app: la navegación y el título de encabezado
// (`.title`), que antes se repetía idéntico en InventoryPage y CartPage.

class BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.pageTitle = page.locator('.title');
  }

  /** @param {string} path */
  async goto(path = '/') {
    await this.page.goto(path);
    return this;
  }
}

module.exports = { BasePage };
