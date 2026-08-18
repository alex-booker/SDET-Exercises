// tests/06-cart-continue-shopping.spec.ts
//
// Verifica que el botón "Continue Shopping" del carrito regresa al usuario
// a la página de inventario/productos. El locator `continueShoppingButton`
// ya existía en CartPage pero no tenía un método asociado; se agregó
// `continueShopping()` (retorna la InventoryPage encadenada, igual que
// `login()`/`goToCart()`) para no resolver el locator a mano desde el test.

const { test, expect } = require('@playwright/test');

const { TestConfig } = require('../support/TestConfig');
const { LoginPage } = require('../pages/LoginPage');

const PRODUCT = 'Sauce Labs Backpack';

test('T06 - Continue Shopping en el carrito regresa al inventario', async ({ page }) => {
  const config = TestConfig.getInstance();
  const { username, password } = config.users.standard;

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  const inventoryPage = await loginPage.login(username, password);
  await expect(page).toHaveURL(/inventory/);

  // Agregar un producto y entrar al carrito (encadenado: goToCart() retorna CartPage)
  await inventoryPage.product(PRODUCT).addToCart();
  const cartPage = await inventoryPage.goToCart();
  await expect(cartPage.pageTitle).toHaveText('Your Cart');

  // "Continue Shopping" debe regresar al catálogo de productos
  const backToInventory = await cartPage.continueShopping();

  await expect(page).toHaveURL(/inventory/);
  await expect(backToInventory.pageTitle).toHaveText('Products');
});
