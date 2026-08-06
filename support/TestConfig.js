// support/TestConfig.js
// ── Patrón Singleton ─────────────────────────────────────────────────────
// Garantiza UNA sola instancia de la configuración de pruebas para todo el
// proceso: credenciales, datos de checkout, etc. Cualquier archivo que haga
// `TestConfig.getInstance()` recibe siempre el mismo objeto.
//
// Nota pedagógica: en Node, `require()` ya cachea el módulo, así que en la
// práctica un simple `module.exports = { ...datos... }` lograría algo
// parecido. Pero aquí implementamos el patrón GoF explícito (constructor
// que se auto-protege + accesor estático) porque es la forma que necesitas
// en lenguajes sin cache de módulos (Java, C#) y es la que suelen pedir en
// entrevistas/exámenes de SDET.

class TestConfig {
  constructor() {
    if (TestConfig.instance) {
      return TestConfig.instance;
    }

    this.baseUrl = 'https://www.saucedemo.com';

    this.users = {
      standard: { username: 'standard_user', password: 'secret_sauce' },
      admin: { username: 'performance_glitch_user', password: 'secret_sauce' },
      lockedOut: { username: 'locked_out_user', password: 'secret_sauce' },
    };

    this.checkoutInfo = {
      firstName: 'Mariana',
      lastName: 'Testing',
      postalCode: '20089',
    };

    TestConfig.instance = this;
  }

  /** Punto de acceso global a la única instancia. */
  static getInstance() {
    if (!TestConfig.instance) {
      TestConfig.instance = new TestConfig();
    }
    return TestConfig.instance;
  }
}

module.exports = { TestConfig };
