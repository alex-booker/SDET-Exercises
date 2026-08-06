// steps/login.steps.js
//
// NOTA (entregable BDD, agregado 03/08/2026): step definitions para
// features/login.feature. Usamos `createBdd()` de playwright-bdd (en vez del
// Given/When/Then de @cucumber/cucumber a secas) para que cada step reciba
// el fixture `page` de Playwright Test directamente — sin tener que escribir
// un World/hooks propio para abrir y cerrar el browser a mano.
//
// La regla de la trampa que evitamos aquí: estos steps NO son un test ya
// escrito envuelto en Gherkin después. Reutilizan pages/LoginPage.js tal
// cual, sin agregar ningún selector o lógica de aserción que no exista ya.

const { createBdd } = require('playwright-bdd');
const { expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');

const { Given, When, Then } = createBdd();

Given('I am on the login page', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
});

When('I log in as {string} with password {string}', async ({ page }, username, password) => {
  const loginPage = new LoginPage(page);
  await loginPage.login(username, password);
});

Then('I should see the product inventory page', async ({ page }) => {
  await expect(page).toHaveURL(/inventory\.html/);
});

Then('I should see the error message {string}', async ({ page }, expectedMessage) => {
  const loginPage = new LoginPage(page);
  const actualMessage = await loginPage.getErrorMessage();
  expect(actualMessage).toContain(expectedMessage);
});
