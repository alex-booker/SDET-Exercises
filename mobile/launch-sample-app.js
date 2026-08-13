// ── Mobile Automation, Topico 1 ─────────────────────────────────────────────
// Lanza una app instalada en el emulador usando Appium + capabilities, y
// guarda un screenshot como evidencia. Es el mismo flujo que se probo a mano
// con curl: POST /session (con las capabilities) -> GET /screenshot -> DELETE
// /session. Node 24+ ya trae `fetch` nativo, asi que no hace falta agregar
// un cliente de Appium (ej. webdriverio) solo para esto.
//
// Requisitos antes de correr este script:
//   1. Appium corriendo: `appium` (en otra terminal, puerto 4723 por defecto)
//   2. Emulador arrancado y detectado: `adb devices`
//
// appPackage/appActivity abajo son de la app "Settings" de Android, elegida
// porque siempre viene preinstalada. Se obtuvieron con `adb logcat` (buscando
// la linea "ActivityTaskManager: Displayed <package>/<activity>") o con
// `adb shell dumpsys window | grep mCurrentFocus` — ver find-package-name.js
// en esta misma carpeta para automatizar esa parte.

const fs = require('node:fs');
const path = require('node:path');

const APPIUM_URL = 'http://127.0.0.1:4723';

const capabilities = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': 'emulator-5554',
  'appium:appPackage': 'com.android.settings',
  'appium:appActivity': '.Settings',
  'appium:noReset': true,
  // Default de Appium es 60s de inactividad antes de matar la sesion sola;
  // lo subimos porque este script se detiene en cada paso a loggear.
  'appium:newCommandTimeout': 300,
};

async function createSession() {
  const res = await fetch(`${APPIUM_URL}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ capabilities: { alwaysMatch: capabilities } }),
  });
  const body = await res.json();
  if (!res.ok || body.value?.error) {
    throw new Error(
      `No se pudo crear la sesion. ¿Appium esta corriendo en ${APPIUM_URL}? ¿el emulador esta arrancado (adb devices)? ` +
        `Detalle: ${JSON.stringify(body.value)}`
    );
  }
  return body.value; // incluye sessionId + capabilities resueltas del dispositivo
}

async function saveScreenshot(sessionId) {
  const res = await fetch(`${APPIUM_URL}/session/${sessionId}/screenshot`);
  const body = await res.json();
  const buffer = Buffer.from(body.value, 'base64');
  const outPath = path.join(__dirname, 'last-screenshot.png');
  fs.writeFileSync(outPath, buffer);
  return outPath;
}

async function deleteSession(sessionId) {
  await fetch(`${APPIUM_URL}/session/${sessionId}`, { method: 'DELETE' });
}

async function main() {
  console.log(`Creando sesion para ${capabilities['appium:appPackage']}/${capabilities['appium:appActivity']}...`);
  const session = await createSession();
  console.log(`Sesion creada: ${session.sessionId}`);
  console.log(`Dispositivo: ${session.capabilities.deviceModel} (API ${session.capabilities.deviceApiLevel})`);

  try {
    const screenshotPath = await saveScreenshot(session.sessionId);
    console.log(`Screenshot guardado en: ${screenshotPath}`);
  } finally {
    await deleteSession(session.sessionId);
    console.log('Sesion cerrada.');
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
