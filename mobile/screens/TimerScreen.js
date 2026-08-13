// ── Ejercicio final: 3er escenario ──────────────────────────────────────────
// Screen Object de la pantalla Timer del Reloj. Se agrega en el ejercicio
// final para demostrar que el patron Screen Object (BaseScreen + subclases)
// se generaliza sin esfuerzo a una pantalla que las clases anteriores
// (AlarmScreen, SettingsScreen) nunca tocaron.

const { BaseScreen } = require('./BaseScreen');

const PLAY_PAUSE_RESOURCE_ID = 'com.google.android.deskclock:id/play_pause';
const FAB_RESOURCE_ID = 'com.google.android.deskclock:id/fab';
const EXISTING_TIMER_DELETE_RESOURCE_ID = 'com.google.android.deskclock:id/tertiary_button';

class TimerScreen extends BaseScreen {
  async open() {
    const tab = await this.byAccessibilityId('Timer');
    await tab.click();
    return this;
  }

  // Si ya hay un timer creado, la pantalla Timer muestra la lista de
  // timers en vez del teclado numerico. Lo borramos para partir de un
  // estado conocido — si no hay ninguno, este boton simplemente no existe
  // y el metodo no hace nada (por eso startNewTimer() funciona sin
  // importar en cual de los dos estados haya quedado la corrida anterior).
  async deleteExistingTimerIfAny() {
    const deleteButton = await this.byResourceId(EXISTING_TIMER_DELETE_RESOURCE_ID);
    if (await deleteButton.isExisting()) {
      await deleteButton.click();
    }
  }

  // El teclado llena de derecha a izquierda (segundos -> minutos -> horas),
  // asi que para "N minutos exactos" se ingresan los digitos de N seguidos
  // de "00" (segundos en cero) — igual que se hizo a mano en el topico 3.
  async enterMinutes(minutes) {
    const digits = `${minutes}00`.split('');
    for (const digit of digits) {
      const button = await this.byResourceId(`com.google.android.deskclock:id/timer_setup_digit_${digit}`);
      await button.click();
    }
  }

  async startNewTimer(minutes) {
    await this.deleteExistingTimerIfAny();
    await this.enterMinutes(minutes);
    const fab = await this.byResourceId(FAB_RESOURCE_ID);
    await fab.click(); // este mismo boton confirma Y arranca el timer
    return this;
  }

  async isFirstTimerRunning() {
    const playPause = await this.byResourceId(PLAY_PAUSE_RESOURCE_ID);
    return (await playPause.getAttribute('content-desc')) === 'Pause';
  }
}

module.exports = { TimerScreen };
