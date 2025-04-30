import { calculateDamage, calculateDerivedAttribute } from "../src/ikrpg.js";

describe("calculateDamage", () => {
    it("should return base damage plus bonus", () => {
        expect(calculateDamage(5, 3)).toBe(8);
        expect(calculateDamage(10, 0)).toBe(10);
        expect(calculateDamage(0, -2)).toBe(-2);
    });
});

describe("calculateDerivedAttribute", () => {
    it("should return average of two attributes, rounded down", () => {
        expect(calculateDerivedAttribute(4, 6)).toBe(5);
        expect(calculateDerivedAttribute(3, 3)).toBe(3);
        expect(calculateDerivedAttribute(1, 2)).toBe(1);
    });
});
