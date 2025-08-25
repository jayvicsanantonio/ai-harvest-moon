const fs = require('fs');

// Complete list of all assets used by the game
const assets = [
  // Player sprites - all directions and walk animations
  'assets/sprites/player/idle_down.png',
  'assets/sprites/player/idle_up.png',
  'assets/sprites/player/idle_left.png',
  'assets/sprites/player/idle_right.png',
  'assets/sprites/player/walk_down_1.png',
  'assets/sprites/player/walk_down_2.png',
  'assets/sprites/player/walk_down_3.png',
  'assets/sprites/player/walk_up_1.png',
  'assets/sprites/player/walk_up_2.png',
  'assets/sprites/player/walk_up_3.png',
  'assets/sprites/player/walk_left_1.png',
  'assets/sprites/player/walk_left_2.png',
  'assets/sprites/player/walk_left_3.png',
  'assets/sprites/player/walk_right_1.png',
  'assets/sprites/player/walk_right_2.png',
  'assets/sprites/player/walk_right_3.png',
  
  // Environment
  'assets/sprites/environment/grass.png',
  'assets/sprites/environment/dirt.png',
  'assets/sprites/environment/farmland.png',
  'assets/sprites/environment/water.png',
  'assets/sprites/environment/stone.png',
  
  // Objects and buildings
  'assets/sprites/objects/tree.png',
  'assets/sprites/objects/rock.png',
  'assets/sprites/objects/fence.png',
  'assets/sprites/buildings/house.png',
  'assets/sprites/buildings/barn.png',
  
  // Crops
  'assets/sprites/crops/stage_1.png',
  'assets/sprites/crops/stage_2.png',
  'assets/sprites/crops/stage_3.png',
  'assets/sprites/crops/stage_4.png',
  
  // Tools
  'assets/sprites/tools/hoe.png',
  'assets/sprites/tools/watering_can.png',
  'assets/sprites/tools/axe.png',
  'assets/sprites/tools/pickaxe.png',
  
  // UI elements
  'assets/sprites/ui/panel.png',
  'assets/sprites/ui/button.png',
  'assets/sprites/ui/inventory_slot.png',
  'assets/sprites/ui/health_bar.png',
  'assets/sprites/ui/stamina_bar.png',
  
  // Icons
  'assets/sprites/icons/seed.png',
  'assets/sprites/icons/crop.png',
  'assets/sprites/icons/tool.png'
];

console.log('Creating placeholder asset files to prevent 404 errors...');

// Create minimal PNG files to prevent 404s - the game will use fallback graphics
assets.forEach(assetPath => {
  const dir = assetPath.substring(0, assetPath.lastIndexOf('/'));
  fs.mkdirSync(dir, { recursive: true });
  
  // Create a minimal 1x1 pixel PNG file header to prevent format errors
  const minimalPNG = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk size
    0x49, 0x48, 0x44, 0x52, // IHDR chunk type
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth, color type, compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT chunk size
    0x49, 0x44, 0x41, 0x54, // IDAT chunk type
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0xFF, 0xFF, // Minimal compressed data
    0x00, 0x00, 0x00, 0x02, // 
    0x00, 0x01, // Pixel data (transparent)
    0x00, 0x00, 0x00, 0x00, // IEND chunk size
    0x49, 0x45, 0x4E, 0x44, // IEND chunk type
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  fs.writeFileSync(assetPath, minimalPNG);
  console.log(`Created PNG placeholder: ${assetPath}`);
});

// Create empty audio files
const audioFiles = [
  'assets/audio/music/farm_theme.ogg',
  'assets/audio/music/village_theme.ogg',
  'assets/audio/sfx/footstep.wav',
  'assets/audio/sfx/tool_use.wav',
  'assets/audio/sfx/plant.wav',
  'assets/audio/sfx/harvest.wav',
  'assets/audio/sfx/water.wav',
  'assets/audio/sfx/menu_select.wav',
  'assets/audio/sfx/menu_confirm.wav'
];

audioFiles.forEach(audioPath => {
  const dir = audioPath.substring(0, audioPath.lastIndexOf('/'));
  fs.mkdirSync(dir, { recursive: true });
  
  // Create minimal valid WAV file (silent 1 second audio)
  const minimalWAV = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // "RIFF"
    0x24, 0x00, 0x00, 0x00, // File size - 8
    0x57, 0x41, 0x56, 0x45, // "WAVE"
    0x66, 0x6D, 0x74, 0x20, // "fmt "
    0x10, 0x00, 0x00, 0x00, // Subchunk1 size
    0x01, 0x00,             // Audio format (PCM)
    0x01, 0x00,             // Num channels (mono)
    0x44, 0xAC, 0x00, 0x00, // Sample rate (44100 Hz)
    0x88, 0x58, 0x01, 0x00, // Byte rate
    0x02, 0x00,             // Block align
    0x10, 0x00,             // Bits per sample
    0x64, 0x61, 0x74, 0x61, // "data"
    0x00, 0x00, 0x00, 0x00  // Data size (0 = silent)
  ]);
  
  fs.writeFileSync(audioPath, minimalWAV);
  console.log(`Created audio placeholder: ${audioPath}`);
});

// Create empty data files
const dataFiles = [
  'assets/data/crops.json',
  'assets/data/tools.json',
  'assets/data/npcs.json',
  'assets/data/seasons.json',
  'assets/data/recipes.json'
];

dataFiles.forEach(dataPath => {
  const dir = dataPath.substring(0, dataPath.lastIndexOf('/'));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dataPath, '{}'); // Empty JSON object
  console.log(`Created data placeholder: ${dataPath}`);
});

console.log('\n✅ Placeholder assets created successfully!');
console.log('The game will now load without 404 errors and use its built-in fallback graphics.');
console.log('Run npm run dev to start the game.');
return;

// Generate actual placeholder images
assets.forEach(asset => {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = asset.color;
  ctx.fillRect(0, 0, 32, 32);
  
  // Add border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 30, 30);
  
  // Add text
  ctx.fillStyle = '#000000';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(asset.text, 16, 16);
  
  // Ensure directory exists
  const dir = asset.path.substring(0, asset.path.lastIndexOf('/'));
  fs.mkdirSync(dir, { recursive: true });
  
  // Save image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(asset.path, buffer);
  
  console.log(`Generated: ${asset.path}`);
});

console.log('\nPlaceholder assets generated successfully!');
console.log('Run npm run dev to start the game with visual placeholders.');