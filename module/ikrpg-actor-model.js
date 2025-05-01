export class IKRPGActorModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      mainAttributes: new foundry.data.fields.SchemaField({
        PHY: new foundry.data.fields.NumberField({ initial: 0 }),
        AGL: new foundry.data.fields.NumberField({ initial: 0 }),
        INT: new foundry.data.fields.NumberField({ initial: 0 })
      }),
      secondaryAttributes: new foundry.data.fields.SchemaField({
        STR: new foundry.data.fields.NumberField({ initial: 0 }),
        SPD: new foundry.data.fields.NumberField({ initial: 0 }),
        PRW: new foundry.data.fields.NumberField({ initial: 0 }),
        POI: new foundry.data.fields.NumberField({ initial: 0 }),
        PER: new foundry.data.fields.NumberField({ initial: 0 }),
        ARC: new foundry.data.fields.NumberField({ initial: 0 })
      }),
      derivedAttributes: new foundry.data.fields.SchemaField({
        WILL: new foundry.data.fields.NumberField({ initial: 0 }),
        DEF: new foundry.data.fields.NumberField({ initial: 0 }),
        ARM: new foundry.data.fields.NumberField({ initial: 0 }),
        INIT: new foundry.data.fields.NumberField({ initial: 0 })
      }),
      skills: new foundry.data.fields.ArrayField(
        new foundry.data.fields.SchemaField({
          name: new foundry.data.fields.StringField({ initial: "" }),
          attr: new foundry.data.fields.StringField({ initial: "STR" }),
          level: new foundry.data.fields.NumberField({ initial: 0 })
        }),
        { initial: [] } // <- ESSENCIAL!!!
      )
    };
  }
}
