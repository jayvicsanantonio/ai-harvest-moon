// Comprehensive sprite generation script for Harvest Moon game
// Creates actual visual sprites with proper game art styling

const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// Ensure canvas is available
try {
  require('canvas');
} catch (e) {
  console.error('Canvas module not found. Install with: npm install canvas');
  process.exit(1);
}

// Color palettes for consistent game styling
const COLORS = {
  // Character colors
  skin: '#FFDBAC',
  hair: '#8B4513',
  shirt: '#4169E1',
  pants: '#654321',
  shoes: '#2F4F4F',
  
  // Environment colors
  grass: '#90EE90',
  grassDark: '#228B22',
  dirt: '#8B4513',
  dirtDark: '#654321',
  farmland: '#A0522D',
  water: '#4682B4',
  waterDeep: '#1E90FF',
  stone: '#696969',
  stoneDark: '#2F4F4F',
  
  // Crop colors
  seedling: '#98FB98',
  young: '#90EE90',
  mature: '#228B22',
  ready: '#FFD700',
  
  // Tool colors
  wood: '#8B4513',
  woodDark: '#654321',
  metal: '#C0C0C0',
  metalDark: '#808080',
  
  // UI colors
  panelBG: '#F5F5DC',
  panelBorder: '#8B4513',
  button: '#DEB887',
  buttonHover: '#D2B48C',
  
  // General colors
  black: '#000000',
  white: '#FFFFFF',
  red: '#FF0000',
  green: '#00FF00',
  blue: '#0000FF',
  yellow: '#FFFF00',
  orange: '#FFA500',
  purple: '#800080'
};

