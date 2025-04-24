# IKRPG for Foundry VTT

**IKRPG** (Iron Kingdoms Roleplaying Game) is a custom system for Foundry Virtual Tabletop, built to support the mechanics and flavor of the Iron Kingdoms universe. 
This project was designed from the ground up to faithfully implement character sheets, dice rolls, and derived stats according to the IKRPG rules.

---

## 🎯 Purpose

This system aims to provide a structured and automated character sheet for use in campaigns set in the Iron Kingdoms setting, with a focus on:

- Clean, functional, and modular character sheets
- Automatic dice rolls using 2d6 + modifiers
- Attribute-driven derived values (like HP, DEF, ARM)
- Fully customizable skill system with fixed skill names and editable attributes/levels
- Support for future expansion (items, spells, mechanika, monsters)

---

## 🧰 Features

- **Main and Secondary Attributes**: STR, AGI, PHY, INT, PER, ARC, PRW, POI, SPD
- **Derived Attributes**: WILL, DEF, ARM, HP
- **Rollable Labels**: Click on any attribute name to roll 2d6 + that attribute
- **Skills Table**:
  - Fixed list of IKRPG-relevant skills
  - Attribute and level are editable
  - Rollable per skill using 2d6 + attr + level
  - Social skills use “--” as attribute (treated as +0)
- **Formulas defined in `prepareData()`**:
  - Derived attributes and HP max are automatically updated from base stats
- **Visual Layout**:
  - Centralized character name
  - General information in two top rows
  - Side-by-side columns for main, secondary, and derived attributes
  - Compact, accessible skills table with proper column spacing


---

## 🛠 Planned Features (not yet implemented)

- Mechanika and Spell integration
- Item and inventory system
- Condition effects
- NPC/monster sheet
- Localization and translation support

---

## 📜 Licensing

This system is a **fan-made adaptation** of the Iron Kingdoms RPG for use with Foundry VTT. All IP related to Iron Kingdoms is owned by Privateer Press. This project does not claim any rights to the setting or official mechanics.

---

## 💡 Contributions & Feedback

This project is a work in progress. If you'd like to contribute code, help test, or provide feedback, feel free to fork or contact the author.
