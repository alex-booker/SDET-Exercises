// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const { defineBddConfig } = require('playwright-bdd');

// ── BDD (Cucumber) ──────────────────────────────────────────────────
// playwright-bdd lee los .feature de aquí y los "steps" de aquí, y genera
// specs de Playwright Test reales en bddOutputDir.
//
// NOTA: playwright-bdd necesita que el `testDir` del project que corre esos
// specs sea EXACTAMENTE bddOutputDir (no basta con que esté anidado dentro
// de testDir) — si no, sus fixtures no encuentran su config en runtime
// ("BDD config not found for testDir"). Por eso va en su propio project
// ('chromium-bdd' más abajo) en vez de compartir testDir con los specs
// existentes (01-front_end.spec.ts, 02-design-patterns-demo.spec.ts).
// Se ejecuta con `npx bddgen && npx playwright test` (ver package.json).
const bddOutputDir = defineBddConfig({
  features: './features/*.feature',
  steps: './steps/*.steps.js',
});

module.exports = defineConfig({
  testDir: './tests',

  // Reintentar una vez si falla (el trace se activa en el primer reintento)
  retries: 1,

  // Correr tests en paralelo
  fullyParallel: true,

  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'https://www.saucedemo.com',

    // ── Evidencia en fallas ──────────────────────────────────────────
    screenshot: 'only-on-failure',   // Captura pantalla si falla
    trace: 'on-first-retry',         // Graba trace al reintentar
    video: 'on-first-retry',         // Video también al reintentar

    // Auto-wait por defecto de Playwright (no necesita configuración extra)
    actionTimeout: 10_000,           // Espera máx. 10s por acción
    navigationTimeout: 15_000,       // Espera máx. 15s por navegación
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // Los specs generados por BDD viven fuera de testDir por defecto y
      // corren en su propio project ('chromium-bdd'); se excluyen aquí para
      // no correrlos dos veces.
      testIgnore: '**/.features-gen/**',
    },
    {
      name: 'chromium-bdd',
      testDir: bddOutputDir,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
