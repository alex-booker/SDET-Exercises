//import { test, expect } from '@playwright/test'; 


// ── Class ParenthesisValidator ──────────────────────────────────────
class ParenthesisValidator {
  diagnose(input: string): string {
    if (input === null || input === undefined) {
      throw new Error("Input cannot be null or undefined.");
    }
    if (input === "") {
      return "The string is empty — considered valid.";
    }

    const stack: string[] = [];
    const map: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

    for (const char of input) {
      if ('([{'.includes(char)) {
        stack.push(char);
      } else if (')]}'.includes(char)) {
        if (stack.pop() !== map[char]) {
          return `"${input}" has invalid parentheses.`;
        }
      }
    }

    return stack.length === 0
      ? `"${input}" has valid parentheses.`
      : `"${input}" has invalid parentheses.`;
  }
}

const { test, expect }  = require('@playwright/test');
const { LoginPage }     = require('../pages/LoginPage');
const { InventoryPage } = require('../pages/InventoryPage');
const { CartPage }      = require('../pages/CartPage');
const validator         = new ParenthesisValidator(); 


// ── Usuarios de prueba de Saucedo demo ────────────────────────────────────────
const admin_user   = 'performance_glitch_user';
const valid_user   = 'standard_user';
const invalid_user = 'locked_out_user';
const Password     = 'secret_sauce';
const firstName    = 'Mariana';
const LastName     = 'Testing';
const CodePostal   = '20089';

// ── Fixture: login reutilizable ────────────────────────────────────────────────
// En lugar de repetir el login en cada test, usamos un helper.
// Playwright auto-espera a que cada elemento esté listo antes de interactuar.
async function loginAs({ page, username = valid_user, password = Password }: { page: import('@playwright/test').Page; username?: string; password?: string; }) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(username, password);
}

// ── Cleanup global (equivalente a finally para todos los tests) ───
test.afterEach(async ({ page }, testInfo) => {
  console.log(`Cleanup: "${testInfo.title}" — ${testInfo.status}`);
 if (!testInfo.titlePath.some(t => t.includes('diagnose'))) {
  await page.goto('https://www.saucedemo.com/');
}
});


// ── Tests de login en saucedemo - Admin User ───────────────────────────────────────────────────── 
test('T01 - admin user can log in and sees dashboard', async ({ page }) => {
  const loginPage     = new LoginPage(page);
  const inventoryPage = new InventoryPage(page);
  await loginPage.goto();
  // Playwright auto-espera que los inputs sean visibles antes de fill()
  await loginPage.login(admin_user, Password);

  // Auto-espera a que la URL cambie y el título sea visible
  await expect(page).toHaveURL(/inventory/);
  await expect(inventoryPage.pageTitle).toHaveText('Products');

}); 

  // ── Tests de login en saucedemo - regular User ───────────────────────────────────────────────────── 
test('T02 - viewer user is redirected to read-only view', async ({ page }) => { 

  const loginPage     = new LoginPage(page);
  const inventoryPage = new InventoryPage(page);
  await loginPage.goto();
  // Playwright auto-espera que los inputs sean visibles antes de fill()
  await loginPage.login(valid_user, Password);

  // Auto-espera a que la URL cambie y el título sea visible
  await expect(page).toHaveURL(/inventory/);
  await expect(inventoryPage.pageTitle).toHaveText('Products');
}); 


  // ── Tests de login en saucedemo - Invalid User ───────────────────────────────────────────────────── 
test('T03 -User is invalid, not able to log in', async ({ page }) => { 

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(invalid_user, Password);

  // -- Synchronization & Waits - Validar que el mensaje de error se muestra correctamente ─────────────────────────────────────────────────────
  const error = loginPage.errorMessage;
  await expect(error).toBeVisible();
  await expect(error).toContainText('locked out');
  await expect(page.locator('path').first()).toBeVisible();
  await expect(page.locator('path').nth(1)).toBeVisible();

});


  // ── Tests de login en saucedemo - elegir un producto ───────────────────────────────────────────────────── 
