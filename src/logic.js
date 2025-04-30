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

    const {AGI, PHY, INT} = data.mainAttributes;
    const {PRW, SPD, PER} = data.secondaryAttributes;
    return {
        MOVE: data.movement.current,
        INIT: [PRW, SPD, PER].reduce((sum, val) => sum + val, 0),
        DEF: [AGI, PER, SPD, armorBonuses.defPenalty].reduce((sum, val) => sum + val, 0),
        ARM: [PHY, armorBonuses.armorBonus].reduce((sum, val) => sum + val, 0),
        WILL: [PHY, INT].reduce((sum, val) => sum + val, 0)
    };
}