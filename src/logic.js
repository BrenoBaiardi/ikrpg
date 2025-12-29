// this file is supposed to be testable because it will not have any
// foundry dependency that would fail to compile in jest

export function calculateDamage(hp, arm, damageAmount) {
    const damageTaken = Math.max(0, damageAmount - arm);
    const newHP = Math.max(0, hp - damageTaken);
    return {damageTaken, newHP};
}

export function calculateDerivedAttributes(data, armorBonuses) {
    const currentMove = Math.max(0, data.secondaryAttributes.SPD + armorBonuses.speedPenalty);
    data.movement = {
        base: data.secondaryAttributes.SPD,
        bonus: 0,
        penalty: armorBonuses.speedPenalty,
        current: currentMove
    };
    const {AGL, PHY, INT} = data.mainAttributes;
    const {PRW, SPD, PER} = data.secondaryAttributes;
    return {
        MOVE: data.movement.current,
        INIT: [PRW, SPD, PER].reduce((sum, val) => sum + val, 0),
        DEF: [AGL, PER, SPD, armorBonuses.defPenalty].reduce((sum, val) => sum + val, 0),
        ARM: [PHY, armorBonuses.armorBonus].reduce((sum, val) => sum + val, 0),
        WILL: [PHY, INT].reduce((sum, val) => sum + val, 0)
    };
}

/**
 * Retorna a rotação ajustada para o grid.
 *
 * @param {number} rotation - A rotação original (em graus).
 * @param {number} gridType - O tipo de grid da cena.
 * @returns {number} - A rotação "snapped", arredondada ao passo correto.
 */
export function getSnappedRotation(rotation, gridType) {
    let step = 45;
    let offset = 0;

    if (gridType === 4 || gridType === 5) {
        step = 60;
        offset = 0;
    } else if (gridType === 2 || gridType === 3) {
        step = 60;
        offset = 30;
    }


    const adjusted = (rotation - offset + 360) % 360;
    const snapped = Math.round(adjusted / step) * step;
    return (snapped + offset) % 360;
}

export async function handleDamageRoll(event, message) {
    event.preventDefault();

    const itemId = event.currentTarget.dataset.itemId;
    const actor = ChatMessage.getSpeakerActor(message.speaker);

    if (!actor) {
        ui.notifications.warn("Actor does not exist.");
        return;
    }

    const item = actor.items.get(itemId);
    if (!item) {
        ui.notifications.warn("Item does not exist.");
        return;
    }

    let damageRoll = new Roll("2d6")
    if (item.type === "meleeWeapon") {
        const formula = await promptBonus(`${item.system.pow || 0} + ${actor.system.secondaryAttributes?.STR || 0}`)
        damageRoll = new Roll(formula);
    } else if (item.type === "rangedWeapon") {
        const formula = await promptBonus(`${item.system.pow || 0}`)
        damageRoll = new Roll(formula);
    } else if (item.type === "spell") {
        const formula = await promptBonus(`${item.system.pow || 0}`)
        damageRoll = new Roll(formula);
    }


    await damageRoll.evaluate({async: true});

    await damageRoll.toMessage({
        speaker: ChatMessage.getSpeaker({actor}),
        flavor: `<h3> ${game.i18n.format("IKRPG.Chat.Damage.Description", {itemName:item.name})}</h3>`
    });

    const targets = Array.from(game.user.targets);

    if (targets.length > 0) {
        const buttons = targets.map(t => `
        <button type="button" class="apply-damage" data-target-id="${t.id}" data-damage="${damageRoll.total}">
            ${game.i18n.format("IKRPG.Chat.Damage.Total", {total: damageRoll.total, name: t.name})}
        </button>`).join("<br>");

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor}),
            content: "<h3>"+game.i18n.format("IKRPG.Chat.Damage.Apply", {itemName:item.name}) + "</h3>" + buttons,
        });
    }
}

// warcaster.js
export async function useFocus(actor, cost) {
    if (!actor.system.focus.enabled) return 0;
    const current = actor.system.focus.value;
    const newValue = current - cost;
    if (newValue < 0) { // if exceeds ARCx2 - fatigue roll
        ui.notifications.warn(`Not enough Focus to cast the spell!`);
        return actor.system.focus.value;
    }
    await actor.update({"system.focus.value": newValue});
    return newValue;
}

