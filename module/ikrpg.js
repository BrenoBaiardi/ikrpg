// ================================
// 📦 CONFIGURAÇÃO DO SISTEMA
// ================================
Hooks.once("init", function () {
    CONFIG.Actor.documentClass = IKRPGActor;

    CONFIG.Actor.typeLabels = {
        character: "Personagem"
    };

    CONFIG.Combat.initiative = {
        formula: "2d6 + @init",
        decimals: 0
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

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("ikrpg", IKRPGItemSheet, {makeDefault: true});
});

// ================================
// 🎯 GANCHOS DE CRIAÇÃO DE ATORES
// ================================
Hooks.on("preCreateActor", (actor, data, options, userId) => {
    const commonConfig = {
        bar1: {attribute: "hp"}
    };

    if (actor.type === "character") {
        actor.updateSource({
            prototypeToken: {
                ...commonConfig,
                actorLink: true,
                displayName: CONST.TOKEN_DISPLAY_MODES.HOVER,
                displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER
            }
        });
    }

    if (actor.type === "npc") {
        actor.updateSource({
            prototypeToken: {
                ...commonConfig,
                actorLink: false
            }
        });
    }
});

// ================================
// 🧬 CLASSE BASE DE ATORES
// ================================
class IKRPGActor extends Actor {
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

        // ===== Armor integration =====
        // Uses first armor found for now
        const armor = this.items.find(i => i.type === "armor");


        const equippedArmors = this.items.filter(i => i.type === "armor" && i.system.isEquipped);

        const totalArmorBonus = equippedArmors.reduce((sum, armor) => sum + (armor.system.armorBonus || 0), 0);
        const totalArmorPenalty = equippedArmors.reduce((sum, armor) => sum + (armor.system.penalty || 0), 0); //treated in html to always be converted to negative or 0

        data.derivedAttributes.DEF = data.modifiers.DEF.reduce((sum, val) => sum + val, 0) + agi + per + spd + totalArmorPenalty;
        data.derivedAttributes.WILL = data.modifiers.WILL.reduce((sum, val) => sum + val, 0) + phy + int;
        data.derivedAttributes.INIT = data.modifiers.INIT.reduce((sum, val) => sum + val, 0) + prw + spd + per;
        data.derivedAttributes.ARM = data.modifiers.ARM.reduce((sum, val) => sum + val, 0) + phy + totalArmorBonus;
    }

    getInitiativeRoll() {
        const init = this.system.derivedAttributes?.INIT || 0;
        return new Roll("2d6 + @init", {init}).evaluate({async: false});
    }

    getRollData() {
        const data = super.getRollData();
        data.init = this.system.derivedAttributes?.INIT || 0;
        return data;
    }

    applyDamage(amount) {
        const hp = foundry.utils.duplicate(this.system.hp);
        const arm = this.system.derivedAttributes?.ARM || 0;

        const damageTaken = Math.max(0, amount - arm);
        const newHP = Math.max(0, hp.value - damageTaken);

        this.update({"system.hp.value": newHP});

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor: this}),
            content: `🗡️ ${this.name} sofreu <strong>${damageTaken}</strong> de dano (${amount} - ${arm} ARM), restando <strong>${newHP}</strong> HP.`
        });

        return {
            originalHP: hp.value,
            armUsed: arm,
            damageInput: amount,
            damageApplied: damageTaken,
            hpAfter: newHP
        };
    }
}

// ================================
// 🧱 CLASSE BASE DE FICHAS
// ================================
class IKRPGBaseSheet extends ActorSheet {
    activateListeners(html) {
        super.activateListeners(html);

        // Botões de HP
        html.find(".hp-plus").click(ev => {
            ev.preventDefault();
            const hp = foundry.utils.duplicate(this.actor.system.hp);
            if (hp.value < hp.max) {
                this.actor.update({"system.hp.value": hp.value + 1});
            }
        });

        html.find(".hp-minus").click(ev => {
            ev.preventDefault();
            const hp = foundry.utils.duplicate(this.actor.system.hp);
            if (hp.value > 0) {
                this.actor.update({"system.hp.value": hp.value - 1});
            }
        });

        // Rolar atributos
        html.find(".roll-attr").click(async ev => {
            ev.preventDefault();
            const attr = ev.currentTarget.dataset.attr;
            const value = this.actor.system.mainAttributes?.[attr]
                ?? this.actor.system.secondaryAttributes?.[attr]
                ?? this.actor.system.derivedAttributes?.[attr]
                ?? 0;

            const roll = new Roll("2d6 + @mod", {mod: value});
            await roll.evaluate({async: true});
            roll.toMessage({
                speaker: ChatMessage.getSpeaker({actor: this.actor}),
                flavor: `Teste de ${attr}`
            });
        });

        // Rolar perícias
        html.find(".roll-skill").click(async ev => {
            ev.preventDefault();
            const idx = Number(ev.currentTarget.dataset.idx);
            const skill = this.actor.system.occupationalSkills?.[idx];

            const attrValue = this.actor.system.mainAttributes?.[skill.attr]
                ?? this.actor.system.secondaryAttributes?.[skill.attr]
                ?? 0;
            const level = skill.level || 0;

            const roll = new Roll("2d6 + @attr + @lvl", {
                attr: attrValue,
                lvl: level
            });

            await roll.evaluate({async: true});
            roll.toMessage({
                speaker: ChatMessage.getSpeaker({actor: this.actor}),
                flavor: `Teste de ${skill.name}`
            });
        });

        html.find(".roll-military-skill").click(async ev => {
            ev.preventDefault();
            const idx = Number(ev.currentTarget.dataset.idx);
            const skill = this.actor.system.militarySkills?.[idx];

            const attrValue = this.actor.system.mainAttributes?.[skill.attr]
                ?? this.actor.system.secondaryAttributes?.[skill.attr]
                ?? 0;
            const level = skill.level || 0;

            const roll = new Roll("2d6 + @attr + @lvl", {attr: attrValue, lvl: level});
            await roll.evaluate({async: true});

            roll.toMessage({
                speaker: ChatMessage.getSpeaker({actor: this.actor}),
                flavor: `Perícia Militar: ${skill.name}`
            });
        });

    }
}

