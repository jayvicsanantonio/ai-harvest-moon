// Collision detection system for tile-based game world
// Handles spatial partitioning and efficient collision queries

export class CollisionSystem {
    constructor() {
        // Spatial grid for efficient collision detection
        this.cellSize = 32; // Match tile size
        this.spatialGrid = new Map();
        
        // Collision layers for different object types
        this.layers = {
            TERRAIN: 1,
            OBJECTS: 2,
            ENTITIES: 4,
            TRIGGERS: 8
        };
        
        // Registered collision bodies
        this.bodies = new Map();
        this.nextBodyId = 1;
        
        // Collision callbacks
        this.collisionCallbacks = new Map();
    }
    
    // Register a collision body
    addBody(x, y, width, height, options = {}) {
        const bodyId = this.nextBodyId++;
        const body = {
            id: bodyId,
            x, y, width, height,
            layer: options.layer || this.layers.ENTITIES,
            solid: options.solid !== false, // Default to solid
            trigger: options.trigger || false,
            userData: options.userData || null,
            gridCells: new Set()
        };
        
        this.bodies.set(bodyId, body);
        this.updateBodyInGrid(body);
        
        return bodyId;
    }
    
    // Remove a collision body
    removeBody(bodyId) {
        const body = this.bodies.get(bodyId);
        if (body) {
            this.removeBodyFromGrid(body);
            this.bodies.delete(bodyId);
        }
    }
    
    // Update body position
    updateBody(bodyId, x, y, width = null, height = null) {
        const body = this.bodies.get(bodyId);
        if (!body) return false;
        
        // Remove from old grid cells
        this.removeBodyFromGrid(body);
        
        // Update position
        body.x = x;
        body.y = y;
        if (width !== null) body.width = width;
        if (height !== null) body.height = height;
        
        // Add to new grid cells
        this.updateBodyInGrid(body);
        
        return true;
    }
    
