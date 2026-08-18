# Ejercicio: generar 50 usuarios plausibles, revisar duplicados

**Consigna:** "Generate test data (50 plausible users) as JSON; spot-check
for duplicates."

SauceDemo no tiene registro de usuarios (son cuentas fijas), así que estos
datos se generaron pensando en un consumidor real que sí existe en este
repo: `auth/authHelper.registerUser()` (de los ejercicios de AI Safety).

## Generación

[testdata/generate-users.js](./testdata/generate-users.js) combina un pool
de 12 nombres x 12 apellidos (144 combinaciones posibles) para producir 50
usuarios, sacando nombre y apellido **de forma independiente en cada
registro**, sin revisar contra los anteriores — a propósito, para no
maquillar el resultado. Es exactamente lo que haría una IA a la que se le
pide "genera 50 usuarios plausibles" sin pedirle explícitamente que
garantice unicidad.

Con 50 sorteos independientes sobre 144 combinaciones, un choque no es mala
suerte — es lo esperable por el problema del cumpleaños (con ese tamaño de
pool, la probabilidad de al menos una colisión ronda el 90%+).

Salida: [testdata/users.json](./testdata/users.json) — 50 objetos
`{ firstName, lastName, username, email, password }`.

## Spot-check de duplicados

[testdata/check-duplicates.js](./testdata/check-duplicates.js) revisa,
sobre el JSON generado:

```
--- Duplicados exactos de username ---
"robert.brown" aparece 2 veces (índices: 9, 38)
"john.lopez" aparece 2 veces (índices: 20, 36)
"elizabeth.hernandez" aparece 2 veces (índices: 27, 46)

--- Duplicados exactos de email ---
(los mismos 3 pares — el email se deriva del username)

--- Duplicados de username (case-insensitive) ---
(los mismos 3 — no había ningún duplicado adicional que solo apareciera
al normalizar mayúsculas/minúsculas)

--- Contraseñas repetidas ---
Sin duplicados.

--- Resumen ---
Total de usuarios: 50
Usernames únicos: 47
Duplicados exactos de username: 3
```

**3 de 50 (6%) son duplicados exactos.** Nada raro ni un bug del script —
es la consecuencia matemática esperada de generar de forma independiente
sobre un pool de nombres chico.

## Cerrando el ciclo: ¿qué pasa si se usan de verdad?

Detectar el duplicado en el JSON es la mitad del ejercicio. La otra mitad:
confirmar la consecuencia real, no asumirla.
[tests/08-user-seed-data.spec.ts](./tests/08-user-seed-data.spec.ts) toma
los 50 usuarios y llama a `registerUser()` (el código real, no una
simulación) para cada uno:

```
Registros exitosos: 47
Registros fallidos: 3 — los mismos 3 usernames detectados en el spot-check,
  todos con el mensaje "User already exists"
```

El número coincide exactamente con lo que predijo el análisis del JSON —
buena señal de que el spot-check estaba completo y no se le escapó ni le
sobró ningún caso.

## Lección para el curso

1. "Generar 50 usuarios plausibles" sin pedir explícitamente unicidad casi
   garantiza duplicados si el pool de nombres de origen es chico — y un
   pool de nombres realista (para que se vean "plausibles") es
   necesariamente chico. Pedirle a una IA datos de prueba "realistas" y
   "únicos" al mismo tiempo son objetivos en tensión que hay que resolver
   explícitamente (pool más grande, o un sufijo/contador garantizando
   unicidad), no asumir que ambos salen gratis.
2. El spot-check no se quedó en "encontré 3 duplicados en el JSON" — se
   verificó que esos 3, y solo esos 3, fallan al usarse contra el código
   real. Sin ese segundo paso, no había forma de saber si el análisis del
   JSON estaba completo o si se le escapaba algún caso (por ejemplo,
   colisiones de otro tipo que `authHelper` sí detecta pero el script de
   duplicados no contempló).
