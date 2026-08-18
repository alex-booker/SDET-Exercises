# Auditoría: auth helper generado por IA vs. OWASP Cheat Sheets

**Consigna:** "Ask an AI for a 'secure' auth helper. Audit it against the
OWASP cheat sheet."

**Código auditado:** [auth/authHelper.js](./auth/authHelper.js)
**Prompt (reconstruido):** "write a secure authentication helper for a
Node.js app (register, login, verify a session token)" — genérico, sin
mencionar OWASP ni ningún requisito de seguridad específico.

**Funciona:** ver [tests/04-auth-helper-smoke.spec.ts](./tests/04-auth-helper-smoke.spec.ts)
(3/3 pasan). Ese es exactamente el punto de este ejercicio: **que el código
funcione no significa que sea seguro**. El smoke test no verifica ninguno de
los hallazgos de abajo — solo confirma el happy path.

Cheat sheets usadas como referencia: **Password Storage Cheat Sheet**,
**Authentication Cheat Sheet**, **Session Management Cheat Sheet** (las tres
de OWASP).

---

## Hallazgos

### 1. Secreto de JWT hardcodeado como fallback — **Crítico**

```js
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';
```

Si `JWT_SECRET` no está seteada (típico en un entorno mal configurado, o en
desarrollo local que "por accidente" llega a producción), cualquiera puede
firmar sus propios tokens válidos con ese string, que además es adivinable a
simple vista. La Session Management Cheat Sheet exige que el identificador de
sesión/token se genere con una fuente de entropía criptográficamente segura y
suficiente longitud — un string legible hardcodeado en el código fuente no
cumple ninguno de los dos requisitos, y encima queda expuesto en el
repositorio (y en el historial de git).

**Fix:** fallar el arranque de la app si `JWT_SECRET` no está definida
(`if (!process.env.JWT_SECRET) throw new Error(...)`), nunca un default.

### 2. `jwt.verify()` sin restringir el algoritmo — **Alto**

```js
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
```

No se pasa `{ algorithms: ['HS256'] }`. Es la causa raíz de la clase de
vulnerabilidad de "algorithm confusion" en JWT (incluyendo el ataque clásico
de forzar `alg: none` o confundir claves HS256/RS256) — CWE-347, verificación
incorrecta de firma criptográfica. Si la librería alguna vez acepta un
algoritmo que el autor no anticipó, un atacante puede forjar tokens.

**Fix:** `jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })`.

### 3. Enumeración de usuarios por mensaje de error — **Alto**

```js
if (!user) throw new Error('User not found');
...
if (!isValid) throw new Error('Incorrect password');
```

La Authentication Cheat Sheet es explícita: las respuestas de login deben ser
**idénticas** sin importar si el usuario existe o no, precisamente para no
filtrar qué cuentas son válidas. Con este código, un atacante puede enumerar
usuarios reales del sistema probando nombres y observando el mensaje.

**Fix:** un solo mensaje genérico ("Invalid username or password") para
ambos casos.

### 4. Canal lateral por tiempo de respuesta — **Medio**

Relacionado con el punto 3, pero más sutil: cuando el usuario no existe, la
función retorna **inmediatamente** sin llamar a `bcrypt.compare()`. Cuando sí
existe, `bcrypt.compare()` toma un tiempo medible (por diseño, bcrypt es
lento). Un atacante puede enumerar usuarios midiendo el tiempo de respuesta,
incluso si el mensaje de error se unifica (punto 3).

**Fix:** ejecutar siempre un `bcrypt.compare()` contra un hash "dummy"
precalculado cuando el usuario no existe, para que el tiempo de respuesta sea
constante en ambos casos.

### 5. Sin protección contra fuerza bruta — **Alto**

No hay rate limiting, backoff progresivo, ni bloqueo de cuenta tras intentos
fallidos. La Authentication Cheat Sheet dedica una sección entera
("Protect Against Automated Attacks") a exigir justo esto. Tal como está, el
helper es trivialmente atacable por fuerza bruta o credential stuffing.

**Fix:** limitar intentos por IP/usuario (ej. `express-rate-limit` o un
contador en el propio `users` Map), con backoff exponencial o CAPTCHA tras N
intentos fallidos.

### 6. Sin política de fortaleza de contraseña — **Medio**

