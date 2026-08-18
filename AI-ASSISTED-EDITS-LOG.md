# Entregable final: 10 ediciones asistidas por IA

**Consigna:** "Doc with 10 AI-assisted edits logged: prompt → AI output →
final edit → why you changed it."

Diez casos reales de todo el trabajo de este curso — no inventados para la
ocasión. Cada uno con el prompt real (o su equivalente reconstruido), el
output original tal como salió, la edición final aplicada, y por qué.

---

## 1. `auth/authHelper.js` — de "funciona" a "seguro"

**Prompt:** "Write a secure authentication helper for a Node.js app
(register, login, verify a session token)." — genérico, sin mencionar
OWASP.

**Output de la IA:**
```js
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';
...
if (!user) throw new Error('User not found');
...
if (!isValid) throw new Error('Incorrect password');
...
const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
```

**Edición final:** secreto sin fallback (falla explícito si falta),
mensaje de error unificado + comparación dummy contra timing, algoritmo de
JWT restringido explícitamente, contraseña pre-hasheada con SHA-256 antes de
bcrypt, validación de longitud mínima, expiración reducida a 15 min.

**Por qué:** auditar contra las OWASP Cheat Sheets (Authentication,
Password Storage, Session Management) encontró 10 hallazgos reales — el
código pasaba su propio smoke test sin problema, pero un secreto hardcodeado
y la enumeración de usuarios son fallas de seguridad reales, no cosméticas.
→ [AI-AUTH-AUDIT.md](./AI-AUTH-AUDIT.md)

---

## 2. `auth/loginRateLimiter.js` + `auth/authRouter.js` — singleton a fábrica

**Prompt:** "Connect authHelper.js and loginRateLimiter.js to real HTTP
routes" (refactor multi-archivo).

**Output de la IA:**
```js
// loginRateLimiter.js
const loginRateLimiter = rateLimit({ windowMs: 15*60*1000, max: 5, ... });
module.exports = { loginRateLimiter };

// authRouter.js
const router = express.Router();
router.post('/login', loginRateLimiter, ...);
module.exports = { router };
```

**Edición final:**
```js
function createLoginRateLimiter() { return rateLimit({ ... }); }
module.exports = { createLoginRateLimiter };

function createAuthRouter() {
  const router = express.Router();
  router.post('/login', createLoginRateLimiter(), ...);
  return router;
}
```

**Por qué:** corriendo la suite de integración varias veces (no una) con
`--workers=1` apareció un fallo intermitente real — el rate limiter,
instanciado una sola vez al importar el módulo, compartía su contador entre
servidores de prueba distintos. Un bug de concurrencia que leer el código
una vez no revela.
→ [MULTI-FILE-REFACTOR-NOTES.md](./MULTI-FILE-REFACTOR-NOTES.md)

---

## 3. `pages/MenuPage.js` — locators funcionales pero no óptimos

**Prompt:** "Generate a page object for the hamburger menu screen"
(a ciegas, sin inspeccionar el DOM real).

**Output de la IA:**
```js
this.allItemsLink = page.locator('#inventory_sidebar_link');
this.logoutLink   = page.locator('#logout_sidebar_link');
```

**Edición final:**
```js
this.allItemsLink = page.locator('[data-test="inventory-sidebar-link"]');
this.logoutLink   = page.locator('[data-test="logout-sidebar-link"]');
```

**Por qué:** los 6 locators originales funcionaban (4/4 tests pasaban), pero
inspeccionando el DOM real se encontró que 4 de 6 elementos también exponen
un atributo `data-test` — la convención real ya establecida en el resto del
repo, más estable que un `id` generado por una librería de terceros
(`react-burger-menu`). "Funciona" no fue el criterio de aceptación.
→ [MENU-PAGE-AUDIT.md](./MENU-PAGE-AUDIT.md)

---

## 4. `tests/01-front_end.spec.ts` — instanciación manual a API encadenada

**Prompt:** "Refactor the flat Page Object Model into BasePage + chained
page objects + one component object."

**Output de la IA (versión intermedia, antes de ajustar el estilo del archivo):**
```js
const inventoryPage = new InventoryPage(page);
await loginPage.login(admin_user, Password);
...
await inventoryPage.getAddToCartButton(PRODUCT).click();
```

