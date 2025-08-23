// Interior scene for indoor locations like houses, shops, and buildings
// Manages indoor interactions, furniture, and contained gameplay

import { Scene } from '../engine/Scene.js';
import { TileMap } from '../engine/TileMap.js';

export class InteriorScene extends Scene {
    constructor(interiorType = 'house') {
        super(`Interior_${interiorType}`);
        this.interiorType = interiorType;
        this.tileMap = null;
        this.furniture = [];
        this.interactables = [];
        this.exitPoints = [];
    }
    
    // Override Scene's load method for interior-specific initialization
    async load() {
        console.log(`Loading ${this.interiorType} interior scene...`);
        
        // Queue interior-specific assets
        this.queueInteriorAssets();
        
        // Setup interior layout based on type
        this.setupInteriorLayout();
        this.createFurniture();
        this.setupExitPoints();
        this.setupCollisions();
    }
    
    // Queue interior-specific assets
    queueInteriorAssets() {
        // Common interior assets
        this.queueAsset('wood_floor', 'sprites/interior/wood_floor.png');
        this.queueAsset('carpet', 'sprites/interior/carpet.png');
        this.queueAsset('wall_tile', 'sprites/interior/wall.png');
        this.queueAsset('door', 'sprites/interior/door.png');
        
        // Furniture assets based on interior type
        if (this.interiorType === 'house') {
            this.queueAsset('bed', 'sprites/furniture/bed.png');
            this.queueAsset('table', 'sprites/furniture/table.png');
            this.queueAsset('chair', 'sprites/furniture/chair.png');
            this.queueAsset('bookshelf', 'sprites/furniture/bookshelf.png');
        } else if (this.interiorType === 'shop') {
            this.queueAsset('counter', 'sprites/furniture/counter.png');
            this.queueAsset('shelf', 'sprites/furniture/shelf.png');
            this.queueAsset('cash_register', 'sprites/furniture/cash_register.png');
        } else if (this.interiorType === 'barn') {
            this.queueAsset('hay_bale', 'sprites/furniture/hay_bale.png');
            this.queueAsset('feeding_trough', 'sprites/furniture/feeding_trough.png');
            this.queueAsset('animal_pen', 'sprites/furniture/animal_pen.png');
        }
    }
    
    setupInteriorLayout() {
        // Create interior based on type
        const layouts = {
            house: { width: 12, height: 10 },
            shop: { width: 15, height: 12 },
            barn: { width: 16, height: 14 },
            default: { width: 10, height: 8 }
        };
        
        const layout = layouts[this.interiorType] || layouts.default;
        this.tileMap = new TileMap(layout.width, layout.height, 32);
        
        // Define interior tile properties
        this.tileMap.tileProperties.set(1, { type: 'wood_floor', solid: false, interior: true });
        this.tileMap.tileProperties.set(2, { type: 'carpet', solid: false, interior: true });
        this.tileMap.tileProperties.set(3, { type: 'wall', solid: true, interior: true });
        this.tileMap.tileProperties.set(4, { type: 'door', solid: false, exit: true });
        
        // Generate interior layout
        this.generateInteriorLayout(layout.width, layout.height);
        
        console.log(`Created ${this.interiorType} interior: ${layout.width}x${layout.height}`);
    }
    