    // Add body to spatial grid
    updateBodyInGrid(body) {
        const minX = Math.floor(body.x / this.cellSize);
        const maxX = Math.floor((body.x + body.width - 1) / this.cellSize);
        const minY = Math.floor(body.y / this.cellSize);
        const maxY = Math.floor((body.y + body.height - 1) / this.cellSize);
        
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const cellKey = `${x},${y}`;
                if (!this.spatialGrid.has(cellKey)) {
                    this.spatialGrid.set(cellKey, new Set());
                }
                this.spatialGrid.get(cellKey).add(body.id);
                body.gridCells.add(cellKey);
            }
        }
    }
    
    // Remove body from spatial grid
    removeBodyFromGrid(body) {
        for (const cellKey of body.gridCells) {
            const cell = this.spatialGrid.get(cellKey);
            if (cell) {
                cell.delete(body.id);
                if (cell.size === 0) {
                    this.spatialGrid.delete(cellKey);
                }
            }
        }
        body.gridCells.clear();
    }
    
    // Check if a point collides with any solid bodies
    checkPoint(x, y, layerMask = 0xFFFFFFFF) {
        const cellKey = `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
        const cell = this.spatialGrid.get(cellKey);
        
        if (!cell) return null;
        
        for (const bodyId of cell) {
            const body = this.bodies.get(bodyId);
            if (!body || !body.solid || !(body.layer & layerMask)) continue;
            
            if (x >= body.x && x < body.x + body.width &&
                y >= body.y && y < body.y + body.height) {
                return body;
            }
        }
        
        return null;
    }
    
    // Check if a rectangle collides with any bodies
    checkRect(x, y, width, height, layerMask = 0xFFFFFFFF, excludeId = null) {
        const collisions = [];
        
        const minX = Math.floor(x / this.cellSize);
        const maxX = Math.floor((x + width - 1) / this.cellSize);
        const minY = Math.floor(y / this.cellSize);
        const maxY = Math.floor((y + height - 1) / this.cellSize);
        
        const checkedBodies = new Set();
        
        for (let gridY = minY; gridY <= maxY; gridY++) {
            for (let gridX = minX; gridX <= maxX; gridX++) {
                const cellKey = `${gridX},${gridY}`;
                const cell = this.spatialGrid.get(cellKey);
                
                if (!cell) continue;
                
                for (const bodyId of cell) {
                    if (bodyId === excludeId || checkedBodies.has(bodyId)) continue;
                    checkedBodies.add(bodyId);
                    
                    const body = this.bodies.get(bodyId);
                    if (!body || !(body.layer & layerMask)) continue;
                    
                    if (this.rectOverlap(x, y, width, height, body.x, body.y, body.width, body.height)) {
                        collisions.push(body);
                    }
                }
            }
        }
        
        return collisions;
    }
    
    // Test if player can move to a position
    canMoveTo(bodyId, newX, newY) {
        const body = this.bodies.get(bodyId);
        if (!body) return false;
        
        const collisions = this.checkRect(newX, newY, body.width, body.height, 
                                         this.layers.TERRAIN | this.layers.OBJECTS, bodyId);
        
        // Check for solid collisions
        for (const collision of collisions) {
            if (collision.solid) {
                return false;
            }
        }
        
        return true;
    }
    
    // Move a body with collision response
    moveBody(bodyId, deltaX, deltaY) {
        const body = this.bodies.get(bodyId);
        if (!body) return { x: 0, y: 0 };
        
        let newX = body.x + deltaX;
        let newY = body.y + deltaY;
        
        // Test X movement
        if (deltaX !== 0) {
            if (!this.canMoveTo(bodyId, newX, body.y)) {
                // Try to slide along Y axis
                newX = body.x;
            }
        }
        
        // Test Y movement
        if (deltaY !== 0) {
            if (!this.canMoveTo(bodyId, newX, newY)) {
                // Try to slide along X axis if we haven't moved there yet
                if (deltaX === 0 && this.canMoveTo(bodyId, body.x + deltaX, body.y)) {
                    newX = body.x + deltaX;
                } else {
                    newY = body.y;
                }
            }
        }
        
        // Update body position
        const actualDeltaX = newX - body.x;
        const actualDeltaY = newY - body.y;
        
        if (actualDeltaX !== 0 || actualDeltaY !== 0) {
            this.updateBody(bodyId, newX, newY);
        }
        
        return { x: actualDeltaX, y: actualDeltaY };
    }
    
    // Check tile-based collisions for farming game
    checkTileCollision(tileX, tileY, layerMask = 0xFFFFFFFF) {
        const worldX = tileX * this.cellSize;
        const worldY = tileY * this.cellSize;
        
        return this.checkRect(worldX, worldY, this.cellSize, this.cellSize, layerMask);
    }
    
    // Add collision for a tile
    addTileCollision(tileX, tileY, solid = true, userData = null) {
        const worldX = tileX * this.cellSize;
        const worldY = tileY * this.cellSize;
        
        return this.addBody(worldX, worldY, this.cellSize, this.cellSize, {
            layer: this.layers.TERRAIN,
            solid: solid,
            userData: userData
        });
    }
    
    // Rectangle overlap test
    rectOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
        return !(x1 >= x2 + w2 || x2 >= x1 + w1 || y1 >= y2 + h2 || y2 >= y1 + h1);
    }
    
    // Get all bodies in a region (for rendering culling, etc.)
    getBodiesInRegion(x, y, width, height, layerMask = 0xFFFFFFFF) {
        return this.checkRect(x, y, width, height, layerMask);
    }
    
    // Register collision callback
    onCollision(bodyId, callback) {
        this.collisionCallbacks.set(bodyId, callback);
    }
    
    // Trigger collision events
    triggerCollisionEvents(bodyId, collisions) {
        const callback = this.collisionCallbacks.get(bodyId);
        if (callback && collisions.length > 0) {
            callback(collisions);
        }
    }
    
    // Get body by ID
    getBody(bodyId) {
        return this.bodies.get(bodyId);
    }
    
    // Get all bodies
    getAllBodies() {
        return Array.from(this.bodies.values());
    }
    
    // Debug: Get grid statistics
    getGridStats() {
        return {
            totalCells: this.spatialGrid.size,
            totalBodies: this.bodies.size,
            cellSize: this.cellSize
        };
    }
    
    // Debug: Render collision bounds
    renderDebug(renderSystem) {
        for (const body of this.bodies.values()) {
            const color = body.solid ? '#ff0000' : '#00ff00';
            renderSystem.drawRect(body.x, body.y, body.width, body.height, color, {
                layer: 999,
                alpha: 0.5,
                stroke: true,
                strokeColor: color,
                strokeWidth: 1
            });
        }
    }
}