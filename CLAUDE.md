# CLAUDE.md

Convenciones de este repo. Léelo antes de tocar código — no son preferencias
de estilo opcionales, son la forma en la que ya está construido todo lo
existente.

## Tests

- Viven en `tests/`, cada archivo nombrado `NN-descripcion-corta.spec.ts`
  con un prefijo numérico de dos dígitos en orden de creación (`01-`, `02-`,
  `03-`...). Antes de crear un archivo nuevo, revisa el número más alto que
  ya exista en `tests/` y usa el siguiente.
- Aunque la extensión sea `.ts`, el estilo del repo es **CommonJS**:
  `const { test, expect } = require('@playwright/test');` y
  `module.exports = { ... };` — no uses `import`/`export` de ES Modules.
- Cada test file lleva un comentario de cabecera en español explicando qué
  cubre y, si nació de un ejercicio específico del curso, cuál.
- Un test que documenta un bug real de la aplicación bajo prueba (no del
  código propio) se deja en la suite marcado con `test.fail()` — nunca se
  borra ni se hace `test.skip()` — con un comentario explicando la causa
  real. Ver `tests/03-llm-generated-sort.spec.ts` como ejemplo.
- Antes de dar por terminado cualquier cambio, corre la suite completa
  (`npx playwright test`) más de una vez si el cambio toca estado
  compartido entre tests (rate limiters, singletons, stores en memoria) —
  una corrida limpia no descarta contaminación entre tests.
- Después de correr tests localmente, `playwright-report/index.html` queda
  modificado como efecto secundario (está trackeado en git). Reviértelo
  antes de comitear (`git checkout -- playwright-report/index.html`) si el
  cambio real no era sobre el reporte.

## Page Object Model (`pages/`)

- Arquitectura en capas, no un POM plano:
  - `BasePage` — clase base con lo común a cualquier página (navegación,
    locators compartidos como `.title`). Todas las páginas heredan de ella.
  - Los métodos que provocan una navegación **retornan la página a la que
    la app navega** (`login()` retorna `InventoryPage`, `goToCart()` retorna
    `CartPage`), para que los tests encadenen en vez de instanciar cada
    página a mano con `new XPage(page)`.
- Un fragmento de UI que se repite en más de una página (una fila de
  producto, una card) **no** se duplica como método en cada Page Object —
  se extrae a un Component Object en `components/` y las páginas lo
  exponen vía un método (`.product(name)`), como
  `components/ProductItemComponent.js`.

## `auth/` (módulos de seguridad, no ligados a SauceDemo)

- Cada módulo lleva un comentario de cabecera con su historial: de qué
  ejercicio nació, qué hallazgo de `AI-AUTH-AUDIT.md` cierra (si aplica).
- Cualquier pieza que mantenga estado y vaya a montarse en más de un
  servidor/instancia durante tests (rate limiters, cualquier middleware con
  contador interno) se exporta como **fábrica** (`createX()`), nunca como
  una instancia ya construida a nivel de módulo — una instancia compartida
  contamina el estado entre tests que deberían ser independientes.

## Documentación de ejercicios

- Cada ejercicio del curso que produce un hallazgo o un análisis (no solo
  código) se documenta en su propio archivo Markdown en la raíz, nombrado
  en MAYÚSCULAS-CON-GUIONES describiendo el tema
  (`AI-AUTH-AUDIT.md`, `PATTERNS.md`, `LLM-EXERCISE-NOTES.md`) — no se
  mete el análisis dentro de `README.md`.
- `README.md` mantiene un changelog al final, una línea por ejercicio o
  hito, formato `DD/MM/YYYY - descripción corta.`, enlazando al `.md`
  correspondiente si existe uno.

## Idioma

- Comentarios y documentación: español. Nombres de variables/funciones/
  clases: inglés.
