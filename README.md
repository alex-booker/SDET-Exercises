# SDET-Exercises
This Repository contains the SDET exercises and future deliverables for this course

26/06/2026 - Adding the "01 - Front-end Automation" exercise

29/07/2026 - Adding a Design Patterns demo (Singleton, Page Factory, Screenplay) on top of the existing Page Object Model. See [PATTERNS.md](./PATTERNS.md).

30/07/2026 - Refactored the flat Page Object Model into a layered POM: BasePage, chained page objects (LoginPage -> InventoryPage -> CartPage), and a ProductItemComponent shared between the catalog and the cart. See [PATTERNS.md](./PATTERNS.md).

03/08/2026 - Added a BDD deliverable: `features/login.feature` (3 Gherkin scenarios covering the login flow) with step definitions in `steps/login.steps.js`, wired up via playwright-bdd on top of the existing `LoginPage`. Run with `npm run test:bdd`.