test('T04 - User is able to select a product', async ({ page }) => { 

   await loginAs({ page });

  const inventoryPage = new InventoryPage(page);
  const cartPage      = new CartPage(page);
  const PRODUCT = 'Sauce Labs Backpack';

  // Auto-espera a que la URL cambie y el título sea visible
  await expect(page).toHaveURL(/inventory/);
  // -- Assertions - Validar que el número de productos se muestra correctamente ─────────────────────────────────────────────────────
  await expect(page.locator('[data-test="inventory-item"]')).toHaveCount(6);
  // -- Validar que los productos se muestran correctamente - Snapshoot ─────────────────────────────────────────────────────
  await expect(page.locator('[data-test="inventory-container"]')).toMatchAriaSnapshot(`
    - link "Sauce Labs Backpack":
      - /url: "#"
      - img "Sauce Labs Backpack"
    - link "Sauce Labs Backpack":
      - /url: "#"
    - text: /carry\\.allTheThings\\(\\) with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection\\. \\$\\d+\\.\\d+/
    - button "Add to cart"
    - link "Sauce Labs Bike Light":
      - /url: "#"
      - img "Sauce Labs Bike Light"
    - link "Sauce Labs Bike Light":
      - /url: "#"
    - text: /A red light isn't the desired state in testing but it sure helps when riding your bike at night\\. Water-resistant with 3 lighting modes, 1 AAA battery included\\. \\$\\d+\\.\\d+/
    - button "Add to cart"
    - link "Sauce Labs Bolt T-Shirt":
      - /url: "#"
      - img "Sauce Labs Bolt T-Shirt"
    - link "Sauce Labs Bolt T-Shirt":
      - /url: "#"
    - text: /Get your testing superhero on with the Sauce Labs bolt T-shirt\\. From American Apparel, \\d+% ringspun combed cotton, heather gray with red bolt\\. \\$\\d+\\.\\d+/
    - button "Add to cart"
    - link "Sauce Labs Fleece Jacket":
      - /url: "#"
      - img "Sauce Labs Fleece Jacket"
    - link "Sauce Labs Fleece Jacket":
      - /url: "#"
    - text: /It's not every day that you come across a midweight quarter-zip fleece jacket capable of handling everything from a relaxing day outdoors to a busy day at the office\\. \\$\\d+\\.\\d+/
    - button "Add to cart"
    - link "Sauce Labs Onesie":
      - /url: "#"
      - img "Sauce Labs Onesie"
    - link "Sauce Labs Onesie":
      - /url: "#"
    - text: /Rib snap infant onesie for the junior automation engineer in development\\. Reinforced 3-snap bottom closure, two-needle hemmed sleeved and bottom won't unravel\\. \\$\\d+\\.\\d+/
    - button "Add to cart"
    - link "Test.allTheThings() T-Shirt (Red)":
      - /url: "#"
      - img "Test.allTheThings() T-Shirt (Red)"
    - link "Test.allTheThings() T-Shirt (Red)":
      - /url: "#"
    - text: /This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard to automate a few tests\\. Super-soft and comfy ringspun combed cotton\\. \\$\\d+\\.\\d+/
    - button "Add to cart"
    `);
  // Agregar
  await inventoryPage.getAddToCartButton(PRODUCT).click();
  await expect(inventoryPage.cartBadge).toHaveText('1');

  // Ir al carrito
  await inventoryPage.goToCart();
  await expect(cartPage.pageTitle).toHaveText('Your Cart');

  // Verificar que el producto está en el carrito
  const items = await cartPage.getItemNames();
  expect(items).toContain(PRODUCT);

  // Remover desde el carrito
  await cartPage.getRemoveButton(PRODUCT).click();

  // Auto-espera a que el item desaparezca del DOM
  await expect(page.locator('.cart_item')).toHaveCount(0);

  // El badge del carrito ya no debe ser visible
  await expect(inventoryPage.cartBadge).not.toBeVisible();
 // -- logout ─────────────────────────────────────────────────────
  await page.locator('[data-test="checkout"]').click();


}); 


  // ── Tests de login en saucedemo - borrar un producto ───────────────────────────────────────────────────── 
test('User is able to delete a product', async ({ page }) => { 

 await loginAs({ page });

  const inventoryPage = new InventoryPage(page);
  const cartPage      = new CartPage(page);
  const PRODUCT = 'Sauce Labs Bike Light';

  // Agregar
  await inventoryPage.getAddToCartButton(PRODUCT).click();
  await expect(inventoryPage.cartBadge).toHaveText('1');

  // Ir al carrito
  await inventoryPage.goToCart();
  await expect(cartPage.pageTitle).toHaveText('Your Cart');

  // Verificar que el producto está en el carrito
  const items = await cartPage.getItemNames();
  expect(items).toContain(PRODUCT);

  // Remover desde el carrito
  await cartPage.getRemoveButton(PRODUCT).click();

  // Auto-espera a que el item desaparezca del DOM
  await expect(page.locator('.cart_item')).toHaveCount(0);

  // El badge del carrito ya no debe ser visible
  await expect(inventoryPage.cartBadge).not.toBeVisible();
}); 


// -- elegir un producto y dar checkout ─────────────────────────────────────────────────────
test('User is able to select a product and checkout', async ({ page }) => {
  
 await loginAs({ page });
  
  const inventoryPage = new InventoryPage(page);
  const cartPage      = new CartPage(page);
  const PRODUCT = 'Sauce Labs Fleece Jacket';

  // 1. Agregar producto
  await inventoryPage.getAddToCartButton(PRODUCT).click();
  await expect(inventoryPage.cartBadge).toHaveText('1');

  // 2. Ir al carrito
  await inventoryPage.goToCart();
  await expect(cartPage.pageTitle).toHaveText('Your Cart');

  // 3. Iniciar checkout
  await cartPage.startCheckout();
  await expect(page).toHaveURL(/checkout-step-one/);

  // 4. Llenar datos personales (Playwright auto-espera los inputs)
  await cartPage.fillCheckoutInfo('Mariana', 'Testing', '20089');
  await expect(page).toHaveURL(/checkout-step-two/);

  // 5. Verificar resumen y confirmar orden
  await expect(cartPage.summaryTotal).toBeVisible();
  await cartPage.finishCheckout();

  // 6. Verificar pantalla de confirmación
  await expect(page).toHaveURL(/checkout-complete/);
  await expect(cartPage.confirmationHeader).toHaveText('Thank you for your order!');
});  



// ── Tests de lógica Parentesis: diagnose() ───────────────────────────────
test.describe("diagnose()", () => {
  test("should return valid message for correct brackets", () => {
    const result = validator.diagnose("()[]{}");
    expect(result).toBe('"()[]{}\" has valid parentheses.');
  });

  test("should return invalid message for incorrect brackets", () => {
    const result = validator.diagnose("(]");
    expect(result).toBe('"(]" has invalid parentheses.');
  });

  test("should handle empty string in diagnose", () => {
    const result = validator.diagnose("");
    expect(result).toBe("The string is empty — considered valid.");
  });

  test("should throw in diagnose when input is null", () => {
    expect(() => validator.diagnose(null as unknown as string)).toThrow(
      "Input cannot be null or undefined."
    );
  });
});