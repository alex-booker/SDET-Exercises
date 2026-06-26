// pages/InventoryPage.js
// Page Object: catálogo de productos tras hacer login.

class InventoryPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Locators ────────────────────────────────────────────────────
    this.pageTitle       = page.locator('.title');
    this.cartBadge       = page.locator('.shopping_cart_badge');
    this.cartIcon        = page.locator('.shopping_cart_link');
    this.inventoryItems  = page.locator('.inventory_item');
  }

  /**
   * Devuelve el botón "Add to cart" de un producto por su nombre exacto.
   * Playwright sube desde el texto del nombre hasta el contenedor del item
   * y busca el botón dentro de ese contenedor.
   *
   * @param {string} productName  Ej: 'Sauce Labs Backpack'
   */
  getAddToCartButton(productName) {
    return this.page
      .locator('.inventory_item')
      .filter({ hasText: productName })
      .locator('button');
  }

  /**
   * Devuelve el botón "Remove" de un producto por su nombre.
   * @param {string} productName
   */
  getRemoveButton(productName) {
    return this.page
      .locator('.inventory_item')
      .filter({ hasText: productName })
      .locator('button');
  }

  /** Navega al carrito */
  async goToCart() {
    await this.cartIcon.click();
  }

  /** Devuelve el número en el badge del carrito (null si está vacío) */
  async getCartCount() {
    const visible = await this.cartBadge.isVisible();
    if (!visible) return 0;
    const text = await this.cartBadge.textContent();
    return parseInt(text, 10);
  }
}

module.exports = { InventoryPage };
