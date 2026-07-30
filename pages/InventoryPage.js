// pages/InventoryPage.js
// Page Object: catálogo de productos tras hacer login.
//
// `product(name)` reemplaza a los antiguos getAddToCartButton()/getRemoveButton():
// devuelve un ProductItemComponent (component object) en vez de un locator suelto.
// `goToCart()` encadena hacia CartPage.

const { BasePage } = require('./BasePage');
const { CartPage } = require('./CartPage');
const { ProductItemComponent } = require('../components/ProductItemComponent');

class InventoryPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    // ── Locators ────────────────────────────────────────────────────
    this.cartBadge       = page.locator('.shopping_cart_badge');
    this.cartIcon        = page.locator('.shopping_cart_link');
    this.inventoryItems  = page.locator('.inventory_item');
  }

  /**
   * Devuelve el componente de un producto del catálogo por su nombre exacto.
   * @param {string} productName  Ej: 'Sauce Labs Backpack'
   */
  product(productName) {
    return new ProductItemComponent(this.page, '.inventory_item', productName);
  }

  /** Navega al carrito */
  async goToCart() {
    await this.cartIcon.click();
    return new CartPage(this.page);
  }

  /** Devuelve el número en el badge del carrito (0 si está vacío) */
  async getCartCount() {
    const visible = await this.cartBadge.isVisible();
    if (!visible) return 0;
    const text = await this.cartBadge.textContent();
    return parseInt(text, 10);
  }
}

module.exports = { InventoryPage };
