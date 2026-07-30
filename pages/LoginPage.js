// pages/LoginPage.js
// Page Object: encapsula todos los selectores y acciones de la página de login.
// Si SauceDemo cambia un selector, solo se edita aquí.
//
// Capa "chained page objects": login() retorna la InventoryPage a la que la
// app navega, para poder escribir `const inventoryPage = await loginPage.login(...)`
// en lugar de instanciar InventoryPage a mano en cada test.

const { BasePage } = require('./BasePage');
const { InventoryPage } = require('./InventoryPage');

class LoginPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    // ── Locators ────────────────────────────────────────────────────
    // Playwright auto-espera a que estos elementos sean visibles/habilitados
    // antes de interactuar con ellos. No necesitamos waitFor() manuales.
    this.usernameInput  = page.locator('[data-test="username"]');
    this.passwordInput  = page.locator('[data-test="password"]');
    this.loginButton    = page.locator('[data-test="login-button"]');
    this.errorMessage   = page.locator('[data-test="error"]');
  }

  /** Navega a la página de login */
  async goto() {
    await super.goto('/');
    return this;
  }

  /**
   * Rellena el formulario y hace clic en Login.
   * @param {string} username
   * @param {string} password
   */
  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    // Si el login falla (usuario inválido/bloqueado) la app se queda en esta
    // misma pantalla; el test seguirá usando `loginPage.errorMessage`
    // directamente en vez del objeto retornado aquí.
    return new InventoryPage(this.page);
  }

  /** Devuelve el texto del mensaje de error (si existe) */
  async getErrorMessage() {
    return this.errorMessage.textContent();
  }
}

module.exports = { LoginPage };
