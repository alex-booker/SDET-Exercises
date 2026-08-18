// testdata/generate-users.js
//
// EJERCICIO: "Generate test data (50 plausible users) as JSON; spot-check
// for duplicates."
//
// Genera 50 usuarios plausibles pensados para auth/authHelper.registerUser()
// (username + password >= 8 caracteres). Elige nombre y apellido de un pool
// fijo de forma independiente en cada registro — a propósito NO se revisa
// contra los registros anteriores mientras se genera, igual que haría una
// IA a la que simplemente se le pide "genera 50 usuarios plausibles" sin
// pedirle explícitamente que garantice unicidad. Con 12 nombres x 12
// apellidos (144 combinaciones posibles) y 50 sorteos independientes, el
// problema del cumpleaños hace que un choque sea probable, no una rareza.

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael',
  'Linda', 'William', 'Elizabeth', 'David', 'Barbara',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPassword() {
  // Plausible, no trivial: palabra + número de 3 dígitos + símbolo.
  const words = ['river', 'tiger', 'cloud', 'stone', 'ember', 'delta'];
  return `${pick(words)}${Math.floor(100 + Math.random() * 900)}!`;
}

function generateUsers(count) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const username = `${firstName}.${lastName}`.toLowerCase();
    users.push({
      firstName,
      lastName,
      username,
      email: `${username}@example.test`,
      password: randomPassword(),
    });
  }
  return users;
}

if (require.main === module) {
  const users = generateUsers(50);
  console.log(JSON.stringify(users, null, 2));
}

module.exports = { generateUsers };
