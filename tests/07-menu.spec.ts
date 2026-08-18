// tests/07-menu.spec.ts
//
// Ejercita cada método de MenuPage.js (generado a ciegas). No se editó
// después de la primera corrida — ver MENU-PAGE-AUDIT.md para el resultado.

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { MenuPage } = require('../pages/MenuPage');

test.describe('MenuPage (AI-generated, unverified locators)', () => {
  test('opens and closes the menu', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    const menuPage = new MenuPage(page);
    await menuPage.open();
    await expect(menuPage.allItemsLink).toBeVisible();

    await menuPage.close();
    await expect(menuPage.allItemsLink).not.toBeVisible();
  });

  test('"All Items" returns to the inventory page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    const menuPage = new MenuPage(page);
    await menuPage.open();
    const inventoryPage = await menuPage.goToAllItems();

    await expect(page).toHaveURL(/inventory/);
    await expect(inventoryPage.pageTitle).toHaveText('Products');
  });

  test('"Reset App State" clears the cart badge', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    const inventoryPage = await loginPage.login('standard_user', 'secret_sauce');

    await inventoryPage.product('Sauce Labs Backpack').addToCart();
    await expect(inventoryPage.cartBadge).toHaveText('1');

    const menuPage = new MenuPage(page);
    await menuPage.open();
    await menuPage.resetAppState();
    await menuPage.close();

    await expect(inventoryPage.cartBadge).not.toBeVisible();
  });

  test('"Logout" returns to the login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    const menuPage = new MenuPage(page);
    await menuPage.open();
    const backToLogin = await menuPage.logout();

    await expect(page).toHaveURL('https://www.saucedemo.com/');
    await expect(backToLogin.loginButton).toBeVisible();
  });
});
