// ── Mobile Automation, Topico 5, punto 2 ────────────────────────────────────
// Graba la pantalla durante una corrida completa (a diferencia del trio de
// diagnostico, que es una foto del momento de la falla, el video muestra el
// camino completo hasta llegar ahi). Appium expone esto como un comando
// mobile: que empieza a grabar en el dispositivo y, al detenerlo, devuelve
// el archivo completo en base64.

const fs = require('node:fs');
const path = require('node:path');

async function startRecording(driver) {
  await driver.startRecordingScreen();
}

async function stopRecordingAndSave(driver, outPath) {
  const base64 = await driver.stopRecordingScreen();
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
  return outPath;
}

module.exports = { startRecording, stopRecordingAndSave };
