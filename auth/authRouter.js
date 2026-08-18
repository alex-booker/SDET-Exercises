// auth/authRouter.js
//
// Conecta authHelper.js (lógica de negocio) con loginRateLimiter.js
// (protección HTTP contra fuerza bruta, hallazgo #5 de AI-AUTH-AUDIT.md).
// El rate limiter nunca se había montado en ninguna ruta real — era código
// correcto pero huérfano. Este archivo es el motivo por el que existe.
//
// createAuthRouter() es una fábrica (no un router ya construido) por la
// misma razón que loginRateLimiter.js es una fábrica: cada servidor de
// prueba necesita su propia instancia del rate limiter, con su propio
// contador, independiente de otros tests. En producción se llama una sola
// vez al arrancar la app — mismo comportamiento de un router normal.

const express = require('express');
const { registerUser, loginUser, verifyToken } = require('./authHelper');
const { createLoginRateLimiter } = require('./loginRateLimiter');

function createAuthRouter() {
  const router = express.Router();
  router.use(express.json());

  router.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body;
      const result = await registerUser(username, password);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/login', createLoginRateLimiter(), async (req, res) => {
    try {
      const { username, password } = req.body;
      const result = await loginUser(username, password);
      res.status(200).json(result);
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  });

  router.get('/me', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    try {
      const payload = verifyToken(token);
      res.status(200).json(payload);
    } catch (err) {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  });

  return router;
}

module.exports = { createAuthRouter };
