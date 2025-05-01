import { calculateDamage, calculateDerivedAttributes, getSnappedRotation } from "./logic.js";


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
    Actors.registerSheet("ikrpg", IKRPGSteamjackSheet, {
        types: ["steamjack"],
        makeDefault: true
    });
    Actors.registerSheet("ikrpg", IKRPGBasicNPCSheet, {
        types: ["npc"],
        makeDefault: true
    });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("ikrpg", IKRPGItemSheet, {makeDefault: true});
    if (game.modules.get("drag-ruler")?.active) {
        game.settings.register('drag-ruler', 'speedProviders.system.ikrpg.color.normal', {
            name: 'normal',
            scope: 'world',
            config: false,
            type: Number,
            default: 0x00FF00 // Verde
        });
        game.settings.register('drag-ruler', 'speedProviders.system.ikrpg.color.penalty', {
            name: 'penalty',
            scope: 'world',
            config: false,
            type: Number,
            default: 0xFFB733 // Laranja
        });
        game.settings.register('drag-ruler', 'speedProviders.system.ikrpg.color.prohibited', {
            name: 'prohibited',
            scope: 'world',
            config: false,
            type: Number,
            default: 0xFF2222 // Vermelho
        });
    }

});

Hooks.once("ready", () => {
    CONFIG.Grid.gridDistance = 1;
    CONFIG.token.MovementSpeed = {
        formula: "@attributes.movement.current"
    };
});

Hooks.on("updateToken", (document, changes, options, userId) => {
    const token = canvas.tokens.get(document.id);
    if (token) {
        token.once("refresh", () => {
            addDirectionIndicator(token);
        });
    }
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

Hooks.on("refreshToken", (token) => {
    addDirectionIndicator(token);
});

function addDirectionIndicator(token) {
    if (!token) return;

    // Remove anteriores, se existirem
    if (token.directionIndicator) {
        token.removeChild(token.directionIndicator);
        token.directionIndicator.destroy();
    }
    if (token.rearIndicator) {
        token.removeChild(token.rearIndicator);
        token.rearIndicator.destroy();
    }

    let arrowWidth = 30
    let arrowHeight = 65
    let arrowBaseHeight = 50
    const mainArrow = new PIXI.Graphics();
    mainArrow.beginFill(0xFF0000, 0.8);
    mainArrow.moveTo(-arrowWidth, -arrowBaseHeight);
    mainArrow.lineTo(arrowWidth, -arrowBaseHeight);
    mainArrow.lineTo(0, -arrowHeight);
    mainArrow.lineTo(-arrowWidth, -arrowBaseHeight);
    mainArrow.endFill();

    let backUpperWidth = 65
    let backLowerWidth = 30
    let backHeight = 55
    const backArrow = new PIXI.Graphics();
    backArrow.beginFill(0x0000FF, 0.3);
    backArrow.moveTo(-backUpperWidth, 0);
    backArrow.lineTo(-backLowerWidth, backHeight);
    backArrow.lineTo(backLowerWidth, backHeight);
    backArrow.lineTo(backUpperWidth, 0);
    backArrow.lineTo(-backUpperWidth, 0);
    backArrow.endFill();

    // Calculando a rotação correta para o token
    const snappedRotation = getSnappedRotation(token.document.rotation, canvas.scene.grid.type);
    const radians = snappedRotation * (Math.PI / 180);

    // Ajuste da rotação para frente e para trás
    mainArrow.rotation = radians;
    backArrow.rotation = radians; // 180° oposto

    // Posicionando as setas no centro do token
    const centerX = token.w / 2;
    const centerY = token.h / 2;
    mainArrow.position.set(centerX, centerY);
    backArrow.position.set(centerX, centerY);

    // Adiciona a seta traseira atrás do token e a seta principal na frente
    token.addChildAt(backArrow, 0);  // Coloca a seta traseira atrás
    token.addChild(mainArrow);        // Coloca a seta principal em cima

    token.directionIndicator = mainArrow;
    token.rearIndicator = backArrow;
}





// ================================
//              ATORES
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

class IKRPGActor extends Actor {
    prepareData() {
        super.prepareData();
        const data = this.system;

        const agl = data.mainAttributes.AGL;
        const phy = data.mainAttributes.PHY;
        const int = data.mainAttributes.INT;

        data.hp.max = phy + int + agl;

        // ===== Armor integration =====
        // Uses first armor found for now
        const equippedArmors = this.items.filter(i => i.type === "armor" && i.system.isEquipped);

        const totalArmorBonus = equippedArmors.reduce((sum, armor) => sum + (armor.system.armorBonus || 0), 0);
        const totalArmorDefPenalty = equippedArmors.reduce((sum, armor) => sum + (armor.system.defPenalty || 0), 0); //treated in html to always be converted to negative or 0
        const totalArmorSpdPenalty = equippedArmors.reduce((sum, armor) => sum + (armor.system.spdPenalty || 0), 0); //treated in html to always be converted to negative or 0

        data.derivedAttributes = calculateDerivedAttributes(data, {
            speedPenalty: totalArmorSpdPenalty,
            armorBonus: totalArmorBonus,
            defPenalty: totalArmorDefPenalty
        });

        data.movement = {
            base: data.movement.base,
            bonus: 0,
            penalty: totalArmorSpdPenalty,
            current: data.derivedAttributes.MOVE
        };
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
        const { damageTaken, newHP } = calculateDamage(hp.value, arm, amount);
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
//             FICHAS
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
            // Ignores clicks from input
            if (ev.target.tagName.toLowerCase() === "input") return;

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

class IKRPGActorSheet extends IKRPGBaseSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ikrpg", "sheet", "actor"],
            template: "systems/ikrpg/templates/sheets/actor-sheet.html",
            width: 1000,
            height: 1000,
            resizable: true,
            dragDrop: [],
            scrollY: [".sheet-body"],
            minWidth: 1000,
            minHeight: 1000,
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

            // Identificar alvos
            const targets = Array.from(game.user.targets);

            const formattedTargets = targets.map(t => `<strong>${t.name}</strong>`).join(", ");
            let targetInfo = targets.length > 0
                ? `<p>🎯 Alvos: ${formattedTargets}</p>`
                : `<p>🎯 Sem alvos</p>`;

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
                speaker: ChatMessage.getSpeaker({actor: this.actor}),
                content: content
            });
        });
    }
}

