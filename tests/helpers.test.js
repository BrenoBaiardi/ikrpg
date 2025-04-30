
test('Sistema configura iniciativa corretamente', () => {
    expect(CONFIG.Combat.initiative.formula).toBe("2d6 + @init");
});

test('prepareData calcula atributos derivados corretamente', () => {
    const actor = new IKRPGActor({
        type: "character",
        system: {
            mainAttributes: { AGI: 2, PHY: 3, INT: 4 },
            secondaryAttributes: { PRW: 1, SPD: 2, PER: 1 },
            modifiers: {
                DEF: [],
                WILL: [],
                INIT: [],
                ARM: []
            },
            movement: {},
            derivedAttributes: {},
            hp: {}
        },
        items: []
    });

    actor.prepareData();

    expect(actor.system.hp.max).toBe(9); // PHY + INT + AGI
    expect(actor.system.movement.current).toBe(2); // SPD + no armor penalty
});
