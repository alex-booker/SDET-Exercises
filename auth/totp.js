// auth/totp.js
//
// EJERCICIO: "Find one hallucinated API call in your AI history."
//
// Escrito A CIEGAS, implementando MFA con TOTP (sugerido en AI-AUTH-AUDIT.md
// como buena práctica adicional) usando otplib, de memoria, sin revisar la
// documentación del paquete primero.

const { authenticator } = require('otplib');

function generateMfaSecret() {
  return authenticator.generateSecret();
}

function generateTotpCode(secret) {
  return authenticator.generate(secret);
}

function verifyTotpCode(token, secret) {
  return authenticator.verify({ token, secret });
}

module.exports = { generateMfaSecret, generateTotpCode, verifyTotpCode };
