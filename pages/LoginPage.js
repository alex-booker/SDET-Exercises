// pages/LoginPage.js
// Page Object: encapsula todos los selectores y acciones de la página de login.
// Si SauceDemo cambia un selector, solo se edita aquí.

class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

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
    await this.page.goto('/');
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
  }

  /** Devuelve el texto del mensaje de error (si existe) */
  async getErrorMessage() {
    return this.errorMessage.textContent();
  }
}

module.exports = { LoginPage };  // 
