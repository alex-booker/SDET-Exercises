# Ejercicio: refactor multi-archivo con Claude Code, leyendo cada diff

**Consigna:** "Use Cursor Composer or Claude Code for one multi-file
refactor. Read every diff before accepting."

## El refactor

Los tres ejercicios anteriores de "AI Safety" dejaron piezas sueltas en
`auth/`: `authHelper.js` (con 10 hallazgos documentados en
[AI-AUTH-AUDIT.md](./AI-AUTH-AUDIT.md) sin corregir), `loginRateLimiter.js`
(fix del hallazgo #5, nunca conectado a nada real), y `prehash.js` (fix del
hallazgo #7, tampoco conectado). El refactor: **cerrar esos hallazgos de
verdad**, conectando las piezas entre sí — un cambio genuinamente
multi-archivo, no uno inventado para la ocasión.

**Archivos tocados:**

| Archivo | Qué cambió |
|---|---|
| `auth/authHelper.js` | Reescrito: secreto de JWT obligatorio (sin fallback), algoritmo restringido en sign/verify, mensaje de error unificado + comparación dummy contra timing, validación de longitud mínima, usa `prehashPassword()` antes de bcrypt |
| `auth/loginRateLimiter.js` | Cambiado de instancia única a **fábrica** (`createLoginRateLimiter()`) — motivo abajo |
| `auth/authRouter.js` | **Nuevo.** Conecta `authHelper` + `loginRateLimiter` a rutas HTTP reales (`/register`, `/login`, `/me`) |
| `tests/04-auth-helper-smoke.spec.ts` | Actualizado: mensaje de error unificado, validación de contraseña, caso de regresión del truncamiento de bcrypt |
| `tests/05-auth-router-integration.spec.ts` | **Nuevo.** Prueba de integración HTTP real, incluyendo que el rate limiter bloquea de verdad al 6to intento |

## Revisión de cada diff antes de aceptarlo

Esto no fue "generar y aceptar" — cada archivo se leyó y se justificó antes
de darlo por bueno:

- **`authHelper.js`:** confirmé que `getJwtSecret()` se llama dentro de las
  funciones (no al cargar el módulo) — si lanzara el error al `require()`,
  cualquier test que importe el archivo sin `JWT_SECRET` seteada tronaría
  antes de poder configurarlo. Confirmé también que `DUMMY_HASH` se calcula
  una sola vez al cargar el módulo (con `hashSync`, aceptable porque corre
  una sola vez, no por request) para no introducir el mismo problema de
  timing que se quería arreglar.
- **`authRouter.js`:** decidí que fuera una función `createAuthRouter()` en
  vez de un router ya armado, **antes** de escribirlo — por la razón que
  aparece en el siguiente punto.
- **`loginRateLimiter.js`:** aquí la revisión SÍ atrapó un bug real, no solo
  cosmético (ver abajo). El diseño original (una instancia de middleware
  creada una sola vez al importar el módulo) es exactamente lo que
  `express-rate-limit` recomienda para producción — el problema apareció al
  reutilizar esa misma instancia entre servidores de prueba distintos.
- **Los dos archivos de test:** antes de aceptarlos corrí la suite completa
  varias veces (no una) — ver siguiente sección.

## El bug real que apareció al correr la suite (no al leer el código)

Con la primera versión de `authRouter.js` (un `router` ya construido, y
`loginRateLimiter.js` exportando una instancia ya construida), el test de
integración fallaba **intermitentemente**:

```
Expected: [401, 401, 401, 401, 401]
Received: [401, 401, 401, 401, 429]   // el 429 llegó un intento antes
```

Causa raíz: `loginRateLimiter` se creaba una sola vez al importar el módulo
(`require` de Node cachea el módulo). El test de integración crea un
servidor Express nuevo en cada `beforeEach`, pero **todos esos servidores
importaban la misma instancia** del rate limiter — con el mismo contador de
intentos. El primer test del archivo (`registers and logs in...`) hacía un
login exitoso, consumiendo un intento del contador compartido; para cuando
el segundo test hacía sus 5 intentos "limpios", en realidad ya iba en 6.

**Fix:** `loginRateLimiter.js` y `authRouter.js` pasaron de exportar una
instancia a exportar una fábrica (`createLoginRateLimiter()` /
`createAuthRouter()`). En producción el comportamiento es idéntico (se llama
una vez al arrancar la app); en tests, cada servidor nuevo pide su propia
instancia con su propio contador. Confirmado corriendo el test de
integración 3 veces seguidas con `--workers=1` después del fix — sin
fallas.

## Una anomalía que se dejó anotada, no oculta

Durante una corrida en paralelo apareció este mensaje en la consola:

```
Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 94
```

Es un mensaje de bajo nivel de libuv, probablemente del addon nativo de
`bcrypt` cerrando un handle async mientras el proceso de test termina en
paralelo. No hizo fallar ningún test ni cambió el código de salida (0), y no
volvió a aparecer en 3 corridas adicionales completas de toda la suite. Se
documenta aquí en vez de ignorarlo — no se investigó a fondo porque no
bloqueó nada, pero si empezara a aparecer de forma consistente, sería la
primera pista a seguir.

## Verificación final

- `tests/04-auth-helper-smoke.spec.ts`: 6/6 (incluye el caso de regresión
  del truncamiento de bcrypt).
- `tests/05-auth-router-integration.spec.ts`: 2/2, estable en 3 corridas
  consecutivas con `--workers=1`.
- Suite completa: 27/27 (incluye los 2 fallos esperados y documentados del
  ejercicio de LLM), estable en 3 corridas consecutivas con paralelismo
  normal.

## Lección para el curso

1. "Leer el diff antes de aceptarlo" no es solo leer el código línea por
   línea — el error más serio de este refactor (el rate limiter
   compartiendo estado entre tests) **no era visible leyendo el archivo
   aislado**; solo apareció al correr la suite completa varias veces y notar
   que fallaba de forma intermitente.
2. Un refactor multi-archivo hecho por una IA puede ser internamente
   consistente y aun así romper algo que solo se manifiesta en la
   interacción entre archivos — por eso el ejercicio importa: revisar
   "cada diff" incluye revisar cómo se comportan juntos, no solo uno por
   uno.
3. Cuando un test fallara de forma intermitente, la reacción correcta no es
   "correrlo de nuevo hasta que pase" — es investigar el estado compartido
   antes de aceptar el cambio como bueno.
