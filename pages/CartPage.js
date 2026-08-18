// pages/CartPage.js
// Page Object: carrito de compras y flujo de checkout.
//
// `product(name)` reemplaza a getRemoveButton() con el mismo ProductItemComponent
// que usa InventoryPage. Las acciones de checkout retornan `this` porque
// siguen operando sobre la misma familia de pantallas (checkout-step-*).
// `continueShopping()` sí es una navegación real hacia otra pantalla, así que
// retorna la InventoryPage encadenada (mismo patrón que `login()`/`goToCart()`).

const { BasePage } = require('./BasePage');
const { ProductItemComponent } = require('../components/ProductItemComponent');

class CartPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    // ── Locators ────────────────────────────────────────────────────
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
   * Devuelve el componente de un producto del carrito por su nombre.
   * @param {string} productName
   */
  product(productName) {
    return new ProductItemComponent(this.page, '.cart_item', productName);
  }

  /** Devuelve los nombres de todos los productos en el carrito */
  async getItemNames() {
    return this.cartItems.locator('.inventory_item_name').allTextContents();
  }

  /** Inicia el proceso de checkout */
  async startCheckout() {
    await this.checkoutButton.click();
    return this;
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
    return this;
  }

  /** Confirma la orden en el paso 2 (overview) */
  async finishCheckout() {
    await this.finishButton.click();
    return this;
  }

  /**
   * Navega de vuelta al catálogo de productos.
   * `require` diferido (dentro del método, no en el top del archivo) para
   * evitar un require circular con InventoryPage, que ya importa CartPage
   * a nivel de módulo — para cuando este método se invoca en runtime ambos
   * módulos ya terminaron de cargar, así que el require solo devuelve la
   * versión cacheada.
   */
  async continueShopping() {
    await this.continueShoppingButton.click();
    const { InventoryPage } = require('./InventoryPage');
    return new InventoryPage(this.page);
  }
}

module.exports = { CartPage };