**Edición final:**
```js
const inventoryPage = await loginPage.login(admin_user, Password);
...
await inventoryPage.product(PRODUCT).addToCart();
```

**Por qué (dos razones, no una):** (1) `login()`/`goToCart()` ahora
retornan la siguiente página — instanciar a mano quedó obsoleto y
desincronizado con el resto del código. (2) Al escribir el archivo se
introdujeron finales de línea LF sobre un archivo históricamente CRLF, lo
que infló el diff a 565 líneas cuando el cambio real era ~30 — se normalizó
a CRLF para que el diff comiteado fuera revisable de verdad.
→ [PATTERNS.md](./PATTERNS.md) (commit `d8cdeca`, revisado con `git diff -w`)

---

## 5. `screenplay/tasks/AddProductToCart.js` — efecto dominó de un refactor

**Prompt:** el mismo refactor del punto 4 — no un prompt nuevo, sino el
efecto colateral de haber eliminado `InventoryPage.getAddToCartButton()`.

**Output de la IA (sin tocar, quedó roto):**
```js
await inventoryPage.getAddToCartButton(this.productName).click();
```

**Edición final:**
```js
await inventoryPage.product(this.productName).addToCart();
```

**Por qué:** este archivo pertenecía a un ejercicio anterior (Screenplay
Pattern) y no se tocó al hacer el refactor de POM — se rompió en silencio.
Solo se encontró corriendo la suite **completa** (`npx playwright test`,
no solo el archivo que se estaba editando) antes de dar el refactor por
terminado.
→ [PATTERNS.md](./PATTERNS.md)

---

## 6. `tests/03-llm-generated-sort.spec.ts` — de "arreglar" a "documentar"

**Prompt:** "Assume problem_user behaves like standard_user" (hipótesis a
ciegas, sin verificar).

**Output de la IA:**
```js
test('sorting by Name (Z to A) reverses the product list for problem_user too', async ({ page }) => {
  ...
  expect(sortedNames).toEqual([...originalNames].sort().reverse());
});
```

**Edición final:** el test se dejó, pero envuelto en `test.fail()` con un
comentario explicando la causa real:
```js
test.fail('sorting by Name (Z to A) reverses the product list for problem_user too', async ({ page }) => {
  // BUG REAL: para problem_user, seleccionar el dropdown no reordena nada.
  ...
});
```

**Por qué:** el fallo no era un bug del test — es un bug real e intencional
de SauceDemo (`problem_user` simula productos rotos a propósito). Borrar el
test o corregir la aserción habría escondido un hallazgo real; `test.fail()`
lo documenta y mantiene el CI en verde.
→ [LLM-EXERCISE-NOTES.md](./LLM-EXERCISE-NOTES.md)

---

## 7. `auth/totp.js` — la vez que la edición correcta fue no editar el archivo

**Prompt:** "Implement MFA with TOTP using otplib" (a ciegas, sin revisar
documentación).

**Output de la IA:**
```js
const { authenticator } = require('otplib');
function generateMfaSecret() { return authenticator.generateSecret(); }
```

**Edición final:** **ninguna** sobre `auth/totp.js` — se dejó tal cual, con
el error real (`TypeError: Cannot read properties of undefined`). La
versión corregida (`generateSecret()`, `verify({secret, token})` async) se
documentó aparte, sin aplicarla al archivo.

**Por qué:** el ejercicio pedía explícitamente "save the example" — el
valor de este archivo es ser evidencia de una alucinación real (una API que
existió en `otplib` v10-12 y que v13, una reescritura completa, eliminó).
Arreglarlo habría borrado la evidencia que el ejercicio pedía conservar.
→ [AI-HALLUCINATION-EXAMPLE.md](./AI-HALLUCINATION-EXAMPLE.md)

---

## 8. `testdata/users.json` — el dato "malo" se dejó, se instrumentó alrededor

**Prompt:** "Generate 50 plausible users as JSON" — sin pedir unicidad
explícitamente.

