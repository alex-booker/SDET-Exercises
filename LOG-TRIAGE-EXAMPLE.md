# Ejercicio: pegar un log de 100+ líneas, pedirle a la IA la primera línea interesante

**Consigna:** "Paste a 100-line failing log; ask AI to identify the first
interesting line."

**El log:** la primera corrida real (sin corregir) de
`tests/03-llm-generated-sort.spec.ts`, de esta misma sesión — dos fallos
completos con reintentos, screenshots, video y trace, ~135 líneas en total.
Se le pasó tal cual, sin editar, a un sub-agente fresco (sin repo, sin
memoria de esta conversación).

## Lo que respondió

**Primera línea interesante** (según "primera señal de que algo está mal"):

```
  x  6 [chromium] › tests\03-llm-generated-sort.spec.ts:105:3 › Product sort dropdown with problem_user (LLM-generated, unverified) › each product shows a distinct image for problem_user (3.5s)
```

Razonamiento: todo lo anterior (`Running 7 tests...`, los 5 `ok`) es
confirmación de que algo funciona — no requiere ninguna acción. Esta línea
es la primera que "voltea la señal" y ya da lo mínimo necesario para
empezar a investigar (archivo, línea, nombre del escenario) antes de que
exista ningún stack trace.

**Sin que se le pidiera explícitamente**, distinguió una segunda
interpretación de "interesante" — *la primera línea que explica el mecanismo
del fallo*, no solo que algo falló — y para esa dio una respuesta distinta:

```
    Expected: 6
    Received: 1
```

(del segundo bloque de fallo, el de las imágenes duplicadas), explicando que
esa es la línea que dice *por qué* está roto, no solo *que* está roto.

## Verificación: ¿la respuesta principal es correcta?

**Sí.** La línea `x 6` es, sin ambigüedad, la primera línea del log con
valor diagnóstico real — todo lo anterior es ruido de confirmación. Un
ingeniero haciendo triage de este log a mano habría señalado la misma línea.

## Un matiz que sí hay que corregirle

Al justificar por qué eligió el segundo bloque de fallo (imágenes
duplicadas) como "más revelador de la causa raíz" que el primero
(orden de productos), el agente especuló:

> "a broken sort could itself be a downstream symptom of a page that's
> rendering wrong/duplicate data for problem_user in general"

**Esto no es correcto.** Se sabe (de primera mano, por haber investigado
este mismo bug en
[LLM-EXERCISE-NOTES.md](./LLM-EXERCISE-NOTES.md)) que son dos bugs
**independientes y no relacionados** de la simulación de `problem_user` en
SauceDemo: uno es que el dropdown de orden no hace nada, el otro es que las
6 imágenes comparten el mismo `src`. Ninguno es causa del otro — el agente
inventó una relación causal plausible-sonante para justificar su elección,
sin tener evidencia real de que existiera.

## Lección para el curso

1. La respuesta principal (la línea `x 6`) fue correcta y bien razonada —
   una IA sí puede hacer triage de ruido de log de forma confiable cuando la
   pregunta es "¿cuál es la primera señal de problema?".
2. El valor real de pedirle a una IA que distinga entre interpretaciones
   ("primera señal" vs. "primera explicación") en vez de forzarla a una sola
   respuesta es que **revela su razonamiento**, y ese razonamiento se puede
   auditar — y en este caso, auditarlo encontró una inferencia causal
   inventada que sonaba razonable pero era falsa.
3. Esto es el mismo patrón de riesgo que las alucinaciones de API
   (documentado en
   [AI-HALLUCINATION-EXAMPLE.md](./AI-HALLUCINATION-EXAMPLE.md)): el
   problema no es que la IA se equivoque en cosas absurdas, es que a veces
   rellena un vacío de conocimiento con algo plausible y lo presenta con la
   misma confianza que una afirmación verificada. La única forma de
   atraparlo fue tener conocimiento previo real del bug, no algo que se
   pueda delegar a la propia IA que cometió el error.
