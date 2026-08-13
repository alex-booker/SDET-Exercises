// ── Ejercicio final del modulo de Mobile Automation ─────────────────────────
// Combina los topicos 4 y 5: 3 escenarios reales sobre el emulador, cada uno
// resuelto con un Screen Object, con captura de screenshot + page-source
// (captureDiagnostics() del topico 5 — que de hecho tambien guarda logcat,
// superset de lo pedido aqui) si algun escenario falla.

const { createDriver } = require('./screens/driver');
const { AlarmScreen } = require('./screens/AlarmScreen');
const { SettingsScreen } = require('./screens/SettingsScreen');
const { TimerScreen } = require('./screens/TimerScreen');
const { captureDiagnostics } = require('./support/captureDiagnostics');

const CLOCK_APP = {
  'appium:appPackage': 'com.google.android.deskclock',
  'appium:appActivity': 'com.android.deskclock.DeskClock',
};

const SETTINGS_APP = {
  'appium:appPackage': 'com.android.settings',
  'appium:appActivity': '.Settings',
};

const scenarios = [
  {
    name: 'escenario-1-encender-alarma-830',
    app: CLOCK_APP,
    run: async (driver) => {
      const alarmScreen = new AlarmScreen(driver);
      await alarmScreen.open();
      await alarmScreen.setFirstAlarmEnabled(true);
      const enabled = await alarmScreen.isFirstAlarmEnabled();
      if (!enabled) {
        throw new Error('Se esperaba que la alarma de las 8:30 AM quedara encendida');
      }
    },
  },
  {
    name: 'escenario-2-abrir-accessibility-en-settings',
    app: SETTINGS_APP,
    run: async (driver) => {
      const settingsScreen = new SettingsScreen(driver);
      await settingsScreen.openItem('Accessibility');

      const title = await driver.$(
        'android=new UiSelector().resourceId("com.android.settings:id/collapsing_toolbar")'
      );
      const contentDesc = await title.getAttribute('content-desc');
      if (contentDesc !== 'Accessibility') {
        throw new Error(
          `Se esperaba navegar a la pantalla "Accessibility", pero el titulo es "${contentDesc}"`
        );
      }
    },
  },
  {
    name: 'escenario-3-arrancar-timer-1-minuto',
    app: CLOCK_APP,
    run: async (driver) => {
      const timerScreen = new TimerScreen(driver);
      await timerScreen.open();
      await timerScreen.startNewTimer(1);
      const running = await timerScreen.isFirstTimerRunning();
      if (!running) {
        throw new Error('Se esperaba que el timer de 1 minuto quedara corriendo');
      }
    },
  },
];

async function runScenario(scenario) {
  const driver = await createDriver(scenario.app);
  try {
    await scenario.run(driver);
    console.log(`PASS - ${scenario.name}`);
    return true;
  } catch (err) {
    console.error(`FAIL - ${scenario.name}: ${err.message}`);
    const dir = await captureDiagnostics(driver, scenario.name);
    console.error(`  Diagnostico guardado en: ${dir}`);
    return false;
  } finally {
    await driver.deleteSession();
  }
}

async function main() {
  let failures = 0;
  for (const scenario of scenarios) {
    const passed = await runScenario(scenario);
    if (!passed) failures += 1;
  }

  console.log(`\n${scenarios.length - failures}/${scenarios.length} escenarios pasaron`);
  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
