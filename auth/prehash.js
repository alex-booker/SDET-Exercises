// auth/prehash.js
//
// EJERCICIO: "Find one hallucinated API call in your AI history."
//
// Escrito A CIEGAS, implementando el fix #7 de AI-AUTH-AUDIT.md (bcrypt
// trunca silenciosamente a 72 bytes) usando la API de conveniencia
// crypto.hash() de Node, de memoria, sin revisar los docs de Node primero.

const crypto = require('crypto');

function prehashPassword(password) {
  return crypto.hash('sha256', password, 'hex');
}

module.exports = { prehashPassword };
