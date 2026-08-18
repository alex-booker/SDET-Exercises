# Ejercicio: fallo flaky real — hipótesis de la IA vs. las mías

**Consigna:** "Take a recent flaky failure. Paste error + code + ruled-out
into AI; rank the hypotheses against your own."

**El bug:** el mismo que se documentó (y arregló) en
[MULTI-FILE-REFACTOR-NOTES.md](./MULTI-FILE-REFACTOR-NOTES.md) — el rate
limiter de login compartía su contador entre servidores de prueba distintos,
causando un `429` un intento antes de lo esperado, de forma intermitente.

## Cómo se armó el experimento

Se le pasó a un sub-agente **fresco** (sin memoria de esta conversación, sin
acceso al repo — instrucción explícita de no leer archivos ni correr
comandos, solo razonar sobre lo pegado en el prompt) exactamente:

1. El error observado.
2. El código relevante **tal como estaba antes del fix**
   (`loginRateLimiter.js`, `authRouter.js`, el test de integración).
3. Lo que ya se había descartado: la lógica del rate limiter en sí funciona
   bien aislada (confirmado con un script standalone), el fallo es
   reproducible con `--workers=1` pero no corriendo el test solo, y el
   "off-by-one" siempre es en la misma dirección (nunca al revés, nunca en
   otra posición).

Se le pidió una lista de hipótesis rankeadas de más a menos probable — sin
darle la respuesta, sin decirle qué se había arreglado después.

## Lo que respondió (sin editar, tal cual)

1. **(Casi seguro) Estado del rate limiter compartido vía el cache de
   módulos de Node, indexado por IP.** `loginRateLimiter` se instancia una
   vez al cargar el módulo; cada `startTestServer()` reutiliza esa misma
   instancia con el mismo store interno; como el `keyGenerator` por defecto
   usa `req.ip` (127.0.0.1 sin importar el puerto) y **cuenta tanto éxitos
   como fallos por defecto** (sin `skipSuccessfulRequests`), el único login
   exitoso del primer test deja el contador en 1 antes de que arranque el
   segundo test.
2. La razón de que sea intermitente fuera de `--workers=1`: Playwright
   reparte tests en procesos separados por defecto, cada uno con su propio
   cache de `require` — el bug solo aparece cuando ambos tests caen en el
   mismo proceso.
3. Dependencia del orden de ejecución dentro del mismo proceso — el bug
   solo se dispara si "registers and logs in" corre ANTES que "blocks
   brute-force".
4. (Menor, poco probable) inconsistencia IPv4/IPv6 en `req.ip` — descartada
   por el propio agente porque fragmentaría el conteo, no produciría un
   "un intento antes" consistente y siempre en la misma dirección.
5. (Menos probable) teardown incompleto de `server.close()` dejando un
   request en vuelo — descartada por no explicar la reproducibilidad 100%
   bajo `--workers=1`.

## Comparación contra mi propio diagnóstico

Mi explicación original (en `MULTI-FILE-REFACTOR-NOTES.md`, escrita ANTES de
este ejercicio, en el momento real en que se encontró el bug):

> "`loginRateLimiter` se creaba una sola vez al importar el módulo... todos
> esos servidores importaban la misma instancia del rate limiter — con el
> mismo contador de intentos."

| | Mi diagnóstico original | Hipótesis #1 del agente |
|---|---|---|
| Causa raíz (singleton compartido vía `require`) | ✅ Correcto | ✅ Correcto |
| Explica *por qué* el contador ya iba en 1 (cuenta éxitos, no solo fallos) | ❌ No lo mencioné explícitamente | ✅ Lo señaló como parte del mecanismo |
| Explica por qué es intermitente fuera de `--workers=1` (procesos separados) | ⚠️ Lo sabía por observación empírica, no lo articulé como mecanismo | ✅ Lo explicó como consecuencia directa del modelo de workers |
| Hipótesis alternativas descartadas con criterio (no solo listadas) | No aplica — no generé una lista de alternativas, fui directo a la causa | ✅ Explicó por qué IPv4/IPv6 y el teardown NO encajan con el patrón observado |

**Veredicto honesto: la hipótesis #1 de la IA fue tan buena como la mía, y
en un punto más completa** (la razón exacta de por qué un solo login exitoso
alcanza para contaminar el contador). Esto no es la narrativa esperable de
"la IA se equivoca, el humano tiene que corregirla" — con un prompt bien
armado (error + código exacto + lo ya descartado), la calidad de la
hipótesis fue equivalente o superior a la mía.

## Lección para el curso

1. La calidad de la hipótesis de una IA depende muchísimo de la calidad del
   contexto que se le da — un prompt con el error, el código exacto, Y lo ya
   descartado, produjo una hipótesis #1 correcta y bien fundamentada. Un
   prompt más pobre ("mi test es flaky, ¿por qué?") probablemente no habría
   llegado ahí.
2. "Lo ya descartado" no es relleno — la pista de que el fallo desaparece
   corriendo el test solo, y que siempre es en la misma dirección, fue
   exactamente lo que permitió al agente descartar (y explicar por qué)
   las hipótesis de IPv4/IPv6 y de teardown, en vez de solo enumerarlas.
3. Rankear las hipótesis de la IA contra las propias no siempre termina en
   "gané yo" — a veces termina en "coincidimos, y la explicación de la IA
   quedó más completa que la mía". Vale la pena documentar ese resultado
   tan honestamente como el caso contrario.
