// Farm scene containing the player's farmland and basic gameplay
// Manages farm layout, player movement, and farming interactions

import { Player } from '../entities/Player.js';

export class FarmScene {
    constructor() {
        this.engine = null;
        this.player = null;
        this.tiles = [];
        this.entities = [];
    }

    init(engine) {
        this.engine = engine;
        this.setupFarmLayout();
        this.setupAnimations();
        this.createPlayer();
        this.setupCollisions();
    }

    setupFarmLayout() {
        // Create a simple 20x15 tile farm layout
        this.tiles = [];
        for (let y = 0; y < 15; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < 20; x++) {
                // Simple grass tiles for now
                this.tiles[y][x] = {
                    type: 'grass',
                    farmable: y > 5 && y < 12 && x > 2 && x < 17,
                    solid: false
                };
            }
        }
    }
    
    setupAnimations() {
        if (!this.engine.animationSystem) return;
        
        // Register player animations
        this.engine.animationSystem.registerAnimation('idle_down', ['player_idle_down'], 500, true);
        this.engine.animationSystem.registerAnimation('idle_up', ['player_idle_up'], 500, true);
        this.engine.animationSystem.registerAnimation('idle_left', ['player_idle_left'], 500, true);
        this.engine.animationSystem.registerAnimation('idle_right', ['player_idle_right'], 500, true);
        
        this.engine.animationSystem.registerAnimation('walk_down', 
            ['player_walk_down_1', 'player_walk_down_2', 'player_walk_down_3', 'player_walk_down_2'], 150, true);
        this.engine.animationSystem.registerAnimation('walk_up', 
            ['player_walk_up_1', 'player_walk_up_2', 'player_walk_up_3', 'player_walk_up_2'], 150, true);
        this.engine.animationSystem.registerAnimation('walk_left', 
            ['player_walk_left_1', 'player_walk_left_2', 'player_walk_left_3', 'player_walk_left_2'], 150, true);
        this.engine.animationSystem.registerAnimation('walk_right', 
            ['player_walk_right_1', 'player_walk_right_2', 'player_walk_right_3', 'player_walk_right_2'], 150, true);
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
        if (!this.engine.collisionSystem) return;
        
        const tileSize = 32;
        
        // Add collision boundaries around the map edges
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {
                const tile = this.tiles[y][x];
                
                // Add solid collision for map boundaries
                if (x === 0 || x === this.tiles[y].length - 1 || 
                    y === 0 || y === this.tiles.length - 1) {
                    this.engine.collisionSystem.addTileCollision(x, y, true, { type: 'boundary' });
                }
                
                // Add collision for non-farmable areas (rocks, trees, etc.)
                if (!tile.farmable && x > 0 && x < this.tiles[y].length - 1 && 
                    y > 0 && y < this.tiles.length - 1) {
                    // Some areas can be obstacles
                    if (Math.random() < 0.1) { // 10% chance of obstacle
                        this.engine.collisionSystem.addTileCollision(x, y, true, { type: 'obstacle' });
                        tile.solid = true;
                    }
                }
            }
        }
    }

    update(deltaTime, inputManager) {
        // Update all entities (including player)
        for (const entity of this.entities) {
            if (entity.update) {
                entity.update(deltaTime, inputManager);
            }
        }
    }

    render(renderSystem) {
        const tileSize = 32;
        
        // Render tiles using the new rendering system
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {
                const tile = this.tiles[y][x];
                
                // Use different colors for different tile types
                let color = '#4caf50'; // Default grass
                if (tile.farmable) {
                    color = '#8bc34a'; // Farmable land
                }
                if (tile.solid) {
                    color = '#795548'; // Obstacles/rocks
                }
                
                renderSystem.drawRect(
                    x * tileSize, 
                    y * tileSize, 
                    tileSize, 
                    tileSize, 
                    color,
                    { 
                        layer: 0,
                        stroke: true,
                        strokeColor: '#2e7d32',
                        strokeWidth: 1
                    }
                );
            }
        }

        // Render player using the new entity system
        if (this.player) {
            this.player.render(renderSystem);
        }
        
        // Render debug collision information if debug mode is enabled
        if (this.engine.isDebugMode()) {
            this.engine.collisionSystem.renderDebug(renderSystem);
        }
    }

    cleanup() {
        // Clean up scene resources
        this.entities = [];
    }
}