export function checkFocus(actor, cost) {
    if (!actor.system.focus.enabled) return false;
    else if (actor.system.focus.value < cost) return false
    return true;
}



// will-weaver.js

export async function increaseFatigue(actor, cost) {
    if (!actor.system.fatigue.enabled) return;
    const current = actor.system.fatigue.value;
    const newValue = current + cost;
    if (newValue > actor.system.fatigue.max) { // if exceeds ARCx2 - fatigue roll
        console.log("Add message to say it should not be allowed. dont know what to do in this case")
    } else if (newValue > actor.system.secondaryAttributes.ARC) { // if fatigue exceeds ARC - fatigue roll
        fatigueRoll(actor);
    }
    await actor.update({"system.fatigue.value": newValue});
}

/**
 * Verifica se é necessário fazer o fatigue roll.
 * @param {Actor} actor
 * @returns {boolean}
 */
export function shouldRollFatigue(actor) {
    return actor.system.fatigue.enabled
        && actor.system.fatigue.value > actor.system.secondaryAttributes.ARC;
}

/**
 * Cria e avalia um roll de 2d6.
 * @returns {Promise<Roll>}
 */
export async function performFatigueRoll() {
    const roll = new Roll("2d6");
    await roll.evaluate({ async: true });
    return roll;
}

/**
 * Envia o resultado do roll para o chat.
 * @param {Roll} roll
 * @param {number} fatigue
 */
export function sendFatigueRollToChat(roll, fatigue) {
    roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: roll.data._actor }), // actor atrelado ao Roll
        flavor: game.i18n.format("IKRPG.Chat.Fatigue.Roll", { fatigue })
    });
}

/**
 * Determina se o roll falhou (exhaustion).
 * @param {number} total
 * @param {number} fatigue
 * @returns {boolean}
 */
export function isExhausted(total, fatigue) {
    return total < fatigue;
}

/**
 * Aplica efeitos e mensagens de falha.
 * @param {Actor} actor
 * @param {number} total
 */
export async function handleFatigueFailure(actor, total) {
    await actor.update({ "system.fatigue.exhausted": true });
    ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: game.i18n.format("IKRPG.Chat.Fatigue.Fail", {
            name: actor.name,
            total
        })
    });
    applyExhaustedStatus(actor);
}

/**
 * Envia mensagem de sucesso (resistiu).
 * @param {Actor} actor
 * @param {number} total
 */
export function handleFatigueSuccess(actor, total) {
    ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: game.i18n.format("IKRPG.Chat.Fatigue.Success", {
            name: actor.name,
            total
        })
    });
}

/**
 * Perform a fatigue roll for a Will Weaver. Outputs results to chat
 * @param {Actor} actor  The actor performing the fatigue roll.
 */
export async function fatigueRoll(actor) {
    if (!shouldRollFatigue(actor)) return;

    const fatigue = actor.system.fatigue.value;
    const roll    = await performFatigueRoll();
    sendFatigueRollToChat(roll, fatigue);

    const total = roll.total;
    if (isExhausted(total, fatigue)) {
        await handleFatigueFailure(actor, total);
    } else {
        handleFatigueSuccess(actor, total);
    }
}


export async function regenerateFatigue(actor) {
    if (!actor.system.fatigue.enabled) return;
    const current = actor.system.fatigue.value;
    const newValue = Math.max(0, current - actor.system.secondaryAttributes.ARC);
    await actor.update({"system.fatigue.value": newValue});

    const content = `
    <div class="ikrpg-chat-fatigue">
      <h4>✨ Will Weavers recover their ARC in fatigue each maintenance phase. ✨</h4>
      <p>
        <strong>${actor.name}</strong> recovered <strong>${actor.system.secondaryAttributes.ARC}</strong> Fatigue.
      </p>
      <p>
        Fatigue: <s>${current}</s> → <strong>${newValue}</strong>
      </p>
    </div>
  `;

    ChatMessage.create({
        speaker: ChatMessage.getSpeaker({actor}),
        content
    });
}

