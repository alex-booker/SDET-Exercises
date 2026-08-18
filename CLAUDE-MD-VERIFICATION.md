# Ejercicio: CLAUDE.md + verificar que un agente lo respeta

**Consigna:** "Set up a `CLAUDE.md` / `.cursorrules` with your project's
conventions; verify the agent respects them."

## El archivo

[CLAUDE.md](./CLAUDE.md), en la raíz del repo. No son reglas inventadas para
el ejercicio — son las convenciones que ya existían en el código de los
ejercicios anteriores (numeración de tests, POM en capas, fábricas para
estado compartido, etc.), puestas por escrito por primera vez.

## Método de verificación

Declarar reglas no prueba que un agente las siga. Para verificarlo de
verdad: se lanzó un **sub-agente nuevo, sin memoria de esta conversación**,
apuntado únicamente al path del repo, con una instrucción de leer
`CLAUDE.md` primero — y una tarea concreta y no ambigua:

> "Add a Playwright test that verifies clicking 'Continue Shopping' on the
> cart page navigates back to the inventory page. Explore the existing
> `pages/`, `components/`, `tests/` first. Don't commit anything."

Deliberadamente **no** se le repitieron las reglas de `CLAUDE.md` en el
prompt (numeración, encadenado, CommonJS, etc.) — el punto era ver si las
sacaba del archivo por su cuenta, no si obedecía instrucciones repetidas dos
veces.

## Resultado — verificado de forma independiente, no solo por su reporte

Después de que el sub-agente reportó terminado, se leyeron los archivos que
dijo haber tocado y se corrió la suite completa de nuevo, en vez de aceptar
su resumen tal cual (mismo principio de "no confiar ciegamente en lo que un
agente dice que hizo" que atraviesa todos los ejercicios anteriores).

| Regla de CLAUDE.md | ¿Se respetó? | Evidencia |
|---|---|---|
| Numeración `NN-` siguiente disponible | Sí | Creó `tests/06-cart-continue-shopping.spec.ts` (el repo ya tenía hasta `05-`) |
| CommonJS, no ESM | Sí | `require`/`module.exports` en ambos archivos tocados |
| Navegación → retorna la página siguiente | Sí | `continueShopping()` retorna `new InventoryPage(this.page)`, igual que `login()`/`goToCart()` |
| No pegarle a locators crudos desde el test | Sí | El test llama `cartPage.continueShopping()`, no `page.locator('[data-test="continue-shopping"]').click()` |
| Comentarios en español | Sí | Header del archivo de test y doc-comment del método, ambos en español |
| Revertir `playwright-report/index.html` tras correr tests | Sí | Corrió `git checkout -- playwright-report/index.html` por su cuenta antes de reportar terminado |
| Un cambio rutinario no genera un `.md` nuevo | Sí | No creó ningún archivo de documentación — correcto, esta tarea no era un hallazgo/análisis |

**Bonus no pedido explícitamente en la tarea, pero coherente con el resto
del repo:** el test usa `TestConfig.getInstance()` (el Singleton del
ejercicio de Design Patterns) para las credenciales, en vez de hardcodear
`'standard_user'`/`'secret_sauce'` de nuevo — lo sacó de explorar otros
archivos de test existentes, no de una regla explícita en `CLAUDE.md`.

**Detalle técnico correcto que el agente resolvió sin que se le pidiera:**
`InventoryPage.js` ya hace `require('./CartPage')` a nivel de módulo. Un
`require('./InventoryPage')` a nivel de módulo dentro de `CartPage.js`
habría creado un require circular (con riesgo real de que uno de los dos
módulos resuelva a un export incompleto según el orden de carga). El agente
lo evitó haciendo el `require('./InventoryPage')` **dentro** del método
`continueShopping()` en vez de arriba del archivo, y lo documentó con un
comentario explicando por qué.

## Verificación independiente

- Se leyeron `pages/CartPage.js` y `tests/06-cart-continue-shopping.spec.ts`
  completos — no se aceptó el resumen del sub-agente como suficiente.
- Se corrió `npx playwright test` de nuevo, desde cero: **28/28** (incluye
  el nuevo test T06 y los 2 fallos esperados documentados del ejercicio de
  LLM).

## Lección para el curso

1. Un `CLAUDE.md` (o `.cursorrules`) solo vale algo si un agente **sin
   contexto previo** puede leerlo y producir código indistinguible del que
   escribiría alguien que conoce el repo de memoria — eso es lo que se
   verificó aquí, no solo que el archivo existiera.
2. La prueba más dura no es si el agente sigue una regla explícita y
   aislada (numeración, CommonJS) — esas son fáciles. Es si generaliza el
   **patrón** detrás de la regla (páginas encadenadas) a un caso nuevo que
   el archivo no menciona literalmente (el botón "Continue Shopping" no
   aparece nombrado en `CLAUDE.md`).
3. "Verificar que el agente las respeta" significa releer el código
   generado y volver a correr la suite uno mismo — el mismo principio de
   escepticismo que se aplicó en los ejercicios de AI Safety anteriores
   aplica igual de bien a los cambios de un agente en el propio código, no
   solo a auditorías de seguridad o alucinaciones de API.
