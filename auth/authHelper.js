// auth/authHelper.js
//
// Historial: este archivo se escribió a ciegas para el ejercicio "Ask an AI
// for a 'secure' auth helper" y se auditó contra OWASP en AI-AUTH-AUDIT.md
// (10 hallazgos). Esta versión cierra los hallazgos que pertenecen a esta
// capa (secreto, algoritmo de JWT, enumeración de usuarios, canal lateral
// por tiempo, fortaleza de contraseña, truncamiento de bcrypt). El rate
// limiting (hallazgo #5) vive en auth/loginRateLimiter.js y se conecta en
// auth/authRouter.js, porque es responsabilidad de la capa HTTP, no de este
// módulo. Ver MULTI-FILE-REFACTOR-NOTES.md para el detalle de este cambio.

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prehashPassword } = require('./prehash');

const SALT_ROUNDS = 10;
const JWT_ALGORITHM = 'HS256';
const JWT_EXPIRES_IN = '15m'; // vida corta a propósito; ver nota de revocación abajo.
const MIN_PASSWORD_LENGTH = 8;
const GENERIC_LOGIN_ERROR = 'Invalid username or password';

// Hallazgo #1: nunca un secreto hardcodeado como fallback. Se lee en cada
// llamada (no al cargar el módulo) para que un test pueda setear
// process.env.JWT_SECRET antes de invocar login/verify.
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET must be set — refusing to fall back to a hardcoded secret.');
  }
  return secret;
}

// Hallazgo #4: hash "dummy" precalculado, usado cuando el usuario no existe,
// para que loginUser tarde lo mismo con o sin usuario real (evita el canal
// lateral por tiempo de respuesta).
const DUMMY_HASH = bcrypt.hashSync(prehashPassword('dummy-password-for-timing'), SALT_ROUNDS);

// Almacenamiento en memoria solo para demo/pruebas.
const users = new Map(); // username -> { passwordHash }

async function registerUser(username, password) {
  if (users.has(username)) {
    throw new Error('User already exists');
  }
  // Hallazgo #6: longitud mínima razonable (OWASP Authentication Cheat Sheet).
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  // Hallazgo #7: pre-hashear con SHA-256 antes de bcrypt para no depender
  // del límite de 72 bytes de bcrypt (contraseñas largas ya no se truncan).
  const passwordHash = await bcrypt.hash(prehashPassword(password), SALT_ROUNDS);
  users.set(username, { passwordHash });
  return { username };
}

async function loginUser(username, password) {
  const user = users.get(username);

  // Hallazgos #3 y #4: siempre se corre un bcrypt.compare (real o contra el
  // hash dummy) y siempre se lanza el mismo mensaje genérico, sin importar
  // si el usuario existe — ni el mensaje ni el tiempo de respuesta revelan
  // si el username es válido.
  const passwordHash = user ? user.passwordHash : DUMMY_HASH;
  const isValid = await bcrypt.compare(prehashPassword(password), passwordHash);

  if (!user || !isValid) {
    throw new Error(GENERIC_LOGIN_ERROR);
  }

  const token = jwt.sign({ username }, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: JWT_ALGORITHM,
  });
  return { token };
}

function verifyToken(token) {
  // Hallazgo #2: algoritmo restringido explícitamente (evita ataques de
  // "algorithm confusion" / alg:none).
  return jwt.verify(token, getJwtSecret(), { algorithms: [JWT_ALGORITHM] });
}

module.exports = { registerUser, loginUser, verifyToken };

// Nota de diseño que NO se resuelve aquí (fuera de alcance de este
// refactor): un JWT stateless de 15 minutos sigue sin poder revocarse antes
// de expirar. Una solución real (refresh tokens revocables server-side, o
// una blacklist) es un cambio de arquitectura más grande que el de este
// ejercicio — se deja documentado en vez de improvisar una a medias.
