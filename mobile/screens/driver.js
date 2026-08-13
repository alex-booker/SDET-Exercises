// ── Helper compartido para crear una sesion de Appium con webdriverio ──────
// Centraliza la conexion al servidor (host/puerto) y las capabilities
// comunes a cualquier pantalla; cada test solo pasa lo que cambia
// (appPackage/appActivity de la app que va a probar).

const { remote } = require('webdriverio');

async function createDriver(appCapabilities) {
  return remote({
    hostname: '127.0.0.1',
    port: 4723,
    path: '/',
    logLevel: 'warn',
    capabilities: {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': 'emulator-5554',
      'appium:noReset': true,
      'appium:forceAppLaunch': true,
      'appium:newCommandTimeout': 300,
      ...appCapabilities,
    },
  });
}

module.exports = { createDriver };
