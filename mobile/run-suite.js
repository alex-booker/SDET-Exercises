// ── Mobile Automation, Topico 5, puntos 1-3 ─────────────────────────────────
// Corre una mini-suite contra el Reloj: graba video de toda la corrida
// (punto 2), y si un test falla, captura screenshot + page source + logcat
// automaticamente (punto 1). Incluye un test que falla A PROPOSITO
// (`FALLA-A-PROPOSITO-elemento-inexistente`) para probar que el mecanismo de
// diagnostico realmente dispara (punto 3) — en CI, `ci.yml` sube la carpeta
// mobile/artifacts/ generada aqui via actions/upload-artifact.

const path = require('node:path');
const { createDriver } = require('./screens/driver');
const { AlarmScreen } = require('./screens/AlarmScreen');
const { captureDiagnostics, ARTIFACTS_DIR } = require('./support/captureDiagnostics');
const { startRecording, stopRecordingAndSave } = require('./support/recordScreen');

const tests = [
  {
    name: 'enciende-la-alarma-8-30',
    run: async (driver) => {
      const alarmScreen = new AlarmScreen(driver);
      await alarmScreen.open();
      await alarmScreen.setFirstAlarmEnabled(true);
      const enabled = await alarmScreen.isFirstAlarmEnabled();
      if (!enabled) {
        throw new Error('Se esperaba que la alarma quedara encendida');
      }
    },
  },
  {
    // Test deliberadamente roto: busca un elemento que no existe en la app.
    // Sirve para demostrar que captureDiagnostics() y el upload en CI
    // realmente se disparan ante una falla real, no solo en teoria.
    name: 'FALLA-A-PROPOSITO-elemento-inexistente',
    run: async (driver) => {
      const el = await driver.$('~Este elemento no existe en la app');
      await el.click();
    },
  },
];

async function main() {
  const driver = await createDriver({
    'appium:appPackage': 'com.google.android.deskclock',
    'appium:appActivity': 'com.android.deskclock.DeskClock',
  });

  await startRecording(driver);

  let failures = 0;
  for (const test of tests) {
    try {
      await test.run(driver);
      console.log(`PASS - ${test.name}`);
    } catch (err) {
      failures += 1;
      console.error(`FAIL - ${test.name}: ${err.message}`);
      const dir = await captureDiagnostics(driver, test.name);
      console.error(`  Diagnostico guardado en: ${dir}`);
    }
  }

  const videoPath = path.join(ARTIFACTS_DIR, 'suite-run.mp4');
  await stopRecordingAndSave(driver, videoPath);
  console.log(`Video de la corrida guardado en: ${videoPath}`);

  await driver.deleteSession();

  console.log(`\n${tests.length - failures}/${tests.length} tests pasaron`);
  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
