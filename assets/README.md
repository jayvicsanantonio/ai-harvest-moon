# Assets Directory

This directory contains all game assets. Currently, the game uses fallback colored rectangles when sprite files are missing.

## Directory Structure

- **sprites/** - Image assets
  - **player/** - Player character sprites
  - **environment/** - Tiles and terrain
  - **objects/** - Trees, rocks, buildings
  - **crops/** - Crop growth stages
  - **tools/** - Farming tools
  - **ui/** - User interface elements
  - **icons/** - Small icons and symbols

- **audio/** - Sound assets
  - **music/** - Background music tracks
  - **sfx/** - Sound effects

- **data/** - Game configuration files
  - **crops.json** - Crop definitions
  - **tools.json** - Tool configurations
  - **npcs.json** - NPC data
  - **seasons.json** - Seasonal configurations
  - **recipes.json** - Cooking recipes

## Asset Requirements

All sprite files should be 32x32 pixels for consistency with the game's tile system.
Audio files should be in OGG or WAV format for broad browser compatibility.

## Fallback System

When assets are missing, the game automatically generates:
- Magenta rectangles with "?" for missing sprites
- Silent audio tracks for missing sounds
- Default configurations for missing data files

This ensures the game remains playable even without complete assets.