    generateInteriorLayout(width, height) {
        // Create walls around perimeter
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                    this.tileMap.setTile(x, y, 3, 'objects'); // Wall
                } else {
                    this.tileMap.setTile(x, y, 1, 'background'); // Floor
                }
            }
        }
        
        // Add door at bottom center
        const doorX = Math.floor(width / 2);
        this.tileMap.setTile(doorX, height - 1, 4, 'objects'); // Door
        
        // Add interior-specific elements
        if (this.interiorType === 'house') {
            this.addHouseElements(width, height);
        } else if (this.interiorType === 'shop') {
            this.addShopElements(width, height);
        } else if (this.interiorType === 'barn') {
            this.addBarnElements(width, height);
        }
    }
    
    addHouseElements(width, height) {
        // Add carpet in center
        const carpetStartX = Math.floor(width / 2) - 1;
        const carpetStartY = Math.floor(height / 2) - 1;
        
        for (let y = carpetStartY; y < carpetStartY + 3; y++) {
            for (let x = carpetStartX; x < carpetStartX + 3; x++) {
                if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
                    this.tileMap.setTile(x, y, 2, 'background'); // Carpet
                }
            }
        }
    }
    
    addShopElements(width, height) {
        // Add counter near entrance
        const counterY = height - 3;
        for (let x = 2; x < width - 2; x++) {
            this.tileMap.setTile(x, counterY, 2, 'background'); // Counter area carpet
        }
    }
    
    addBarnElements(width, height) {
        // Add hay storage area
        for (let y = 2; y < 4; y++) {
            for (let x = 2; x < width - 2; x++) {
                this.tileMap.setTile(x, y, 2, 'background'); // Hay area
            }
        }
    }
    
    createFurniture() {
        this.furniture = [];
        
        if (this.interiorType === 'house') {
            this.furniture.push(
                { type: 'bed', x: 2 * 32, y: 2 * 32, width: 64, height: 32, solid: true },
                { type: 'table', x: 6 * 32, y: 4 * 32, width: 32, height: 32, solid: true },
                { type: 'chair', x: 5 * 32, y: 4 * 32, width: 32, height: 32, solid: true },
                { type: 'bookshelf', x: 9 * 32, y: 2 * 32, width: 32, height: 32, solid: true }
            );
        } else if (this.interiorType === 'shop') {
            this.furniture.push(
                { type: 'counter', x: 7 * 32, y: 9 * 32, width: 64, height: 32, solid: true },
                { type: 'shelf', x: 2 * 32, y: 3 * 32, width: 32, height: 32, solid: true },
                { type: 'shelf', x: 12 * 32, y: 3 * 32, width: 32, height: 32, solid: true },
                { type: 'cash_register', x: 8 * 32, y: 9 * 32, width: 32, height: 32, solid: false }
            );
        } else if (this.interiorType === 'barn') {
            this.furniture.push(
                { type: 'hay_bale', x: 3 * 32, y: 2 * 32, width: 32, height: 32, solid: true },
                { type: 'hay_bale', x: 6 * 32, y: 2 * 32, width: 32, height: 32, solid: true },
                { type: 'feeding_trough', x: 2 * 32, y: 8 * 32, width: 64, height: 32, solid: true },
                { type: 'animal_pen', x: 10 * 32, y: 6 * 32, width: 96, height: 64, solid: false }
            );
        }
    }
    
    setupExitPoints() {
        // Main door exit
        const doorX = Math.floor(this.tileMap.width / 2);
        const doorY = this.tileMap.height - 1;
        
        this.exitPoints.push({
            x: doorX * 32,
            y: doorY * 32,
            width: 32,
            height: 32,
            targetScene: 'Village', // Default exit to village
            spawnPoint: { x: 12 * 32, y: 8 * 32 } // Where player appears in target scene
        });
    }
    
    setupCollisions() {
        if (!this.engine.collisionSystem || !this.tileMap) return;
        
        // Add tilemap collisions
        for (const [posKey, collision] of this.tileMap.collisionData.entries()) {
            const [x, y] = posKey.split(',').map(n => parseInt(n));
            
            this.engine.collisionSystem.addTileCollision(
                x, y, 
                collision.solid, 
                { 
                    type: collision.properties.type || 'wall',
                    tileId: collision.tileId,
                    properties: collision.properties
                }
            );
        }
        
        // Add furniture collisions
        for (const furniture of this.furniture) {
            if (furniture.solid) {
                this.engine.collisionSystem.addBody(
                    furniture.x, furniture.y,
                    furniture.width, furniture.height,
                    {
                        solid: true,
                        userData: { type: 'furniture', furniture }
                    }
                );
            }
        }
        
        console.log(`Set up interior collisions: ${this.tileMap.collisionData.size} tiles, ${this.furniture.filter(f => f.solid).length} furniture`);
    }
    
    // Override Scene's updateScene method
    updateScene(deltaTime, inputManager) {
        // Check for exit interactions
        this.checkExitInteractions();
        
        // Update furniture interactions
        this.updateFurnitureInteractions(inputManager);
    }
    
    checkExitInteractions() {
        const player = this.findEntity('player');
        if (!player) return;
        
        for (const exit of this.exitPoints) {
            // Simple overlap check
            if (player.x < exit.x + exit.width &&
                player.x + player.width > exit.x &&
                player.y < exit.y + exit.height &&
                player.y + player.height > exit.y) {
                
                // Trigger scene transition
                if (this.engine.sceneManager) {
                    this.engine.sceneManager.transitionToScene(exit.targetScene, {
                        spawnPoint: exit.spawnPoint,
                        previousScene: this.name
                    });
                }
                break;
            }
        }
    }
    
    updateFurnitureInteractions(inputManager) {
        // Future: Handle furniture interactions (sitting, sleeping, using items)
        const player = this.findEntity('player');
        if (!player) return;
        
        // Check for furniture interactions when action key is pressed
        if (inputManager.isKeyPressed('KeyE')) {
            for (const furniture of this.furniture) {
                const distance = Math.sqrt(
                    Math.pow(player.x + player.width/2 - (furniture.x + furniture.width/2), 2) +
                    Math.pow(player.y + player.height/2 - (furniture.y + furniture.height/2), 2)
                );
                
                if (distance < 48) { // Within interaction range
                    this.interactWithFurniture(furniture);
                    break;
                }
            }
        }
    }
    
    interactWithFurniture(furniture) {
        console.log(`Interacting with ${furniture.type}`);
        
        // Future: Implement specific furniture interactions
        switch (furniture.type) {
            case 'bed':
                console.log('Player could sleep here to restore stamina');
                break;
            case 'cash_register':
                console.log('Player could access shop interface');
                break;
            case 'bookshelf':
                console.log('Player could read books or learn recipes');
                break;
        }
    }
    
    // Override Scene's renderScene method
    renderScene(renderSystem) {
        // Render TileMap
        if (this.tileMap) {
            this.tileMap.render(renderSystem, renderSystem.camera);
        }
        
        // Render furniture
        this.renderFurniture(renderSystem);
        
        // Call parent class renderScene to handle entity rendering
        super.renderScene(renderSystem);
        
        // Render debug information if debug mode is enabled
        if (this.engine.isDebugMode()) {
            this.engine.collisionSystem.renderDebug(renderSystem);
            this.renderInteriorDebugInfo(renderSystem);
        }
    }
    
    renderFurniture(renderSystem) {
        for (const furniture of this.furniture) {
            // For now, render furniture as colored rectangles
            const furnitureColors = {
                bed: '#8b4513',
                table: '#deb887',
                chair: '#cd853f',
                counter: '#696969',
                shelf: '#a0522d',
                hay_bale: '#ffd700',
                bookshelf: '#8b0000'
            };
            
            const color = furnitureColors[furniture.type] || '#888888';
            
            renderSystem.drawRect(
                furniture.x, furniture.y,
                furniture.width, furniture.height,
                color,
                { layer: 3 }
            );
            
            // Show furniture names in debug mode
            if (this.engine.isDebugMode()) {
                renderSystem.drawText(
                    furniture.type,
                    furniture.x, furniture.y - 5,
                    { color: '#ffffff', layer: 101 }
                );
            }
        }
    }
    
    renderInteriorDebugInfo(renderSystem) {
        let yOffset = 80;
        const debugColor = '#00ffff';
        
        renderSystem.drawText(
            `Interior: ${this.interiorType}`,
            10, yOffset, { color: debugColor, layer: 1000 }
        );
        yOffset += 20;
        
        renderSystem.drawText(
            `Furniture: ${this.furniture.length}`,
            10, yOffset, { color: debugColor, layer: 1000 }
        );
        yOffset += 20;
        
        renderSystem.drawText(
            `Exits: ${this.exitPoints.length}`,
            10, yOffset, { color: debugColor, layer: 1000 }
        );
        
        // Render exit points
        for (const exit of this.exitPoints) {
            renderSystem.drawRect(
                exit.x, exit.y,
                exit.width, exit.height,
                'rgba(0, 255, 255, 0.3)',
                { stroke: true, strokeColor: '#00ffff', strokeWidth: 2, layer: 100 }
            );
        }
    }
    
    // Save interior-specific state
    saveState() {
        const baseState = super.saveState();
        return {
            ...baseState,
            interiorType: this.interiorType,
            furniture: this.furniture,
            exitPoints: this.exitPoints
        };
    }
    
    // Load interior-specific state
    loadState(stateData) {
        super.loadState(stateData);
        
        if (stateData.interiorType) {
            this.interiorType = stateData.interiorType;
        }
        if (stateData.furniture) {
            this.furniture = stateData.furniture;
        }
        if (stateData.exitPoints) {
            this.exitPoints = stateData.exitPoints;
        }
    }
}