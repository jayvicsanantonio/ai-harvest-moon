// Farm scene containing the player's farmland and basic gameplay
// Manages farm layout, player movement, and farming interactions

import { Scene } from '../engine/Scene.js';
import { Player } from '../entities/Player.js';
import { TileMap } from '../engine/TileMap.js';
import { HUD } from '../ui/HUD.js';

export class FarmScene extends Scene {
    constructor() {
        super('Farm');
        this.player = null;
        this.tileMap = null;
        this.hud = null;
    }

    // Override Scene's load method for farm-specific initialization
    async load() {
        console.log('Loading Farm scene...');
        
        // Queue farm-specific assets
        this.queueFarmAssets();
        
        // Setup farm layout
        this.setupFarmLayout();
        this.setupAnimations();
        this.createPlayer();
        this.setupCollisions();
        this.initializeFarming();
        this.setupBeds();
        this.spawnTestAnimals();
        this.spawnTestNPCs();
        
        // Add player to entities array
        if (this.player) {
            this.addEntity(this.player);
        }
        
        // Initialize HUD
        this.hud = new HUD(this.engine);
    }
    
    // Queue farm-specific assets
    queueFarmAssets() {
        // Farm tiles and objects
        this.queueAsset('grass_tile', 'sprites/environment/grass.png');
        this.queueAsset('dirt_tile', 'sprites/environment/dirt.png');
        this.queueAsset('farmland_tile', 'sprites/environment/farmland.png');
        this.queueAsset('water_tile', 'sprites/environment/water.png');
        this.queueAsset('stone_tile', 'sprites/environment/stone.png');
        this.queueAsset('tree', 'sprites/objects/tree.png');
        this.queueAsset('rock', 'sprites/objects/rock.png');
        this.queueAsset('fence', 'sprites/objects/fence.png');
        
        // Crop sprites for all growth stages
        const cropTypes = ['turnip', 'potato', 'carrot', 'corn', 'tomato'];
        const growthStages = ['seed', 'sprout', 'young', 'mature', 'ready'];
        
        for (const crop of cropTypes) {
            for (const stage of growthStages) {
                this.queueAsset(`${crop}_${stage}`, `sprites/crops/${crop}_${stage}.png`);
            }
        }
    }

    setupFarmLayout() {
        // Create a 20x15 tile farm with TileMap system
        const mapWidth = 20;
        const mapHeight = 15;
        this.tileMap = new TileMap(mapWidth, mapHeight, 32);
        
        // Define tile properties
        this.tileMap.tileProperties.set(1, { type: 'grass', farmable: true, solid: false });
        this.tileMap.tileProperties.set(2, { type: 'dirt', farmable: true, solid: false });
        this.tileMap.tileProperties.set(3, { type: 'farmland', farmable: true, solid: false });
        this.tileMap.tileProperties.set(4, { type: 'water', farmable: false, solid: true });
        this.tileMap.tileProperties.set(5, { type: 'stone', farmable: false, solid: true });
        this.tileMap.tileProperties.set(10, { type: 'tree', farmable: false, solid: true });
        this.tileMap.tileProperties.set(11, { type: 'rock', farmable: false, solid: true });
        this.tileMap.tileProperties.set(12, { type: 'fence', farmable: false, solid: true });
        
        // Create basic farm layout
        this.generateFarmLayout(mapWidth, mapHeight);
        
        console.log('Farm layout created with TileMap system');
    }
    
