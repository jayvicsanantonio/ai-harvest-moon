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
        
        // Render debug information if debug mode is enabled
        if (this.engine.isDebugMode()) {
            this.engine.collisionSystem.renderDebug(renderSystem);
            this.engine.sleepSystem?.renderDebug(renderSystem);
            this.engine.weatherSystem?.renderDebug(renderSystem);
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

    cleanup() {
        // Clean up scene resources
        this.entities = [];
        this.hud = null;
    }
}