// pages/CartPage.js
// Page Object: página del carrito de compras.

class CartPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Locators ────────────────────────────────────────────────────
    this.pageTitle       = page.locator('.title');
    this.cartItems       = page.locator('.cart_item');
    this.checkoutButton  = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');

    // Checkout step 1
    this.firstNameInput  = page.locator('[data-test="firstName"]');
    this.lastNameInput   = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton  = page.locator('[data-test="continue"]');

    // Checkout step 2 (overview)
    this.finishButton    = page.locator('[data-test="finish"]');
    this.summaryTotal    = page.locator('.summary_total_label');

    // Checkout completo
    this.confirmationHeader = page.locator('.complete-header');
  }

  /**
   * Devuelve el botón "Remove" de un item en el carrito por nombre.
   * @param {string} productName
   */
  getRemoveButton(productName) {
    return this.page
      .locator('.cart_item')
      .filter({ hasText: productName })
      .locator('button');
  }

  /** Devuelve los nombres de todos los productos en el carrito */
  async getItemNames() {
    return this.cartItems.locator('.inventory_item_name').allTextContents();
  }

  /** Inicia el proceso de checkout */
  async startCheckout() {
    await this.checkoutButton.click();
  }

  /**
   * Rellena los datos personales del checkout (paso 1)
   * @param {string} firstName
   * @param {string} lastName
   * @param {string} postalCode
   */
  async fillCheckoutInfo(firstName, lastName, postalCode) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.postalCodeInput.fill(postalCode);
    await this.continueButton.click();
  }

  /** Confirma la orden en el paso 2 (overview) */
  async finishCheckout() {
    await this.finishButton.click();
  }
}

module.exports =  { CartPage };

