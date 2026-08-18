// tests/05-auth-router-integration.spec.ts
//
// Prueba de integración que cierra el ciclo de AI-AUTH-AUDIT.md: el
// hallazgo #5 ("sin protección contra fuerza bruta") se documentó, se
// escribió un fix (auth/loginRateLimiter.js), y aquí finalmente se conecta
// a rutas HTTP reales (auth/authRouter.js) y se prueba en vivo — no solo
// "el código existe", sino "el servidor de verdad bloquea al 6to intento".

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-do-not-use-in-production';

const { test, expect } = require('@playwright/test');
const express = require('express');
const { createAuthRouter } = require('../auth/authRouter');

function startTestServer() {
  const app = express();
  // createAuthRouter() se llama una vez POR SERVIDOR DE PRUEBA, para que
  // cada test tenga su propio rate limiter con su propio contador — ver la
  // nota en auth/loginRateLimiter.js sobre por qué es una fábrica.
  app.use('/auth', createAuthRouter());
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

test.describe('authRouter (integration, real HTTP + real rate limiter)', () => {
  let server;
  let baseUrl;

  test.beforeEach(async () => {
    server = await startTestServer();
    baseUrl = `http://localhost:${server.address().port}`;
  });

  test.afterEach(() => {
    server.close();
  });

  test('registers and logs in over real HTTP', async () => {
    const registerRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'frank', password: 'correct horse battery staple' }),
    });
    expect(registerRes.status).toBe(201);

    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'frank', password: 'correct horse battery staple' }),
    });
    expect(loginRes.status).toBe(200);
    const { token } = await loginRes.json();

    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(meRes.status).toBe(200);
    const payload = await meRes.json();
    expect(payload.username).toBe('frank');
  });

  test('blocks brute-force login attempts after 5 tries in the same window', async () => {
    await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'grace', password: 'correct horse battery staple' }),
    });

    const attemptLogin = () =>
      fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'grace', password: 'wrong-password' }),
      });

    const statuses = [];
    for (let i = 0; i < 7; i++) {
      const res = await attemptLogin();
      statuses.push(res.status);
    }

    // Los primeros 5 intentos llegan a authHelper y fallan por credenciales
    // incorrectas (401). Del 6to en adelante, el rate limiter los corta
    // antes de llegar ahí (429) — sin importar que la contraseña sea correcta.
    expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
    expect(statuses.slice(5)).toEqual([429, 429]);
  });
});
