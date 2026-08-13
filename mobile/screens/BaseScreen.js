// ── Mobile Automation, Topico 4 ──────────────────────────────────────────────
// Screen Object base: lo que cualquier pantalla necesita (acceso al driver,
// helpers de locators comunes, y el scroll-until-visible del punto 3 del
// ejercicio). Las pantallas concretas (AlarmScreen, SettingsScreen, ...)
// heredan de esta clase, igual que BasePage en el lado web de este repo.

class BaseScreen {
  constructor(driver) {
    this.driver = driver;
  }

  byAccessibilityId(id) {
    return this.driver.$(`~${id}`);
  }

  byResourceId(id) {
    return this.driver.$(`android=new UiSelector().resourceId("${id}")`);
  }

  // Repite un scroll hacia abajo (direction:"down" revela contenido MAS
  // ABAJO en la lista — confirmado en el topico 1 con mobile: scrollGesture),
  // dejando margen de ambos bordes de pantalla (ver notas del topico 2 sobre
  // por que un swipe que arranca muy cerca de un borde choca con el gesto de
  // "atras" del sistema), hasta encontrar un elemento cuyo texto contenga
  // `label`.
  async scrollUntilVisible(label, { maxSwipes = 8, direction = 'down' } = {}) {
    const locator = `android=new UiSelector().textContains("${label}")`;

    for (let attempt = 0; attempt <= maxSwipes; attempt++) {
      const element = await this.driver.$(locator);
      if (await element.isExisting()) {
        // mobile: scrollGesture ya espera a que el gesto termine, pero la
        // lista puede seguir "asentandose" (rebote/relayout) un instante
        // mas — sin esta pausa, un click inmediato a veces no aterriza
        // (visto en el ejercicio final: el elemento se encontraba pero el
        // tap no navegaba). Se re-consulta el elemento en vez de reusar la
        // referencia ya obtenida, por si la vista se re-vinculo mientras
        // tanto (reciclaje normal de RecyclerView).
        await this.driver.pause(300);
        return this.driver.$(locator);
      }
      if (attempt === maxSwipes) break;
      await this.driver.execute('mobile: scrollGesture', {
        left: 40,
        top: 300,
        width: 640,
        height: 800,
        direction,
        percent: 0.75,
      });
    }

    throw new Error(`No se encontro un elemento con texto "${label}" tras ${maxSwipes} scrolls`);
  }
}

module.exports = { BaseScreen };