export async function applyExhaustedStatus(actor) {
    // Avoids duplication
    if ( actor.effects.find(e => e.data.flags.core?.statusId === "exhausted") ) return;

    const statusDef = CONFIG.statusEffects.find(e => e.id === "exhausted");
    const effectData = {
        label: statusDef.label,
        icon: statusDef.icon,
        origin: actor.uuid,
        disabled: false,
        flags: statusDef.flags
    };
    await actor.createEmbeddedDocuments("ActiveEffect", [ effectData ]);

    const token = canvas.tokens.placeables.find(t => t.actor.id === actor.id);
    if (token) token.toggleEffect(statusDef.icon);
}

export async function clearFocus(actor) {
    if (!actor.system.focus.enabled) return;
    await actor.update({"system.focus.value": 0});

    const content = `
    <div class="ikrpg-chat-fatigue">
      <h4>✨ Focusers lose their focus at the end of turn.✨</h4>
      <p>
        <strong>${actor.name}</strong> now has
        <strong>0</strong> Focus.
      </p>
    </div>
  `;

    ChatMessage.create({
        speaker: ChatMessage.getSpeaker({actor}),
        content
    });
}

export async function addFocus(actor) {
    if (!actor.system.focus.enabled) return;
    await actor.update({"system.focus.value": actor.system.secondaryAttributes.ARC});
    const content = `
    <div class="ikrpg-chat-fatigue">
      <h4>✨ Focusers gain Focus at the start of their turn.✨</h4>
      <p>
        <strong>${actor.name}</strong> now has 
        <strong>${actor.system.secondaryAttributes.ARC}</strong> Focus.
      </p>
    </div>
  `;

    ChatMessage.create({
        speaker: ChatMessage.getSpeaker({actor}),
        content
    });
}

export function findMilitarySkill(item, actor) {
    const skillName = item.system.skill;
    const militarySkills = Object.values(actor.system.militarySkills || {});
    let skill = militarySkills.find(s => s.name === skillName);

    if (!skill) {
        skill = {name: "undefined", attr: 0, level: 0}
        ui.notifications.warn(`No Military Skill found -> [${skillName}].`);
    }
    return skill;
}

async function sendAttackToChat(roll, actor, item) {
    await roll.toMessage({
        speaker: ChatMessage.getSpeaker({actor}),
        flavor: `<h3>${game.i18n.format("IKRPG.Chat.Attack.Result", {itemName: item.name})}</h3>`
    });
    return roll;
}

export function buildHitResult(targets, roll) {
    return targets.map(t => {
        const targetActor = t.actor;
        const targetDef = targetActor?.system?.derivedAttributes?.DEF ?? 0;
        const success = roll.total >= targetDef;
        const hitMessage = success
            ? `style="color: green;"> ✅ Hit!`
            : `style="color: red;">❌ Miss!`;
        return `<strong ${hitMessage} </strong> Contra ${t.name}: DEF ${targetDef}`; // do not localize without fixing tests localization
    }).join("<br>");
}

/**
 * @param {Object} actor
 * @param {Object} item
 * @returns {{attr: number, skill: number}} Associated attribute level and Skill level
 */
export function getAttackValues(actor, item) {
    const isSteamjack = actor.type === "steamjack";
    const isCharacter = actor.type === "character";
    const isMeleeWeapon = item.type === "meleeWeapon";
    const isRangedWeapon = item.type === "rangedWeapon";
    const isSpell = item.type === "spell";
    const isWeapon = isMeleeWeapon || isRangedWeapon;


    if (isSteamjack) {
        const derived = actor.system.derivedAttributes || {};
        if (isMeleeWeapon) return {attr: derived.MAT ?? 0, skill: 0};
        if (isRangedWeapon) return {attr: derived.RAT ?? 0, skill: 0};

        ui.notifications.warn("Erro: atributo para rolagem não encontrado (esperado MAT ou RAT).");
        return {"attr": 0, "skill": 0};
    } else if (isCharacter && isWeapon) {
        const skill = findMilitarySkill(item, actor);
        const attrValue = actor.system.mainAttributes?.[skill.attr]
            ?? actor.system.secondaryAttributes?.[skill.attr]
            ?? 0;
        return {attr: attrValue, skill: skill.level || 0};
    } else if (isSpell) {
        return {attr: actor.system.secondaryAttributes.ARC ?? 0, skill: 0};
    }

    console.warn("No character type configured for -> " + actor.type);
    return {"attr": 0, "skill": 0};
}

