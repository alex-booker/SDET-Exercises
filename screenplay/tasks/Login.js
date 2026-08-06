// screenplay/tasks/Login.js
// ── Screenplay Pattern — Task ────────────────────────────────────────────
// Una Task representa una intención de negocio de alto nivel ("iniciar
// sesión"), no un `fill()` + `click()` sueltos. Por dentro reutiliza el
// Page Object existente (LoginPage) para no duplicar selectores: Screenplay
// no reemplaza al POM, se apoya en él.

const { BrowseTheWeb } = require('../abilities/BrowseTheWeb');
const { LoginPage } = require('../../pages/LoginPage');

class Login {
  constructor(username, password) {
    this.username = username;
    this.password = password;
  }

  static withCredentials(username, password) {
    return new Login(username, password);
  }

  /** @param {import('../Actor').Actor} actor */
  async performAs(actor) {
    const { page } = actor.abilityTo(BrowseTheWeb);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(this.username, this.password);
  }
}

module.exports = { Login };
