// tests/02-design-patterns-demo.spec.ts
//
// Este archivo NO reemplaza a 01-front_end.spec.ts (que ya usa Page Object
// Model "a mano"). Es material didáctico: el mismo flujo de negocio
// (login -> agregar producto -> ver carrito) resuelto con distintos
// patrones, para poder comparar directamente.
//
//   T-PF-01  -> Singleton + Page Factory
//   T-SP-01  -> Singleton + Screenplay Pattern

const { test, expect } = require('@playwright/test');

const { TestConfig } = require('../support/TestConfig');
const { PageFactory } = require('../pages/PageFactory');

const { Actor } = require('../screenplay/Actor');
const { BrowseTheWeb } = require('../screenplay/abilities/BrowseTheWeb');
const { Login } = require('../screenplay/tasks/Login');
const { AddProductToCart } = require('../screenplay/tasks/AddProductToCart');
const { CartBadgeCount } = require('../screenplay/questions/CartBadgeCount');

const PRODUCT = 'Sauce Labs Backpack';

test.describe('Singleton + Page Factory', () => {
  test('T-PF-01 - agrega un producto al carrito usando la PageFactory', async ({ page }) => {
    // ── Singleton ──────────────────────────────────────────────────────
    // Misma instancia de configuración que usaría cualquier otro archivo
    // que llame a TestConfig.getInstance().
    const config = TestConfig.getInstance();
    const { username, password } = config.users.standard;

    // ── Page Factory ───────────────────────────────────────────────────
    // Una sola fábrica por test; cada `factory.xPage` se crea una vez y
    // se reutiliza (compárese con `new LoginPage(page)` repetido en
    // 01-front_end.spec.ts).
    const factory = new PageFactory(page);

    await factory.loginPage.goto();
    await factory.loginPage.login(username, password);
    await expect(page).toHaveURL(/inventory/);

    await factory.inventoryPage.product(PRODUCT).addToCart();
    await expect(factory.inventoryPage.cartBadge).toHaveText('1');

    await factory.inventoryPage.goToCart();
    const items = await factory.cartPage.getItemNames();
    expect(items).toContain(PRODUCT);
  });
});

test.describe('Singleton + Screenplay Pattern', () => {
  test('T-SP-01 - agrega un producto al carrito usando actores y tasks', async ({ page }) => {
    // ── Singleton ──────────────────────────────────────────────────────
    const config = TestConfig.getInstance();
    const { username, password } = config.users.standard;

    // ── Screenplay ─────────────────────────────────────────────────────
    // El test se lee como una historia de negocio: "Mariana puede navegar
    // la web, intenta iniciar sesión y agregar un producto, luego se le
    // pregunta cuántos artículos tiene en el carrito."
    const mariana = Actor.named('Mariana').whoCan(BrowseTheWeb.using(page));

    await mariana.attemptsTo(
      Login.withCredentials(username, password),
      AddProductToCart.named(PRODUCT)
    );

    const cartCount = await mariana.asks(CartBadgeCount.value());
    expect(cartCount).toBe(1);
  });
});