// Sprite definitions with drawing functions
const SPRITES = {
  // Player character sprites
  player: {
    // Idle poses
    'idle_down': (ctx) => drawPlayer(ctx, 'down', 'idle'),
    'idle_up': (ctx) => drawPlayer(ctx, 'up', 'idle'),
    'idle_left': (ctx) => drawPlayer(ctx, 'left', 'idle'),
    'idle_right': (ctx) => drawPlayer(ctx, 'right', 'idle'),
    
    // Walking animations
    'walk_down_1': (ctx) => drawPlayer(ctx, 'down', 'walk1'),
    'walk_down_2': (ctx) => drawPlayer(ctx, 'down', 'walk2'),
    'walk_down_3': (ctx) => drawPlayer(ctx, 'down', 'walk3'),
    'walk_up_1': (ctx) => drawPlayer(ctx, 'up', 'walk1'),
    'walk_up_2': (ctx) => drawPlayer(ctx, 'up', 'walk2'),
    'walk_up_3': (ctx) => drawPlayer(ctx, 'up', 'walk3'),
    'walk_left_1': (ctx) => drawPlayer(ctx, 'left', 'walk1'),
    'walk_left_2': (ctx) => drawPlayer(ctx, 'left', 'walk2'),
    'walk_left_3': (ctx) => drawPlayer(ctx, 'left', 'walk3'),
    'walk_right_1': (ctx) => drawPlayer(ctx, 'right', 'walk1'),
    'walk_right_2': (ctx) => drawPlayer(ctx, 'right', 'walk2'),
    'walk_right_3': (ctx) => drawPlayer(ctx, 'right', 'walk3')
  },
  
  // Environment tiles
  environment: {
    'grass': (ctx) => drawGrass(ctx),
    'dirt': (ctx) => drawDirt(ctx),
    'farmland': (ctx) => drawFarmland(ctx),
    'water': (ctx) => drawWater(ctx),
    'stone': (ctx) => drawStone(ctx)
  },
  
  // Objects
  objects: {
    'tree': (ctx) => drawTree(ctx),
    'rock': (ctx) => drawRock(ctx, 'normal'),
    'fence': (ctx) => drawFence(ctx)
  },
  
  // Buildings
  buildings: {
    'house': (ctx) => drawBuilding(ctx, 'house'),
    'barn': (ctx) => drawBuilding(ctx, 'barn')
  },
  
  // Crops (growth stages)
  crops: {
    'stage_1': (ctx) => drawCrop(ctx, 1),
    'stage_2': (ctx) => drawCrop(ctx, 2),
    'stage_3': (ctx) => drawCrop(ctx, 3),
    'stage_4': (ctx) => drawCrop(ctx, 4),
    
    // Specific crop types referenced in code
    'parsnip_seedling': (ctx) => drawSpecificCrop(ctx, 'parsnip', 'seedling'),
    'parsnip_young': (ctx) => drawSpecificCrop(ctx, 'parsnip', 'young'),
    'parsnip_mature': (ctx) => drawSpecificCrop(ctx, 'parsnip', 'mature'),
    'parsnip_ready': (ctx) => drawSpecificCrop(ctx, 'parsnip', 'ready'),
    
    'turnip_seedling': (ctx) => drawSpecificCrop(ctx, 'turnip', 'seedling'),
    'turnip_young': (ctx) => drawSpecificCrop(ctx, 'turnip', 'young'),
    'turnip_mature': (ctx) => drawSpecificCrop(ctx, 'turnip', 'mature'),
    'turnip_ready': (ctx) => drawSpecificCrop(ctx, 'turnip', 'ready'),
    
    'potato_seedling': (ctx) => drawSpecificCrop(ctx, 'potato', 'seedling'),
    'potato_young': (ctx) => drawSpecificCrop(ctx, 'potato', 'young'),
    'potato_mature': (ctx) => drawSpecificCrop(ctx, 'potato', 'mature'),
    'potato_ready': (ctx) => drawSpecificCrop(ctx, 'potato', 'ready')
  },
  
  // Tools
  tools: {
    'hoe': (ctx) => drawTool(ctx, 'hoe'),
    'watering_can': (ctx) => drawTool(ctx, 'watering_can'),
    'axe': (ctx) => drawTool(ctx, 'axe'),
    'pickaxe': (ctx) => drawTool(ctx, 'pickaxe'),
    'fishing_rod': (ctx) => drawTool(ctx, 'fishing_rod')
  },
  
  // UI elements
  ui: {
    'panel': (ctx) => drawUIPanel(ctx),
    'button': (ctx) => drawUIButton(ctx),
    'inventory_slot': (ctx) => drawInventorySlot(ctx),
    'health_bar': (ctx) => drawHealthBar(ctx),
    'stamina_bar': (ctx) => drawStaminaBar(ctx)
  },
  
  // Icons
  icons: {
    'seed': (ctx) => drawIcon(ctx, 'seed'),
    'crop': (ctx) => drawIcon(ctx, 'crop'),
    'tool': (ctx) => drawIcon(ctx, 'tool'),
    'fish': (ctx) => drawIcon(ctx, 'fish'),
    'mineral': (ctx) => drawIcon(ctx, 'mineral')
  },
  
  // Fish (referenced in Fish.js)
  fish: {
    'fish_bass': (ctx) => drawFish(ctx, 'bass'),
    'fish_trout': (ctx) => drawFish(ctx, 'trout'),
    'fish_salmon': (ctx) => drawFish(ctx, 'salmon'),
    'fish_carp': (ctx) => drawFish(ctx, 'carp')
  },
  
  // Rock damage states (referenced in Rock.js)
  rocks: {
    'rock_small': (ctx) => drawRock(ctx, 'small'),
    'rock_medium': (ctx) => drawRock(ctx, 'medium'),
    'rock_large': (ctx) => drawRock(ctx, 'large'),
    'rock_small_crack1': (ctx) => drawRock(ctx, 'small', 1),
    'rock_small_crack2': (ctx) => drawRock(ctx, 'small', 2),
    'rock_medium_crack1': (ctx) => drawRock(ctx, 'medium', 1),
    'rock_medium_crack2': (ctx) => drawRock(ctx, 'medium', 2),
    'rock_large_crack1': (ctx) => drawRock(ctx, 'large', 1),
    'rock_large_crack2': (ctx) => drawRock(ctx, 'large', 2)
  },
  
  // NPCs (referenced in NPC.js)
  npcs: {
    'npc_default': (ctx) => drawNPC(ctx, 'default'),
    'npc_merchant': (ctx) => drawNPC(ctx, 'merchant'),
    'npc_villager_1': (ctx) => drawNPC(ctx, 'villager_1'),
    'npc_villager_2': (ctx) => drawNPC(ctx, 'villager_2')
  }
};

