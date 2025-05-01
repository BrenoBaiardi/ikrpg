// this file is supposed to be testable because it will not have any
// foundry dependency that would fail to compile in jest

export function calculateDamage(hp, arm, damageAmount) {
    const damageTaken = Math.max(0, damageAmount - arm);
    const newHP = Math.max(0, hp - damageTaken);
    return {damageTaken, newHP};
}

export function calculateDerivedAttributes(data, armorBonuses) {
    console.log("data", data);
    console.log("armorBonuses", armorBonuses);
    const currentMove = Math.max(0, data.secondaryAttributes.SPD + armorBonuses.speedPenalty);
    console.log("current move", currentMove);
    data.movement = {
        base: data.secondaryAttributes.SPD,
        bonus: 0,
        penalty: armorBonuses.speedPenalty,
        current: currentMove
    };
    console.log("current data movement", data.movement);

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