// ==============
// IEM SHEET
// ==============
class IKRPGItemSheet extends ItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["ikrpg", "sheet", "item"],
            template: "systems/ikrpg/templates/sheets/item-sheet.html",
            width: 400,
            height: 300
        });
    }


    getData() {
        const data = super.getData();
        data.system = this.item.system;
        return data;
    }
}

// ================================
// 🧍🏽 FICHA DE PERSONAGEM
// ================================
class IKRPGActorSheet extends IKRPGBaseSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ikrpg", "sheet", "actor"],
            template: "systems/ikrpg/templates/sheets/actor-sheet.html",
            width: 800,
            height: 900,
            resizable: true,
            dragDrop: [],
            scrollY: [".sheet-body"],
            minWidth: 800,
            minHeight: 900,
            tabs: [
                {
                    navSelector: ".sheet-primary-tabs",
                    contentSelector: ".sheet-body",
                    initial: "attributes"
                },
                {
                    navSelector: ".sheet-item-tabs",
                    contentSelector: ".sheet-items",
                    initial: "melee"
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


    activateListeners(html) {
        super.activateListeners(html);

        // Editar item
        html.find(".item-edit").click(ev => {
            const li = ev.currentTarget.closest(".item");
            const item = this.actor.items.get(li.dataset.itemId);
            item.sheet.render(true);
        });

        // Excluir item
        html.find(".item-delete").click(ev => {
            const li = ev.currentTarget.closest(".item");
            this.actor.deleteEmbeddedDocuments("Item", [li.dataset.itemId]);
        });

        html.find(".item-create").click(ev => {
            const type = ev.currentTarget.dataset.type || "equipment";
            const itemData = {
                name: `Novo ${type}`,
                type: type,
                system: {}
            };
            this.actor.createEmbeddedDocuments("Item", [itemData]);
        });

        html.find(".item-roll").click(async ev => {
            ev.preventDefault();

            // Identifica o item clicado
            const li = ev.currentTarget.closest(".item");
            const item = this.actor.items.get(li.dataset.itemId);
            if (!item) return;

            // Nome da skill associada
            const skillName = item.system.skill;
            if (!skillName) {
                ui.notifications.warn(`O item ${item.name} não tem uma perícia atribuída.`);
                return;
            }

            // Converte para array se for objeto indexado
            const militarySkills = Object.values(this.actor.system.militarySkills || {});
            const skill = militarySkills.find(s => s.name === skillName);

            if (!skill) {
                ui.notifications.warn(`O personagem não possui a perícia militar "${skillName}".`);
                return;
            }

            // Atributo vinculado à perícia
            const attrValue = this.actor.system.mainAttributes?.[skill.attr]
                ?? this.actor.system.secondaryAttributes?.[skill.attr]
                ?? 0;

            const skillLevel = skill.level || 0;
            const atkMod = item.system.attackMod || 0;

            const roll = new Roll("2d6 + @attr + @skill + @atk", {
                attr: attrValue,
                skill: skillLevel,
                atk: atkMod
            });

            await roll.evaluate({ async: true });

            roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: `Ataque com <strong>${item.name}</strong> usando <em>${skillName}</em>`
            });
        });



    }
}

// ================================
// 🧟 FICHA DE NPC
// ================================
class IKRPGBasicNPCSheet extends IKRPGBaseSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ikrpg", "sheet", "npc"],
            template: "systems/ikrpg/templates/sheets/npc-sheet.html",
            width: 500,
            height: 500,
            dragDrop: [],
            resizable: true,
            minWidth: 500,
            minHeight: 500
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
