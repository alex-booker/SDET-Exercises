// screenplay/Actor.js
// ── Screenplay Pattern — Actor ───────────────────────────────────────────
// El Actor es quien "protagoniza" el test. No conoce selectores ni URLs:
// solo sabe ejecutar Tasks (`attemptsTo`) y responder Questions (`asks`)
// apoyándose en las Abilities que se le hayan dado con `whoCan`.

class Actor {
  /** @param {string} name */
  constructor(name) {
    this.name = name;
    this._abilities = new Map();
  }

  /** @param {string} name */
  static named(name) {
    return new Actor(name);
  }

  /** @param {InstanceType<any>} ability */
  whoCan(ability) {
    this._abilities.set(ability.constructor, ability);
    return this;
  }

  /** @param {Function} AbilityClass */
  abilityTo(AbilityClass) {
    const ability = this._abilities.get(AbilityClass);
    if (!ability) {
      throw new Error(`${this.name} no tiene la habilidad "${AbilityClass.name}".`);
    }
    return ability;
  }

  /** Ejecuta una o más Tasks en orden. */
  async attemptsTo(...tasks) {
    for (const task of tasks) {
      await task.performAs(this);
    }
  }

  /** Consulta una Question sin modificar el estado de la app. */
  async asks(question) {
    return question.answeredBy(this);
  }
}

module.exports = { Actor };
