# IKRPG for Foundry VTT

### ***This is a WORK IN PROGRESS***

**IKRPG** (Iron Kingdoms Roleplaying Game) is a custom system for Foundry Virtual Tabletop, built to support the
mechanics and flavor of the Iron Kingdoms universe.  
This project was designed from the ground up to faithfully implement character sheets, dice rolls, inventory, and
derived stats according to the IKRPG rules.

---

## 🎯 Purpose

This system aims to provide a structured and automated experience for campaigns set in the Iron Kingdoms setting, with a focus on:

- Clean, functional, and modular character sheets
- Automatic dice rolls using 2d6 + modifiers
- Attribute-driven derived values (like HP, DEF, ARM)
- Fully customizable skill system with fixed skill names and editable attributes/levels
- Categorized inventory management with dynamic weapon rolls
- Support for actor types: Character, NPC, Steamjack

---

## 🧰 Features

### Character Sheets
- **Main & Secondary Attributes:** STR, AGL, PHY, INT, PER, ARC, PRW, POI, SPD
- **Derived Attributes:** INIT, WILL, DEF, ARM, HP (auto-calculated for characters)
- **Rollable Attributes:** click on any attribute name to roll 2d6 + that attribute
- **Occupational & Military Skills:**
  - Predefined skill list
  - Automatic skill rolls: 2d6 + attribute + level
  - Social skills allow neutral attribute association (using `--`)

  <p align="center">
  <img src="./assets/char-sheet-a.png" alt="char-sheet-a" width="45%" />
  <img src="./assets/char-sheet-b.png" alt="char-sheet-b" width="45%" />
  </p>

### Inventory & Combat
- **Dynamic Inventory:** melee weapons, ranged weapons, armor, equipment tabs
- Weapon entries allow customizable tags (e.g., "fire", "magical", "slashing")
- **Weapon Rolls:** tag-driven rolls and attack/damage buttons in chat
- **Armor Integration:** equipped armor modifies DEF, ARM, and MOVE

  <p align="center">
  <img src="./assets/attack-roll-chat.png" alt="attack-roll" width="20%" />
  <img src="./assets/token-appearance.png" alt="token-appearance" width="20%" />
  </p>  




### Steamjack Support
- Dedicated actor type and sheet
- Fields: chassis, fuel, cortex, imprint, damage grid, etc.
- Chassis selector (Light/Heavy) changes token size in real time
- Tokens display front/rear directional arrows
- Automated token size according to jack chassis type (light/heavy)

### 🪄 Spell Management
- Full support for `spell` items with fields: **COST**, **RNG**, **POW**, **UPKEEP**, **OFFENSIVE**, **AoE**, **description**
- 🎲 Spell-roll button rolls `2d6 + POW` in chat, tagged with spell name
- “New Spell” button to create and manage spell items
- Isolated spell-sheet template for editing spells

### 🛡 Optional Fatigue & Focus
- Toggle **Use Fatigue** and **Use Focus** per character
- Numeric **value** and **max** fields appear only if enabled
- Automatic regeneration at start of character’s turn in combat via `Hooks.on("updateCombat")`
- Chat notification styled as a recovery alert

### ⚙️ Other Improvements
- **Deletion Confirmation:** dialogs before deleting any item
- **Scoped CSS:** styles limited to `form.ikrpg.sheet.actor` and `form.ikrpg.sheet.item`
- **Unit Tests with Jest:** coverage for core logic (attacks, spells, damage, fatigue regen)

---

## 🌐 Localization

- **Supported languages:** pt-BR and en
- Open to addition of new json files for new languages. (not planned)

---

## 🛠 Planned Features

- Status and condition tracking
- Steamjack damage grid. 
- Advanced ability/spell effects (area, duration, conditions)
- No official compendium creation (legal/maintenance constraints)

---

## 📜 Licensing

This system is a **fan-made adaptation** of the Iron Kingdoms RPG for use with Foundry VTT.  
All intellectual property related to Iron Kingdoms is owned by its respective owners.  
This project is not affiliated with or endorsed by _Privateer Press_ or _Steamforged Games_ and claims no ownership over
their material.

---

## 💡 Contributions & Feedback

This project is a work in progress. If you'd like to contribute code, help test, or provide feedback, feel free to fork
or contact the author.
---