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

// chat-helpers.js

export async function handleDamageRoll(ev, message) {
    ev.preventDefault();

    const itemId = ev.currentTarget.dataset.itemId;
    const actor = ChatMessage.getSpeakerActor(message.speaker);

    if (!actor) {
        ui.notifications.warn("Ator não encontrado.");
        return;
    }

    const item = actor.items.get(itemId);
    if (!item) {
        ui.notifications.warn("Item não encontrado.");
        return;
    }

    let damageRoll = new Roll("2d6")
    if (item.type === "meleeWeapon") {
        damageRoll = new Roll("2d6 + @pow + @str", {
            pow: item.system.pow || 0,
            str: actor.system.secondaryAttributes?.STR || 0
        });
    } else {
        damageRoll = new Roll("2d6 + @pow", {
            pow: item.system.pow || 0,
        });
    }


    await damageRoll.evaluate({ async: true });

    await damageRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: `<h3>Dano de ${item.name}</h3>`
    });

    const targets = Array.from(game.user.targets);
    const buttons = targets.map(t => `
        <button type="button" class="apply-damage" data-target-id="${t.id}" data-damage="${damageRoll.total}">
            Aplicar ${damageRoll.total} em ${t.name}
        </button>`).join("<br>");

    ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `
            <h3>Aplicar Dano (${item.name})</h3>
            ${buttons}
        `
    });
}
