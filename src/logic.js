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
    } else if (item.type === "rangedWeapon"){
        damageRoll = new Roll("2d6 + @pow", {
            pow: item.system.pow || 0,
        });
    } else if  (item.type === "spell") {
        console.log("ITAEM",item);
        damageRoll = new Roll("2d6 + @pow", {
            pow: item.system.pow || 0,
        });
    }


    await damageRoll.evaluate({async: true});

    await damageRoll.toMessage({
        speaker: ChatMessage.getSpeaker({actor}),
        flavor: `<h3>💥 Dano de ${item.name}</h3>`
    });

    const targets = Array.from(game.user.targets);

    if (targets.length > 0) {
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
    }
}

export async function regenerateFatigue(actor) {
    if (!actor.system.fatigue.enabled) return;
    const current = actor.system.fatigue.value;
    const newValue = Math.max(0, current - actor.system.secondaryAttributes.ARC);
    await actor.update({"system.fatigue.value": newValue});

    const content = `
    <div class="ikrpg-chat-fatigue">
      <h4>✨ Will Weavers recover their ARC in fatigue each maintenance ✨</h4>
      <p>
        <strong>${actor.name}</strong> recovered
        <strong>${actor.system.secondaryAttributes.ARC}</strong> fatigue.
      </p>
      <p>
        Fatigue: <s>${current}</s> → <strong>${newValue}</strong>
      </p>
    </div>
  `;

    // Cria a mensagem no chat
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
        skill = {name: "undefined", attr: "--", level: 0}
        ui.notifications.warn(`Perícia militar não encontrada -> "${skillName}".`);
    }
    return skill;
}

async function sendAttackToChat(roll, actor, item) {
    await roll.toMessage({
        speaker: ChatMessage.getSpeaker({actor}),
        flavor: `<h3>🎯 Resultado do ataque de ${item.name}</h3>`
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
        return `<strong ${hitMessage} </strong> Contra ${t.name}: DEF ${targetDef}`;
    }).join("<br>");
}

/**
 * @param {Object} actor
 * @param {Object} item
 * @returns {{attr: (number), skill: number}} Associated attribute level and Skill level
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
        if (isMeleeWeapon) return { attr: derived.MAT ?? 0, skill: 0 };
        if (isRangedWeapon) return { attr: derived.RAT ?? 0, skill: 0 };

        ui.notifications.warn("Erro: atributo para rolagem não encontrado (esperado MAT ou RAT).");
        return null;
    } else if (isCharacter && isWeapon) {
        const skill = findMilitarySkill(item, actor);
        const attrValue = actor.system.mainAttributes?.[skill.attr]
            ?? actor.system.secondaryAttributes?.[skill.attr]
            ?? "";
        return { attr: attrValue, skill: skill.level || 0 };
    } else if (isSpell){
        return { attr: actor.system.secondaryAttributes.ARC, skill: 0 };
    }

    console.warn("No character type configured for -> " + actor.type);
    return null;
}

export async function handleAttackRoll(event, message) {
    event.preventDefault();

    const itemId = event.currentTarget.dataset.itemId;
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

    const attackValues = getAttackValues(actor, item);
    let attrValue = attackValues.attr;
    let skillLevel = attackValues.skill;

    const attackMod = item.system.attackMod || 0;

    const roll = new Roll("2d6 + @attr + @skill + @atk", {
        attr: attrValue,
        skill: skillLevel,
        atk: attackMod
    });

    await roll.evaluate({async: true});
    await sendAttackToChat(roll, actor, item);

    const targets = Array.from(game.user.targets);

    if (targets.length > 0) {
        let results = buildHitResult(targets, roll);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor}),
            content: `
                <h3>Resultado do Ataque (${item.name})</h3>
                ${results}
            `
        });
    }
}
