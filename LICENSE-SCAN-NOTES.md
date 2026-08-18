# Ejercicio: escanear licencias de un proyecto asistido por IA

**Consigna:** "Run a license scanner (FOSSA free tier) on a small
AI-assisted project."

## Nota sobre FOSSA específicamente

FOSSA requiere crear una cuenta y conectar/subir el repositorio a su
plataforma. Crear cuentas en nombre de alguien más y subir código a un
servicio de terceros no son acciones que pueda hacer directamente por
política — te tocaría el registro a ti. Como alternativa **equivalente en
espíritu** (mismo objetivo: saber qué licencias trae la cadena de
dependencias), corrí `license-checker`, que hace el mismo tipo de análisis
mirando los metadatos de cada paquete instalado, sin necesidad de cuenta ni
de subir nada a ningún lado.

Si de verdad necesitas específicamente el reporte de FOSSA para la entrega,
al final de este documento dejo los pasos para que lo corras tú mismo en un
par de minutos con lo que ya encontramos aquí.

## Qué se escaneó

El proyecto completo `SDET-Exercise` (Playwright + los módulos de auth
agregados en los ejercicios anteriores), con todas sus dependencias
instaladas (`node_modules`).

```bash
npx license-checker --summary
```

## Resultado

```
├─ MIT: 318
├─ ISC: 28
├─ Apache-2.0: 23
├─ BSD-2-Clause: 16
├─ BSD-3-Clause: 7
├─ BlueOak-1.0.0: 6
├─ (MIT OR CC0-1.0): 4
├─ CC-BY-4.0: 1
├─ MIT*: 1
├─ (MIT OR GPL-3.0-or-later): 1
├─ (MIT AND Zlib): 1
├─ CC-BY-3.0: 1
├─ CC0-1.0: 1
└─ 0BSD: 1
```

**Lectura general:** la inmensa mayoría (más de 390 de ~408 paquetes) son
licencias permisivas estándar de la industria (MIT, ISC, Apache-2.0, BSD,
0BSD, BlueOak) — sin obligaciones de copyleft, uso comercial sin
restricciones. Nada de qué preocuparse ahí.

## Los 4 casos que sí vale la pena mirar de cerca

| Paquete | Licencia | Viene de | Riesgo real |
|---|---|---|---|
| `@promptbook/utils@0.69.5` | **CC-BY-4.0** | `webdriverio` → `@wdio/utils` → `locate-app` | Ver abajo — el más interesante de los cuatro |
| `jszip@3.10.1` | `(MIT OR GPL-3.0-or-later)` | `webdriverio` (directo) | Bajo — es dual-licencia, se puede usar bajo MIT |
| `css-value@0.0.1` | `MIT*` | `webdriverio` (directo) | Bajo — el `*` significa que `license-checker` infirió la licencia (no viene de un campo `license` explícito en su `package.json`); vale la pena confirmarla a mano si este paquete llegara a pesar en una auditoría real |
| `spdx-exceptions@2.5.0` | CC-BY-3.0 | dependencia interna de la propia herramienta `license-checker` | Ninguno — es un archivo de datos (lista de excepciones SPDX), no código que se use en el proyecto |

### `@promptbook/utils` — el hallazgo real

Es una dependencia transitiva de cuarto nivel
(`webdriverio → @wdio/utils → locate-app → @promptbook/utils`), no algo que
el proyecto pidió directamente. Su licencia es **CC-BY-4.0** (Creative
Commons Atribución) — una licencia pensada para contenido creativo
(imágenes, texto, datos), no para software. La propia Creative Commons
desaconseja usar sus licencias para código, precisamente porque no cubren
temas que sí importan en software (patentes, qué pasa con el código
derivado, compatibilidad con otras licencias de código).

En este proyecto el riesgo real es bajo: es una dependencia de una
herramienta de desarrollo (`webdriverio`, que ni siquiera se usa realmente —
este proyecto usa Playwright, no WebdriverIO — probablemente quedó de una
prueba anterior), no algo que se distribuya ni se empaquete con el producto
final. Pero es exactamente el tipo de cosa que un escaneo de licencias está
pensado para atrapar: **nadie eligió esa licencia a propósito, apareció sola,
cuatro niveles abajo en el árbol de dependencias.**

## Lección para el curso

1. Un proyecto "pequeño" con 3-4 dependencias directas puede fácilmente traer
   **cientos** de paquetes transitivos — y con ellos, licencias que nadie del
   equipo revisó ni aceptó conscientemente.
2. Las licencias problemáticas casi nunca están en las dependencias directas
   (esas sí se eligen con cuidado); aparecen varios niveles abajo, donde
   nadie mira.
3. Un escaneo de licencias no reemplaza el juicio legal — encontrar
   `CC-BY-4.0` en una dependencia transitiva de una herramienta de dev no es
   necesariamente un problema real, pero **sí es algo que alguien con
   criterio debe evaluar**, no algo para ignorar automáticamente ni para
   bloquear automáticamente.
4. Para un proyecto "asistido por IA" en particular: si le pides a una IA que
   agregue una dependencia para resolver algo rápido, es poco probable que
   evalúe la licencia de esa dependencia (ni de sus transitivas) a menos que
   se lo pidas explícitamente — igual que un desarrollador humano apurado.

## Si necesitas el reporte de FOSSA específicamente

1. Crea una cuenta gratis en [fossa.com](https://fossa.com) (tier gratuito
   para proyectos open-source/pequeños).
2. Conecta el repo de GitHub (`alex-booker/SDET-Exercises`) desde su
   dashboard, o instala `fossa-cli` localmente:
   ```bash
   npm install -g fossa-cli
   fossa init
   fossa analyze
   fossa report licenses
   ```
3. El `fossa analyze` va a encontrar exactamente los mismos 4 casos límite
   documentados arriba (mismo `node_modules`, mismos metadatos) — FOSSA
   además los clasifica automáticamente por nivel de riesgo/compatibilidad,
   que es su valor agregado sobre `license-checker`.
