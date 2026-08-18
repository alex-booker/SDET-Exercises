// testdata/check-duplicates.js
//
// Spot-check real sobre testdata/users.json: duplicados exactos de
// username/email, y duplicados "case-insensitive" que un check ingenuo
// (=== plano) no atraparía.

const users = require('./users.json');

function findDuplicates(users, keyFn, label) {
  const seen = new Map(); // key normalizada -> [índices originales]
  users.forEach((user, index) => {
    const key = keyFn(user);
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push(index);
  });

  const duplicates = [...seen.entries()].filter(([, indices]) => indices.length > 1);

  console.log(`\n--- ${label} ---`);
  if (duplicates.length === 0) {
    console.log('Sin duplicados.');
  } else {
    for (const [key, indices] of duplicates) {
      console.log(`"${key}" aparece ${indices.length} veces (índices: ${indices.join(', ')})`);
    }
  }
  return duplicates;
}

const exactUsernameDupes = findDuplicates(users, (u) => u.username, 'Duplicados exactos de username');
const exactEmailDupes = findDuplicates(users, (u) => u.email, 'Duplicados exactos de email');
const caseInsensitiveDupes = findDuplicates(users, (u) => u.username.toLowerCase(), 'Duplicados de username (case-insensitive)');
const exactPasswordDupes = findDuplicates(users, (u) => u.password, 'Contraseñas repetidas (no es un bug de datos, pero vale la pena saberlo)');

console.log('\n--- Resumen ---');
console.log(`Total de usuarios: ${users.length}`);
console.log(`Usernames únicos: ${new Set(users.map((u) => u.username)).size}`);
console.log(`Duplicados exactos de username: ${exactUsernameDupes.length}`);
console.log(`Duplicados exactos de email: ${exactEmailDupes.length}`);
console.log(`Contraseñas repetidas: ${exactPasswordDupes.length}`);
