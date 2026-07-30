// components/ProductItemComponent.js
// Component Object: representa la fila/card de UN producto, sin importar si
// aparece en el catálogo (`.inventory_item`) o en el carrito (`.cart_item`).
// Antes, InventoryPage.getAddToCartButton() y CartPage.getRemoveButton()
// duplicaban exactamente el mismo `.filter({hasText}).locator('button')`
// en dos clases distintas. Este componente se instancia una vez por
// producto y se reutiliza desde cualquier página que muestre esa fila.

class ProductItemComponent {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} containerSelector  Ej: '.inventory_item' o '.cart_item'
   * @param {string} productName        Ej: 'Sauce Labs Backpack'
   */
  constructor(page, containerSelector, productName) {
    this.root = page.locator(containerSelector).filter({ hasText: productName });
    this.nameLabel = this.root.locator('.inventory_item_name');
    this.actionButton = this.root.locator('button');
  }

  /** El botón alterna entre "Add to cart" y "Remove" según el estado del producto. */
  async addToCart() {
    await this.actionButton.click();
  }

  async remove() {
    await this.actionButton.click();
  }

  async getName() {
    return this.nameLabel.textContent();
  }
}

module.exports = { ProductItemComponent };
