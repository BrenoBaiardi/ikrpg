import {calculateDamage, calculateDerivedAttributes, getSnappedRotation} from "../src/logic.js";

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

describe("getSnappedRotation", () => {

    test("snaps correctly on square grid (type 1)", () => {
        expect(getSnappedRotation(22, 1)).toBe(0);
        expect(getSnappedRotation(23, 1)).toBe(45);
        expect(getSnappedRotation(89, 1)).toBe(90);
        expect(getSnappedRotation(134, 1)).toBe(135);
    });

    test("snaps correctly on vertical hex grid (type 3)", () => {
        expect(getSnappedRotation(10, 3)).toBe(0);
        expect(getSnappedRotation(31, 3)).toBe(60);
        expect(getSnappedRotation(89, 3)).toBe(90); // rounded to 90 (snaps every 60°)
        expect(getSnappedRotation(179, 3)).toBe(180);
    });

    test("snaps correctly on horizontal hex grid (type 2) with 30° offset", () => {
        expect(getSnappedRotation(30, 2)).toBe(30);
        expect(getSnappedRotation(59, 2)).toBe(60);
        expect(getSnappedRotation(74, 2)).toBe(90);
        expect(getSnappedRotation(119, 2)).toBe(120);
        expect(getSnappedRotation(359, 2)).toBe(0); // wraps around
    });

    test("handles negative rotation", () => {
        expect(getSnappedRotation(-45, 1)).toBe(315);
        expect(getSnappedRotation(-90, 2)).toBe(90); // offset considered
    });

    test("handles rotation > 360", () => {
        expect(getSnappedRotation(370, 1)).toBe(0);
        expect(getSnappedRotation(765, 3)).toBe(60);
    });
});
