export class IKRPGActorDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      attributes: new foundry.data.fields.SchemaField({
        STR: new foundry.data.fields.NumberField({ initial: 0 }),
        SPD: new foundry.data.fields.NumberField({ initial: 0 }),
        PHY: new foundry.data.fields.NumberField({ initial: 0 }),
        AGI: new foundry.data.fields.NumberField({ initial: 0 }),
        PRW: new foundry.data.fields.NumberField({ initial: 0 }),
        POI: new foundry.data.fields.NumberField({ initial: 0 }),
        INT: new foundry.data.fields.NumberField({ initial: 0 }),
        PER: new foundry.data.fields.NumberField({ initial: 0 }),
        ARC: new foundry.data.fields.NumberField({ initial: 0 })
      }),
      occupationalSkills: new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
        name: new foundry.data.fields.StringField({ initial: "" }),
        attr: new foundry.data.fields.StringField({ initial: "STR" }),
        level: new foundry.data.fields.NumberField({ initial: 0 })
      })),
      will: new foundry.data.fields.NumberField({ initial: 0 })
    };
  }
}
