// ── Mobile Automation, Topico 4, punto 3 ────────────────────────────────────
// Screen Object de la pantalla principal de Settings. Se usa aqui solo para
// demostrar scrollUntilVisible() de BaseScreen contra una lista real y larga
// — la mayoria de sus items no caben en una sola pantalla sin desplazarse.

const { BaseScreen } = require('./BaseScreen');

class SettingsScreen extends BaseScreen {
  async openItem(label) {
    const item = await this.scrollUntilVisible(label);
    await item.click();
    return item;
  }
}

module.exports = { SettingsScreen };
