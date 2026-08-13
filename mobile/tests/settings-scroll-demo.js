// ── Mobile Automation, Topico 4, punto 3 (demo) ─────────────────────────────
// Demuestra scrollUntilVisible() de BaseScreen contra la lista de Settings:
// "Accessibility" esta bien al fondo de la lista, fuera de la pantalla inicial.

const { createDriver } = require('../screens/driver');
const { SettingsScreen } = require('../screens/SettingsScreen');

const TARGET_LABEL = 'Accessibility';

async function main() {
  const driver = await createDriver({
    'appium:appPackage': 'com.android.settings',
    'appium:appActivity': '.Settings',
  });

  try {
    const settingsScreen = new SettingsScreen(driver);
    const element = await settingsScreen.scrollUntilVisible(TARGET_LABEL);
    const text = await element.getText();
    console.log(`Elemento encontrado tras scrollear: "${text}"`);
  } finally {
    await driver.deleteSession();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
