# SDET-Exercises
This Repository contains the SDET exercises and future deliverables for this course

26/06/2026 - Adding the "01 - Front-end Automation" exercise

29/07/2026 - Adding a Design Patterns demo (Singleton, Page Factory, Screenplay) on top of the existing Page Object Model. See [PATTERNS.md](./PATTERNS.md).

30/07/2026 - Refactored the flat Page Object Model into a layered POM: BasePage, chained page objects (LoginPage -> InventoryPage -> CartPage), and a ProductItemComponent shared between the catalog and the cart. See [PATTERNS.md](./PATTERNS.md).

03/08/2026 - Added a BDD deliverable: `features/login.feature` (3 Gherkin scenarios covering the login flow) with step definitions in `steps/login.steps.js`, wired up via playwright-bdd on top of the existing `LoginPage`. Run with `npm run test:bdd`.

11/08/2026 - Added a Mobile Automation deliverable under `mobile/` (Appium + Android emulator): `launch-sample-app.js` starts a session via capabilities and screenshots it, `find-package-name.js` automates discovering an app's package/activity via `adb logcat`, and `ACCESSIBILITY-IDS.md` proposes a stable accessibility-id contract with the dev team based on locator/gesture issues found while exploring with Appium Inspector. Run with `npm run mobile:launch` / `npm run mobile:find-package`.

12/08/2026 - Added a mobile Screen Object Model deliverable under `mobile/screens/` (webdriverio + Appium), mirroring the web POM already documented in `PATTERNS.md`: `BaseScreen` (common locators + a `scrollUntilVisible(label)` helper), `AlarmScreen` (with a platform branch between Android/iOS for the alarm toggle), and `SettingsScreen`. `mobile/tests/alarm-flat.js` and `alarm-screen-object.js` do the exact same thing (enable the first alarm) so they can be compared side by side — before/after the refactor. Run with `npm run mobile:alarm-flat` / `mobile:alarm-screen-object` / `mobile:settings-scroll-demo`.

13/08/2026 - Added failure diagnostics for the mobile suite: `mobile/support/captureDiagnostics.js` (screenshot + page source + logcat, saved under `mobile/artifacts/<test-name>/` whenever a test fails) and `mobile/support/recordScreen.js` (records video for the whole run via Appium's `startRecordingScreen`/`stopRecordingScreen`). `mobile/run-suite.js` ties both together over a small test list that includes one deliberate failure, to prove the mechanism actually fires. `ci.yml` gained a `mobile-test` job (Android emulator via `reactivecircus/android-emulator-runner`) that runs the suite and uploads `mobile/artifacts/` as a build artifact regardless of pass/fail — configured and documented, not yet exercised against a real PR. Run with `npm run mobile:run-suite`.

13/08/2026 - Added the Mobile Automation module's final deliverable, `mobile/final-exercise.js`: 3 real scenarios (enable an alarm, navigate to Settings > Accessibility, start a 1-minute timer) each through a Screen Object — including a new `TimerScreen` added just for this exercise, proving the Screen Object pattern generalizes to a screen none of the earlier deliverables touched. Reuses `captureDiagnostics()` for screenshot + page source on failure. Caught and fixed a real flaky-click bug in `BaseScreen.scrollUntilVisible` along the way (a `RecyclerView` can still be settling right after a scroll gesture completes; a bare click right after finding the element sometimes missed). Run with `npm run mobile:final-exercise`.