// Drawing helper functions

function drawPlayer(ctx, direction, pose) {
  ctx.fillStyle = COLORS.skin;
  
  if (direction === 'down') {
    // Head
    ctx.fillRect(12, 6, 8, 8);
    // Body
    ctx.fillStyle = COLORS.shirt;
    ctx.fillRect(10, 14, 12, 10);
    // Legs
    ctx.fillStyle = COLORS.pants;
    ctx.fillRect(11, 24, 4, 6);
    ctx.fillRect(17, 24, 4, 6);
    // Feet position varies by pose
    ctx.fillStyle = COLORS.shoes;
    if (pose === 'walk1') {
      ctx.fillRect(10, 30, 5, 2);
      ctx.fillRect(17, 30, 5, 2);
    } else if (pose === 'walk2') {
      ctx.fillRect(11, 30, 5, 2);
      ctx.fillRect(16, 30, 5, 2);
    } else if (pose === 'walk3') {
      ctx.fillRect(12, 30, 5, 2);
      ctx.fillRect(15, 30, 5, 2);
    } else {
      ctx.fillRect(11, 30, 5, 2);
      ctx.fillRect(16, 30, 5, 2);
    }
    // Hair
    ctx.fillStyle = COLORS.hair;
    ctx.fillRect(12, 6, 8, 4);
  } else if (direction === 'up') {
    // Similar pattern for back view
    ctx.fillStyle = COLORS.hair;
    ctx.fillRect(12, 6, 8, 6);
    ctx.fillStyle = COLORS.shirt;
    ctx.fillRect(10, 14, 12, 10);
    ctx.fillStyle = COLORS.pants;
    ctx.fillRect(11, 24, 4, 6);
    ctx.fillRect(17, 24, 4, 6);
    ctx.fillStyle = COLORS.shoes;
    ctx.fillRect(11, 30, 5, 2);
    ctx.fillRect(16, 30, 5, 2);
  } else if (direction === 'left') {
    // Profile view
    ctx.fillStyle = COLORS.skin;
    ctx.fillRect(14, 6, 6, 8);
    ctx.fillStyle = COLORS.shirt;
    ctx.fillRect(12, 14, 10, 10);
    ctx.fillStyle = COLORS.pants;
    ctx.fillRect(13, 24, 6, 6);
    ctx.fillStyle = COLORS.shoes;
    ctx.fillRect(10, 30, 6, 2);
    ctx.fillStyle = COLORS.hair;
    ctx.fillRect(14, 6, 6, 4);
  } else { // right
    ctx.fillStyle = COLORS.skin;
    ctx.fillRect(12, 6, 6, 8);
    ctx.fillStyle = COLORS.shirt;
    ctx.fillRect(10, 14, 10, 10);
    ctx.fillStyle = COLORS.pants;
    ctx.fillRect(13, 24, 6, 6);
    ctx.fillStyle = COLORS.shoes;
    ctx.fillRect(16, 30, 6, 2);
    ctx.fillStyle = COLORS.hair;
    ctx.fillRect(12, 6, 6, 4);
  }
}

function drawGrass(ctx) {
  // Base grass color
  ctx.fillStyle = COLORS.grass;
  ctx.fillRect(0, 0, 32, 32);
  
  // Add texture with darker spots
  ctx.fillStyle = COLORS.grassDark;
  for (let i = 0; i < 20; i++) {
    const x = Math.floor(Math.random() * 30) + 1;
    const y = Math.floor(Math.random() * 30) + 1;
    ctx.fillRect(x, y, 2, 1);
  }
  
  // Add some grass blades
  ctx.strokeStyle = COLORS.grassDark;
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const x = Math.floor(Math.random() * 28) + 2;
    const y = Math.floor(Math.random() * 28) + 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 3);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

