# Negociando accessibility-ids estables con el equipo de dev

Nota de proceso del tópico "Locators & Gestures" — no es código, es la propuesta que le
llevaríamos al equipo de desarrollo para dejar de depender de locators frágiles.

## El problema

Los locators que sacamos inspeccionando la UI actual (`resource-id`, `xpath`,
`content-desc`) funcionan hoy, pero no son un contrato — nadie en el equipo de dev sabe
que QA depende de ellos, así que pueden romperse en cualquier refactor de UI sin que
nadie se dé cuenta hasta que la suite falla. La solución de fondo no es inspeccionar
mejor, es **negociar con dev un conjunto de accessibility-ids estables** para las
pantallas más probadas, tratados como un contrato explícito entre QA y dev.

## Las 5 pantallas propuestas

Usamos la app del Reloj como caso de estudio. Sus 5 tabs de navegación son, por
definición, las pantallas con más tráfico de usuario y por lo tanto las más probadas:

| # | Pantalla | accessibility-id actual (tab) |
|---|---|---|
| 1 | Alarm | `Alarm` |
| 2 | Clock | `Clock` |
| 3 | Timer | `Timer` |
| 4 | Stopwatch | `Stopwatch` |
| 5 | Bedtime | `Bedtime` |

## Evidencia recolectada hoy que motiva la propuesta

Estos son problemas reales que encontramos en esta misma sesión, explorando con Appium
Inspector y `curl` — no hipotéticos:

1. **El accessibility-id no siempre está donde lo tocas.** Al seleccionar el tab
   "Stopwatch" en Appium Inspector, el `TextView` visible (la etiqueta de texto) no
   tenía `accessibility id` en su "Find By" — el `content-desc="Stopwatch"` real vivía
   en su `FrameLayout` padre. Sin acceso al árbol completo, un locator "obvio" apunta al
   elemento equivocado.
2. **Tap y long-press no siempre están diferenciados.** El botón "Add city" no tiene un
   manejador de `onLongClick` propio — un `mobile: longClickGesture` sobre él disparó el
   mismo `onClick` que un tap normal. Si QA no sabe esto de antemano, puede interpretar
   un test de long-press como "pasó" cuando en realidad solo se ejecutó un tap.
3. **Los gestos pueden chocar con el sistema operativo, no con la app.** Un swipe que
   arranca a menos de ~60px de cualquier borde de pantalla es interceptado por el gesto
   de "atrás" de Android, sacando al usuario (o al test) de la app por completo. Esto no
   es un bug de la app ni del test — es un detalle de la plataforma que hay que conocer
   al diseñar los gestos.

## Qué le pediríamos al equipo de dev

1. **Un `content-desc` explícito en el contenedor interactivo real** de cada pantalla
   clave (el elemento que de verdad recibe el tap), no en un hijo decorativo — así se
   evita el problema #1 de arriba.
2. **Que el `content-desc` usado como identificador de pruebas no cambie con el idioma.**
   `content-desc` está pensado originalmente para lectores de pantalla, así que se
   localiza junto con el resto de la UI — un valor como `"Stopwatch"` puede volverse
   `"Cronómetro"` en español y romper cualquier test que dependa de ese texto literal.
   Pedimos que el id de pruebas sea una cadena estable y no traducida (o, si no es
   viable, que se documente cuáles ids sí varían por locale y cuáles no).
3. **Documentar explícitamente qué elementos distinguen tap de long-press** (y cuáles
   no) en las pantallas negociadas, para no descubrirlo a ciegas como en el punto #2 de
   la evidencia.
4. **Un inventario versionado de estos 5 accessibility-ids**, en un archivo que viva en
   el repo de la app (o se comparta con QA), para que un cambio de UI que rompa alguno
   sea una decisión consciente — no un efecto secundario silencioso.

## Convención propuesta para ids nuevos

Para elementos que hoy no tienen `content-desc` útil, proponemos el patrón
`<pantalla>-<elemento>` en kebab-case, por ejemplo `clock-add-city-fab`,
`alarm-delete-button` — evita colisiones entre pantallas y es legible tanto para dev
como para QA sin tener que abrir Appium Inspector para adivinar qué hace cada uno.
