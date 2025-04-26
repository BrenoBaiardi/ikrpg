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

// =======================
//  Helpers
// =======================
Handlebars.registerHelper('tagsToString', function (tags) {
    if (Array.isArray(tags)) {
        return tags.join(", ");
    }
    return "";
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

// Só criar o hook uma única vez
Hooks.once("ready", () => {
    document.addEventListener("click", async (ev) => {
        if (ev.target.classList.contains("attack-roll")) {
            const itemId = ev.target.dataset.itemId;
            const messageId = ev.target.closest(".message")?.dataset.messageId;
            const message = game.messages.get(messageId);
            const actor = game.actors.get(message?.speaker?.actor);
            if (!actor) return;
            const item = actor.items.get(itemId);
            if (!item) return;

            // Attack logic
            const skillName = item.system.skill;
            const militarySkills = Object.values(actor.system.militarySkills || {});
            const skill = militarySkills.find(s => s.name === skillName);
            if (!skill) return;

            const attrValue = actor.system.mainAttributes?.[skill.attr]
                ?? actor.system.secondaryAttributes?.[skill.attr]
                ?? 0;
            const skillLevel = skill.level || 0;
            const attackMod = item.system.attackMod || 0;

            const roll = new Roll("2d6 + @attr + @skill + @atk", {
                attr: attrValue,
                skill: skillLevel,
                atk: attackMod
            });
            await roll.evaluate({async: true});

            let flavor = `<h3>🎯 Attack Roll: ${item.name}</h3>`;
            const target = game.user.targets.first();
            if (target) {
                const targetDEF = target.actor?.system?.derivedAttributes?.DEF ?? null;
                if (targetDEF !== null) {
                    const success = roll.total >= targetDEF;
                    flavor += `<p>Target: <strong>${target.name}</strong> (DEF ${targetDEF})</p>`;
                    flavor += success
                        ? `<p style="color: green;">✅ Hit!</p>`
                        : `<p style="color: red;">❌ Miss!</p>`;
                }
            } else {
                flavor += `<p><em>No target selected.</em></p>`;
            }

            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({actor}),
                flavor: flavor
            });
        }

        if (ev.target.classList.contains("damage-roll")) {
            const itemId = ev.target.dataset.itemId;
            const messageId = ev.target.closest(".message")?.dataset.messageId;
            const message = game.messages.get(messageId);
            const actor = game.actors.get(message?.speaker?.actor);
            if (!actor) return;
            const item = actor.items.get(itemId);
            if (!item) return;

            const pow = item.system.pow || 0;
            const roll = new Roll(`2d6 + ${pow}`);
            await roll.evaluate({ async: true });

            const target = game.user.targets.first();
            if (!target) {
                ui.notifications.warn("⚠️ No target selected. Damage not applied.");
                return roll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor }),
                    flavor: `<h3>💥 Damage Roll: ${item.name}</h3><p><em>No target selected.</em></p>`
                });
            }

            // Aplica o dano usando a função existente
            const result = await target.actor.applyDamage(roll.total);

            // Mensagem detalhada usando o resultado da função
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor }),
                flavor: `<h3>💥 Damage Roll: ${item.name}</h3>
             <p>Target: <strong>${target.name}</strong></p>
             <p>Rolled: <strong>${result.damageInput}</strong> vs ARM ${result.armUsed}</p>
             <p>Damage Applied: <strong>${result.damageApplied}</strong></p>
             <p>HP Remaining: <strong>${result.hpAfter}</strong></p>`
            });
        }
    });
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
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ikrpg", "sheet", "item"],
            template: "systems/ikrpg/templates/sheets/item-sheet.html",
            width: 400,
            height: 300
        });
    }

    async _updateObject(event, formData) {
        if (typeof formData["system.tags"] === "string") {
            formData["system.tags"] = formData["system.tags"]
                .split(",")
                .map(t => t.trim())
                .filter(t => t.length > 0);
        }
        return super._updateObject(event, formData);
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

            const li = ev.currentTarget.closest(".item");
            const item = this.actor.items.get(li.dataset.itemId);
            if (!item) return;

            // Identificar alvo se existir
            let target = game.user.targets.first();
            let targetInfo = target ? `<p>🎯 Target: <strong>${target.name}</strong></p>` : `<p>🎯 Target: <em>None</em></p>`;

            const content = `
    <div class="chat-weapon-roll">
        <h3>${item.name}</h3>
        ${targetInfo}
        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
            <button type="button" class="attack-roll" data-item-id="${item.id}">🎯 Attack</button>
            <button type="button" class="damage-roll" data-item-id="${item.id}">💥 Damage</button>
        </div>
    </div>
    `;

            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: content
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