function drawDirt(ctx) {
  ctx.fillStyle = COLORS.dirt;
  ctx.fillRect(0, 0, 32, 32);
  
  // Add texture spots
  ctx.fillStyle = COLORS.dirtDark;
  for (let i = 0; i < 15; i++) {
    const x = Math.floor(Math.random() * 30) + 1;
    const y = Math.floor(Math.random() * 30) + 1;
    ctx.fillRect(x, y, Math.random() > 0.5 ? 2 : 1, 1);
  }
}

function drawFarmland(ctx) {
  ctx.fillStyle = COLORS.farmland;
  ctx.fillRect(0, 0, 32, 32);
  
  // Add tilled lines
  ctx.strokeStyle = COLORS.dirtDark;
  ctx.lineWidth = 1;
  for (let y = 4; y < 32; y += 4) {
    ctx.beginPath();
    ctx.moveTo(2, y);
    ctx.lineTo(30, y);
    ctx.stroke();
  }
}

function drawWater(ctx) {
  ctx.fillStyle = COLORS.water;
  ctx.fillRect(0, 0, 32, 32);
  
  // Add wave pattern
  ctx.fillStyle = COLORS.waterDeep;
  for (let y = 0; y < 32; y += 8) {
    for (let x = 0; x < 32; x += 16) {
      ctx.fillRect(x + (y % 16), y, 8, 2);
    }
  }
}

function drawStone(ctx) {
  ctx.fillStyle = COLORS.stone;
  ctx.fillRect(0, 0, 32, 32);
  
  // Add stone texture
  ctx.fillStyle = COLORS.stoneDark;
  const stones = [[6, 8, 4, 3], [12, 15, 5, 4], [20, 6, 6, 5], [8, 22, 7, 4], [18, 24, 5, 3]];
  stones.forEach(([x, y, w, h]) => {
    ctx.fillRect(x, y, w, h);
  });
}

function drawTree(ctx) {
  // Tree trunk
  ctx.fillStyle = COLORS.wood;
  ctx.fillRect(13, 20, 6, 12);
  
  // Tree canopy
  ctx.fillStyle = COLORS.grassDark;
  ctx.fillRect(6, 6, 20, 18);
  
  // Lighter green highlights
  ctx.fillStyle = COLORS.grass;
  ctx.fillRect(8, 8, 6, 6);
  ctx.fillRect(18, 10, 6, 6);
  ctx.fillRect(10, 16, 8, 4);
}

function drawRock(ctx, size = 'normal', crackLevel = 0) {
  ctx.fillStyle = COLORS.stone;
  
  if (size === 'small') {
    ctx.fillRect(10, 14, 12, 10);
  } else if (size === 'large') {
    ctx.fillRect(4, 8, 24, 20);
  } else {
    ctx.fillRect(8, 12, 16, 12);
  }
  
  // Add cracks if damaged
  if (crackLevel > 0) {
    ctx.strokeStyle = COLORS.black;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (crackLevel >= 1) {
      ctx.moveTo(12, 8);
      ctx.lineTo(18, 24);
    }
    if (crackLevel >= 2) {
      ctx.moveTo(8, 16);
      ctx.lineTo(24, 16);
    }
    ctx.stroke();
  }
}

function drawFence(ctx) {
  ctx.fillStyle = COLORS.wood;
  // Fence posts
  ctx.fillRect(4, 8, 3, 20);
  ctx.fillRect(14, 8, 3, 20);
  ctx.fillRect(25, 8, 3, 20);
  
  // Fence rails
  ctx.fillRect(2, 12, 28, 2);
  ctx.fillRect(2, 20, 28, 2);
}

