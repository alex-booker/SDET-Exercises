# Ejercicio: contar las hipótesis equivocadas antes de la correcta

**Consigna:** "For one bug, document the 3 wrong hypotheses AI suggested
before the right one — sharpens prompting."

**El bug:** el mismo de siempre — `otplib` v13 eliminó el objeto
`authenticator` que existía en v10-12 (ver
[AI-HALLUCINATION-EXAMPLE.md](./AI-HALLUCINATION-EXAMPLE.md)).

## Lo que se hizo

Una conversación real, turno por turno, con un sub-agente fresco (sin
memoria de esta conversación). Cada vez que propuso algo, se ejecutó
**de verdad** contra el paquete instalado y se le devolvió el resultado
real — nada simulado ni inventado de mi parte.

| Turno | Qué propuso el agente | ¿Correcto? |
|---|---|---|
| 1 | No adivinar — pedir `Object.keys(require('otplib'))` primero | Prudente, no es una hipótesis todavía |
| 2 | Su propio diagnóstico (`require('otplib/package.json')`) falló por el `exports` estricto del paquete; pidió una alternativa (`npm ls` + `console.log(otplib)`) | Prudente, se adaptó sin insistir |
| 3 | **Diagnóstico correcto** a la primera: "v13 es una reescritura completa, el objeto `authenticator` ya no existe" — pero con un fix cuestionable: bajar a `otplib@^12.0.1` | Diagnóstico ✅, fix ⚠️ (parche, no solución) |
| 4 (tras push-back: "no quiero quedarme en v12, dame el código real de v13") | Instaló `otplib@13.4.1` en un entorno aislado, **lo corrió de verdad**, y entregó código verificado (`generateSecret()`, `verify({secret, token})` async, `result.valid`) | ✅ Correcto y verificado |

**Resultado real: 0 hipótesis equivocadas sobre la causa.** No es el
resultado que pedía la consigna (3 antes de la correcta) — se documenta tal
como pasó, no se fuerza un conteo que no ocurrió.

## El contraste que sí vale la pena documentar

Este mismo bug, exacto, ya se había investigado antes en esta sesión — pero
de la otra forma: **yo, a ciegas, de memoria, sin pedir evidencia antes de
proponer código** (ver `AI-HALLUCINATION-EXAMPLE.md`). Ese intento sí generó
hipótesis equivocadas reales, en orden:

1. **Hipótesis 1 (equivocada):** `const { authenticator } = require('otplib')` — asumí que el objeto `authenticator` de v10-12 seguía existiendo. Resultado real: `TypeError: Cannot read properties of undefined (reading 'generateSecret')`.
2. **Hipótesis 2 (equivocada):** corregí a mano, sin leer documentación, asumiendo funciones síncronas con argumentos posicionales (`otplib.generate(secret)`, `otplib.verify({token, secret})`). Resultado real: `SecretMissingError: Secret is required... provide via { secret: '...' }`.
3. **Hipótesis correcta:** solo al leer el `README.md` que trae el propio paquete instalado — `generate({ secret })` y `verify({ secret, token })`, ambas async.

**Mismo bug exacto. Mismo punto de partida (paquete instalado, sin pistas
previas). Dos resultados completamente distintos:**

| | Método | Hipótesis equivocadas |
|---|---|---|
| Yo, en `AI-HALLUCINATION-EXAMPLE.md` | Adivinar de memoria, sin pedir evidencia, corregir sin leer docs | **2** |
| El agente fresco, en este ejercicio | Pedir evidencia real antes de proponer, verificar corriendo el código antes de responder | **0** |

## Lección para el curso (la real, no la que pedía la consigna al pie de la letra)

1. La diferencia entre 2 hipótesis equivocadas y 0 no fue la dificultad del
   bug — fue exactamente el bug, con el mismo paquete y la misma versión.
   La diferencia fue el **método**: pedir evidencia real antes de opinar, y
   verificar ejecutando antes de entregar una respuesta.
2. "Sharpens prompting" (la frase de la consigna) se cumplió, solo que en la
   dirección de *evitar* las hipótesis equivocadas en primer lugar, no en la
   de aprender a reconocerlas después de que ya salieron. Un prompt que dice
   "dame un diagnóstico" invita a adivinar; una conversación que insiste en
   "muéstrame la evidencia antes de proponer nada" produce menos (o cero)
   pasos en falso.
3. Vale la pena reportar el resultado real de un experimento, incluso
   cuando no coincide con lo que la consigna anticipaba — un ejercicio que
   asume "la IA se va a equivocar 3 veces" y encuentra que no fue así es un
   hallazgo válido, no un experimento fallido.
