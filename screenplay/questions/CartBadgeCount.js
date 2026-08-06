// screenplay/questions/CartBadgeCount.js
// ── Screenplay Pattern — Question ────────────────────────────────────────
// Una Question consulta el estado de la aplicación SIN modificarlo. Se usa
// como `await actor.asks(CartBadgeCount.value())` dentro de un `expect()`.

const { BrowseTheWeb } = require('../abilities/BrowseTheWeb');
const { InventoryPage } = require('../../pages/InventoryPage');

class CartBadgeCount {
  static value() {
    return new CartBadgeCount();
  }

  /** @param {import('../Actor').Actor} actor */
  async answeredBy(actor) {
    const { page } = actor.abilityTo(BrowseTheWeb);
    const inventoryPage = new InventoryPage(page);
    return inventoryPage.getCartCount();
  }
}

module.exports = { CartBadgeCount };