function drawBuilding(ctx, type) {
  if (type === 'house') {
    // House base
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(4, 12, 24, 16);
    
    // Roof
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(2, 12);
    ctx.lineTo(16, 4);
    ctx.lineTo(30, 12);
    ctx.fill();
    
    // Door
    ctx.fillStyle = COLORS.woodDark;
    ctx.fillRect(14, 20, 4, 8);
    
    // Windows
    ctx.fillStyle = COLORS.blue;
    ctx.fillRect(8, 16, 3, 3);
    ctx.fillRect(21, 16, 3, 3);
  } else if (type === 'barn') {
    // Barn base
    ctx.fillStyle = '#CD5C5C';
    ctx.fillRect(2, 8, 28, 20);
    
    // Roof
    ctx.fillStyle = COLORS.woodDark;
    ctx.fillRect(0, 6, 32, 4);
    
    // Door
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(12, 18, 8, 10);
  }
}

function drawCrop(ctx, stage) {
  ctx.fillStyle = COLORS.dirt;
  ctx.fillRect(0, 28, 32, 4); // Soil line
  
  if (stage === 1) {
    // Just sprouted
    ctx.fillStyle = COLORS.seedling;
    ctx.fillRect(15, 26, 2, 2);
  } else if (stage === 2) {
    // Small plant
    ctx.fillStyle = COLORS.young;
    ctx.fillRect(14, 22, 4, 6);
  } else if (stage === 3) {
    // Growing
    ctx.fillStyle = COLORS.mature;
    ctx.fillRect(12, 18, 8, 10);
  } else if (stage === 4) {
    // Ready to harvest
    ctx.fillStyle = COLORS.mature;
    ctx.fillRect(10, 14, 12, 14);
    // Add harvest indicator
    ctx.fillStyle = COLORS.ready;
    ctx.fillRect(14, 16, 4, 4);
  }
}

function drawSpecificCrop(ctx, cropType, stage) {
  const colors = {
    parsnip: { base: '#FFFACD', harvest: '#F0E68C' },
    turnip: { base: '#DDA0DD', harvest: '#DA70D6' },
    potato: { base: '#F4A460', harvest: '#D2691E' }
  };
  
  const crop = colors[cropType] || colors.parsnip;
  
  drawCrop(ctx, ['seedling', 'young', 'mature', 'ready'].indexOf(stage) + 1);
  
  // Override harvest color for specific crops
  if (stage === 'ready') {
    ctx.fillStyle = crop.harvest;
    ctx.fillRect(14, 16, 4, 4);
  }
}

function drawTool(ctx, toolType) {
  if (toolType === 'hoe') {
    // Handle
    ctx.fillStyle = COLORS.wood;
    ctx.fillRect(14, 8, 2, 20);
    // Blade
    ctx.fillStyle = COLORS.metal;
    ctx.fillRect(10, 6, 8, 4);
  } else if (toolType === 'watering_can') {
    // Body
    ctx.fillStyle = COLORS.metal;
    ctx.fillRect(10, 12, 8, 8);
    // Spout
    ctx.fillRect(18, 14, 6, 2);
    // Handle
    ctx.fillStyle = COLORS.metalDark;
    ctx.fillRect(8, 16, 4, 2);
  } else if (toolType === 'axe') {
    // Handle
    ctx.fillStyle = COLORS.wood;
    ctx.fillRect(14, 8, 2, 20);
    // Blade
    ctx.fillStyle = COLORS.metal;
    ctx.fillRect(8, 8, 12, 6);
  } else if (toolType === 'pickaxe') {
    // Handle
    ctx.fillStyle = COLORS.wood;
    ctx.fillRect(14, 8, 2, 20);
    // Pick head
    ctx.fillStyle = COLORS.metal;
    ctx.fillRect(6, 10, 16, 3);
  } else if (toolType === 'fishing_rod') {
    // Rod
    ctx.strokeStyle = COLORS.wood;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, 28);
    ctx.lineTo(16, 4);
    ctx.stroke();
    // Line
    ctx.strokeStyle = COLORS.black;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, 4);
    ctx.lineTo(24, 2);
    ctx.stroke();
  }
}