export async function handleAttackRoll(event, message) {
    event.preventDefault();

    const itemId = event.currentTarget.dataset.itemId;
    const actor = ChatMessage.getSpeakerActor(message.speaker);

    if (!actor) {
        ui.notifications.warn("Actor does not exist.");
        return;
    }

    const item = actor.items.get(itemId);

    if (!item) {
        ui.notifications.warn("Item does not exist.");
        return;
    }


    const attackValues = getAttackValues(actor, item);
    let attrValue = attackValues.attr;
    let skillLevel = attackValues.skill;

    const attackMod = item.system.attackMod || 0;

    const formula = await promptBonus(`${attrValue} + ${skillLevel} + ${attackMod}`)

    const roll = new Roll(formula);

    await roll.evaluate({async: true});
    await sendAttackToChat(roll, actor, item);

    const targets = Array.from(game.user.targets);

    if (targets.length > 0) {
        let results = buildHitResult(targets, roll);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor}),
            content: `
                <h3>${game.i18n.format("IKRPG.Chat.Attack.Result", {itemName: item.name})}</h3>
                ${results}
            `
        });
    }
}

export async function handleItemRoll(item, actor) {
    const targets = Array.from(game.user.targets);

    const formattedTargets = targets.map(t => `<strong>${t.name}</strong>`).join(", ");
    let targetInfo = targets.length > 0
        ? `<p>${game.i18n.format("IKRPG.Chat.Target.List", {formattedTargets: formattedTargets})}</p>`
        : `<p>${game.i18n.format("IKRPG.Chat.Target.Empty")}</p>`;

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
        speaker: ChatMessage.getSpeaker({actor: actor}),
        content: content
    });
}

export async function handleSpellRoll(item, actor) {
    const targets = Array.from(game.user.targets);

    if (checkFocus(actor, item.system.cost) || actor.system.fatigue.enabled){
        if (item.system.offensive) {
            const formattedTargets = targets.map(t => `<strong>${t.name}</strong>`).join(", ");
            let targetInfo = targets.length > 0
                ? `<p>${game.i18n.format("IKRPG.Chat.Target.List", {formattedTargets: formattedTargets})}</p>`
                : `<p>${game.i18n.format("IKRPG.Chat.Target.Empty")}</p>`;

            const content = `
        <div class="chat-spell-roll">
            <h3>Casting -> ${item.name}</h3>
            ${targetInfo}
            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                <button type="button" class="attack-roll" data-item-id="${item.id}">🎯 Attack</button>
                <button type="button" class="damage-roll" data-item-id="${item.id}">💥 Damage</button>
            </div>
        </div>
    `;

            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({actor: actor}),
                content: content
            });
        }
    }

    if (actor.type === "character" && actor.system.fatigue.enabled) {
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor: actor}),
            content: `<strong>${actor.name}</strong> used <strong>${item.name}</strong> and accumulated <strong>${item.system.cost}</strong> point(s) of Fatigue`
        });
        increaseFatigue(actor, item.system.cost)
    }
    if (actor.type === "character" && actor.system.focus.enabled) {
        if (checkFocus(actor, item.system.cost)){
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({actor: actor}),
                content: `<strong>${actor.name}</strong> used <strong>${item.name}</strong> and spent <strong>${item.system.cost}</strong> Focus points.`
            });
        }
        useFocus(actor, item.system.cost)
    }
}

// Damage grid operations
const DEFAULT_HEIGHT = 1;
const DEFAULT_CELL = {type: " Blank", destroyed: false};
const REQUIRED_COLUMNS = 6;

function ensureColumnsArray(damageGrid) {
    if (!Array.isArray(damageGrid.columns)) {
        damageGrid.columns = [];
    }
}

/**
 * Ensures number of column is REQUIRED_COLUMNS
 *
 * @param {object} column - cells: { type: string, destroyed: boolean }[]
 */
