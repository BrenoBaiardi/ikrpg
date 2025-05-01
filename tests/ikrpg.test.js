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
                AGL: 4,
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

    test("snaps correctly on hexagonal odd row (type 2) with 30° offset", () => {
        expect(getSnappedRotation(10, 2)).toBe(30);
        expect(getSnappedRotation(31, 2)).toBe(30);
        expect(getSnappedRotation(45, 2)).toBe(30);
        expect(getSnappedRotation(89, 2)).toBe(90);
        expect(getSnappedRotation(70, 2)).toBe(90);
        expect(getSnappedRotation(179, 2)).toBe(150);
    });

    test("snaps correctly on hexagonal even row (type 3)", () => {
        expect(getSnappedRotation(10, 3)).toBe(30);
        expect(getSnappedRotation(31, 3)).toBe(30);
        expect(getSnappedRotation(45, 3)).toBe(30);
        expect(getSnappedRotation(89, 3)).toBe(90);
        expect(getSnappedRotation(70, 3)).toBe(90);
        expect(getSnappedRotation(179, 3)).toBe(150);
    });

    test("snaps correctly on hexagonal odd column (type 4)", () => {
        expect(getSnappedRotation(10, 4)).toBe(0);
        expect(getSnappedRotation(31, 4)).toBe(60);
        expect(getSnappedRotation(45, 4)).toBe(60);
        expect(getSnappedRotation(89, 4)).toBe(60);
        expect(getSnappedRotation(70, 4)).toBe(60);
        expect(getSnappedRotation(179, 4)).toBe(180);
    });

    test("snaps correctly on hexagonal even column (type 5)", () => {
        expect(getSnappedRotation(10, 5)).toBe(0);
        expect(getSnappedRotation(31, 5)).toBe(60);
        expect(getSnappedRotation(45, 5)).toBe(60);
        expect(getSnappedRotation(89, 5)).toBe(60);
        expect(getSnappedRotation(70, 5)).toBe(60);
        expect(getSnappedRotation(179, 5)).toBe(180);
    });

    test("handles negative rotation", () => {
        expect(getSnappedRotation(-45, 1)).toBe(315);
        expect(getSnappedRotation(-90, 2)).toBe(270); // offset considered
    });

    test("handles rotation > 360", () => {
        expect(getSnappedRotation(370, 4)).toBe(0);
    });
});