function drawUIPanel(ctx) {
  ctx.fillStyle = COLORS.panelBG;
  ctx.fillRect(0, 0, 32, 32);
  
  // Border
  ctx.strokeStyle = COLORS.panelBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 30, 30);
}

function drawUIButton(ctx) {
  ctx.fillStyle = COLORS.button;
  ctx.fillRect(2, 2, 28, 28);
  
  // Border
  ctx.strokeStyle = COLORS.panelBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, 28, 28);
  
  // Highlight
  ctx.fillStyle = COLORS.white;
  ctx.fillRect(4, 4, 24, 2);
  ctx.fillRect(4, 4, 2, 24);
}

function drawInventorySlot(ctx) {
  ctx.fillStyle = COLORS.panelBG;
  ctx.fillRect(0, 0, 32, 32);
  
  // Inset border
  ctx.strokeStyle = COLORS.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(2, 2, 28, 28);
  
  // Inner shadow
  ctx.fillStyle = COLORS.panelBorder;
  ctx.fillRect(3, 3, 26, 1);
  ctx.fillRect(3, 3, 1, 26);
}

function drawHealthBar(ctx) {
  // Background
  ctx.fillStyle = COLORS.black;
  ctx.fillRect(0, 0, 32, 8);
  
  // Health (assume 75% health)
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(2, 2, 24, 4);
  
  // Border
  ctx.strokeStyle = COLORS.white;
  ctx.lineWidth = 1;
  ctx.strokeRect(1, 1, 30, 6);
}

function drawStaminaBar(ctx) {
  // Background
  ctx.fillStyle = COLORS.black;
  ctx.fillRect(0, 0, 32, 8);
  
  // Stamina (assume 60% stamina)
  ctx.fillStyle = COLORS.yellow;
  ctx.fillRect(2, 2, 19, 4);
  
  // Border
  ctx.strokeStyle = COLORS.white;
  ctx.lineWidth = 1;
  ctx.strokeRect(1, 1, 30, 6);
}

function drawIcon(ctx, iconType) {
  if (iconType === 'seed') {
    ctx.fillStyle = COLORS.seedling;
    ctx.fillRect(14, 12, 4, 6);
    ctx.fillRect(15, 10, 2, 2);
  } else if (iconType === 'crop') {
    drawCrop(ctx, 4);
  } else if (iconType === 'tool') {
    drawTool(ctx, 'hoe');
  } else if (iconType === 'fish') {
    drawFish(ctx, 'generic');
  } else if (iconType === 'mineral') {
    drawRock(ctx, 'small');
  }
}

function drawFish(ctx, fishType) {
  const colors = {
    bass: '#228B22',
    trout: '#FF6347',
    salmon: '#FA8072',
    carp: '#DAA520',
    generic: '#4682B4'
  };
  
  const color = colors[fishType] || colors.generic;
  
  // Fish body
  ctx.fillStyle = color;
  ctx.fillRect(8, 14, 16, 6);
  
  // Fish head
  ctx.fillRect(6, 15, 4, 4);
  
  // Tail
  ctx.fillRect(22, 12, 4, 2);
  ctx.fillRect(22, 18, 4, 2);
  
  // Fin
  ctx.fillRect(12, 12, 6, 2);
  
  // Eye
  ctx.fillStyle = COLORS.white;
  ctx.fillRect(7, 16, 1, 1);
}

