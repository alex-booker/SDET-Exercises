// ── Mobile Automation, Topico 5, punto 1 ────────────────────────────────────
// El "trio de diagnostico" al fallar un test: screenshot (que se veia),
// page source (el arbol de elementos exacto en ese instante) y logcat (log
// del sistema/app — ahi aparecen crashes que ni el screenshot ni el source
// muestran). Ninguno de los tres solo alcanza para diagnosticar una falla.

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ARTIFACTS_DIR = path.join(__dirname, '..', 'artifacts');

async function captureDiagnostics(driver, testName) {
  const dir = path.join(ARTIFACTS_DIR, testName);
  fs.mkdirSync(dir, { recursive: true });

  const screenshotBase64 = await driver.takeScreenshot();
  fs.writeFileSync(path.join(dir, 'screenshot.png'), Buffer.from(screenshotBase64, 'base64'));

  const pageSource = await driver.getPageSource();
  fs.writeFileSync(path.join(dir, 'page-source.xml'), pageSource);

  const logcatPath = path.join(dir, 'logcat.txt');
  try {
    // OJO: `adb logcat -f <archivo>` escribe ese archivo DENTRO del
    // dispositivo, no en el host — no sirve para esto. En vez de capturar el
    // stdout con execFileSync (con un logcat grande, el pipe sincrono de
    // Node en Windows revienta con ENOBUFS antes de llegar a maxBuffer),
    // apuntamos el stdout del proceso directo a un file descriptor del host.
    const fd = fs.openSync(logcatPath, 'w');
    try {
      execFileSync('adb', ['logcat', '-d'], { stdio: ['ignore', fd, 'ignore'] });
    } finally {
      fs.closeSync(fd);
    }
  } catch (err) {
    // No queremos que un logcat fallido tumbe la captura de diagnostico
    // completa — dejamos constancia del error y seguimos.
    fs.writeFileSync(logcatPath, `No se pudo capturar logcat: ${err.message}`);
  }

  return dir;
}

module.exports = { captureDiagnostics, ARTIFACTS_DIR };
