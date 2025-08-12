import {
    calculateDamage,
    calculateDerivedAttributes,
    getSnappedRotation,
    handleDamageRoll,
    handleAttackRoll,
    regenerateFatigue,
    promptBonus,
    addFocus,
    clearFocus,
    handleSpellRoll, handleItemRoll
} from "./logic.js";


// ================================
// 📦 CONFIGURAÇÃO DO SISTEMA
// ================================
Hooks.once("init", function () {
    CONFIG.Actor.documentClass = IKRPGActor;

    // Status effects
    CONFIG.statusEffects.push({
        id: "exhausted",
        label: "IKRPG.Status.Exhausted",    // chave de tradução
        icon: "systems/ikrpg/icons/exhausted.svg",
        flags: {core: {statusId: "exhausted"}}
    });

    // Register a Handlebars helper for localization
    Handlebars.registerHelper("t", (key) => {
        return game.i18n.localize(key);
    });

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
    Items.registerSheet("ikrpg", IKRPGItemSheet, {
        makeDefault: true
    });
    Items.registerSheet("ikrpg", IKRPGSpellSheet, {
        types: ["spell"],
        makeDefault: true,
        label: "IKRPG Feitiço"
    });
});

Hooks.once("ready", () => {

    if (game.modules.get("drag-ruler")?.active) {
        game.settings.register("drag-ruler", "speedProviders.ikrpg.color.normal", {
            name: 'normal',
            scope: 'world',
            config: false,
            type: Number,
            default: 0x00FF00 // Verde
        });
        game.settings.register('drag-ruler', 'speedProviders.ikrpg.color.penalty', {
            name: 'penalty',
            scope: 'world',
            config: false,
            type: Number,
            default: 0xFFB733 // Laranja
        });
        game.settings.register('drag-ruler', 'speedProviders.ikrpg.color.prohibited', {
            name: 'prohibited',
            scope: 'world',
            config: false,
            type: Number,
            default: 0xFF2222 // Vermelho
        });
    }

    CONFIG.Grid.gridDistance = 1;
    CONFIG.token.MovementSpeed = {
        formula: "@attributes.movement.current"
    };
});

Hooks.on("updateToken", async (document, changes, options, userId) => {
    const token = canvas.tokens.get(document.id);
    if (token) {
        token.once("refresh", () => {
            addDirectionIndicator(token);
        });
    }
});

// =======================
//  HUD
// =======================