**Output de la IA:** 50 usuarios generados combinando nombre/apellido de un
pool de 12x12 de forma independiente por registro — 3 duplicados exactos de
username (`robert.brown`, `john.lopez`, `elizabeth.hernandez`).

**Edición final:** el JSON **no se deduplicó**. Se agregó
`testdata/check-duplicates.js` (detecta los 3) y
`tests/08-user-seed-data.spec.ts` (confirma contra `registerUser()` real
que exactamente esos 3, y ningún otro, fallan al registrarse).

**Por qué:** deduplicar el JSON habría ocultado el resultado real y
esperable de pedir "usuarios plausibles" sin pedir unicidad (matemática del
problema del cumpleaños sobre un pool chico) — el hallazgo interesante era
justamente que los duplicados aparecieran solos, y que se pudiera confirmar
su consecuencia real contra el código.
→ [TEST-DATA-AUDIT.md](./TEST-DATA-AUDIT.md)

---

## 9. La sugerencia de "downgrade" en la conversación de debugging del bug de `otplib`

**Prompt:** "Why is `authenticator` undefined? What's the fix?" (conversación
multi-turno con un agente fresco, cada afirmación verificada corriéndola de
verdad).

**Output de la IA (primera respuesta con un fix concreto):**
```
npm install otplib@^12.0.1
```
(volver a la versión que sí tiene `authenticator`, con la nota "you'll
probably want to migrate to v13 eventually").

**Edición final (tras pedir explícitamente no bajar de versión):**
```js
const { generateSecret, verify } = require('otplib');
const secret = generateSecret();
const result = await verify({ secret, token }); // async, result.valid
```
código verificado corriéndolo de verdad contra `otplib@13.4.1` instalado.

**Por qué:** el diagnóstico de la causa (v13 eliminó el objeto
`authenticator`) ya era correcto desde la primera respuesta — lo que cambió
fue la calidad del *fix*. Bajar de versión es un parche que pospone el
problema (paquete sin actualizaciones futuras); se pidió explícitamente la
solución nativa de v13 en su lugar.
→ [DEBUGGING-HYPOTHESIS-COUNT.md](./DEBUGGING-HYPOTHESIS-COUNT.md)

---

## 10. `pages/LoginPage.js` / `InventoryPage.js` / `CartPage.js` — la base de todo lo demás

**Prompt:** "Refactor the flat Page Object Model into BasePage + chained
page objects" (el refactor fundacional, antes de cualquier ejercicio de
IA — el primer entregable del curso).

**Output de la IA (POM plano, el estado original del repo):**
```js
class InventoryPage {
  constructor(page) { this.page = page; ... }
  getAddToCartButton(name) { return this.page.locator('.inventory_item').filter({hasText:name}).locator('button'); }
  async goToCart() { await this.cartIcon.click(); } // no retorna nada
}
```

**Edición final:**
```js
class InventoryPage extends BasePage {
  constructor(page) { super(page); ... }
  product(name) { return new ProductItemComponent(this.page, '.inventory_item', name); }
  async goToCart() { await this.cartIcon.click(); return new CartPage(this.page); }
}
```

**Por qué:** el POM plano original duplicaba `getAddToCartButton()`/
`getRemoveButton()` (locator idéntico) entre `InventoryPage` y `CartPage`, y
cada test instanciaba cada página a mano en vez de navegar entre ellas. Esta
fue la base sobre la que se apoyaron los otros 9 puntos de este log — sin
`BasePage`/encadenado/component object, ninguno de los refactors
posteriores habría tenido un patrón claro que seguir o romper.
→ [PATTERNS.md](./PATTERNS.md)

---

## Patrón general, visto en conjunto

De los 10 casos: **7 involucraron una edición real de código**, **2 fueron
decisiones explícitas de NO editar** (puntos 7 y 8 — la evidencia era el
producto, no el código corregido), y **1 fue una edición de la calidad de
una respuesta conversacional**, no de un archivo (punto 9). En ningún caso
el output original de la IA se aceptó tal cual sin correrlo, auditarlo, o
compararlo contra una referencia externa primero — el trabajo real de
"asistido por IA" estuvo en decidir, caso por caso, cuál de esas tres cosas
hacer con lo que salió.
