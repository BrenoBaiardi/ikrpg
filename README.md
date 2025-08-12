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
  <img src="./assets/character-actor-sheet.png" alt="char-sheet-a" />
  </p>

1. Character information.
2. Will Weaver toggle for magic casters.
3. Focuser toggle for warcasters.
4. Tabs for adding and managing weapons, equipment and spells.
   1. Items may be used directly from sheet by clicking 🎲.
   2. Item information will be thrown in chat by clicking 🔎.
   3. Add items by clickint corresponding ➕ icon.
5. Character atributes and derived values tab.
6. Skills tab - military and ocupational.

### Inventory & Combat
- **Dynamic Inventory:** melee weapons, ranged weapons, armor, equipment tabs
- Weapon entries allow customizable tags (e.g., "fire", "magical", "slashing")
- **Weapon Rolls:** tag-driven rolls and attack/damage buttons in chat
- **Armor Integration:** equipped armor modifies DEF, ARM, and MOVE

  <p align="center">
  
  <img src="./assets/combat-example.png" alt="token-appearance" />
  </p>  

### 🎛️ Token HUD Integration (experimental)
- Token Items and spells appear on top of the screen on a HUD.
- Elements on the HUD are grouped by category.
- Elements can be used by the HUD instead of opening character sheet.

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
- Automations for Fatigue (Will-Weavers) and Focus (Focusers) management

### 🛡 Optional Fatigue & Focus
- **Toggleable** per character: enable “Fatigue” and/or “Focus” in the header
- Numeric **value** and **max** fields appear only if enabled
- Automatic regeneration at start of character’s turn in combat.
  - Subtracts ARC from current Fatigue (never below 0)
  - Adds ARC To current Focus, and set to 0 at turn end.
- **Fatigue Roll** when spending beyond ARC:
  - As soon as you exceed ARC, rolls **2d6** vs your current Fatigue points
  - On failure: actor is marked **Exhausted**.
  - Exhausted state integrates with Foundry’s status effects (token overlay + ActiveEffect)

### ⚙️ Other Improvements
- **Deletion Confirmation:** dialogs before deleting any item
- **Scoped CSS:** styles limited to `form.ikrpg.sheet.actor` and `form.ikrpg.sheet.item`
- **Unit Tests with Jest:** coverage for core logic (attacks, spells, damage, fatigue regen)

---

## 🌐 Localization

- **Supported languages:** pt-BR and en
- Open to addition of new json files for new languages. (not planned)
- Lots of strings still pending to be translated. Expect a few portuguese lines/words.

---

## 🛠 Planned Features

- Status and condition tracking
- Steamjack damage grid. 
- Advanced ability/spell effects (area, duration, conditions)
- No plans for official compendium creation (legal/maintenance constraints)

---

## 📜 Licensing 
<img src="./assets/ik-logo.png" alt="char-sheet-a" width="250"/>

This system is a **fan-made adaptation** of the Iron Kingdoms RPG for use with Foundry VTT.  
All intellectual property related to Iron Kingdoms is owned by its respective owners.  
This project is not affiliated with or endorsed by _Privateer Press_ or _Steamforged Games_ and claims no ownership over
their material.

### *No IP content included*
This module does **not** include any copyrighted material from the Iron Kingdoms RPG.  
To use all features of this system, **users must supply their own content** from the official books they legally own.

- No Character classes, archetypes, races and career options.
- No Spells, abilities, and item data (weapons, armor, equipment)
- No Creature stats, bestiary entries, and lore descriptions
- Does not include any artwork, tokens or map assets
- The frameworks to allow the management of those items will be present, but blank for filling.

This project provides only the rules engine, character-sheet layouts and automation tools.  
No proprietary text, images or compendium entries are distributed with the module.
---

## 💡 Contributions & Feedback

This project is a work in progress. If you'd like to contribute code, help test, or provide feedback, feel free to fork
or contact the author.

---