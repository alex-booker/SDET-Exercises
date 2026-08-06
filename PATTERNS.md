# Design Patterns en este proyecto

Este documento explica los patrones de diseño usados en la suite de automatización,
con ejemplos tomados directamente del código de este repo. La app bajo prueba es
[saucedemo.com](https://www.saucedemo.com).

Hay dos implementaciones del mismo flujo de negocio (login → agregar producto →
ver carrito) para poder comparar los patrones lado a lado:

| Test | Patrones usados |
|---|---|
| `tests/01-front_end.spec.ts` | POM en capas: BasePage + páginas encadenadas + Component Object |
| `tests/02-design-patterns-demo.spec.ts` → `T-PF-01` | Singleton + Page Factory |
| `tests/02-design-patterns-demo.spec.ts` → `T-SP-01` | Singleton + Screenplay Pattern |

Para correr solo la demo de patrones:

```bash
npx playwright test tests/02-design-patterns-demo.spec.ts
```

---

## Page Object Model (POM)

**Dónde:** `pages/LoginPage.js`, `pages/InventoryPage.js`, `pages/CartPage.js`

Cada página de la app es una clase que encapsula sus selectores y las acciones
posibles sobre ella. Los tests no conocen selectores CSS, solo llaman métodos
como `loginPage.login(user, pass)`.

```js
const loginPage = new LoginPage(page);
await loginPage.goto();
await loginPage.login(username, password);
```

**Por qué es el estándar de facto:** si SauceDemo cambia el `id` de un botón,
se corrige en un solo lugar (la clase), no en cada test que lo use. Casi todo
framework de testing (Selenium, Cypress, Playwright) asume este patrón como base.

**Limitación que motivó el refactor a POM "en capas" (ver abajo):** originalmente
cada test creaba sus Page Objects a mano (`new LoginPage(page)`, `new
InventoryPage(page)`, ...) y `InventoryPage`/`CartPage` duplicaban el mismo
`.filter({hasText}).locator('button')` cada una por su lado.

---

## POM en capas: BasePage + páginas encadenadas + component object

**Dónde:** `pages/BasePage.js`, `pages/LoginPage.js` / `InventoryPage.js` /
`CartPage.js` (heredan de `BasePage`), `components/ProductItemComponent.js`

Esta es la evolución del POM plano de arriba, con tres capas:

### BasePage

Clase base de la que heredan todas las páginas. Centraliza lo que es común a
cualquier página — aquí, la navegación y el locator `.title`, que antes vivía
duplicado, idéntico, en `InventoryPage` y `CartPage`.

```js
class BasePage {
  constructor(page) {
    this.page = page;
    this.pageTitle = page.locator('.title');
  }
  async goto(path = '/') {
    await this.page.goto(path);
    return this;
  }
}
```

### Chained page objects (páginas encadenadas)

Los métodos que provocan una navegación retornan la página a la que la app
navegó, en vez de `void`. El test ya no instancia la siguiente página a mano:

```js
// Antes:
const loginPage = new LoginPage(page);
const inventoryPage = new InventoryPage(page); // instanciación manual y desconectada
await loginPage.login(user, pass);

// Después:
const loginPage = new LoginPage(page);
await loginPage.goto();
const inventoryPage = await loginPage.login(user, pass); // login() retorna InventoryPage
const cartPage = await inventoryPage.goToCart();          // goToCart() retorna CartPage
```

**Excepción a propósito:** `LoginPage.login()` siempre retorna una
`InventoryPage`, incluso cuando el login falla (usuario inválido/bloqueado).
Es una simplificación conocida del patrón: la app en realidad se queda en la
pantalla de login, así que el test de login inválido (`T03`) ignora ese
retorno y sigue usando `loginPage.errorMessage` directamente.

### Component Object

Un componente representa un fragmento de UI que se repite y no tiene URL
propia — a diferencia de una página. Aquí, la fila de un producto, que
aparece tanto en el catálogo (`.inventory_item`) como en el carrito
(`.cart_item`):

```js
class ProductItemComponent {
  constructor(page, containerSelector, productName) {
    this.root = page.locator(containerSelector).filter({ hasText: productName });
    this.actionButton = this.root.locator('button');
  }
  async addToCart() { await this.actionButton.click(); }
  async remove() { await this.actionButton.click(); }
}
```

`InventoryPage` y `CartPage` exponen `.product(name)`, que retorna este mismo
componente con un contenedor distinto — eliminando la duplicación que existía
entre `getAddToCartButton()` y `getRemoveButton()`.

```js
await inventoryPage.product(PRODUCT).addToCart();
// ...
await cartPage.product(PRODUCT).remove();
```

**Cuándo usar esta variante en vez del POM plano:** cuando la suite crece y
aparecen (a) lógica repetida entre páginas que en realidad describe el mismo
fragmento de UI, o (b) tests que instancian manualmente cada página del flujo
en vez de dejar que la navegación fluya de una a la siguiente.

---

## Page Factory

**Dónde:** `pages/PageFactory.js`

Centraliza la creación de los Page Objects y los **cachea** por instancia de
`page`: la primera vez que pides `factory.cartPage` se crea, las siguientes
veces se reutiliza el mismo objeto.

```js
const factory = new PageFactory(page);
await factory.loginPage.goto();
await factory.loginPage.login(username, password);
await factory.inventoryPage.product(PRODUCT).addToCart();
```

**Origen:** en Selenium/Java, `PageFactory.initElements(driver, this)` inicializa
los campos anotados con `@FindBy` de una sola vez. Playwright ya resuelve sus
locators de forma perezosa, así que aquí el valor de la fábrica es puramente
la creación/cacheo centralizado — pero el problema que resuelve (no repetir
`new XPage(page)` en cada test) es el mismo.

**Cuándo usarlo:** suites grandes donde muchos tests comparten los mismos
Page Objects y quieres un solo punto de entrada (`factory.xPage`) en vez de
imports y `new` repetidos.

---

## Singleton

**Dónde:** `support/TestConfig.js`

Garantiza una única instancia de la configuración de pruebas (URL base,
usuarios, datos de checkout) para todo el proceso.

```js
class TestConfig {
  constructor() {
    if (TestConfig.instance) return TestConfig.instance;
    // ...inicializar datos...
    TestConfig.instance = this;
  }

  static getInstance() {
    if (!TestConfig.instance) TestConfig.instance = new TestConfig();
    return TestConfig.instance;
  }
}
```

```js
const config = TestConfig.getInstance();
const { username, password } = config.users.standard;
```

**Nota honesta:** en Node, `require()` ya cachea el módulo, así que
`module.exports = { baseUrl, users }` lograría un efecto similar sin la
guarda del constructor. Se implementó el patrón GoF explícito de todas formas
porque:

1. Es la forma que necesitas en lenguajes sin cache de módulos (Java, C#) —
   frecuente en cursos/entrevistas de SDET.
2. Dejar la guarda explícita documenta la intención ("esto es un singleton a
   propósito") en vez de depender de un detalle de implementación de Node.

**Riesgo a tener en cuenta:** el estado global compartido puede acoplar tests
que deberían ser independientes. Aquí es seguro porque `TestConfig` es
solo-lectura una vez inicializado.

---

## Screenplay Pattern

**Dónde:** `screenplay/`

```
screenplay/
├── Actor.js                    # quién actúa
├── abilities/BrowseTheWeb.js   # qué puede hacer (navegar la web)
├── tasks/
│   ├── Login.js                 # tarea de negocio: iniciar sesión
│   └── AddProductToCart.js      # tarea de negocio: agregar producto
└── questions/
    └── CartBadgeCount.js        # consulta de estado, sin efectos secundarios
```

El test se lee como una historia de negocio en vez de una secuencia de
clics:

```js
const mariana = Actor.named('Mariana').whoCan(BrowseTheWeb.using(page));

await mariana.attemptsTo(
  Login.withCredentials(username, password),
  AddProductToCart.named('Sauce Labs Backpack')
);

const cartCount = await mariana.asks(CartBadgeCount.value());
expect(cartCount).toBe(1);
```

Piezas del patrón:

- **Actor** — quien ejecuta las Tasks y responde las Questions (`Actor.js`).
- **Ability** — una capacidad que se le da al actor, p. ej. navegar la web
  (`BrowseTheWeb`). Si el mismo flujo necesitara probarse por API, se le daría
  una Ability distinta (`CallAnApi`) sin tocar las Tasks que no dependen de UI.
- **Task** — una acción de negocio de alto nivel (`Login`, `AddProductToCart`).
  Por dentro reutiliza los Page Objects existentes — Screenplay no reemplaza
  al POM, se apoya en él.
- **Question** — consulta el estado de la app sin modificarlo
  (`CartBadgeCount`).

**Ventaja sobre POM/Page Factory:** separa mejor las responsabilidades
(principio de responsabilidad única) y escala mejor en suites grandes y
complejas, porque las Page Objects no acumulan lógica de negocio — solo
selectores y acciones atómicas.

**Costo:** más código de infraestructura inicial (Actor, Abilities, Tasks,
Questions) y una curva de aprendizaje más alta que un POM simple. Para un
proyecto pequeño como este, es más peso del que hace falta — se incluye aquí
con fines didácticos.

---

## Resumen

| Patrón | Problema que resuelve | Cuándo conviene |
|---|---|---|
| Page Object Model | Selectores dispersos por todos los tests | Siempre — es la base |
| BasePage + páginas encadenadas | Código común duplicado; instanciación manual de la siguiente página | Suites con flujos de navegación de varios pasos |
| Component Object | Lógica de UI repetida entre páginas (misma fila/widget) | Un mismo fragmento de UI aparece en más de una página |
| Page Factory | `new XPage(page)` repetido en cada test | Suites grandes con muchos Page Objects compartidos |
| Singleton | Configuración/estado duplicado o inconsistente | Datos compartidos de solo lectura (config, credenciales) |
| Screenplay | Tests que mezclan intención de negocio con detalles de UI | Suites grandes y complejas, equipos que priorizan mantenibilidad a largo plazo |