    generateFarmLayout(width, height) {
        // Fill background with grass
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                this.tileMap.setTile(x, y, 1, 'background'); // Grass tile
            }
        }
        
        // Add farmable area in the center
        const farmStartX = 3;
        const farmEndX = 16;
        const farmStartY = 6;
        const farmEndY = 11;
        
        for (let y = farmStartY; y <= farmEndY; y++) {
            for (let x = farmStartX; x <= farmEndX; x++) {
                this.tileMap.setTile(x, y, 2, 'objects'); // Dirt tile for farmable area
            }
        }
        
        // Add some decorative objects
        this.addFarmDecorations(width, height);
        
        // Add water feature
        this.addWaterFeature(width, height);
        
        // Create boundary with stones
        this.addBoundaryStones(width, height);
    }
    
    addFarmDecorations(width, height) {
        // Add some trees around the farm
        const treePositions = [
            {x: 1, y: 2}, {x: 4, y: 1}, {x: 17, y: 3},
            {x: 2, y: 13}, {x: 18, y: 12}, {x: 1, y: 8}
        ];
        
        for (const pos of treePositions) {
            if (pos.x < width && pos.y < height) {
                this.tileMap.setTile(pos.x, pos.y, 10, 'objects'); // Tree
            }
        }
        
        // Add some rocks
        const rockPositions = [
            {x: 6, y: 2}, {x: 15, y: 4}, {x: 3, y: 12}
        ];
        
        for (const pos of rockPositions) {
            if (pos.x < width && pos.y < height) {
                this.tileMap.setTile(pos.x, pos.y, 11, 'objects'); // Rock
            }
        }
    }
    
    addWaterFeature(width, height) {
        // Add small pond in corner
        const pondPositions = [
            {x: 17, y: 13}, {x: 18, y: 13}, {x: 19, y: 13},
            {x: 17, y: 14}, {x: 18, y: 14}, {x: 19, y: 14}
        ];
        
        for (const pos of pondPositions) {
            if (pos.x < width && pos.y < height) {
                this.tileMap.setTile(pos.x, pos.y, 4, 'objects'); // Water
            }
        }
    }
    
    addBoundaryStones(width, height) {
        // Add stone boundaries at map edges (selective placement)
        const boundaryPositions = [
            // Top boundary (partial)
            {x: 0, y: 0}, {x: 3, y: 0}, {x: 7, y: 0}, {x: 12, y: 0}, {x: 19, y: 0},
            // Bottom boundary (partial)  
            {x: 0, y: 14}, {x: 5, y: 14}, {x: 10, y: 14}, {x: 15, y: 14},
            // Left boundary (partial)
            {x: 0, y: 3}, {x: 0, y: 7}, {x: 0, y: 11},
            // Right boundary (partial)
            {x: 19, y: 2}, {x: 19, y: 6}, {x: 19, y: 9}
        ];
        
        for (const pos of boundaryPositions) {
            this.tileMap.setTile(pos.x, pos.y, 5, 'objects'); // Stone
        }
    }
    
    setupAnimations() {
        if (!this.engine.animationSystem) return;
        
        // Register enhanced player animations with events and tags
        this.engine.animationSystem.registerAnimation('idle_down', {
            frames: ['player_idle_down'],
            frameTime: 500,
            loop: true,
            tags: ['idle', 'player'],
            priority: 1
        });
        
        this.engine.animationSystem.registerAnimation('idle_up', {
            frames: ['player_idle_up'],
            frameTime: 500,
            loop: true,
            tags: ['idle', 'player'],
            priority: 1
        });
        
        this.engine.animationSystem.registerAnimation('idle_left', {
            frames: ['player_idle_left'],
            frameTime: 500,
            loop: true,
            tags: ['idle', 'player'],
            priority: 1
        });
        
        this.engine.animationSystem.registerAnimation('idle_right', {
            frames: ['player_idle_right'],
            frameTime: 500,
            loop: true,
            tags: ['idle', 'player'],
            priority: 1
        });
        
        // Walking animations with step sound events
        this.engine.animationSystem.registerAnimation('walk_down', {
            frames: ['player_walk_down_1', 'player_walk_down_2', 'player_walk_down_3', 'player_walk_down_2'],
            frameTime: 150,
            loop: true,
            priority: 2,
            tags: ['walk', 'player'],
            events: {
                1: (entityId) => this.playFootstepSound(entityId),
                3: (entityId) => this.playFootstepSound(entityId)
            }
        });
        
        this.engine.animationSystem.registerAnimation('walk_up', {
            frames: ['player_walk_up_1', 'player_walk_up_2', 'player_walk_up_3', 'player_walk_up_2'],
            frameTime: 150,
            loop: true,
            priority: 2,
            tags: ['walk', 'player'],
            events: {
                1: (entityId) => this.playFootstepSound(entityId),
                3: (entityId) => this.playFootstepSound(entityId)
            }
        });
        
        this.engine.animationSystem.registerAnimation('walk_left', {
            frames: ['player_walk_left_1', 'player_walk_left_2', 'player_walk_left_3', 'player_walk_left_2'],
            frameTime: 150,
            loop: true,
            priority: 2,
            tags: ['walk', 'player'],
            events: {
                1: (entityId) => this.playFootstepSound(entityId),
                3: (entityId) => this.playFootstepSound(entityId)
            }
        });
        
        this.engine.animationSystem.registerAnimation('walk_right', {
            frames: ['player_walk_right_1', 'player_walk_right_2', 'player_walk_right_3', 'player_walk_right_2'],
            frameTime: 150,
            loop: true,
            priority: 2,
            tags: ['walk', 'player'],
            events: {
                1: (entityId) => this.playFootstepSound(entityId),
                3: (entityId) => this.playFootstepSound(entityId)
            }
        });
    }
    
    // Sound event handler for footsteps
    playFootstepSound(entityId) {
        // For now just log, but this would trigger audio system
        console.log(`Footstep sound for entity ${entityId}`);
        
        // Future: play actual footstep sound through AssetManager
        // this.engine.assetManager.playAudio('sfx_footstep');
    }

    createPlayer() {
        // Create player at center of farm in world coordinates
        const startX = 10 * 32; // Tile 10 * tile size
        const startY = 8 * 32;  // Tile 8 * tile size
        
        this.player = new Player(startX, startY, this.engine);
        this.player.init(this.engine);
        this.entities.push(this.player);
        
        // Give player some starter animal care items
        this.giveStarterAnimalItems();
    }
    
    // Give player basic animal care items and tools
    giveStarterAnimalItems() {
        if (!this.player || !this.player.inventory) return;
        
        // Add animal feed items
        this.player.inventory.addItem('hay', 10);
        this.player.inventory.addItem('grass', 5);
        this.player.inventory.addItem('seeds', 8);
        this.player.inventory.addItem('grain', 6);
        
        // Add basic fishing rod and pickaxe
        this.player.inventory.addItem('fishing_rod', 1);
        this.player.inventory.addItem('pickaxe', 1);
        
        // Add basic cooking ingredients
        this.player.inventory.addItem('potato', 5);
        this.player.inventory.addItem('herbs', 3);
        this.player.inventory.addItem('flour', 2);
        this.player.inventory.addItem('milk', 1);
        this.player.inventory.addItem('egg', 2);
        
        // Add upgrade materials
        this.player.inventory.addItem('copper_ore', 8);
        this.player.inventory.addItem('iron_ore', 5);
        this.player.inventory.addItem('wood', 300);
        this.player.inventory.addItem('stone', 200);
        this.player.inventory.addItem('nails', 100);
        this.player.inventory.addItem('hardwood', 50);
        this.player.inventory.addItem('iron_bar', 30);
        
        // Add starting gold
        if (this.player.gold === undefined) {
            this.player.gold = 15000; // Increased for building upgrades
        }
        
        console.log('Added starter items (tools, food, and cooking ingredients) to player inventory');
    }
    
    setupCollisions() {
        if (!this.engine.collisionSystem || !this.tileMap) return;
        
        // Integrate TileMap collision data with CollisionSystem
        for (const [posKey, collision] of this.tileMap.collisionData.entries()) {
            const [x, y] = posKey.split(',').map(n => parseInt(n));
            
            this.engine.collisionSystem.addTileCollision(
                x, y, 
                collision.solid, 
                { 
                    type: collision.properties.type || 'obstacle',
                    tileId: collision.tileId,
                    properties: collision.properties
                }
            );
        }
        
        console.log(`Set up ${this.tileMap.collisionData.size} collision tiles`);
    }
    
    // Initialize farming system for this scene
    initializeFarming() {
        if (this.engine?.farmingSystem) {
            this.engine.farmingSystem.init(this.engine);
            console.log('FarmingSystem initialized for Farm scene');
        }
    }
    
    // Setup bed locations in the farm
    setupBeds() {
        if (this.engine?.sleepSystem) {
            // Add a bed in the farmhouse area (top-left corner)
            this.engine.sleepSystem.registerBed('farm_bed', 2 * 32, 2 * 32, {
                width: 64,
                height: 32,
                comfort: 1.0,
                quality: 'basic',
                ownerId: this.player?.entityId || 'player'
            });
            
            console.log('Bed locations setup for Farm scene');
        }
    }

    // Override Scene's updateScene method for farm-specific updates
    updateScene(deltaTime, inputManager) {
        // Update HUD
        if (this.hud) {
            this.hud.update(deltaTime);
            this.hud.handleInput(inputManager);
        }
        
        // Handle sleep interactions
        if (inputManager.isKeyPressed('KeyZ')) {
            this.handleSleepInteraction();
        }
        
        // Handle save/load interactions
        if (inputManager.isKeyPressed('F5')) {
            this.handleQuickSave();
        }
        
        if (inputManager.isKeyPressed('F9')) {
            this.handleQuickLoad();
        }
        
        // Handle animal interactions
        if (inputManager.isKeyPressed('KeyX')) {
            this.handleAnimalInteraction();
        }
        
        // Handle NPC interactions (C key for conversation)
        if (inputManager.isKeyPressed('KeyC')) {
            this.handleNPCInteraction();
        }
        
        // Handle fishing interactions (F key to start fishing, SPACE to catch)
        if (inputManager.isKeyPressed('KeyF')) {
            this.handleFishingInteraction();
        }
        
        if (inputManager.isKeyPressed('Space')) {
            this.handleFishingCatch();
        }
        
        // Handle mining interactions (M key to mine)
        if (inputManager.isKeyPressed('KeyM')) {
            this.handleMiningInteraction();
        }
        
        // Handle cooking interactions (Q key to open cooking menu, SPACE to finish)
        if (inputManager.isKeyPressed('KeyQ')) {
            this.handleCookingInteraction();
        }
        
        if (inputManager.isKeyPressed('Space') && this.engine.cookingSystem?.isCooking) {
            this.handleCookingFinish();
        }
        
        // Handle tool upgrade interactions (U key to open upgrade menu)
        if (inputManager.isKeyPressed('KeyU')) {
            this.handleToolUpgradeInteraction();
        }
        
        // Handle building upgrade interactions (B key to open building menu)
        if (inputManager.isKeyPressed('KeyB')) {
            this.handleBuildingUpgradeInteraction();
        }
        
        // Handle achievement viewing (A key to view achievements)
        if (inputManager.isKeyPressed('KeyA')) {
            this.handleAchievementView();
        }
        
        // Farm-specific update logic can go here
        // Base Scene class already handles entity updates
    }

    // Override Scene's renderScene method for farm-specific rendering
    renderScene(renderSystem) {
        // Render TileMap using the integrated system
        if (this.tileMap) {
            this.tileMap.render(renderSystem, renderSystem.camera);
        }

        // Call parent class renderScene to handle entity rendering with culling
        super.renderScene(renderSystem);
        
        // Render HUD
        if (this.hud) {
            this.hud.render(renderSystem);
        }
        
        // Render weather effects
        if (this.engine.weatherSystem) {
            this.engine.weatherSystem.renderWeatherEffects(renderSystem);
        }
        
        // Render fishing system
        if (this.engine.fishingSystem) {
            this.engine.fishingSystem.render(renderSystem);
        }
        
        // No explicit mining system render needed - rocks are entities
        
        // Render cooking system
        if (this.engine.cookingSystem) {
            this.engine.cookingSystem.render(renderSystem);
        }
        
        // Render tool upgrade system
        if (this.engine.toolUpgradeSystem) {
            this.engine.toolUpgradeSystem.render(renderSystem);
        }
        
        // Render building upgrade system
        if (this.engine.buildingUpgradeSystem) {
            this.engine.buildingUpgradeSystem.render(renderSystem);
        }
        
        // Render debug information if debug mode is enabled
        if (this.engine.isDebugMode()) {
            this.engine.collisionSystem.renderDebug(renderSystem);
            this.engine.sleepSystem?.renderDebug(renderSystem);
            this.engine.weatherSystem?.renderDebug(renderSystem);
            this.engine.animalSystem?.renderDebug(renderSystem);
            this.engine.npcSystem?.renderDebug(renderSystem);
            this.engine.dialogueSystem?.renderDebug(renderSystem);
            this.engine.miningSystem?.renderDebug(renderSystem);
            renderSystem.renderCullingDebug();
            this.renderPerformanceStats(renderSystem);
        }
    }
    
    // Render performance statistics in debug mode
    renderPerformanceStats(renderSystem) {
        const renderStats = renderSystem.getStats();
        const tileStats = this.tileMap ? this.tileMap.getRenderStats() : null;
        
        let yOffset = 40;
        const statColor = '#00ff00';
        
        // Render statistics
        renderSystem.drawText(
            `Entities: ${this.entities.length} total, ${renderStats.totalSprites - renderStats.culledSprites} visible`,
            10, yOffset, { color: statColor, layer: 1000 }
        );
        yOffset += 20;
        
        if (tileStats) {
            renderSystem.drawText(
                `Tiles: ${tileStats.tilesRendered}/${tileStats.totalTilesInView} rendered (${Math.round(tileStats.cullRatio * 100)}% culled)`,
                10, yOffset, { color: statColor, layer: 1000 }
            );
            yOffset += 20;
        }
        
        renderSystem.drawText(
            `Batches: ${renderStats.batchesUsed}, Draw calls: ${renderStats.drawCalls}`,
            10, yOffset, { color: statColor, layer: 1000 }
        );
    }
    
    // Handle sleep interaction when Z key is pressed
    handleSleepInteraction() {
        if (!this.player || !this.engine.sleepSystem) return;
        
        const result = this.engine.sleepSystem.handleBedInteraction(this.player);
        
        if (result.success) {
            console.log(result.message);
            
            // Trigger HUD time update animation if available
            if (this.hud && result.timeAdvanced) {
                this.hud.triggerTimeUpdate();
            }
        } else {
            console.log(result.message);
        }
    }

    // Handle quick save (F5)
    handleQuickSave() {
        if (!this.engine.saveManager) {
            console.log('Save system not available');
            return;
        }
        
        try {
            const result = this.engine.saveManager.saveGame(0, {
                characterName: 'Player',
                farmName: 'Green Valley Farm',
                quickSave: true
            });
            
            if (result.success) {
                console.log('Game saved successfully!');
                // Future: Show save confirmation UI
            } else {
                console.error('Save failed:', result.error);
                // Future: Show error message to player
            }
        } catch (error) {
            console.error('Save system error:', error);
        }
    }
    
    // Handle quick load (F9)
    handleQuickLoad() {
        if (!this.engine.saveManager) {
            console.log('Save system not available');
            return;
        }
        
        try {
            const result = this.engine.saveManager.loadGame(0);
            
            if (result.success) {
                console.log('Game loaded successfully!');
                // Future: Show load confirmation UI
                // The scene will be automatically updated by the loaded data
            } else {
                console.error('Load failed:', result.error);
                // Future: Show error message to player
            }
        } catch (error) {
            console.error('Load system error:', error);
        }
    }
    
    // Spawn test animals for demonstration
    spawnTestAnimals() {
        if (!this.engine.animalSystem) return;
        
        // Spawn a cow near the barn area
        const cow = this.engine.animalSystem.spawnAnimal('cow', 5 * 32, 4 * 32);
        if (cow) {
            console.log('Spawned test cow');
        }
        
        // Spawn chickens near the coop area
        const chicken1 = this.engine.animalSystem.spawnAnimal('chicken', 15 * 32, 3 * 32);
        const chicken2 = this.engine.animalSystem.spawnAnimal('chicken', 16 * 32, 3 * 32);
        
        if (chicken1 && chicken2) {
            console.log('Spawned test chickens');
        }
        
        // Spawn a sheep
        const sheep = this.engine.animalSystem.spawnAnimal('sheep', 7 * 32, 4 * 32);
        if (sheep) {
            console.log('Spawned test sheep');
        }
    }
    
    // Handle animal interaction (X key)
    handleAnimalInteraction() {
        if (!this.player || !this.engine.animalSystem) {
            console.log('Animal system not available');
            return;
        }
        
        // Find nearest animal
        const nearestAnimal = this.engine.animalSystem.getNearestAnimal(
            this.player.x, 
            this.player.y
        );
        
        if (!nearestAnimal) {
            console.log('No animal nearby');
            return;
        }
        
        // Get interaction options
        const options = nearestAnimal.getInteractionOptions(this.player);
        
        if (options.length === 0) {
            console.log(`${nearestAnimal.name} doesn't need anything right now`);
            return;
        }
        
        // For now, perform the first available interaction
        // Future: Show interaction menu to player
        const firstOption = options[0];
        let result;
        
        switch (firstOption.action) {
            case 'feed':
                result = this.engine.animalSystem.handlePlayerInteraction(
                    this.player, 'feed', nearestAnimal
                );
                break;
            case 'pet':
                result = this.engine.animalSystem.handlePlayerInteraction(
                    this.player, 'pet', nearestAnimal
                );
                break;
            case 'collect':
                result = this.engine.animalSystem.handlePlayerInteraction(
                    this.player, 'collect', nearestAnimal
                );
                break;
            default:
                result = { success: false, message: 'Unknown interaction' };
        }
        
        // Display result
        if (result.success) {
            console.log(`✓ ${result.message}`);
        } else {
            console.log(`✗ ${result.message}`);
        }
    }
    
    // Spawn test NPCs for demonstration
    spawnTestNPCs() {
        if (!this.engine.npcSystem) return;
        
        // Spawn a merchant NPC near the farmhouse
        const merchant = this.engine.npcSystem.spawnNPC('merchant_tom', 3 * 32, 3 * 32, 'Farm');
        if (merchant) {
            console.log('Spawned merchant Tom');
        }
        
        // Spawn a farmer NPC 
        const farmer = this.engine.npcSystem.spawnNPC('farmer_mary', 8 * 32, 5 * 32, 'Farm');
        if (farmer) {
            console.log('Spawned farmer Mary');
        }
    }
    
    // Handle NPC interaction (C key)
    handleNPCInteraction() {
        if (!this.player || !this.engine.npcSystem) {
            console.log('NPC system not available');
            return;
        }
        
        // Prevent interaction if dialogue is active
        if (this.engine.dialogueSystem && this.engine.dialogueSystem.isDialogueActive()) {
            console.log('Already in conversation');
            return;
        }
        
        // Find nearest NPC
        const nearestNPC = this.engine.npcSystem.getNearestNPC(
            this.player.x, 
            this.player.y
        );
        
        if (!nearestNPC) {
            console.log('No one nearby to talk to');
            return;
        }
        
        // Get interaction options
        const options = nearestNPC.getInteractionOptions(this.player);
        
        if (options.length === 0) {
            console.log(`${nearestNPC.name} is not available right now`);
            return;
        }
        
        // For now, perform the first available interaction (talk)
        // Future: Show interaction menu to player
        const firstOption = options.find(opt => opt.action === 'talk');
        if (!firstOption) {
            console.log('No talk option available');
            return;
        }
        
        // Start conversation
        const result = this.engine.npcSystem.handlePlayerInteraction(
            this.player, 'talk', nearestNPC
        );
        
        // Display result
        if (result.success) {
            console.log(`✓ ${result.message}`);
        } else {
            console.log(`✗ ${result.message}`);
        }
    }
    
    // Handle fishing interaction when F key is pressed
    handleFishingInteraction() {
        if (!this.player || !this.engine.fishingSystem) {
            console.log('Fishing system not available');
            return;
        }
        
        // If already fishing, stop fishing
        if (this.engine.fishingSystem.isFishing) {
            const result = this.engine.fishingSystem.handlePlayerInteraction(
                this.player, 'stop_fishing'
            );
            console.log(result.message);
            return;
        }
        
        // Try to start fishing
        const result = this.engine.fishingSystem.handlePlayerInteraction(
            this.player, 'start_fishing'
        );
        
        if (result.success) {
            console.log(`🎣 ${result.message}`);
        } else {
            console.log(`✗ ${result.message}`);
        }
    }
    
    // Handle fishing catch attempt when SPACE is pressed
    handleFishingCatch() {
        if (!this.player || !this.engine.fishingSystem) {
            return;
        }
        
        // Only process catch attempts during fishing
        if (!this.engine.fishingSystem.isFishing) {
            return;
        }
        
        const result = this.engine.fishingSystem.handlePlayerInteraction(
            this.player, 'catch_fish'
        );
        
        if (result.success) {
            console.log(`🐟 ${result.message} (Quality: ${result.quality})`);
            
            // Add to inventory is handled by fishing system
            // Could add UI effects here for successful catch
            
        } else {
            console.log(`✗ ${result.message}`);
        }
    }
    
    // Handle mining interaction when M key is pressed
    handleMiningInteraction() {
        if (!this.player || !this.engine.miningSystem) {
            console.log('Mining system not available');
            return;
        }
        
        const result = this.engine.miningSystem.handlePlayerInteraction(
            this.player, 'mine'
        );
        
        if (result.success) {
            if (result.broken) {
                console.log(`⛏️ ${result.message}`);
                if (result.drops && result.drops.length > 0) {
                    const dropText = result.drops.map(drop => `${drop.amount}x ${drop.type}`).join(', ');
                    console.log(`🎒 Collected: ${dropText}`);
                }
            } else {
                console.log(`⛏️ ${result.message}`);
            }
        } else {
            console.log(`✗ ${result.message}`);
        }
    }
    
    // Handle cooking interaction when Q key is pressed
    handleCookingInteraction() {
        if (!this.player || !this.engine.cookingSystem) {
            console.log('Cooking system not available');
            return;
        }
        
        const result = this.engine.cookingSystem.handlePlayerInteraction(
            this.player, 'open_cooking_menu'
        );
        
        if (result.success) {
            console.log(`🍳 ${result.message}`);
            
            // For now, auto-start cooking the first available recipe
            // In a full implementation, this would open a recipe selection UI
            if (result.availableRecipes.length > 0) {
                const firstRecipe = result.availableRecipes[0];
                const startResult = this.engine.cookingSystem.handlePlayerInteraction(
                    this.player, 'start_cooking', {
                        recipeId: firstRecipe.recipeId,
                        stationId: result.station.id
                    }
                );
                
                if (startResult.success) {
                    console.log(`🍳 ${startResult.message} - cooking for ${startResult.cookingTime}ms`);
                } else {
                    console.log(`✗ ${startResult.message}`);
                }
            } else {
                console.log('No recipes available at this station');
            }
        } else {
            console.log(`✗ ${result.message}`);
        }
    }
    
    // Handle cooking finish when SPACE is pressed during cooking
    handleCookingFinish() {
        if (!this.player || !this.engine.cookingSystem) {
            return;
        }
        
        const result = this.engine.cookingSystem.handlePlayerInteraction(
            this.player, 'finish_cooking'
        );
        
        if (result.success) {
            let message = `🍳 ${result.message}`;
            if (result.perfectTiming) {
                message += ' (Perfect timing!)';
            } else if (result.overcooked) {
                message += ' (Overcooked...)';
            }
            
            console.log(message);
            console.log(`🎒 Added ${result.result.name} to inventory (+${result.experience} exp)`);
        } else {
            console.log(`✗ ${result.message}`);
        }
    }
    
    // Handle tool upgrade interaction when U key is pressed
    handleToolUpgradeInteraction() {
        if (!this.player || !this.engine.toolUpgradeSystem) {
            console.log('Tool upgrade system not available');
            return;
        }
        
        const result = this.engine.toolUpgradeSystem.handlePlayerInteraction(
            this.player, 'open_upgrade_menu'
        );
        
        if (result.success) {
            console.log(`🔨 ${result.message} (Gold: ${result.playerGold})`);
            
            // For demo purposes, auto-upgrade the first upgradeable tool
            if (result.upgradableTools.length > 0) {
                const firstTool = result.upgradableTools[0];
                const firstUpgrade = firstTool.availableUpgrades[0];
                
                console.log(`Available upgrade: ${firstTool.tool.name} -> ${firstUpgrade.targetType}`);
                console.log(`Cost: ${firstUpgrade.cost.gold} gold + materials: ${Object.entries(firstUpgrade.cost.materials).map(([mat, amt]) => `${amt}x ${mat}`).join(', ')}`);
                
                // Auto-attempt the upgrade
                const upgradeResult = this.engine.toolUpgradeSystem.handlePlayerInteraction(
                    this.player, 'upgrade_tool', {
                        toolId: firstTool.tool.toolId,
                        targetType: firstUpgrade.targetType,
                        stationId: result.station.id
                    }
                );
                
                if (upgradeResult.success) {
                    console.log(`🔨 ${upgradeResult.message}`);
                    console.log(`✨ Your ${upgradeResult.tool.name} is now more efficient!`);
                    
                    // Trigger achievement
                    this.engine.achievementSystem?.onToolUpgraded();
                } else {
                    console.log(`✗ ${upgradeResult.message}`);
                }
            } else {
                console.log('No tools can be upgraded at this station');
            }
        } else {
            console.log(`✗ ${result.message}`);
        }
    }
    
    // Handle building upgrade interaction when B key is pressed
    handleBuildingUpgradeInteraction() {
        if (!this.player || !this.engine.buildingUpgradeSystem) {
            console.log('Building upgrade system not available');
            return;
        }
        
        const result = this.engine.buildingUpgradeSystem.handlePlayerInteraction(
            this.player, 'open_building_menu'
        );
        
        if (result.success) {
            console.log(`🏗️ ${result.message} (Gold: ${result.playerGold})`);
            
            // For demo purposes, auto-upgrade the first upgradeable building
            if (result.upgradableBuildings.length > 0) {
                const firstBuilding = result.upgradableBuildings[0];
                const firstUpgrade = firstBuilding.availableUpgrades[0];
                
                console.log(`Available upgrade: ${firstBuilding.building.buildingType.name} -> ${firstUpgrade.buildingType.name}`);
                
                if (firstUpgrade.buildingType.upgradeCost) {
                    const cost = firstUpgrade.buildingType.upgradeCost;
                    console.log(`Cost: ${cost.gold} gold + materials: ${Object.entries(cost.materials).map(([mat, amt]) => `${amt}x ${mat}`).join(', ')}`);
                    console.log(`Construction time: ${Math.round(cost.constructionTime / 1000)}s`);
                    
                    // Auto-attempt the upgrade
                    const upgradeResult = this.engine.buildingUpgradeSystem.handlePlayerInteraction(
                        this.player, 'upgrade_building', {
                            buildingId: firstBuilding.building.id,
                            targetType: firstUpgrade.targetType,
                            stationId: result.station.id
                        }
                    );
                    
                    if (upgradeResult.success) {
                        console.log(`🏗️ ${upgradeResult.message}`);
                        console.log(`📈 Building capacity will increase from ${firstBuilding.building.capacity} to ${firstUpgrade.buildingType.capacity}!`);
                        
                        // Trigger achievement
                        this.engine.achievementSystem?.onBuildingUpgraded();
                        
                        // For demo, complete immediately
                        setTimeout(() => {
                            console.log(`✅ ${firstUpgrade.buildingType.name} construction completed!`);
                        }, 1000);
                    } else {
                        console.log(`✗ ${upgradeResult.message}`);
                    }
                } else {
                    console.log('No upgrade cost defined for this building');
                }
            } else {
                console.log('No buildings can be upgraded at this station');
            }
        } else {
            console.log(`✗ ${result.message}`);
        }
    }
    
    // Handle achievement viewing when A key is pressed
    handleAchievementView() {
        if (!this.engine.achievementSystem) {
            console.log('Achievement system not available');
            return;
        }
        
        const stats = this.engine.achievementSystem.getStats();
        
        console.log('🏆 === ACHIEVEMENTS ===');
        console.log(`Progress: ${stats.unlockedAchievements}/${stats.totalAchievements} (${stats.completionPercentage.toFixed(1)}%)`);
        console.log('');
        
        // Show achievements by category
        for (const [categoryId, category] of this.engine.achievementSystem.categories.entries()) {
            const categoryAchievements = this.engine.achievementSystem.getAchievementsByCategory(categoryId);
            const unlockedInCategory = categoryAchievements.filter(a => a.unlocked).length;
            
            console.log(`${category.icon} ${category.name}: ${unlockedInCategory}/${categoryAchievements.length}`);
            
            // Show first few achievements in category
            for (let i = 0; i < Math.min(3, categoryAchievements.length); i++) {
                const achievement = categoryAchievements[i];
                const progress = this.engine.achievementSystem.getAchievementProgress(achievement.id);
                const status = achievement.unlocked ? '✅' : `${Math.round(progress * 100)}%`;
                
                console.log(`  ${status} ${achievement.name}: ${achievement.description}`);
            }
            
            if (categoryAchievements.length > 3) {
                console.log(`  ... and ${categoryAchievements.length - 3} more`);
            }
            console.log('');
        }
        
        // Show recent unlocks
        if (stats.recentUnlocksCount > 0) {
            console.log('🎉 Recent Achievements:');
            for (const unlock of this.engine.achievementSystem.recentUnlocks.slice(-3)) {
                console.log(`  🏆 ${unlock.achievement.name}`);
            }
        }
        
        // Show some key statistics
        console.log('📊 Game Statistics:');
        console.log(`  Crops Harvested: ${stats.gameStatistics.cropsHarvested || 0}`);
        console.log(`  Fish Caught: ${stats.gameStatistics.fishCaught || 0}`);
        console.log(`  Rocks Mined: ${stats.gameStatistics.rocksMinedTotal || 0}`);
        console.log(`  Foods Cooked: ${stats.gameStatistics.foodsCooked || 0}`);
        console.log(`  Tools Upgraded: ${stats.gameStatistics.toolsUpgraded || 0}`);
        console.log(`  Buildings Upgraded: ${stats.gameStatistics.buildingsUpgraded || 0}`);
        
        // Trigger a test achievement for demo
        if (stats.gameStatistics.toolsUpgraded === 0 && stats.gameStatistics.buildingsUpgraded === 0) {
            console.log('');
            console.log('💡 Tip: Upgrade a tool (U key) or building (B key) to unlock your first achievements!');
        }
    }

    cleanup() {
        // Clean up scene resources
        this.entities = [];
        this.hud = null;
    }
}