class IKRPGSteamjackSheet extends IKRPGBaseSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ikrpg", "sheet", "steamjack"],
            template: "systems/ikrpg/templates/sheets/steamjack-sheet.html",
            width: 800,
            height: 800,
            resizable: true,
            scrollY: [".sheet-body"],
        });
    }

    getData() {
        const data = super.getData();
        data.system = this.actor.system;
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        // Interações específicas da ficha steamjack podem ir aqui
    }
}

Hooks.on("renderChatMessage", (message, html, data) => {

    // Botão de Ataque
    html.find(".attack-roll").click(async ev => {
        ev.preventDefault();
        const itemId = ev.currentTarget.dataset.itemId;
        const actor = game.actors.get(message.speaker.actor);
        const item = actor?.items.get(itemId);

        if (!item) return;

        const skillName = item.system.skill;
        const militarySkills = Object.values(actor.system.militarySkills || {});
        const skill = militarySkills.find(s => s.name === skillName);

        if (!skill) {
            ui.notifications.warn(`O personagem não possui a perícia militar "${skillName}".`);
            return;
        }

        // Atributo vinculado à perícia militar (normalmente PRW ou POI)
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

        // Primeiro: Mostrar a rolagem no chat
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({actor}),
            flavor: `<h3>Resultado do ataque de ${item.name}</h3>`
        });

        const targets = Array.from(game.user.targets);

        if (targets.length > 0) {
            let results = targets.map(t => {
                const targetActor = t.actor;
                const targetDef = targetActor?.system?.derivedAttributes?.DEF ?? 0;
                const success = roll.total >= targetDef;
                const hitMessage = success ? `style="color: green;"> ✅ Hit!` : `style="color: red;">❌ Miss!`
                return `<strong ${hitMessage} </strong> Contra ${t.name}: DEF ${targetDef} `;
            }).join("<br>");

            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({actor}),
                content: `
                <h3>Resultado do Ataque (${item.name})</h3>
                ${results}
            `
            });
        }
    });

    // Botão de Dano
    html.find(".damage-roll").click(async ev => {
        ev.preventDefault();
        const itemId = ev.currentTarget.dataset.itemId;
        const actor = game.actors.get(message.speaker.actor);
        const item = actor?.items.get(itemId);

        if (!item) return;

        // Rolar dano primeiro e mostrar a fórmula
        const damageRoll = new Roll("2d6 + @pow", {
            pow: item.system.pow || 0
        });
        await damageRoll.evaluate({async: true});

        // Primeiro: Mostrar a rolagem no chat
        await damageRoll.toMessage({
            speaker: ChatMessage.getSpeaker({actor}),
            flavor: `<h3>Dano de ${item.name}</h3>`
        });

        // Depois: Criar os botões para aplicar dano
        const targets = Array.from(game.user.targets);

        const buttons = targets.map(t => `
        <button type="button" class="apply-damage" data-target-id="${t.id}" data-damage="${damageRoll.total}">
            Aplicar ${damageRoll.total} em ${t.name}
        </button>`).join("<br>");

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor}),
            content: `
            <h3>Aplicar Dano (${item.name})</h3>
            ${buttons}
        `
        });
    });

    // Botão de Aplicar Dano
    html.find(".apply-damage").click(async ev => {
        ev.preventDefault();
        const targetId = ev.currentTarget.dataset.targetId;
        const damage = Number(ev.currentTarget.dataset.damage);

        const token = canvas.tokens.get(targetId);
        const actor = token?.actor;

        if (!actor) {
            ui.notifications.error("Target not found!");
            return;
        }

        if (typeof actor.applyDamage === "function") {
            actor.applyDamage(damage);
        } else {
            ui.notifications.warn("Target actor does not support damage application.");
        }
    });

});

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
