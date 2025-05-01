import {calculateDamage, calculateDerivedAttributes, getSnappedRotation, findMilitarySkill, buildHitResult, getAttackValues} from "../src/logic.js";

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


describe("findMilitarySkill", () => {
    let mockWarn;

    beforeEach(() => {
        // Mock do sistema de notificações do Foundry
        mockWarn = jest.fn();
        global.ui = {
            notifications: {
                warn: mockWarn
            }
        };
    });

    it("returns correct skill when found", () => {
        const actor = {
            system: {
                militarySkills: {
                    skill1: {name: "Hand Weapon", attr: "PRW", level: 2},
                    skill2: {name: "Pistol", attr: "POI", level: 1}
                }
            }
        };

        const item = {
            system: {
                skill: "Pistol"
            }
        };

        const result = findMilitarySkill(item, actor);
        expect(result).toEqual({name: "Pistol", attr: "POI", level: 1});
        expect(mockWarn).not.toHaveBeenCalled();
    });

    it("should return default and emit a warning when not finding a skill", () => {
        const actor = {
            system: {
                militarySkills: {
                    skill1: {name: "Hand Weapon", attr: "PRW", level: 2}
                }
            }
        };

        const item = {
            system: {
                skill: "Gunsmithing"
            }
        };

        const result = findMilitarySkill(item, actor);
        expect(result).toEqual({name: "undefined", attr: "--", level: 0});
        expect(mockWarn).toHaveBeenCalledWith('Perícia militar não encontrada -> "Gunsmithing".');
    });

});

describe("buildHitResult", () => {
    it("should display ✅ Hit! When roll is above DEF", () => {
        const targets = [
            {
                name: "Goblin",
                actor: {
                    system: {
                        derivedAttributes: {
                            DEF: 10
                        }
                    }
                }
            }
        ];

        const roll = { total: 12 };

        const result = buildHitResult(targets, roll);
        expect(result).toContain('✅ Hit!');
        expect(result).toContain('Contra Goblin: DEF 10');
    });

    it("should display ✅ Hit! When roll is equal DEF", () => {
        const targets = [
            {
                name: "Goblin",
                actor: {
                    system: {
                        derivedAttributes: {
                            DEF: 12
                        }
                    }
                }
            }
        ];

        const roll = { total: 12 };

        const result = buildHitResult(targets, roll);
        expect(result).toContain('✅ Hit!');
        expect(result).toContain('Contra Goblin: DEF 12');
    });
    it("should display ❌ Miss! When roll is bellow DEF", () => {
        const targets = [
            {
                name: "Troll",
                actor: {
                    system: {
                        derivedAttributes: {
                            DEF: 15
                        }
                    }
                }
            }
        ];

        const roll = { total: 13 };

        const result = buildHitResult(targets, roll);
        expect(result).toContain('❌ Miss!');
        expect(result).toContain('Contra Troll: DEF 15');
    });

    it("should assume DEF 0 if actor has no derivedAttributes", () => {
        const targets = [
            {
                name: "Espantalho",
                actor: {
                    system: {
                        // sem derivedAttributes
                    }
                }
            }
        ];

        const roll = { total: 5 };

        const result = buildHitResult(targets, roll);
        expect(result).toContain('✅ Hit!');
        expect(result).toContain('DEF 0');
    });

    it("should build multiple lines for multiple targets", () => {
        const targets = [
            {
                name: "Orc",
                actor: {
                    system: {
                        derivedAttributes: { DEF: 12 }
                    }
                }
            },
            {
                name: "Elfo",
                actor: {
                    system: {
                        derivedAttributes: { DEF: 14 }
                    }
                }
            }
        ];

        const roll = { total: 13 };

        const result = buildHitResult(targets, roll);
        expect(result.split("<br>").length).toBe(2);
        expect(result).toContain("Contra Orc: DEF 12");
        expect(result).toContain("Contra Elfo: DEF 14");
    });
});


// Simula o objeto global ui
global.ui = {
    notifications: {
        warn: jest.fn()
    }
};

console.warn = jest.fn();

afterEach(() => {
    jest.clearAllMocks();
});

describe("getAttackValues", () => {
    describe("Steamjack", () => {

        const steamjackActor = {
            type: "steamjack",
            system: { derivedAttributes: { RAT: 5, MAT:4 } }
        };

        test("should use MAT for meleeWeapon", () => {
            const item = { type: "meleeWeapon" };
            const result = getAttackValues(steamjackActor, item);
            expect(result).toEqual({ attr: steamjackActor.system.derivedAttributes.MAT, skill: 0 });
        });

        test("should use RAT for rangedWeapon", () => {
            const item = { type: "rangedWeapon" };
            const result = getAttackValues(steamjackActor, item);
            expect(result).toEqual({ attr: steamjackActor.system.derivedAttributes.RAT, skill: 0 });
        });

        test("should return null and war about wrong weapon types", () => {
            const item = { type: "tool" };
            const result = getAttackValues(steamjackActor, item);
            expect(result).toBeNull();
            expect(global.ui.notifications.warn).toHaveBeenCalledWith(expect.stringContaining("Erro: atributo para rolagem não encontrado (esperado MAT ou RAT)."));
        });
    });

    describe("Character", () => {
        const sampleActor = {
            type: "character",
            system: {
                militarySkills: {
                    skill1: { name: "Great Weapon", attr: "PRW", level: 1 },
                    skill2: { name: "Hand Weapon", attr: "PRW", level: 2 },
                    skill3: { name: "Pistol", attr: "PRW", level: 2 },
                    skill4: { name: "mainattr", attr: "PHY", level: 99 }
                },
                mainAttributes: {PHY: 88},
                secondaryAttributes: {POI: 4, PRW: 3}
            }
        };

        test("usa mainAttributes se a perícia aponta para um atributo principal", () => {
            const item = { system: { skill: "mainattr" } };

            const result = getAttackValues(sampleActor, item);
            expect(result).toEqual({ attr: sampleActor.system.mainAttributes.PHY, skill: 99 });
        });

        test("usa secondaryAttributes se atributo não está em mainAttributes", () => {
            const actor = {
                type: "character",
                system: {
                    militarySkills: {
                        skill1: { name: "Táticas", attr: "INT", level: 2 }
                    },
                    mainAttributes: {},
                    secondaryAttributes: { INT: 4 }
                }
            };
            const item = { system: { skill: "Táticas" } };

            const result = getAttackValues(actor, item);
            expect(result).toEqual({ attr: 4, skill: 2 });
        });

        test("retorna skill 'undefined' se perícia não for encontrada", () => {

            const item = { system: { skill: "Inexistente" } };

            const result = getAttackValues(sampleActor, item);
            expect(result).toEqual({ attr: "", skill: 0 });
            expect(global.ui.notifications.warn).toHaveBeenCalledWith(expect.stringContaining("Perícia militar não encontrada"));
        });
    });

    describe("Tipo inválido", () => {
        test("retorna null e emite warning para tipo de ator desconhecido", () => {
            const actor = {
                type: "npc",
                system: {}
            };
            const item = {};

            const result = getAttackValues(actor, item);
            expect(result).toBeNull();
            expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("No character type configured"));
        });
    });
});
