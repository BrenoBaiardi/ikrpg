# IKRPG for Foundry VTT

**IKRPG** (Iron Kingdoms Roleplaying Game) is a custom system for Foundry Virtual Tabletop, built to support the mechanics and flavor of the Iron Kingdoms universe.  
This project was designed from the ground up to faithfully implement character sheets, dice rolls, inventory, and derived stats according to the IKRPG rules.

---

## 🎯 Purpose

This system aims to provide a structured and automated character sheet for use in campaigns set in the Iron Kingdoms setting, with a focus on:

- Clean, functional, and modular character sheets
- Automatic dice rolls using 2d6 + modifiers
- Attribute-driven derived values (like HP, DEF, ARM)
- Fully customizable skill system with fixed skill names and editable attributes/levels
- Categorized inventory management with dynamic weapon rolls

---

## 🧰 Features

- **Main and Secondary Attributes**: STR, AGI, PHY, INT, PER, ARC, PRW, POI, SPD
- **Derived Attributes**: INIT, WILL, DEF, ARM, HP
- **Rollable Attributes**: Click on any attribute name to roll 2d6 + that attribute
- **Occupational & Military Skills**:
  - Predefined skill names
  - Editable attribute and level
  - Automatic skill rolls: 2d6 + attribute + level
  - Social skills use `--` to allow neutral (0) attribute association
- **Dynamic Inventory System**:
  - Separate item types: melee weapons, ranged weapons, armor, and equipment
  - Dedicated inventory tabs for weapons and general equipment
  - Weapons can include any customizable tags (e.g., "fire", "magical", "cutting") without needing predefined types
  - Roll attacks directly from weapon entries using associated skill rolls
- **Armor Integration**:
  - Armor equipped automatically adds its bonuses and penalties
  - Equipped/un-equipped state managed directly inside item sheets
- **HP Management**:
  - Integrated buttons to easily increase or decrease HP
- **Initiative**:
  - Integrated in foundry VTT combat tracker 
  - Uses the derived INIT attribute with 2d6 + INIT formula
- **Layout**: (Doing my best... I m not a design person)
  - Top section with HP controls and general info
  - Tabbed interface for attributes, skills, and inventory management

---

## 🛠 Planned Features

- Ability and Spell management integration
- Status and condition tracking (maybe...)
- Localization (planned: pt-BR and en-US, expandable to more languages)
- No official compendium creation (due to legal and maintenance concerns)

---

## 📜 Licensing

This system is a **fan-made adaptation** of the Iron Kingdoms RPG for use with Foundry VTT.  
All intellectual property related to Iron Kingdoms is owned by its respective owners.  
This project is not affiliated with or endorsed by _Privateer Press_ or _Steamforged Games_ and claims no ownership over their material.

---

## 💡 Contributions & Feedback

This project is a work in progress. If you'd like to contribute code, help test, or provide feedback, feel free to fork or contact the author.
