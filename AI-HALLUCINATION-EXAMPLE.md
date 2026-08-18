# Ejercicio: encontrar una llamada a API alucinada

**Consigna:** "Find one hallucinated API call in your AI history. Save the
example."

No había un ejemplo real a la mano en el historial, así que se generó uno en
vivo: se le pidió a "una IA" (yo, sin consultar documentación primero) que
completara una de las mejoras sugeridas en [AI-AUTH-AUDIT.md](./AI-AUTH-AUDIT.md)
(agregar MFA con TOTP), escribiendo el código de memoria.

## Intentos que NO produjeron una alucinación (contexto)

Antes de encontrar el caso real, se probaron dos implementaciones más — ambas
a ciegas, ambas correctas a la primera:

- [auth/loginRateLimiter.js](./auth/loginRateLimiter.js) con `express-rate-limit`
  — el `require()` clásico (`const rateLimit = require('express-rate-limit')`)
  sigue funcionando en la v8 actual, y `max: 5` sí bloquea la 6ª petición
  (confirmado montándolo en un servidor Express real y disparando 7 requests).
- [auth/prehash.js](./auth/prehash.js) con `crypto.hash('sha256', password, 'hex')`
  — API de conveniencia real de Node, orden de argumentos correcto.

Estos dos son librerías extremadamente comunes (Express, Node core), con
muchísima representación en el material de entrenamiento — igual que pasó con
SauceDemo en el ejercicio de LLM anterior. El patrón se repite: **contra algo
muy popular y estable, un LLM rara vez alucina.**

## El hallazgo real: `auth/totp.js`

```js
const { authenticator } = require('otplib');

function generateMfaSecret() {
  return authenticator.generateSecret();
}
// ...
```

**Error al correrlo:**

```
TypeError: Cannot read properties of undefined (reading 'generateSecret')
```

`authenticator` es `undefined`. El código asume la API de **otplib v10-12**
(un objeto preconfigurado `authenticator` con métodos `generateSecret()`,
`generate(secret)`, `verify({token, secret})`) — una API real que existió
durante años y aparece en muchísimos tutoriales. Pero **otplib v13 (la
versión que `npm install otplib` trae hoy) es una reescritura completa** que
eliminó ese objeto por completo. Del propio README del paquete:

> v13 is a complete rewrite with breaking changes. For example:
> - (Removed) Separate authenticator package — TOTP now covers all
>   authenticator functionality with default plugins

## Segundo intento, también equivocado

Al corregir a mano sin todavía leer la documentación (asumiendo que las
funciones nuevas eran síncronas y de argumentos posicionales):

```js
const otplib = require('otplib');
const code = otplib.generate(secret);              // mal: falta wrappear en { secret }
const isValid = otplib.verify({ token: code, secret }); // mal: es async
```

Resultado real:

```
SecretMissingError: Secret is required. Use generateSecret() to create one,
or provide via { secret: 'YOUR_BASE32_SECRET' }
```

Es decir: **incluso el intento de arreglo, hecho de memoria, alucinó una
segunda vez** — asumiendo firma síncrona y argumento posicional en vez de un
objeto de opciones. Solo al leer el `README.md` que trae el propio paquete
instalado (`node_modules/otplib/README.md`) apareció la forma real:

```js
const { generateSecret, generate, verify } = require('otplib');

const secret = generateSecret();
const token = await generate({ secret });           // async, recibe un objeto
const result = await verify({ secret, token });      // retorna { valid, delta, ... }, NO un boolean
```

## Por qué pasó esto (y no es "el LLM es tonto")

No es una API inventada de la nada — es una API **que sí existió**, real y
documentada, durante múltiples versiones del paquete. El problema es que el
paquete tuvo una reescritura mayor (v13) que el "recuerdo" del modelo no
reflejaba. Esto es un patrón de alucinación distinto (y en la práctica más
peligroso) que "inventar un método de la nada": el código **parece**
perfectamente razonable, usa nombres de método plausibles, y solo se revela
como incorrecto al **ejecutarlo contra la versión real instalada**.

## Lección para el curso

1. Las alucinaciones de API más engañosas no son las absurdas (`array.frobnicate()`)
   sino las que **fueron ciertas en una versión anterior** de la librería. El
   código se ve completamente creíble.
2. Cuanto más rápido cambia la superficie de una librería entre versiones
   mayores (otplib v13 es un ejemplo extremo: reescritura completa), más alto
   el riesgo — independientemente de qué tan "conocida" sea la librería.
3. La única forma confiable de detectarlo fue **instalar la versión real y
   correr el código** — ni revisar el código a simple vista, ni "confiar" en
   que sonaba plausible, lo hubiera revelado.
4. Fijar la versión exacta en `package.json` (en vez de `^13.0.0`) no arregla
   esto — el problema es que el conocimiento del modelo quedó desactualizado
   respecto a la versión que el proyecto realmente instala *hoy*.
