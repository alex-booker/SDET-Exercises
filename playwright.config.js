// @ts-check
const { defineConfig, devices } = require('@playwright/test');

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
    },
  ],
});
