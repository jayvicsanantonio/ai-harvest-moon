// Village scene containing shops, NPCs, and community buildings
// Manages village interactions, trading, and social gameplay

import { Scene } from '../engine/Scene.js';
import { TileMap } from '../engine/TileMap.js';

export class VillageScene extends Scene {
    constructor() {
        super('Village');
        this.tileMap = null;
        this.shops = [];
        this.npcs = [];
        this.buildings = [];
    }
    
    // Override Scene's load method for village-specific initialization
    async load() {
        console.log('Loading Village scene...');
        
        // Queue village-specific assets
        this.queueVillageAssets();
        
        // Setup village layout
        this.setupVillageLayout();
        this.createBuildings();
        this.setupNPCs();
        this.setupCollisions();
    }
    
    // Queue village-specific assets
    queueVillageAssets() {
        // Village tiles and buildings
        this.queueAsset('cobblestone_tile', 'sprites/environment/cobblestone.png');
        this.queueAsset('building_tile', 'sprites/environment/building.png');
        this.queueAsset('shop_tile', 'sprites/buildings/shop.png');
        this.queueAsset('house_tile', 'sprites/buildings/house.png');
        this.queueAsset('fountain', 'sprites/objects/fountain.png');
        this.queueAsset('street_lamp', 'sprites/objects/street_lamp.png');
        
        // NPC sprites
        this.queueAsset('shopkeeper', 'sprites/npcs/shopkeeper.png');
        this.queueAsset('villager_1', 'sprites/npcs/villager_1.png');
        this.queueAsset('villager_2', 'sprites/npcs/villager_2.png');
    }
    
    setupVillageLayout() {
        // Create a 25x20 village layout
        const mapWidth = 25;
        const mapHeight = 20;
        this.tileMap = new TileMap(mapWidth, mapHeight, 32);
        
        // Define village tile properties
        this.tileMap.tileProperties.set(1, { type: 'cobblestone', farmable: false, solid: false });
        this.tileMap.tileProperties.set(2, { type: 'building', farmable: false, solid: true });
        this.tileMap.tileProperties.set(3, { type: 'grass', farmable: false, solid: false });
        this.tileMap.tileProperties.set(10, { type: 'fountain', farmable: false, solid: true });
        this.tileMap.tileProperties.set(11, { type: 'lamp', farmable: false, solid: true });
        
        // Generate village layout
        this.generateVillageLayout(mapWidth, mapHeight);
        
        console.log('Village layout created');
    }
    