Hooks.on("controlToken", (token, controlled) => {
    $("#ikrpg-token-hud").remove();

    if (!controlled || !token.actor) return;

    const actor = token.actor;
    const hud = $(`
    <div id="ikrpg-token-hud" style="
      position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.8); padding: 8px; border-radius: 10px;
      z-index: 100; min-width: 300px; font-family: sans-serif; color: white;
    "></div>
  `).appendTo(document.body);

    // Agrupar itens por tipo
    const grouped = {};
    for (const item of actor.items) {
        const type = item.type;
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(item);
    }

    // Lista ordenada de categorias que queremos mostrar
    const categories = [
        {key: "meleeWeapon", label: "Melee"},
        {key: "rangedWeapon", label: "Ranged"},
        {key: "spell", label: "Spell"},
        {key: "equipment", label: "Equipment"},
        {key: "feat", label: "Features"},
    ];

    // Criar seções para cada categoria
    for (const cat of categories) {
        const items = grouped[cat.key];
        if (!items || items.length === 0) continue;

        const section = $(`
      <div class="hud-section" style="margin-bottom: 6px;">
        <div class="hud-header" style="cursor: pointer; font-weight: bold; padding: 4px 6px; background: #222; border-radius: 4px;">
          ▶ ${cat.label}
        </div>
        <div class="hud-items" style="display: none; margin-top: 4px;"></div>
      </div>
    `);

        const itemContainer = section.find(".hud-items");

        for (const item of items) {
            const btn = $(`
        <button style="background: #444; border: none; color: white; padding: 4px 6px; margin: 2px 0; border-radius: 4px; width: 100%; text-align: left;">
          ${item.name}
        </button>
      `);

            const rollHandlers = {
                spell: handleSpellRoll,
                weapon: handleItemRoll,
                consumable: handleItemRoll,
                equipment: handleItemRoll,
                feat: handleItemRoll
            };
            btn.click(() => {
                const handler = rollHandlers[item.type] || handleItemRoll;
                handler(item, actor);
            });
            itemContainer.append(btn);
        }

        // Expand/Collapse lógica
        const header = section.find(".hud-header");
        header.click(() => {
            const visible = itemContainer.is(":visible");
            itemContainer.toggle(!visible);
            header.html(`${visible ? "▶" : "▼"} ${cat.label}`);
        });

        hud.append(section);
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

    // Remove previous drawings
    if (token.directionIndicator) {
        token.removeChild(token.directionIndicator);
        token.directionIndicator.destroy();
    }
    if (token.rearIndicator) {
        token.removeChild(token.rearIndicator);
        token.rearIndicator.destroy();
    }

    let arrowWidth = 30;
    let arrowHeight = 65 * token.h/120;
    let arrowBaseHeight = 50 * token.h/120;
    const mainArrow = new PIXI.Graphics();
    mainArrow.beginFill(0xEEFFEE, 0.8);
    mainArrow.lineStyle(1, 0x000000, 1);
    mainArrow.moveTo(-arrowWidth, arrowBaseHeight);
    mainArrow.lineTo(arrowWidth, arrowBaseHeight);
    mainArrow.lineTo(0, arrowHeight);
    mainArrow.lineTo(-arrowWidth, arrowBaseHeight);
    mainArrow.endFill();

    let backLargeWidth = 84
    let backSmallWidth = 44
    let backHeight = 75
    const backArrow = new PIXI.Graphics();
    backArrow.beginFill(0xff8f17, 0.3);
    backArrow.lineStyle(1, 0x000000, 1);
    backArrow.moveTo(-backLargeWidth, 0);
    backArrow.lineTo(-backSmallWidth, -backHeight);
    backArrow.lineTo(backSmallWidth, -backHeight);
    backArrow.lineTo(backLargeWidth, 0);
    backArrow.lineTo(-backLargeWidth, 0);
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
//             Actors
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

    if (actor.type === "steamjack") {
        const chassisSize = data.system?.chassisSize ?? "light";
        const size = chassisSize === "heavy" ? 3 : 2;

        actor.updateSource({
            prototypeToken: {
                width: size,
                height: size,
                actorLink: true,
                displayName: CONST.TOKEN_DISPLAY_MODES.HOVER,
                displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER,
                bar1: {attribute: "hp"}
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

Hooks.on("updateActor", async (actor, updateData, options, userId) => {
    if (actor.type !== "steamjack") return;

    // Checa se chassisSize foi alterado
    const newSize = foundry.utils.getProperty(updateData, "system.chassisSize");
    if (!newSize) return;

    const size = newSize === "heavy" ? 3 : 2;

    actor.update({
        "prototypeToken.width": size,
        "prototypeToken.height": size,
    });
    // Atualiza tokens ativos no canvas
    const tokensToUpdate = canvas.tokens.placeables.filter(t => t.actor?.id === actor.id);

    for (const token of tokensToUpdate) {
        await token.document.update({
            width: size,
            height: size
        });
    }
});

let _lastTurnIndex = null
Hooks.on("updateCombat", (combat, changed) => {
    if (!("turn" in changed)) return;

    const turnIndex = combat.turn;
    const combatant = combat.turns[turnIndex];
    const turnOrder = combat.turns;
    if (!combatant) return;

    // End turn handlers
    if (_lastTurnIndex !== null) {
        const prev = turnOrder[_lastTurnIndex];
        if (prev?.actor?.type === "character" && prev?.actor?.system.focus.enabled) {
            clearFocus(prev?.actor);
        }
    }

    //Current turn Handlers
    const actor = combatant.actor;
    if (actor.type === "character" && actor.system.fatigue.enabled) {
        regenerateFatigue(actor);
    }
    if (actor.type === "character" && actor.system.focus.enabled) {
        addFocus(actor);
    }

    // 4) Atualize para a próxima vez
    _lastTurnIndex = turnIndex;
});


Hooks.on("renderChatMessage", (message, html, data) => {

    // Botão de Ataque
    html.find(".attack-roll").click(event => handleAttackRoll(event, message));


    // Botão de Dano
    html.find(".damage-roll").click(event => handleDamageRoll(event, message));

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

class IKRPGActor extends Actor {
    prepareData() {
        super.prepareData();
        const data = this.system;

        if (this.type === "character") {
            this.updateCharacterHp(data);
            this.updateArmorData(data);
            this.prepareFatigue(data);
            this.prepareFocus(data)
        }
    }

    prepareFatigue(data) {
        if (!data.fatigue.enabled) return;
        data.fatigue.max = data.secondaryAttributes.ARC * 2;
    }

    prepareFocus(data) {
        if (!data.focus.enabled) return;
        data.focus.max = data.secondaryAttributes.ARC;
    }

    updateCharacterHp(data) {
        const agl = data.mainAttributes.AGL;
        const phy = data.mainAttributes.PHY;
        const int = data.mainAttributes.INT;

        data.hp.max = phy + int + agl;
    }

    updateArmorData(data) {
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
        const {damageTaken, newHP} = calculateDamage(hp.value, arm, amount);
        this.update({"system.hp.value": newHP});

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor: this}),
            content: game.i18n.format("IKRPG.Chat.Damage.Applied", {
                name: this.name,
                damageTaken: damageTaken,
                damageInput: amount,
                armUsed: arm,
                hpAfter: newHP
            })
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
//             Sheets
// ================================
class IKRPGBaseSheet extends ActorSheet {
    activateListeners(html) {
        super.activateListeners(html);

        // HP Buttons
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

        // Focus Buttons
        html.find(".focus-plus").click(ev => {
            ev.preventDefault();
            this.actor.update({"system.focus.value": this.actor.system.focus.value + 1});
        });

        html.find(".focus-minus").click(ev => {
            this.actor.update({"system.focus.value": this.actor.system.focus.value - 1});
        });

        // Fatigue Buttons
        html.find(".fatigue-plus").click(ev => {
            ev.preventDefault();
            this.actor.update({"system.fatigue.value": this.actor.system.fatigue.value + 1});
        });

        html.find(".fatigue-minus").click(ev => {
            this.actor.update({"system.fatigue.value": this.actor.system.fatigue.value - 1});
        });

        html.find(".toggle-zero-skills").click(async ev => {
            const current = this.actor.getFlag("ikrpg", "showAllSkills") || false;
            const newVal = !current;
            await this.actor.setFlag("ikrpg", "showAllSkills", newVal);

            const wrapper = html.find(".skills-wrapper");
            const btn = $(ev.currentTarget);
            wrapper.toggleClass("skill-show-all", newVal);
            btn.text(newVal ? "Ocultar skills vazias" : "Mostrar todas");
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

            const formula = await promptBonus(`${value}`);

            const roll = new Roll(formula);
            await roll.evaluate({async: true});
            roll.toMessage({
                speaker: ChatMessage.getSpeaker({actor: this.actor}),
                flavor: game.i18n.format("IKRPG.Chat.Fatigue.AttrRoll", {attribute: attr})
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

            const formula = await promptBonus(`${attrValue} + ${level}`);

            const roll = new Roll(formula);

            await roll.evaluate({async: true});
            roll.toMessage({
                speaker: ChatMessage.getSpeaker({actor: this.actor}),
                flavor: `${game.i18n.format("IKRPG.Table.Header.Skill")}: ${skill.name}`
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

            let formula = await promptBonus(`${attrValue} + ${level}`);

            const roll = new Roll(formula);
            await roll.evaluate({async: true});

            roll.toMessage({
                speaker: ChatMessage.getSpeaker({actor: this.actor}),
                flavor: `${game.i18n.format("IKRPG.Table.Header.MilSkill")}: ${skill.name}`
            });
        });

        html.find(".item-info").click(ev => {
            const li = ev.currentTarget.closest(".item");
            const item = this.actor.items.get(li.dataset.itemId);

            // Name and description
            let content = `<strong>${item.name}</strong>`;
            if (item.system.description) {
                content += `<br>${item.system.description}`;
            }

            // List of fields in order they will appear
            const fieldLabels = {
                skill: game.i18n.format("IKRPG.Table.Header.MilSkill"),
                cost: game.i18n.format("IKRPG.Table.Header.Cost"),
                pow: game.i18n.format("IKRPG.Table.Header.POW"),
                attackMod: game.i18n.format("IKRPG.Table.Header.AttackMod"),
                tags: game.i18n.format("IKRPG.Table.Header.Tags"),
                effectiveRange: game.i18n.format("IKRPG.Table.Header.EffectiveRange"),
                extremeRange: game.i18n.format("IKRPG.Table.Header.ExtremeRange"),
                AOE: game.i18n.format("IKRPG.Table.Header.AOE"),
                ammo: game.i18n.format("IKRPG.Table.Header.Ammo"),
                upkeep: game.i18n.format("IKRPG.Table.Header.Upkeep"),
                offensive: game.i18n.format("IKRPG.Table.Header.Offensive"),
                armorBonus: game.i18n.format("IKRPG.Sheet.Labels.ARM"),
                defPenalty: game.i18n.format("IKRPG.Sheet.Labels.DEF"),
                spdPenalty: game.i18n.format("IKRPG.Sheet.Labels.SPD")
            };

            // Attribute table
            let attrTable = `<table style="margin-top: 0.5em;">`;
            for (const [key, label] of Object.entries(fieldLabels)) {
                if (item.system[key] !== undefined && item.system[key] !== null && item.system[key] !== "") {
                    attrTable += `<tr><td><strong>${label}:</strong></td><td>${item.system[key]}</td></tr>`;
                }
            }
            attrTable += `</table>`;

            content += attrTable;

            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content
            });
        });


        html.find(".item-delete").click(ev => {
            ev.preventDefault();
            const li = ev.currentTarget.closest(".item");
            const itemId = li.dataset.itemId;
            const item = this.actor.items.get(itemId);

            // Cria o diálogo de confirmação
            new Dialog({
                title: "Confirmar Exclusão",
                content: `<p>Deseja realmente excluir <strong>${item.name}</strong>?</p>`,
                buttons: {
                    yes: {
                        icon: "<i class='fas fa-trash'></i>",
                        label: "Excluir",
                        callback: () => {
                            this.actor.deleteEmbeddedDocuments("Item", [itemId]);
                        }
                    },
                    no: {
                        icon: "<i class='fas fa-times'></i>",
                        label: "Cancelar"
                    }
                },
                default: "no"
            }).render(true);
        });
    }
}

class IKRPGItemSheet extends ItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ikrpg", "sheet", "item", "spell"],
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
        data.isCharacter = this.actor.type === "character";
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        const showAll = this.actor.getFlag("ikrpg", "showAllSkills") || false;
        html.find(".skills-wrapper").toggleClass("skill-show-all", showAll);
        html.find(".toggle-zero-skills").text(showAll ? "Ocultar skills vazias" : "Mostrar todas");

        // Editar item
        html.find(".item-edit").click(ev => {
            const li = ev.currentTarget.closest(".item");
            const item = this.actor.items.get(li.dataset.itemId);
            item.sheet.render(true);
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

            handleItemRoll(item, this.actor)
        });

        html.find(".spell-roll").click(async ev => {
            ev.preventDefault();
            const li = ev.currentTarget.closest(".item");
            const item = this.actor.items.get(li.dataset.itemId);
            if (!item) return;
            handleSpellRoll(item, this.actor)
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
        data.isSteamjack = this.actor.type === "steamjack";
        data.items = this.actor.items;  // ← ESSENCIAL
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

            // Identify targets
            const targets = Array.from(game.user.targets);

            const formattedTargets = targets.map(t => `<strong>${t.name}</strong>`).join(", ");
            let targetInfo = targets.length > 0
                ? `<p>${game.i18n.format("IKRPG.Chat.Target.List", {formattedTargets: formattedTargets})}</p>`
                : `<p>${game.i18n.format("IKRPG.Chat.Target.Empty")}</p>`;

            const content = `
        <div class="chat-weapon-roll">
            <h3>Attacking with ${item.name}</h3>
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
        data.isNPC = this.actor.type === "npc";
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }
}
