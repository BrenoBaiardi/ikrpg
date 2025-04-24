Hooks.once("init", function () {
  CONFIG.Actor.documentClass = IKRPGActor;
  CONFIG.Actor.typeLabels = {
    character: "Personagem"
  };

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("ikrpg", IKRPGActorSheet, {
    types: ["character"],
    makeDefault: true
  });
});

const SKILL_LIST = [
  "Sneak",
  "Detection",
  "Command",
  "Rifle",
  "Hand Weapon",
  "Great Weapon"
];

class IKRPGActor extends Actor {  // runs every time sheet is changed
  prepareData() {
    super.prepareData();
    const data = this.system;
    const agi = data.mainAttributes.AGI;
    const phy = data.mainAttributes.PHY;
    const int = data.mainAttributes.INT;
    const prw = data.secondaryAttributes.PRW;
    const spd = data.secondaryAttributes.SPD;
    const per = data.secondaryAttributes.PER;

    data.hp.max = phy + int + agi;

    data.derivedAttributes.DEF = data.modifiers.DEF.reduce((sum, val) => sum + val, 0) + agi + per + spd;
    data.derivedAttributes.WILL = data.modifiers.WILL.reduce((sum, val) => sum + val, 0) + phy + int;
    data.derivedAttributes.INIT = data.modifiers.INIT.reduce((sum, val) => sum + val, 0) + prw + spd + per;
    data.derivedAttributes.ARM = data.modifiers.ARM.reduce((sum, val) => sum + val, 0) + phy;

  }

}

class IKRPGActorSheet extends ActorSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ikrpg", "sheet", "actor"],
      template: "systems/ikrpg/templates/sheets/actor-sheet.html",
      width: 600,
      height: 400
    });
  }

  getData() {
    const data = super.getData();
    data.system = this.actor.system;
    return data;
  }

  async activateListeners(html) {
    super.activateListeners(html);

    // Rolar atributo
    html.find(".roll-attr").click(async ev => {
      ev.preventDefault();
      const attr = ev.currentTarget.dataset.attr;
      const value = this.actor.system.mainAttributes?.[attr]
        ?? this.actor.system.secondaryAttributes?.[attr]
        ?? this.actor.system.derivedAttributes?.[attr]
        ?? 0;

      const roll = new Roll("2d6 + @mod", { mod: value });
      await roll.evaluate({ async: true });
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `Teste de ${attr}`
      });
    });

    html.find(".roll-skill").click(async ev => {
      ev.preventDefault();
      const idx = Number(ev.currentTarget.dataset.idx);
      const skill = this.actor.system.skills?.[idx];

      const attrValue = this.actor.system.mainAttributes?.[skill.attr]
        ?? this.actor.system.secondaryAttributes?.[skill.attr]
        ?? 0;
      const level = skill.level || 0;

      const roll = new Roll("2d6 + @attr + @lvl", { attr: attrValue, lvl: level });
      await roll.evaluate({ async: true });
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `Teste de ${skill.name}`
      });
    });
  }
}