function ensureColumnCount(columns) {
    if (columns.length < REQUIRED_COLUMNS) {
        const faltam = REQUIRED_COLUMNS - columns.length;
        for (let i = 0; i < faltam; i++) {
            columns.push({height: DEFAULT_HEIGHT, cells: [{...DEFAULT_CELL}]});
        }
    } else if (columns.length > REQUIRED_COLUMNS) {
        columns.length = REQUIRED_COLUMNS;
    }
}

/**
 * Ensures column height exists.
 * If missing or invalid, assumed DEFAULT_HEIGHT
 *
 * @param {object} column - cells: { type: string, destroyed: boolean }[]
 */
function ensureHeight(column) {
    if (typeof column.height !== 'number') {
        column.height = DEFAULT_HEIGHT;
    } else {
        column.height = Math.max(0, Math.floor(column.height));
    }
}

function ensureCellsArray(column) {
    if (!Array.isArray(column.cells)) {
        column.cells = [];
    }
}

function fillCells(column) {
    const {height, cells} = column;
    const faltam = height - cells.length;
    for (let i = 0; i < faltam; i++) {
        cells.push({...DEFAULT_CELL});
    }
}

/**
 * If height is less than the current cells, exceeding cells are removed
 * @param column cells: { type: string, destroyed: boolean }[]
 */
function truncateCells(column) {
    if (column.cells.length > column.height) {
        column.cells.length = column.height;
    }
}

/**
 * Applies normalization to received column:
 * - Ensures valid height
 * - Ensures cell array
 * - Fills or truncate cells according to height
 *
 * @param {object} column - cells: { type: string, destroyed: boolean }[]
 * @returns {object} the same column after transformation
 */
function normalizeColumn(column) {
    ensureHeight(column);
    ensureCellsArray(column);
    fillCells(column);
    truncateCells(column);
    return column;
}

/**
 * Guarantees that damage grid follows these rules:
 * 1. Ensures grid size format
 * 2. For each column, updates height
 *
 * @param {object} damageGrid - {{ columns: { cells: { type: string, destroyed: boolean }[] }[] }}
 * @returns {object} the modified in place damageGrid object
 */
export function updateDamageGrid(damageGrid) {
    ensureColumnsArray(damageGrid);
    ensureColumnCount(damageGrid.columns);
    damageGrid.columns.forEach(normalizeColumn);
    return damageGrid;
}

/**
 * Floors and clamps the incoming damage value to a non-negative integer.
 *
 * @param {number} damageValue - The raw damage amount.
 * @returns {number} A non-negative integer representing the damage to apply.
 */
function normalizeDamageValue(damageValue) {
    const val = Math.floor(damageValue);
    return val > 0 ? val : 0;
}

/**
 * Safely retrieves the `columns` array from the grid, defaulting to an empty array.
 *
 * @param {{ columns?: any[] }} damageGrid - The grid object.
 * @returns {any[]} The columns array (never null/undefined).
 */
function getColumns(damageGrid) {
    return Array.isArray(damageGrid.columns) ? damageGrid.columns : [];
}

/**
 * Determines a valid starting index for damage distribution.
 *
 * @param {number} totalCols - Total number of columns in the grid.
 * @param {number} [startColumn] - Optional user-specified start index.
 * @returns {number} An index in [0, totalCols-1].
 */
function determineStartIndex(totalCols, startColumn) {
    if (
        typeof startColumn === "number" &&
        Number.isInteger(startColumn) &&
        startColumn >= 0 &&
        startColumn < totalCols
    ) {
        return startColumn;
    }
    return Math.floor(Math.random() * totalCols);
}

/**
 * Applies as much damage as possible to one column, marking cells destroyed in order.
 *
 * @param {{ cells: { destroyed: boolean }[] }} column - A single damage column.
 * @param {number} remaining - Damage points remaining to apply.
 * @returns {number} Updated remaining damage after this column.
 */
function applyDamageToColumn(column, remaining) {
    for (const cell of column.cells) {
        if (remaining <= 0) break;
        if (!cell.destroyed) {
            cell.destroyed = true;
            remaining--;
        }
    }
    return remaining;
}

/**
 * Distributes damage in a circular sweep over all columns,
 * stopping when either damage is exhausted or a full cycle completes.
 *
 * @param {Array<{ cells: { destroyed: boolean }[] }>} columns - The grid's columns.
 * @param {number} remaining - Initial damage points to distribute.
 * @param {number} startIdx - Index at which to begin distribution.
 */
