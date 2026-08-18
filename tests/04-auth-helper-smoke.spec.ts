// tests/04-auth-helper-smoke.spec.ts
//
// Smoke test del auth helper, actualizado después del refactor multi-archivo
// documentado en MULTI-FILE-REFACTOR-NOTES.md: mensaje de error unificado
// (ya no distingue "user not found" de "incorrect password"), validación de
// longitud mínima de contraseña, y JWT_SECRET obligatorio (sin fallback).

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-do-not-use-in-production';

const { test, expect } = require('@playwright/test');
const { registerUser, loginUser, verifyToken } = require('../auth/authHelper');

test.describe('authHelper (smoke, no security assertions)', () => {
  test('registers a user and logs in successfully', async () => {
    await registerUser('alice', 'correct horse battery staple');

    const { token } = await loginUser('alice', 'correct horse battery staple');
    expect(typeof token).toBe('string');

    const payload = verifyToken(token);
    expect(payload.username).toBe('alice');
  });

  test('rejects an incorrect password with a generic message', async () => {
    await registerUser('bob', 'hunter2000password');

    await expect(loginUser('bob', 'wrong-password')).rejects.toThrow('Invalid username or password');
  });

  test('rejects a nonexistent username with the SAME generic message', async () => {
    // Antes del refactor este caso lanzaba "User not found" — un mensaje
    // distinto que permitía enumerar usuarios (hallazgo #3 de la auditoría).
    await expect(loginUser('nobody-registered', 'whatever')).rejects.toThrow('Invalid username or password');
  });

  test('rejects registering the same username twice', async () => {
    await registerUser('carol', 'password123456');

    await expect(registerUser('carol', 'another-password')).rejects.toThrow('User already exists');
  });

  test('rejects a password shorter than 8 characters', async () => {
    await expect(registerUser('dave', 'short')).rejects.toThrow('at least 8 characters');
  });

  test('accepts a password longer than bcrypt\'s 72-byte limit without truncation issues', async () => {
    const longPassword = 'x'.repeat(100) + '-tail-that-must-matter';
    const almostSamePassword = 'x'.repeat(100) + '-tail-that-must-NOT-match';

    await registerUser('erin', longPassword);

    // Si bcrypt truncara silenciosamente a 72 bytes (hallazgo #7 sin el
    // pre-hash de prehash.js), esta contraseña "casi igual" pasaría como
    // válida porque los primeros 72 bytes son idénticos.
    await expect(loginUser('erin', almostSamePassword)).rejects.toThrow('Invalid username or password');

    const { token } = await loginUser('erin', longPassword);
    expect(typeof token).toBe('string');
  });
});
