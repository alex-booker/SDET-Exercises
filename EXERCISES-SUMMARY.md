# Resumen general — todos los tópicos de IA cubiertos

Índice de todo lo entregado, por tópico, con lo que se comparó, lo que
falló de verdad, y lo que quedó fuera con su justificación. Suite completa
al momento de escribir esto: **33/33** (incluye 2 fallos esperados
documentados con `test.fail()`).

---

## 0. Design Patterns (previo a los tópicos de IA)

Explicación + demo aplicada al proyecto de POM, PageFactory, Singleton y
Screenplay — la base sobre la que se construyó todo lo demás.
→ [PATTERNS.md](./PATTERNS.md)

## 0.5. Refactor a POM en capas (el primer entregable)

`BasePage` + páginas encadenadas (`LoginPage` → `InventoryPage` →
`CartPage`) + `ProductItemComponent` compartido. Comiteado y mergeado a
`main` como PR independiente antes de empezar los tópicos de IA.
→ [PATTERNS.md](./PATTERNS.md) (sección "POM en capas")

---

## 1. LLM

| Ejercicio | Resultado |
|---|---|
| Pedirle a un LLM que escriba un test para una página real, correrlo, anotar qué falló | 5/5 correcto para `standard_user` (SauceDemo está muy memorizado); 2 fallos reales para `problem_user` (sort roto, imágenes duplicadas) — bugs reales de la app, no del test |

→ [LLM-EXERCISE-NOTES.md](./LLM-EXERCISE-NOTES.md) · `tests/03-llm-generated-sort.spec.ts`

## 2. AI Safety — Reviewing AI-Generated Code

| Ejercicio | Resultado |
|---|---|
| Auth helper "seguro" generado por IA, auditado contra OWASP | 10 hallazgos reales (secreto hardcodeado, enumeración de usuarios, sin rate limiting, truncamiento de bcrypt, etc.) — el código funcionaba, no era seguro |
| Encontrar una alucinación de API real | 2 intentos (`express-rate-limit`, `crypto.hash()`) correctos a la primera; `otplib` falló — API real de v10-12 que v13 eliminó por completo |
| Escaneo de licencias (FOSSA no viable sin cuenta propia → alternativa local) | ~390/408 paquetes permisivos; `@promptbook/utils` (CC-BY-4.0) enterrado 4 niveles en dependencias transitivas de `webdriverio` |

→ [AI-AUTH-AUDIT.md](./AI-AUTH-AUDIT.md) · [AI-HALLUCINATION-EXAMPLE.md](./AI-HALLUCINATION-EXAMPLE.md) · [LICENSE-SCAN-NOTES.md](./LICENSE-SCAN-NOTES.md)

## 3. Advanced AI Tools — Copilot Advanced, Claude Code, Cursor

*(Solo 2 de 3 — sin Copilot no aplicaba el ejercicio de `@workspace`.)*

| Ejercicio | Resultado |
|---|---|
| Refactor multi-archivo, revisando cada diff | Cerró de verdad los hallazgos #5 y #7 de la auditoría OWASP (rate limiter + pre-hash conectados a rutas HTTP reales); un bug real de estado compartido apareció solo al correr la suite varias veces, no al leer el código |
| `CLAUDE.md` + verificación con agente fresco | Un sub-agente sin contexto previo, con una tarea no ambigua, generalizó correctamente el patrón de páginas encadenadas a un caso que `CLAUDE.md` no menciona por nombre, y evitó un require circular sin que se le pidiera |

→ [MULTI-FILE-REFACTOR-NOTES.md](./MULTI-FILE-REFACTOR-NOTES.md) · [CLAUDE.md](./CLAUDE.md) · [CLAUDE-MD-VERIFICATION.md](./CLAUDE-MD-VERIFICATION.md)

## 4. AI for Test Automation — Generating Tests & Page Objects

*(Solo 2 de 3 — no había una suite de 10 tests con waits manuales que convertir; el único wait manual del repo es un fix deliberado y documentado en `mobile/`.)*

| Ejercicio | Resultado |
|---|---|
| Generar un Page Object para una pantalla nueva, auditar cada locator | Los 6 locators del menú hamburguesa funcionaban, pero 4 de 6 usaban `id` cuando el elemento real también expone `data-test` (la convención real del repo) — corregido |
| Generar 50 usuarios plausibles, spot-check de duplicados | 3 duplicados reales (matemática del problema del cumpleaños sobre un pool de nombres chico) — confirmado contra el código real de `registerUser()`, exactamente esos 3 fallan |

→ [MENU-PAGE-AUDIT.md](./MENU-PAGE-AUDIT.md) · [TEST-DATA-AUDIT.md](./TEST-DATA-AUDIT.md)

## 5. AI-Assisted Debugging — Errors & Logs

| Ejercicio | Resultado |
|---|---|
| Fallo flaky real, rankear hipótesis de la IA contra las propias | La hipótesis #1 del agente igualó (y en un punto superó) mi propio diagnóstico original |
| Log de 100+ líneas, encontrar la primera línea interesante | Acertó la línea correcta y distinguió por su cuenta dos interpretaciones de "interesante" — pero inventó una relación causal falsa entre dos bugs independientes al justificar la segunda |
| Documentar hipótesis equivocadas antes de la correcta | El resultado no fue el esperado por la consigna: 0 equivocadas con un método de "evidencia antes de opinar", contra 2 equivocadas cuando yo mismo adiviné el mismo bug a ciegas antes en la sesión |

→ [FLAKY-BUG-HYPOTHESIS-RANKING.md](./FLAKY-BUG-HYPOTHESIS-RANKING.md) · [LOG-TRIAGE-EXAMPLE.md](./LOG-TRIAGE-EXAMPLE.md) · [DEBUGGING-HYPOTHESIS-COUNT.md](./DEBUGGING-HYPOTHESIS-COUNT.md)

---

## Estructura de código nueva (además de lo que ya existía)

```
auth/
├── authHelper.js          # register/login/verify, hardened tras la auditoría OWASP
├── authRouter.js          # rutas HTTP reales (register/login/me), conecta el rate limiter
├── loginRateLimiter.js    # fábrica de rate limiter (no singleton — ver MULTI-FILE-REFACTOR-NOTES.md)
├── prehash.js             # pre-hash SHA-256 antes de bcrypt
└── totp.js                # deja el bug de otplib SIN corregir a propósito (es la evidencia del ejercicio)

pages/
├── BasePage.js
├── LoginPage.js / InventoryPage.js / CartPage.js   # POM en capas, encadenado
├── MenuPage.js             # nuevo — menú hamburguesa
└── PageFactory.js

components/ProductItemComponent.js
screenplay/                 # Actor/Ability/Task/Question (demo de patrones)
support/TestConfig.js       # Singleton (demo de patrones)
testdata/
├── generate-users.js
├── check-duplicates.js
└── users.json

tests/01 al 08              # ver tabla arriba, cada uno numerado y documentado
```

## Convención seguida en todo lo anterior

Todo lo de este resumen sigue [CLAUDE.md](./CLAUDE.md) — que en sí mismo es
uno de los entregables (topic "Advanced AI Tools"), y que se auto-aplicó a
partir del momento en que se escribió (nada de lo generado después lo
viola).