`registerUser` acepta cualquier string como contraseña — incluyendo `"a"`. La
Authentication Cheat Sheet pide un mínimo razonable (8 caracteres, idealmente
más) y, si es posible, verificar contra listas de contraseñas filtradas
(ej. Have I Been Pwned API). Nada de esto está implementado.

**Fix:** validar longitud mínima/máxima antes de hashear, y considerar una
verificación contra una lista de contraseñas comprometidas.

### 7. Truncamiento silencioso de bcrypt a 72 bytes — **Medio**

bcrypt ignora silenciosamente cualquier carácter después del byte 72 de la
contraseña. La Password Storage Cheat Sheet señala esto explícitamente como
una limitación a manejar (rechazar contraseñas más largas, o pre-hashear con
SHA-256 antes de pasarlas a bcrypt). Aquí no se maneja: dos contraseñas que
difieren solo después del carácter 72 se consideran la misma, sin que el
usuario lo sepa.

**Fix:** rechazar contraseñas > 72 bytes, o aplicar
`sha256(password)` antes de `bcrypt.hash()`.

### 8. Token de sesión de larga duración sin forma de revocarlo — **Medio**

```js
const JWT_EXPIRES_IN = '7d';
```

Un JWT stateless firmado no se puede invalidar antes de su expiración — no
hay endpoint de "logout" real posible con este diseño. Si un token se filtra,
sigue siendo válido hasta 7 días después. La Session Management Cheat Sheet
pide timeouts absolutos e idle apropiados al nivel de sensibilidad, y una
forma real de terminar una sesión activa.

**Fix:** tokens de acceso de vida corta (minutos) + refresh tokens
revocables almacenados server-side, o una lista de revocación (blacklist)
para los casos de logout/compromiso.

### 9. Ninguna guía sobre transporte/almacenamiento del token — **Medio (contextual)**

El helper retorna el JWT como string plano, sin indicar cómo debe
transportarse o guardarse. En la práctica esto empuja al consumidor de la
función hacia el error más común: guardar el token en `localStorage`, expuesto
a robo vía XSS. Las cheat sheets de Authentication/Session Management piden
transporte solo por TLS y, si se usa cookie, flags `Secure`, `HttpOnly`,
`SameSite`.

**Fix:** documentar explícitamente la forma esperada de almacenamiento (o,
mejor, emitir el token directamente como cookie `HttpOnly`+`Secure` desde el
propio helper en vez de dejarlo como string suelto).

### 10. Sin registro de eventos de autenticación — **Bajo**

No hay logging de intentos de login exitosos/fallidos. La Authentication
Cheat Sheet recomienda registrar estos eventos (sin loguear la contraseña en
sí) para poder detectar patrones de ataque.

**Fix:** loguear `{ username, success: boolean, timestamp }` en cada intento
de login (nunca la contraseña ni el hash).

---

## Lo que sí hizo bien

- Usa **bcrypt** (adaptativo, con salt incorporado) en vez de un hash rápido
  como MD5/SHA-256 sin salt — cumple con la lista de algoritmos aprobados de
  la Password Storage Cheat Sheet.
- Usa las variantes **async** de bcrypt (`hash`/`compare`), evitando bloquear
  el event loop — buena práctica de ingeniería, aunque no es un punto de las
  cheat sheets en sí.
- Nunca loguea ni retorna la contraseña ni el hash en ningún punto del flujo.
- Usa una librería de JWT madura (`jsonwebtoken`) en vez de una
  implementación casera de tokens — coincide con "no reinventar la
  criptografía" del principio general de las cheat sheets.

## Conclusión

**10 hallazgos, 0 de ellos evidentes con solo correr el smoke test.** El
código pasa sus propias pruebas felices sin problema — el bug no está en la
lógica funcional, está en decisiones de diseño de seguridad que un prompt
genérico ("secure auth helper", sin más contexto) no tiene por qué anticipar
a menos que se le pida explícitamente que siga una guía como OWASP.

**Lección para el curso:** pedirle a una IA que el código sea "seguro" no
sustituye una checklist real. La única forma confiable de detectar estos
hallazgos fue leer el código línea por línea contra una referencia externa
(las cheat sheets) — ninguno de los 10 puntos se habría encontrado con tests
unitarios del happy path, ni con un linter estándar, ni "confiando" en que la
IA ya lo pensó por default.
