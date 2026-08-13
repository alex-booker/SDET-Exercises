// ── Mobile Automation, Topico 1, punto 3 ────────────────────────────────────
// Automatiza lo que hicimos a mano con adb: limpia el logcat, da tiempo para
// abrir una app en el emulador, y busca la linea que Android imprime cuando
// una app termina de renderizar tras el arranque:
//   ActivityTaskManager: Displayed <package>/<activity> for user 0: +Xs
//
// Uso: node mobile/find-package-name.js [segundos_de_espera]
// Requisito: emulador arrancado y detectado por `adb devices`.

const { execFileSync } = require('node:child_process');

const waitSeconds = Number(process.argv[2]) || 8;

function adb(args) {
  return execFileSync('adb', args, { encoding: 'utf8' });
}

async function main() {
  adb(['logcat', '-c']);
  console.log(`Logcat limpio. Abre una app en el emulador ahora (tienes ${waitSeconds}s)...`);

  await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));

  const log = adb(['logcat', '-d']);
  const displayedLines = log
    .split('\n')
    .filter((line) => line.includes('Displayed'));

  if (displayedLines.length === 0) {
    console.log(
      'No se encontro ninguna linea "Displayed". ¿Se abrio una app nueva dentro de la ventana de espera? ' +
        'Tip: usa un tiempo de espera mas largo (node mobile/find-package-name.js 15).'
    );
    return;
  }

  console.log('\nApps detectadas (package/activity):');
  for (const line of displayedLines) {
    const match = line.match(/Displayed ([^\s:]+)/);
    console.log(`  - ${match ? match[1] : line.trim()}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
