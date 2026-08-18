// tests/08-user-seed-data.spec.ts
//
// Cierra el ciclo del ejercicio "Generate test data (50 plausible users) as
// JSON; spot-check for duplicates": no basta con detectar los duplicados en
// el JSON, hay que confirmar qué pasa de verdad si se usan para poblar
// authHelper.registerUser(). Ver TEST-DATA-AUDIT.md para el análisis
// completo.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-do-not-use-in-production';

const { test, expect } = require('@playwright/test');
const { registerUser } = require('../auth/authHelper');
const users = require('../testdata/users.json');

test('registering all 50 generated users: exactly the 3 known duplicates fail', async () => {
  const results = { succeeded: [], failed: [] };

  for (const user of users) {
    try {
      await registerUser(user.username, user.password);
      results.succeeded.push(user.username);
    } catch (err) {
      results.failed.push({ username: user.username, reason: err.message });
    }
  }

  expect(results.succeeded.length).toBe(47);
  expect(results.failed.length).toBe(3);
  expect(results.failed.every((f) => f.reason === 'User already exists')).toBe(true);

  const failedUsernames = results.failed.map((f) => f.username).sort();
  expect(failedUsernames).toEqual(['elizabeth.hernandez', 'john.lopez', 'robert.brown']);
});
