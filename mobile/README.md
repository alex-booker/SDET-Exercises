# Mobile Automation — Quickstart

Todo lo de esta carpeta corre contra un emulador Android real, usando Appium
+ [webdriverio](https://webdriver.io/) (excepto los dos scripts mas viejos de
`launch-sample-app.js`/`find-package-name.js`, que usan `fetch` crudo contra la
API REST de Appium con fines didacticos).

## Requisitos (una sola vez)

- **JDK 17** — necesario para Android SDK y Appium.
- **Android Studio** + **Android SDK** + al menos un **AVD** (emulador) creado
  desde el Device Manager.
- **Appium** instalado globalmente (`npm i -g appium`) con el driver de Android:
  ```bash
  appium driver install uiautomator2
  ```
- Dependencias del proyecto (`webdriverio`, etc.):
  ```bash
  npm install
  ```

## Para correr cualquier script de esta carpeta

### 1. Arrancar el emulador
Android Studio → **Device Manager** → ▶ Play sobre el AVD.

Verificar que quedo detectado:
```bash
adb devices
```
Debe listar el emulador como `device` (ej. `emulator-5554`).

### 2. Levantar el servidor de Appium
En una terminal aparte, dejarla corriendo:
```bash
appium --address 127.0.0.1 --port 4723 --allow-insecure uiautomator2:chromedriver_autodownload
```
Esperar el mensaje `Appium REST http interface listener started on http://127.0.0.1:4723`.

*(El flag `chromedriver_autodownload` solo hace falta para escenarios con
WebView/Chrome — no molesta dejarlo siempre activo.)*

### 3. Correr el script que quieras
Todos estan expuestos como scripts de `npm` (ver tabla abajo), por ejemplo:
```bash
npm run mobile:final-exercise
```

## Scripts disponibles

| Comando | Que hace |
|---|---|
| `npm run mobile:launch` | Lanza una app via capabilities y toma un screenshot (Topico 1) |
| `npm run mobile:find-package` | Descubre el package/activity de una app abierta a mano, via `adb logcat` (Topico 1) |
| `npm run mobile:alarm-flat` | Enciende una alarma — version sin Screen Object (Topico 4, "antes") |
| `npm run mobile:alarm-screen-object` | Lo mismo, pero con `AlarmScreen` (Topico 4, "despues") |
| `npm run mobile:settings-scroll-demo` | Demuestra `scrollUntilVisible()` en la lista de Settings (Topico 4) |
| `npm run mobile:run-suite` | Corre una mini-suite con grabacion de video + diagnostico automatico al fallar, incluye una falla a proposito (Topico 5) |
| `npm run mobile:final-exercise` | **Ejercicio final del modulo**: 3 escenarios reales (alarma, Settings, timer) via Screen Objects, con screenshot + page-source al fallar |

## Si un escenario falla

Revisa `mobile/artifacts/<nombre-del-escenario>/`: ahi se guardan automaticamente
`screenshot.png`, `page-source.xml` y `logcat.txt` del momento exacto de la
falla (y `suite-run.mp4` con el video completo, solo en `mobile:run-suite`).
Esa carpeta esta en `.gitignore` — se regenera en cada corrida, no se versiona.

## Estructura

```
mobile/
├── screens/          ← Screen Objects (BaseScreen + AlarmScreen/SettingsScreen/TimerScreen)
├── support/           ← helpers de diagnostico (captureDiagnostics, recordScreen)
├── tests/             ← demos puntuales de topicos anteriores (antes/despues del refactor, scroll)
├── final-exercise.js  ← ejercicio final del modulo
├── run-suite.js       ← demo de diagnostico + video (Topico 5)
└── ACCESSIBILITY-IDS.md ← propuesta de convencion de accessibility-ids (Topico 2)
```
