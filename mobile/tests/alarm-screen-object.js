// ── Mobile Automation, Topico 4, punto 1 (DESPUES) ──────────────────────────
// Mismo resultado que tests/alarm-flat.js, pero el test ya no conoce ningun
// resource-id ni selector — solo llama metodos de negocio del Screen Object.
// Si el resource-id del switch cambia manana, se corrige en un solo lugar
// (AlarmScreen.js), no en cada test que prenda una alarma.

const { createDriver } = require('../screens/driver');
const { AlarmScreen } = require('../screens/AlarmScreen');

async function main() {
  const driver = await createDriver({
    'appium:appPackage': 'com.google.android.deskclock',
    'appium:appActivity': 'com.android.deskclock.DeskClock',
  });

  try {
    const alarmScreen = new AlarmScreen(driver);
    await alarmScreen.open();
    await alarmScreen.setFirstAlarmEnabled(true);

    const isEnabled = await alarmScreen.isFirstAlarmEnabled();
    console.log(`Alarma de las 8:30 AM encendida: ${isEnabled}`);
    if (!isEnabled) {
      throw new Error('Se esperaba que la alarma quedara encendida');
    }
  } finally {
    await driver.deleteSession();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
