// ── Mobile Automation, Topico 4, puntos 1 y 2 ───────────────────────────────
// Screen Object de la pantalla "Alarm" del Reloj. Comparar con
// tests/alarm-flat.js: los mismos locators/pasos, pero encapsulados aqui una
// sola vez en vez de repetidos en cada test que necesite tocar una alarma.

const { BaseScreen } = require('./BaseScreen');

// Punto 2 del ejercicio: el switch de encendido/apagado de una alarma no se
// identifica igual en Android que en iOS. En Android tiene un resource-id
// estable; en el Reloj de iOS (no instalable en este entorno, solo Android)
// el switch equivalente se ubicaria por accessibility id. Documentamos el
// valor de iOS como referencia aunque no podamos verificarlo aqui.
const ANDROID_ONOFF_RESOURCE_ID = 'com.google.android.deskclock:id/onoff';
const IOS_ONOFF_ACCESSIBILITY_ID = 'alarm-onoff-switch'; // no verificable en este entorno (solo Android)

class AlarmScreen extends BaseScreen {
  async open() {
    const tab = await this.byAccessibilityId('Alarm');
    await tab.click();
    return this;
  }

  // La rama por plataforma vive aqui, dentro del Screen Object — el test que
  // llama a setFirstAlarmEnabled() no necesita saber ni le importa en que
  // plataforma corre.
  async firstAlarmToggle() {
    if (this.driver.isAndroid) {
      return this.driver.$(
        `android=new UiSelector().resourceId("${ANDROID_ONOFF_RESOURCE_ID}").instance(0)`
      );
    }
    return this.byAccessibilityId(IOS_ONOFF_ACCESSIBILITY_ID);
  }

  async isFirstAlarmEnabled() {
    const toggle = await this.firstAlarmToggle();
    return (await toggle.getAttribute('checked')) === 'true';
  }

  // Idempotente a proposito: si el test corre dos veces seguidas, el
  // resultado es el mismo sin importar el estado en el que haya quedado la
  // corrida anterior (a diferencia de un simple "click" a ciegas).
  async setFirstAlarmEnabled(enabled) {
    const toggle = await this.firstAlarmToggle();
    const isChecked = (await toggle.getAttribute('checked')) === 'true';
    if (isChecked !== enabled) {
      await toggle.click();
    }
    return toggle;
  }
}

module.exports = { AlarmScreen };
