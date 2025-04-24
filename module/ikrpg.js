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
  Actors.registerSheet("ikrpg", IKRPGBasicNPCSheet, {
    types: ["npc"],
    makeDefault: true
  });

  CONFIG.Combat.initiative = {
    formula: "2d6 + @init",
    decimals: 0
  };
});

Hooks.on("preCreateActor", (actor, data, options, userId) => {
  if (actor.type === "character") {
    actor.updateSource({
      prototypeToken: {
        actorLink: true,
        bar1: { attribute: "hp" },
        displayName: CONST.TOKEN_DISPLAY_MODES.HOVER,
        displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER
      }
    });
  }
  if (actor.type === "npc") {
    actor.updateSource({
      prototypeToken: {
        actorLink: false,
        bar1: { attribute: "hp" }
      }
    });
  }
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

  getInitiativeRoll(combatant, options) {
    const init = this.system.derivedAttributes?.INIT || 0;
    return new Roll("2d6 + @init", { init }).evaluate({ async: false });
  }

  getRollData() {
    const data = super.getRollData();
    data.init = this.system.derivedAttributes?.INIT || 0;
    return data;
  }

}

class IKRPGBaseSheet extends ActorSheet {
  activateListeners(html) {
    super.activateListeners(html);

    // Botões de HP
    html.find(".hp-plus").click(ev => {
      ev.preventDefault();
      const hp = foundry.utils.duplicate(this.actor.system.hp);
      if (hp.value < hp.max) {
        hp.value += 1;
        this.actor.update({ "system.hp.value": hp.value });
      }
    });

    html.find(".hp-minus").click(ev => {
      ev.preventDefault();
      const hp = foundry.utils.duplicate(this.actor.system.hp);
      if (hp.value > 0) {
        hp.value -= 1;
        this.actor.update({ "system.hp.value": hp.value });
      }
    });

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


class IKRPGBasicNPCSheet extends IKRPGBaseSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ikrpg", "sheet", "npc"],
      template: "systems/ikrpg/templates/sheets/npc-sheet.html",
      width: 700,
      height: 500,
      resizable: true,
      minWidth: 600,
      minHeight: 400
    });
  }

  getData() {
    const data = super.getData();
    data.system = this.actor.system;
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
  }
}


class IKRPGActorSheet extends IKRPGBaseSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ikrpg", "sheet", "actor"],
      template: "systems/ikrpg/templates/sheets/actor-sheet.html",
      width: 700,
      height: 500,
      resizable: true,
      dragDrop: [],
      scrollY: [".sheet-body"],
      minWidth: 600,
      minHeight: 400,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "attributes"
        }
      ]
    });
  }

  getData() {
    const data = super.getData();
    data.system = this.actor.system;
    data.isNPC = this.actor.type === "npc";
    return data;
  }

  async activateListeners(html) {
    super.activateListeners(html);
  }
}
