# Ejercicio: pedirle a un LLM que escriba un test, correrlo, y anotar qué falló

**Consigna:** "Ask an LLM to write a test for a real page you control. Run it.
Note what it got wrong."

**Página elegida:** el dropdown de orden de productos
(`Name (A to Z)` / `Name (Z to A)` / `Price (low to high)` / `Price (high to low)`)
en `https://www.saucedemo.com/inventory.html`. No estaba cubierto por ningún
test existente en este repo.

**Archivo generado:** [tests/03-llm-generated-sort.spec.ts](./tests/03-llm-generated-sort.spec.ts)

## Metodología

El test se escribió **sin abrir el navegador ni inspeccionar el DOM real**,
usando solo conocimiento general (memorizado) sobre cómo suele estar armado
ese dropdown en SauceDemo. El login reutiliza `LoginPage` porque ya estaba
verificado en ejercicios anteriores de este mismo proyecto — el experimento
es sobre el dropdown de orden, no sobre el login.

## Ronda 1 — standard_user

5 aserciones sobre `standard_user`: selector del dropdown
(`[data-test="product-sort-container"]`), los 4 `value` de las opciones
(`az`/`za`/`lohi`/`hilo`), el texto visible exacto de cada opción, el valor
por defecto al cargar la página, y que ordenar por nombre/precio realmente
reordene la lista.

**Resultado: las 5 pasaron a la primera.** El LLM no se equivocó en nada:
selector correcto, valores correctos, textos exactos correctos, comportamiento
de ordenamiento correcto.

## Ronda 2 — problem_user (la parte que sí falló)

Antes de concluir "el LLM acertó todo", se probó una hipótesis más difícil:
que `problem_user` (un usuario de prueba de SauceDemo con bugs intencionales)
se comporta igual que `standard_user`. Dos aserciones, ambas fallaron:

1. **Ordenar por "Name (Z to A)" no hace nada para `problem_user`** — la
   lista se queda en el orden original (A-Z) en vez de invertirse.
2. **Las 6 imágenes de producto comparten el mismo `src`** para
   `problem_user` (todas muestran la misma imagen — el clásico bug de
   "todos los productos con la misma foto de perro" de SauceDemo).

Ambos son bugs *reales e intencionales* de la app (SauceDemo los incluye a
propósito para que los testers los encuentren), no fallas del test. Se dejaron
en el repo marcados con `test.fail()` — así documentan el bug sin romper el
CI, y si SauceDemo alguna vez "arregla" ese comportamiento, el test lo
señalará como un fallo inesperado (pasó cuando se esperaba que fallara).

## Qué salió mal, en concreto

| # | Suposición del LLM | Realidad | Tipo de error |
|---|---|---|---|
| 1 | `problem_user` ordena la lista igual que cualquier otro usuario | El dropdown no tiene efecto visible para `problem_user` | Asunción de comportamiento uniforme entre roles/usuarios |
| 2 | Cada producto tiene una imagen distinta, sin importar el usuario logueado | Todas las imágenes son idénticas para `problem_user` | Misma asunción — generalizar el "happy path" a todos los casos |

Nada de esto es un error de sintaxis, de selector, o de Playwright — el
código generado era perfectamente válido. El error fue **conceptual**: asumir
que el comportamiento observado con un usuario (el más común, `standard_user`)
es representativo de toda la aplicación.

## Por qué la Ronda 1 salió perfecta (y por qué eso no es tan buena noticia)

SauceDemo es probablemente el sitio de práctica de QA más usado del mundo —
aparece en miles de tutoriales, cursos y repositorios públicos de
automatización. Es muy probable que un LLM no esté "razonando" sobre la
estructura del dropdown, sino **recordándola** de haberla visto (indirectamente,
a través de patrones) miles de veces en su entrenamiento.

Eso significa que un resultado perfecto en la Ronda 1 no es evidencia de que
el LLM "entiende" la aplicación — es evidencia de que la aplicación es famosa.
Contra una app interna o poco documentada (que es el caso real en el trabajo
de un SDET), no hay ese efecto de memorización, y la tasa de aciertos "a
ciegas" sería mucho más baja que la que se ve aquí.

## Conclusión / lección para el curso

1. Un test generado por un LLM puede compilar, correr, y pasar — y aun así
   estar **verificando la suposición equivocada** (comportamiento uniforme
   entre usuarios/roles) en vez de la realidad de la app.
2. Ese tipo de error **no se detecta leyendo el código del test** — el código
   es razonable. Solo se detecta **corriéndolo contra la app real** y, más
   importante, probando casos que el LLM no tenga motivos para haber
   memorizado (usuarios/roles especiales, estados de error, flujos menos
   documentados).
3. Un LLM es más confiable generando tests para páginas/apps muy conocidas y
   documentadas públicamente que para apps internas o propietarias — que es,
   irónicamente, donde más se necesita ayuda para escribir tests rápido.
