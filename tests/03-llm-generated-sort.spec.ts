// tests/03-llm-generated-sort.spec.ts
//
// EJERCICIO: "Ask an LLM to write a test for a real page you control. Run it.
// Note what it got wrong."
//
// Este archivo se escribió A CIEGAS: sin abrir el navegador, sin inspeccionar
// el DOM real de https://www.saucedemo.com/inventory.html, y sin correr los
// tests hasta que este archivo estuviera terminado. Solo se usó "memoria"
// general sobre cómo suele estar armado el dropdown de orden de SauceDemo.
// El login SÍ reutiliza LoginPage (ya verificado en ejercicios anteriores de
// este mismo proyecto), porque el objetivo del experimento es el dropdown de
// orden, no volver a adivinar el login.
//
// NO EDITAR selectores/asserts aquí después de correrlo la primera vez — los
// resultados de esa primera corrida son el material del ejercicio.

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');

const SORT_DROPDOWN = '[data-test="product-sort-container"]';

test.describe('Product sort dropdown (LLM-generated, unverified)', () => {
  test('defaults to Name (A to Z) on page load', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    const sortDropdown = page.locator(SORT_DROPDOWN);
    await expect(sortDropdown).toHaveValue('az');
  });

  test('lists the four expected sort options with their exact labels', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    const options = page.locator(`${SORT_DROPDOWN} option`);
    await expect(options).toHaveText([
      'Name (A to Z)',
      'Name (Z to A)',
      'Price (low to high)',
      'Price (high to low)',
    ]);
  });

  test('sorting by Name (Z to A) reverses the product list', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    const names = page.locator('.inventory_item_name');
    const originalNames = await names.allTextContents();

    await page.locator(SORT_DROPDOWN).selectOption('za');

    const sortedNames = await names.allTextContents();
    expect(sortedNames).toEqual([...originalNames].sort().reverse());
  });

  test('sorting by Price (low to high) orders items ascending', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    await page.locator(SORT_DROPDOWN).selectOption('lohi');

    const priceTexts = await page.locator('.inventory_item_price').allTextContents();
    const prices = priceTexts.map((p) => parseFloat(p.replace('$', '')));

    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('sorting by Price (high to low) orders items descending', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    await page.locator(SORT_DROPDOWN).selectOption('hilo');

    const priceTexts = await page.locator('.inventory_item_price').allTextContents();
    const prices = priceTexts.map((p) => parseFloat(p.replace('$', '')));

    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });
});

// ── Segundo intento a ciegas: asumiendo comportamiento uniforme entre roles ──
// Hipótesis (sin verificar): problem_user ordena igual que standard_user y
// muestra una imagen distinta por producto, igual que cualquier otro usuario.
test.describe('Product sort dropdown with problem_user (LLM-generated, unverified)', () => {
  // Ambos tests de este describe fallaron en la primera corrida: la hipótesis
  // ("problem_user se comporta igual que standard_user") era incorrecta.
  // Se dejan marcados como fallo esperado en vez de arreglarlos o borrarlos,
  // para que documenten el bug real de SauceDemo sin romper el CI. Ver
  // LLM-EXERCISE-NOTES.md para el análisis completo.

  test.fail('sorting by Name (Z to A) reverses the product list for problem_user too', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('problem_user', 'secret_sauce');

    const names = page.locator('.inventory_item_name');
    const originalNames = await names.allTextContents();

    await page.locator(SORT_DROPDOWN).selectOption('za');

    const sortedNames = await names.allTextContents();
    // BUG REAL: para problem_user, seleccionar el dropdown no reordena nada;
    // la lista se queda en el orden original (A-Z).
    expect(sortedNames).toEqual([...originalNames].sort().reverse());
  });

  test.fail('each product shows a distinct image for problem_user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('problem_user', 'secret_sauce');

    const imageSources = await page.locator('.inventory_item_img img').evaluateAll(
      (imgs) => imgs.map((img) => img.getAttribute('src'))
    );

    // BUG REAL: las 6 imágenes de producto comparten el mismo src para
    // problem_user (todas muestran la misma imagen de perro).
    expect(new Set(imageSources).size).toBe(imageSources.length);
  });
});
