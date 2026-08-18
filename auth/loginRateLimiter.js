// auth/loginRateLimiter.js
//
// Historial: implementa el fix #5 de AI-AUTH-AUDIT.md ("sin protección
// contra fuerza bruta") con express-rate-limit.
//
// Se exporta una FÁBRICA (createLoginRateLimiter), no una instancia ya
// construida. Motivo real, no teórico: al conectarlo a authRouter.js
// (ver MULTI-FILE-REFACTOR-NOTES.md) una instancia única a nivel de módulo
// mantenía su contador compartido entre servidores de prueba distintos —
// dos tests de integración que cada uno levantaba su propio servidor
// seguían compitiendo por el mismo contador de intentos, y el segundo test
// heredaba intentos del primero (bug real, encontrado corriendo la suite
// con --workers=1). En producción, authRouter.js sigue llamando a la
// fábrica una sola vez al arrancar — mismo comportamiento de antes, cero
// cambio — pero cada test ahora puede pedir una instancia nueva e
// independiente.
const rateLimit = require('express-rate-limit');

function createLoginRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 intentos de login por IP en esa ventana
    message: 'Too many login attempts, please try again later.',
  });
}

module.exports = { createLoginRateLimiter };
