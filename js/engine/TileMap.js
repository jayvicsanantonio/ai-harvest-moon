// Tile map system for loading and rendering multi-layer tile-based worlds
// Supports tile collision data, property management, and optimized rendering

import { ViewportCulling } from './ViewportCulling.js';

export class TileMap {
    constructor(width, height, tileSize = 32) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        
        // Multi-layer tile data structure
        this.layers = new Map();
        this.layerOrder = ['background', 'objects', 'collision', 'foreground'];
        
        // Tile properties and collision data
        this.tileProperties = new Map(); // tileId -> properties
        this.collisionData = new Map();  // position -> collision info
        
        // Performance optimization
        this.renderCache = new Map();
        this.isDirty = true;
        this.viewportCulling = new ViewportCulling();
        
        // Initialize default layers
        this.initializeLayers();
    }
    
    initializeLayers() {
        // Create default layers with empty tile data
        for (const layerName of this.layerOrder) {
            this.layers.set(layerName, {
                name: layerName,
                visible: true,
                opacity: 1.0,
                tiles: new Array(this.width * this.height).fill(0),
                renderOrder: this.layerOrder.indexOf(layerName)
            });
        }
    }
    
    // Set tile at specific position and layer
    setTile(x, y, tileId, layer = 'objects') {
        if (!this.isValidPosition(x, y)) {
            console.warn(`Invalid tile position: ${x}, ${y}`);
            return false;
        }
        
        const layerData = this.layers.get(layer);
        if (!layerData) {
            console.warn(`Layer '${layer}' does not exist`);
            return false;
        }
        
        const index = y * this.width + x;
        layerData.tiles[index] = tileId;
        
        // Update collision data if this is a collision layer or solid tile
        if (layer === 'collision' || this.isSolidTile(tileId)) {
            this.updateCollisionData(x, y, tileId);
        }
        
        this.markDirty();
        return true;
    }
    
    // Get tile at specific position and layer
    getTile(x, y, layer = 'objects') {
        if (!this.isValidPosition(x, y)) return 0;
        
        const layerData = this.layers.get(layer);
        if (!layerData) return 0;
        
        const index = y * this.width + x;
        return layerData.tiles[index];
    }
    
    // Get all tiles at a position across layers
    getTilesAtPosition(x, y) {
        const tiles = {};
        for (const [layerName, layerData] of this.layers.entries()) {
            tiles[layerName] = this.getTile(x, y, layerName);
        }
        return tiles;
    }
    
    // Load tile map data from JSON
    loadFromData(mapData) {
        if (!this.validateMapData(mapData)) {
            console.error('Invalid map data format');
            return false;
        }
        
        // Update dimensions if provided
        this.width = mapData.width || this.width;
        this.height = mapData.height || this.height;
        this.tileSize = mapData.tileSize || this.tileSize;
        
        // Load layer data
        if (mapData.layers) {
            for (const layerData of mapData.layers) {
                this.loadLayer(layerData);
            }
        }
        
        // Load tile properties
        if (mapData.tileProperties) {
            for (const [tileId, properties] of Object.entries(mapData.tileProperties)) {
                this.tileProperties.set(parseInt(tileId), properties);
            }
        }
        
        // Rebuild collision data
        this.rebuildCollisionData();
        this.markDirty();
        
        console.log(`Loaded tile map: ${this.width}x${this.height}, ${this.layers.size} layers`);
        return true;
    }
    
    // Load individual layer data
    loadLayer(layerData) {
        const layer = {
            name: layerData.name || 'unknown',
            visible: layerData.visible !== undefined ? layerData.visible : true,
            opacity: layerData.opacity || 1.0,
            tiles: layerData.tiles || new Array(this.width * this.height).fill(0),
            renderOrder: layerData.renderOrder || 0
        };
        
        // Ensure tiles array is correct size
        if (layer.tiles.length !== this.width * this.height) {
            console.warn(`Layer ${layer.name} has incorrect tile count, padding with zeros`);
            layer.tiles = layer.tiles.slice(0, this.width * this.height);
            while (layer.tiles.length < this.width * this.height) {
                layer.tiles.push(0);
            }
        }
        
        this.layers.set(layer.name, layer);
    }
    
    // Validate map data structure
    validateMapData(mapData) {
        if (!mapData || typeof mapData !== 'object') return false;
        
        // Check required fields
        if (mapData.width && typeof mapData.width !== 'number') return false;
        if (mapData.height && typeof mapData.height !== 'number') return false;
        if (mapData.tileSize && typeof mapData.tileSize !== 'number') return false;
        
        // Validate layers if provided
        if (mapData.layers) {
            if (!Array.isArray(mapData.layers)) return false;
            for (const layer of mapData.layers) {
                if (!layer.name || !Array.isArray(layer.tiles)) return false;
            }
        }
        
        return true;
    }
    
    // Rebuild collision data from all layers
    rebuildCollisionData() {
        this.collisionData.clear();
        
        // Process collision layer
        const collisionLayer = this.layers.get('collision');
        if (collisionLayer) {
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const tileId = this.getTile(x, y, 'collision');
                    if (tileId > 0) {
                        this.updateCollisionData(x, y, tileId);
                    }
                }
            }
        }
        
        // Process solid tiles in other layers
        for (const [layerName, layerData] of this.layers.entries()) {
            if (layerName === 'collision') continue;
            
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const tileId = this.getTile(x, y, layerName);
                    if (this.isSolidTile(tileId)) {
                        this.updateCollisionData(x, y, tileId);
                    }
                }
            }
        }
    }
    
    // Update collision data for a specific tile
    updateCollisionData(x, y, tileId) {
        const key = `${x},${y}`;
        const properties = this.tileProperties.get(tileId) || {};
        
        if (tileId === 0) {
            // Remove collision data for empty tiles
            this.collisionData.delete(key);
        } else if (properties.solid || this.isSolidTile(tileId)) {
            // Add collision data for solid tiles
            this.collisionData.set(key, {
                x: x * this.tileSize,
                y: y * this.tileSize,
                width: this.tileSize,
                height: this.tileSize,
                tileId,
                solid: true,
                properties
            });
        }
    }
    
    // Check if a tile ID represents a solid/collidable tile
    isSolidTile(tileId) {
        const properties = this.tileProperties.get(tileId);
        return properties?.solid === true;
    }
    
    // Get collision data at world position
    getCollisionAt(worldX, worldY) {
        const tileX = Math.floor(worldX / this.tileSize);
        const tileY = Math.floor(worldY / this.tileSize);
        const key = `${tileX},${tileY}`;
        return this.collisionData.get(key);
    }
    
    // Get all collision bodies in a region
    getCollisionsInRegion(x, y, width, height) {
        const collisions = [];
        const startX = Math.floor(x / this.tileSize);
        const startY = Math.floor(y / this.tileSize);
        const endX = Math.ceil((x + width) / this.tileSize);
        const endY = Math.ceil((y + height) / this.tileSize);
        
        for (let tileY = startY; tileY <= endY; tileY++) {
            for (let tileX = startX; tileX <= endX; tileX++) {
                const key = `${tileX},${tileY}`;
                const collision = this.collisionData.get(key);
                if (collision) {
                    collisions.push(collision);
                }
            }
        }
        
        return collisions;
    }
    
    // Render tile map layers with advanced viewport culling
    render(renderSystem, camera) {
        // Use enhanced viewport culling system
        const tileIterator = this.viewportCulling.createTileIterator(this, camera);
        const viewBounds = tileIterator.bounds;
        
        // Sort layers by render order
        const sortedLayers = Array.from(this.layers.values())
            .filter(layer => layer.visible)
            .sort((a, b) => a.renderOrder - b.renderOrder);
        
        // Track rendering stats
        const stats = { tilesRendered: 0, layersRendered: 0 };
        
        // Render each layer with optimized culling
        for (const layer of sortedLayers) {
            if (layer.name === 'collision') {
                // Only render collision in debug mode
                if (this.shouldRenderDebugCollision()) {
                    this.renderCollisionLayer(renderSystem, viewBounds);
                }
            } else {
                stats.tilesRendered += this.renderTileLayerOptimized(renderSystem, layer, tileIterator);
                stats.layersRendered++;
            }
        }
        
        // Render debug culling bounds if enabled
        if (this.shouldRenderDebugCollision()) {
            this.viewportCulling.renderDebugBounds(renderSystem, camera);
        }
        
        // Update performance stats
        this.updateRenderStats(stats, viewBounds);
    }
    
    // Optimized tile layer rendering using iterator
    renderTileLayerOptimized(renderSystem, layer, tileIterator) {
        let tilesRendered = 0;
        
        for (const tilePos of tileIterator) {
            const tileId = this.getTile(tilePos.x, tilePos.y, layer.name);
            if (tileId > 0) {
                this.renderTile(renderSystem, tilePos.x, tilePos.y, tileId, layer.opacity);
                tilesRendered++;
            }
        }
        
        return tilesRendered;
    }
    
    // Update rendering statistics
    updateRenderStats(stats, viewBounds) {
        const totalTilesInView = (viewBounds.endX - viewBounds.startX + 1) * 
                                (viewBounds.endY - viewBounds.startY + 1);
        
        this.renderStats = {
            tilesRendered: stats.tilesRendered,
            layersRendered: stats.layersRendered,
            totalTilesInView,
            cullRatio: 1 - (stats.tilesRendered / (totalTilesInView * stats.layersRendered || 1)),
            viewBounds: { ...viewBounds }
        };
    }
    
    // Get rendering statistics
    getRenderStats() {
        return this.renderStats || {
            tilesRendered: 0,
            layersRendered: 0,
            totalTilesInView: 0,
            cullRatio: 0,
            viewBounds: null
        };
    }
    
    // Calculate visible tile bounds for viewport culling
    calculateViewBounds(camera) {
        const margin = 1; // Extra tiles for smooth scrolling
        
        return {
            startX: Math.max(0, Math.floor(camera.x / this.tileSize) - margin),
            startY: Math.max(0, Math.floor(camera.y / this.tileSize) - margin),
            endX: Math.min(this.width - 1, Math.ceil((camera.x + camera.width) / this.tileSize) + margin),
            endY: Math.min(this.height - 1, Math.ceil((camera.y + camera.height) / this.tileSize) + margin)
        };
    }
    
    // Render a single tile layer
    renderTileLayer(renderSystem, layer, viewBounds) {
        for (let y = viewBounds.startY; y <= viewBounds.endY; y++) {
            for (let x = viewBounds.startX; x <= viewBounds.endX; x++) {
                const tileId = this.getTile(x, y, layer.name);
                if (tileId > 0) {
                    this.renderTile(renderSystem, x, y, tileId, layer.opacity);
                }
            }
        }
    }
    
    // Render collision layer for debugging
    renderCollisionLayer(renderSystem, viewBounds) {
        for (let y = viewBounds.startY; y <= viewBounds.endY; y++) {
            for (let x = viewBounds.startX; x <= viewBounds.endX; x++) {
                const key = `${x},${y}`;
                const collision = this.collisionData.get(key);
                if (collision) {
                    renderSystem.drawRect(
                        collision.x, collision.y,
                        collision.width, collision.height,
                        'rgba(255, 0, 0, 0.3)',
                        { stroke: true, strokeColor: '#ff0000', strokeWidth: 1 }
                    );
                }
            }
        }
    }
    
    // Render individual tile
    renderTile(renderSystem, tileX, tileY, tileId, opacity = 1) {
        const worldX = tileX * this.tileSize;
        const worldY = tileY * this.tileSize;
        
        // For now, use sprite name based on tile ID
        // Later this will be enhanced with tile atlases
        const spriteName = this.getTileSpriteName(tileId);
        
        renderSystem.drawSprite(
            spriteName, 
            worldX, worldY, 
            this.tileSize, this.tileSize,
            { alpha: opacity }
        );
    }
    
    // Map tile ID to sprite name (temporary implementation)
    getTileSpriteName(tileId) {
        const tileTypes = {
            1: 'grass_tile',
            2: 'dirt_tile',
            3: 'farmland_tile',
            4: 'water_tile',
            5: 'stone_tile',
            10: 'tree',
            11: 'rock',
            12: 'fence'
        };
        
        return tileTypes[tileId] || 'grass_tile';
    }
    
    // Utility methods
    isValidPosition(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
    
    worldToTile(worldX, worldY) {
        return {
            x: Math.floor(worldX / this.tileSize),
            y: Math.floor(worldY / this.tileSize)
        };
    }
    
    tileToWorld(tileX, tileY) {
        return {
            x: tileX * this.tileSize,
            y: tileY * this.tileSize
        };
    }
    
    markDirty() {
        this.isDirty = true;
        this.renderCache.clear();
    }
    
    shouldRenderDebugCollision() {
        return localStorage.getItem('debug_mode') === 'true' || 
               window.location.search.includes('debug=true');
    }
    
    // Add layer management methods
    addLayer(name, renderOrder = 0) {
        this.layers.set(name, {
            name,
            visible: true,
            opacity: 1.0,
            tiles: new Array(this.width * this.height).fill(0),
            renderOrder
        });
        this.markDirty();
    }
    
    removeLayer(name) {
        this.layers.delete(name);
        this.markDirty();
    }
    
    setLayerVisibility(name, visible) {
        const layer = this.layers.get(name);
        if (layer) {
            layer.visible = visible;
            this.markDirty();
        }
    }
    
    setLayerOpacity(name, opacity) {
        const layer = this.layers.get(name);
        if (layer) {
            layer.opacity = Math.max(0, Math.min(1, opacity));
            this.markDirty();
        }
    }
    
    // Export map data
    export() {
        const layerData = [];
        for (const [name, layer] of this.layers.entries()) {
            layerData.push({
                name: layer.name,
                visible: layer.visible,
                opacity: layer.opacity,
                renderOrder: layer.renderOrder,
                tiles: [...layer.tiles]
            });
        }
        
        return {
            width: this.width,
            height: this.height,
            tileSize: this.tileSize,
            layers: layerData,
            tileProperties: Object.fromEntries(this.tileProperties)
        };
    }
}