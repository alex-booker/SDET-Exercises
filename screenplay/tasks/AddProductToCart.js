// screenplay/tasks/AddProductToCart.js
const { BrowseTheWeb } = require('../abilities/BrowseTheWeb');
const { InventoryPage } = require('../../pages/InventoryPage');

class AddProductToCart {
  constructor(productName) {
    this.productName = productName;
  }

  static named(productName) {
    return new AddProductToCart(productName);
  }

  /** @param {import('../Actor').Actor} actor */
  async performAs(actor) {
    const { page } = actor.abilityTo(BrowseTheWeb);
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.product(this.productName).addToCart();
  }
}

module.exports = { AddProductToCart };
