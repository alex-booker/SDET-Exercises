# features/login.feature
#
# NOTA (entregable BDD, agregado 03/08/2026): 3 escenarios de Gherkin para el
# flujo de login de SauceDemo. Los steps (steps/login.steps.js) reutilizan el
# Page Object existente (pages/LoginPage.js) — no hay lógica de Playwright
# nueva aquí, solo la traducción de lenguaje de negocio a esas llamadas.
#
# Los 3 escenarios cubren comportamiento distinto a propósito (no son la
# misma aserción con datos distintos): caso feliz, credencial inválida, y
# una regla de negocio aparte (usuario bloqueado).

Feature: Login
  As a SauceDemo user
  I want to log in with my credentials
  So that I can access the product catalog

  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I log in as "standard_user" with password "secret_sauce"
    Then I should see the product inventory page

  Scenario: Login fails with an invalid password
    Given I am on the login page
    When I log in as "standard_user" with password "wrong_password"
    Then I should see the error message "Username and password do not match any user in this service"

  Scenario: Login is blocked for a locked-out user
    Given I am on the login page
    When I log in as "locked_out_user" with password "secret_sauce"
    Then I should see the error message "Sorry, this user has been locked out."