    generateVillageLayout(width, height) {
        // Fill background with grass
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                this.tileMap.setTile(x, y, 3, 'background'); // Grass
            }
        }
        
        // Create main street (cobblestone)
        const streetY = Math.floor(height / 2);
        for (let x = 0; x < width; x++) {
            this.tileMap.setTile(x, streetY, 1, 'objects'); // Cobblestone street
            this.tileMap.setTile(x, streetY + 1, 1, 'objects');
        }
        
        // Add central fountain
        const centerX = Math.floor(width / 2);
        this.tileMap.setTile(centerX, streetY, 10, 'objects'); // Fountain
        
        // Add street lamps
        const lampPositions = [
            {x: 5, y: streetY - 1}, {x: 10, y: streetY + 2},
            {x: 15, y: streetY - 1}, {x: 20, y: streetY + 2}
        ];
        
        for (const pos of lampPositions) {
            if (pos.x < width && pos.y < height && pos.y >= 0) {
                this.tileMap.setTile(pos.x, pos.y, 11, 'objects'); // Street lamp
            }
        }
        
        // Add building spaces
        this.addBuildingLayout(width, height, streetY);
    }
    
    addBuildingLayout(width, height, streetY) {
        // Buildings north of street
        const northBuildings = [
            {x: 3, y: streetY - 5, w: 4, h: 3}, // Shop
            {x: 10, y: streetY - 4, w: 3, h: 2}, // House
            {x: 16, y: streetY - 6, w: 5, h: 4}  // Large building
        ];
        
        // Buildings south of street
        const southBuildings = [
            {x: 2, y: streetY + 4, w: 3, h: 3},  // House
            {x: 8, y: streetY + 5, w: 4, h: 2},  // Shop
            {x: 18, y: streetY + 3, w: 4, h: 4}  // House
        ];
        
        // Place building tiles
        [...northBuildings, ...southBuildings].forEach(building => {
            for (let y = building.y; y < building.y + building.h; y++) {
                for (let x = building.x; x < building.x + building.w; x++) {
                    if (x < width && y < height && x >= 0 && y >= 0) {
                        this.tileMap.setTile(x, y, 2, 'objects'); // Building
                    }
                }
            }
        });
    }
    
    createBuildings() {
        // Create interactable building objects
        this.buildings = [
            {
                name: 'General Store',
                type: 'shop',
                x: 3 * 32, y: (10 - 5) * 32,
                width: 4 * 32, height: 3 * 32,
                interactionType: 'shop',
                items: ['seeds', 'tools', 'food']
            },
            {
                name: 'Blacksmith',
                type: 'shop',
                x: 8 * 32, y: (10 + 5) * 32,
                width: 4 * 32, height: 2 * 32,
                interactionType: 'upgrade',
                items: ['tool_upgrades', 'equipment']
            }
        ];
    }
    
    setupNPCs() {
        // Create NPC entities (placeholder for now)
        this.npcs = [
            {
                name: 'Shopkeeper Sam',
                x: 5 * 32, y: (10 - 3) * 32,
                sprite: 'shopkeeper',
                dialogue: 'Welcome to my shop!'
            },
            {
                name: 'Village Elder',
                x: 12 * 32, y: (10 + 3) * 32,
                sprite: 'villager_1',
                dialogue: 'Welcome to our village, young farmer!'
            }
        ];
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
        
        console.log(`Set up ${this.tileMap.collisionData.size} village collision tiles`);
    }
    
    // Override Scene's updateScene method for village-specific updates
    updateScene(deltaTime, inputManager) {
        // Village-specific update logic
        // Update NPCs, shops, time-based events, etc.
        
        // Future: Update NPC movements, shop schedules, etc.
    }
    
    // Override Scene's renderScene method for village-specific rendering
    renderScene(renderSystem) {
        // Render TileMap
        if (this.tileMap) {
            this.tileMap.render(renderSystem, renderSystem.camera);
        }
        
        // Render buildings and NPCs
        this.renderBuildings(renderSystem);
        this.renderNPCs(renderSystem);
        
        // Call parent class renderScene to handle entity rendering
        super.renderScene(renderSystem);
        
        // Render debug information if debug mode is enabled
        if (this.engine.isDebugMode()) {
            this.engine.collisionSystem.renderDebug(renderSystem);
            this.renderVillageDebugInfo(renderSystem);
        }
    }
    
    renderBuildings(renderSystem) {
        for (const building of this.buildings) {
            // Render building interaction zones in debug mode
            if (this.engine.isDebugMode()) {
                renderSystem.drawRect(
                    building.x, building.y,
                    building.width, building.height,
                    'rgba(0, 255, 0, 0.3)',
                    { stroke: true, strokeColor: '#00ff00', strokeWidth: 2, layer: 100 }
                );
                
                renderSystem.drawText(
                    building.name,
                    building.x + 5, building.y - 5,
                    { color: '#00ff00', layer: 101 }
                );
            }
        }
    }
    
    renderNPCs(renderSystem) {
        for (const npc of this.npcs) {
            // For now, render NPCs as colored rectangles
            const npcColor = '#ffaa00';
            renderSystem.drawRect(
                npc.x, npc.y, 32, 32,
                npcColor,
                { layer: 5 }
            );
            
            // Show NPC names in debug mode
            if (this.engine.isDebugMode()) {
                renderSystem.drawText(
                    npc.name,
                    npc.x, npc.y - 10,
                    { color: '#ffffff', layer: 101 }
                );
            }
        }
    }
    
    renderVillageDebugInfo(renderSystem) {
        let yOffset = 60;
        const debugColor = '#ffff00';
        
        renderSystem.drawText(
            `Buildings: ${this.buildings.length}`,
            10, yOffset, { color: debugColor, layer: 1000 }
        );
        yOffset += 20;
        
        renderSystem.drawText(
            `NPCs: ${this.npcs.length}`,
            10, yOffset, { color: debugColor, layer: 1000 }
        );
    }
    
    // Handle scene activation with transition data
    activate(transitionData) {
        super.activate(transitionData);
        
        // Handle player spawn position based on where they came from
        if (transitionData && transitionData.spawnPoint) {
            const player = this.findEntity('player');
            if (player) {
                player.x = transitionData.spawnPoint.x;
                player.y = transitionData.spawnPoint.y;
            }
        }
    }
    
    // Save village-specific state
    saveState() {
        const baseState = super.saveState();
        return {
            ...baseState,
            buildings: this.buildings,
            npcs: this.npcs.map(npc => ({
                ...npc,
                // Add any dynamic NPC state here
            }))
        };
    }
    
    // Load village-specific state
    loadState(stateData) {
        super.loadState(stateData);
        
        if (stateData.buildings) {
            this.buildings = stateData.buildings;
        }
        if (stateData.npcs) {
            this.npcs = stateData.npcs;
        }
    }
}