function drawNPC(ctx, npcType) {
  if (npcType === 'merchant') {
    // Merchant with hat
    ctx.fillStyle = COLORS.skin;
    ctx.fillRect(12, 8, 8, 6);
    // Hat
    ctx.fillStyle = COLORS.woodDark;
    ctx.fillRect(10, 6, 12, 4);
    // Body (apron)
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(10, 14, 12, 12);
    // Pants
    ctx.fillStyle = COLORS.pants;
    ctx.fillRect(12, 26, 8, 4);
    // Shoes
    ctx.fillStyle = COLORS.shoes;
    ctx.fillRect(11, 30, 5, 2);
    ctx.fillRect(16, 30, 5, 2);
  } else {
    // Generic villager
    drawPlayer(ctx, 'down', 'idle');
    // Different shirt color
    ctx.fillStyle = COLORS.green;
    ctx.fillRect(10, 14, 12, 10);
  }
}

// Generate all sprites
function generateAllSprites() {
  console.log('🎨 Generating comprehensive sprite set...\n');
  
  let totalSprites = 0;
  
  Object.entries(SPRITES).forEach(([category, sprites]) => {
    console.log(`📁 Generating ${category} sprites...`);
    
    Object.entries(sprites).forEach(([spriteName, drawFunction]) => {
      const canvas = createCanvas(32, 32);
      const ctx = canvas.getContext('2d');
      
      // Clear canvas
      ctx.fillStyle = 'transparent';
      ctx.clearRect(0, 0, 32, 32);
      
      // Draw sprite
      drawFunction(ctx);
      
      // Determine output path
      let outputPath;
      if (category === 'player') {
        outputPath = `assets/sprites/player/${spriteName}.png`;
      } else if (category === 'environment') {
        outputPath = `assets/sprites/environment/${spriteName}.png`;
      } else if (category === 'objects') {
        outputPath = `assets/sprites/objects/${spriteName}.png`;
      } else if (category === 'buildings') {
        outputPath = `assets/sprites/buildings/${spriteName}.png`;
      } else if (category === 'crops') {
        outputPath = `assets/sprites/crops/${spriteName}.png`;
      } else if (category === 'tools') {
        outputPath = `assets/sprites/tools/${spriteName}.png`;
      } else if (category === 'ui') {
        outputPath = `assets/sprites/ui/${spriteName}.png`;
      } else if (category === 'icons') {
        outputPath = `assets/sprites/icons/${spriteName}.png`;
      } else if (category === 'fish') {
        outputPath = `assets/sprites/fish/${spriteName}.png`;
      } else if (category === 'rocks') {
        outputPath = `assets/sprites/rocks/${spriteName}.png`;
      } else if (category === 'npcs') {
        outputPath = `assets/sprites/npcs/${spriteName}.png`;
      }
      
      // Ensure directory exists
      const dir = path.dirname(outputPath);
      fs.mkdirSync(dir, { recursive: true });
      
      // Save sprite
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);
      
      console.log(`  ✅ ${spriteName}.png`);
      totalSprites++;
    });
    
    console.log('');
  });
  
  // Generate tile sprites referenced in TileMap.js
  console.log('📁 Generating tile sprites...');
  
  const tileSprites = {
    'tile_0': (ctx) => { ctx.fillStyle = 'transparent'; }, // Empty
    'tile_1': (ctx) => drawGrass(ctx),
    'tile_2': (ctx) => drawDirt(ctx),
    'tile_3': (ctx) => drawFarmland(ctx),
    'tile_4': (ctx) => drawWater(ctx),
    'tile_5': (ctx) => drawStone(ctx)
  };
  
  Object.entries(tileSprites).forEach(([tileName, drawFunction]) => {
    const canvas = createCanvas(32, 32);
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, 32, 32);
    drawFunction(ctx);
    
    const outputPath = `assets/sprites/tiles/${tileName}.png`;
    const dir = path.dirname(outputPath);
    fs.mkdirSync(dir, { recursive: true });
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`  ✅ ${tileName}.png`);
    totalSprites++;
  });
  
  console.log(`\n🎉 Successfully generated ${totalSprites} sprites!`);
  console.log('🎮 Your Harvest Moon game now has complete visual assets!');
  console.log('💡 Run npm run dev to see your game with proper graphics.');
}

// Run the generator
if (require.main === module) {
  generateAllSprites();
}

module.exports = { generateAllSprites, SPRITES, COLORS };