# Ejercicio: generar un Page Object con IA, auditar cada locator

**Consigna:** "Generate a page object for one screen with AI. Audit every
locator."

**Pantalla elegida:** el menú hamburguesa de SauceDemo (All Items / About /
Logout / Reset App State) — la única pantalla de la app sin ningún Page
Object ni test hasta este ejercicio.

**Código generado a ciegas:** [pages/MenuPage.js](./pages/MenuPage.js), sin
inspeccionar el DOM real primero. Probado con
[tests/07-menu.spec.ts](./tests/07-menu.spec.ts).

## Resultado funcional

Los 6 locators generados a ciegas **funcionaron a la primera** (4/4 tests
pasan) — mismo patrón que en el ejercicio de LLM con el dropdown de orden:
SauceDemo está tan representado en el entrenamiento que los `id` exactos
del menú (`react-burger-menu-btn`, `inventory_sidebar_link`, etc.) se
recordaron correctamente.

**Pero "funciona" no es lo mismo que "es la mejor auditoría posible".** Este
ejercicio pide auditar cada locator, no solo correrlo — así que se inspeccionó
el DOM real de cada uno para evaluar la calidad de la elección, no solo su
corrección.

## Auditoría, locator por locator

| Locator | Selector generado | ¿Existe una mejor opción? | Veredicto |
|---|---|---|---|
| `openMenuButton` | `#react-burger-menu-btn` | No — el botón no tiene `data-test` ni `aria-label`; el `id` (generado por la librería `react-burger-menu`) es la única opción real | ✅ Correcto, se queda igual |
| `closeMenuButton` | `#react-burger-cross-btn` | No — mismo caso que el anterior | ✅ Correcto, se queda igual |
| `allItemsLink` | `#inventory_sidebar_link` | **Sí** — el elemento real tiene `data-test="inventory-sidebar-link"` | ⚠️ Corregido a `[data-test="inventory-sidebar-link"]` |
| `aboutLink` | `#about_sidebar_link` | **Sí** — `data-test="about-sidebar-link"` | ⚠️ Corregido |
| `logoutLink` | `#logout_sidebar_link` | **Sí** — `data-test="logout-sidebar-link"` | ⚠️ Corregido |
| `resetStateLink` | `#reset_sidebar_link` | **Sí** — `data-test="reset-sidebar-link"` | ⚠️ Corregido |

**4 de 6 locators funcionaban, pero no eran la mejor elección.** El `id` de
esos 4 elementos viene de la librería `react-burger-menu` (el widget que
SauceDemo usa para el sidebar) — si el equipo de SauceDemo alguna día
cambia de librería o de configuración interna, ese `id` podría cambiar sin
aviso. El atributo `data-test`, en cambio, es un contrato explícito puesto
ahí a propósito para testing — es exactamente el criterio que ya sigue el
resto del repo (`LoginPage`, `InventoryPage`, `CartPage` usan `data-test`
casi exclusivamente). El código generado por la IA no violó ninguna regla
de `CLAUDE.md` de forma obvia (los locators eran sintácticamente válidos y
funcionaban), pero sí fue inconsistente con el criterio de estabilidad que
el resto del código ya demuestra.

## Otro hallazgo, no sobre el selector sino sobre el comportamiento

`aboutLink` navega a `https://saucelabs.com/` **en la misma pestaña** (el
`<a>` no tiene `target="_blank"`). El método `clickAbout()` original no lo
mencionaba — se agregó una nota explícita en el doc-comment de que, tras
llamarlo, `this.page` queda apuntando a un dominio completamente distinto.
No es un bug (el código no asumía lo contrario), pero es el tipo de detalle
que alguien integrando este método sin leer el DOM real fácilmente pasaría
por alto — la clase de cosa que "verificar que funciona" no revela por sí
sola.

## Cómo se hizo la auditoría (no fue leer el código dos veces)

1. Se abrió `saucedemo.com` en un navegador real, se hizo login, y se abrió
   el menú manualmente.
2. Se corrió JavaScript en la página (`document.querySelectorAll(...)`)
   para volcar **todos** los atributos relevantes (`id`, `class`,
   `data-test`, `href`, `target`) de cada elemento del sidebar — no solo
   confirmar que el `id` adivinado existía, sino ver qué otros atributos
   tenía disponibles que el código no usó.
3. Se comparó esa lista contra el criterio de selección de locators que ya
   usa el resto del repo (preferir `data-test`).

## Lección para el curso

1. Un locator puede ser **100% funcional hoy** y aun así ser una mala
   elección a largo plazo — "pasa el test" no es el criterio de una buena
   auditoría de locators, es apenas el primer filtro.
2. La auditoría real requirió mirar el DOM completo de cada elemento (todos
   sus atributos), no solo confirmar que el selector elegido por la IA
   apuntaba a algo que existía. Sin ese paso, los 4 locators subóptimos
   habrían pasado desapercibidos indefinidamente — nunca fallan, solo son
   más frágiles de lo necesario.
3. El criterio de "mejor locator" no es universal — depende de qué
   convención ya sigue el resto del proyecto (aquí, `data-test`). Una IA sin
   ese contexto no tiene forma de saberlo a menos que audite el patrón
   existente en el propio repo antes de generar código nuevo.
