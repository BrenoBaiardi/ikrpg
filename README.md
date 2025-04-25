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
- Inventory with categorized equipment and integrated skill-based rolls

---

## 🧰 Features

- **Main and Secondary Attributes**: STR, AGI, PHY, INT, PER, ARC, PRW, POI, SPD
- **Derived Attributes**: INIT, WILL, DEF, ARM, HP
- **Rollable Attributes**: Click on any attribute name to roll 2d6 + that attribute
- **Occupational & Military Skills**:
  - Fixed skill names and editable linked attribute and level
  - Automated skill roll: 2d6 + attribute + level
  - Social skills use `--` and count as +0 in order to use any stat manually
- **Dynamic Inventory System**:
  - Melee and ranged weapons, armor, and equipment as separate item types
  - Tabs for weapons and equipment in a dedicated inventory section
  - Roll attacks directly from item tables using weapon-associated skills
- **Token Configuration**:
  - Automatically links HP bar and token name display on actor creation
- **Initiative**:
  - Integrated with Foundry’s combat tracker using derived INIT attribute
- **Layout**: (Doing my best... I m not a design person) 
  - Top section with HP controls and general info
  - Tabbed interface for attributes, skills, and inventory
  - Skill and inventory sections have fixed height scrollable containers to avoid sheet being too big

---

## 🛠 Planned Features

- Allow creation of Abilities and spells
- Status and condition tracking (maybe...)
- Localization and translation (planning to do pt-br and us-en but hopping to allow additions from anyone easily)
- DO NOT plan to make any compendiums, too much work and dont think it would be legal
---

## 📜 Licensing

This system is a **fan-made adaptation** of the Iron Kingdoms RPG for use with Foundry VTT.  
All intellectual property related to Iron Kingdoms is owned by it owners.  
This project is not affiliated with or endorsed by _Privateer Press_ or _Steamforged Games_ and claims no ownership over their material.

---

## 💡 Contributions & Feedback

This project is a work in progress. If you'd like to contribute code, help test, or provide feedback, feel free to fork or contact the author.