function distributeDamageCircular(columns, remaining, startIdx) {
    let idx = startIdx;
    do {
        remaining = applyDamageToColumn(columns[idx], remaining);
        idx = (idx + 1) % columns.length;
    } while (idx !== startIdx && remaining > 0);
}

/**
 * Applies damage to the grid by marking cells as destroyed.
 *
 * @param {{ columns: Array<{ cells: { destroyed: boolean }[] }> }} damageGrid
 *   The damage grid to modify in-place.
 * @param {number} damageValue
 *   Total damage points to apply.
 * @param {number} [startColumn]
 *   Optional column index at which to begin applying damage. Uses random number if not given.
 * @returns {{ columns: Array }} The updated damageGrid.
 */
export function applyDamageToGrid(damageGrid, damageValue, startColumn) {
    const columns = getColumns(damageGrid);
    const remainingDamage = normalizeDamageValue(damageValue);
    if (columns.length === 0 || remainingDamage === 0) {
        return damageGrid;
    }
    const startIdx = determineStartIndex(columns.length, startColumn);
    distributeDamageCircular(columns, remainingDamage, startIdx);
    return damageGrid;
}

/**
 * Checks whether every cell in every column is destroyed.
 *
 * @param {{ columns?: Array<{ cells?: { destroyed: boolean }[] }> }} damageGrid
 *   The grid to inspect.
 * @returns {boolean} True if all existing cells are marked destroyed, false otherwise.
 */
export function isAllDestroyed(damageGrid) {
    return Array.isArray(damageGrid.columns) &&
        damageGrid.columns.every(column => {
            const cells = Array.isArray(column.cells) ? column.cells : [];
            return cells.every(cell => cell.destroyed === true);
        });
}

/**
 * @param {{ columns?: { cells?: { destroyed: boolean }[] }[] }} damageGrid
 * @returns {boolean}
 */
export function updateIsGridDestroyed(damageGrid) {
    updateDamageGrid(damageGrid);
    return isAllDestroyed(damageGrid);
}

/**
 * @param {{ columns: { cells: { type: string, destroyed: boolean }[] }[] }} damageGrid
 * @param {string} targetType
 * @returns {boolean}
 */
export function areAllCellsOfTypeDestroyed(damageGrid, targetType) {
    const lower = targetType.toLowerCase();

    //Builds a sub grid to reuse isAllDestroyed method
    let totalMatched = 0;
    const filteredGrid = {
        columns: damageGrid.columns.map(column => {
            const matched = column.cells.filter(cell => cell.type.toLowerCase() === lower);
            totalMatched += matched.length;
            return {cells: matched};
        })
    };

    if (totalMatched === 0) {
        return false;
    }

    return isAllDestroyed(filteredGrid);
}

/**
 * Prompt the user for a bonus and return the full roll formula.
 * @param {string} defaultModifiers – e.g. "2+3"
 * @returns {Promise<string>} A formula like "2d6+2+3" or "3d6kh2+2+3"
 */
export function promptBonus(defaultModifiers) {
    return new Promise(resolve => {
        new Dialog({
            title: "Additional Bonus",
            content: `
        <div>
          <label>Bonus
            <input
              type="text"
              id="mod-input"
              value=""
              placeholder="0"
              style="width:100%;"
            />
          </label>
        </div>
      `,
            buttons: {
                roll: {
                    icon: "<i class='fas fa-dice'></i>",
                    label: "Roll",
                    callback: html => {
                        // Read input or fallback to defaultModifiers
                        const bonus = html.find("#mod-input").val().trim() || 0;
                        resolve(`2d6+${defaultModifiers}+${bonus}`);
                    }
                },
                boost: {
                    icon: "<i class='fas fa-bolt'></i>",
                    label: "Boost!",
                    callback: html => {
                        const bonus = html.find("#mod-input").val().trim() || 0;
                        resolve(`3d6kh2+${defaultModifiers}+${bonus}`);
                    }
                }
            },
            default: "roll",
            close: () => {
                // If dialog is closed, use normal roll + defaultModifiers
                resolve(`2d6+${defaultModifiers}`);
            }
        }).render(true);
    });
}
