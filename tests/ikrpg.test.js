import {calculateDamage, calculateDerivedAttributes} from "../src/logic.js";

describe("calculateDamage", () => {
    test("Common damage situation", () => {
        const result = calculateDamage(20, 5, 10);
        expect(result).toEqual({damageTaken: 5, newHP: 15});
    });

    test("Damage less than armor should result in 0 damage", () => {
        const result = calculateDamage(20, 10, 9);
        expect(result).toEqual({damageTaken: 0, newHP: 20});
    });

    test("Damage equal armor should be 0", () => {
        const result = calculateDamage(20, 5, 5);
        expect(result).toEqual({damageTaken: 0, newHP: 20});
    });

    test("HP should not become bellow 0", () => {
        const result = calculateDamage(3, 2, 10);
        expect(result).toEqual({damageTaken: 8, newHP: 0});
    });

    test("0 hp should still be targetable", () => {
        const result = calculateDamage(0, 3, 10);
        expect(result).toEqual({damageTaken: 7, newHP: 0});
    });
});

describe("calculateDerivedAttributes", () => {
    test("should calculate derived attributes correctly", () => {
        const data = {
            mainAttributes: {
                AGI: 4,
                PHY: 5,
                INT: 3
            },
            secondaryAttributes: {
                PRW: 2,
                SPD: 6,
                PER: 3
            },
            movement: {
                current: 6
            }
        };

        const armorBonuses = {
            defPenalty: -1,
            armorBonus: 2,
            speedPenalty: -1,
        };

        const result = calculateDerivedAttributes(data, armorBonuses);

        expect(result).toEqual({
            MOVE: 5,
            INIT: 11,
            DEF: 12,
            ARM: 7,
            WILL: 8
        });
    });
});
