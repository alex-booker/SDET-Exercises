// ── Mobile Automation, Topico 4, punto 1 (ANTES) ────────────────────────────
// Version "flat": todo el conocimiento de la pantalla de Alarm (locators y
// pasos) vive inline, en el propio test. Si otro test necesitara prender una
// alarma, tendria que copiar/pegar los mismos selectores. Comparar con
// tests/alarm-screen-object.js, que hace exactamente lo mismo pero apoyandose
// en las clases de mobile/screens/.

const { remote } = require('webdriverio');

async function main() {
  const driver = await remote({
    hostname: '127.0.0.1',
    port: 4723,
    path: '/',
    logLevel: 'warn',
    capabilities: {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': 'emulator-5554',
      'appium:appPackage': 'com.google.android.deskclock',
      'appium:appActivity': 'com.android.deskclock.DeskClock',
      'appium:noReset': true,
      'appium:forceAppLaunch': true,
      'appium:newCommandTimeout': 300,
    },
  });

  try {
    const alarmTab = await driver.$('~Alarm');
    await alarmTab.click();

    const toggle = await driver.$(
      'android=new UiSelector().resourceId("com.google.android.deskclock:id/onoff").instance(0)'
    );

    // Idempotente: si ya estaba prendida, la apagamos primero para partir de
    // un estado conocido antes de "probar" que prenderla funciona.
    const wasChecked = (await toggle.getAttribute('checked')) === 'true';
    if (wasChecked) {
      await toggle.click();
    }

    await toggle.click();
    const isChecked = (await toggle.getAttribute('checked')) === 'true';
    console.log(`Alarma de las 8:30 AM encendida: ${isChecked}`);
    if (!isChecked) {
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
