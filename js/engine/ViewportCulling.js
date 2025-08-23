// Advanced viewport culling system for optimal rendering performance
// Culls objects outside the visible camera bounds with configurable margins

export class ViewportCulling {
    constructor() {
        this.cullingEnabled = true;
        this.defaultMargin = 64; // Default margin in pixels for smooth scrolling
        this.stats = {
            totalObjects: 0,
            visibleObjects: 0,
            culledObjects: 0,
            lastUpdateTime: 0
        };
        this.frustumCache = new Map(); // Cache frustum calculations
    }
    
    // Main culling method for any renderable object
    isVisible(object, camera, margin = this.defaultMargin) {
        if (!this.cullingEnabled) return true;
        
        // Get object bounds
        const bounds = this.getObjectBounds(object);
        if (!bounds) return true; // If no bounds available, assume visible
        
        // Get camera frustum
        const frustum = this.getCameraFrustum(camera, margin);
        
        // Check intersection
        return this.boundsIntersectFrustum(bounds, frustum);
    }
    
    // Optimized tile culling for grid-based objects
    getTileViewBounds(camera, tileSize, margin = this.defaultMargin) {
        const cacheKey = `${camera.x},${camera.y},${camera.zoom},${margin}`;
        
        // Check cache first
        if (this.frustumCache.has(cacheKey)) {
            const cached = this.frustumCache.get(cacheKey);
            if (performance.now() - cached.timestamp < 16) { // Cache for ~1 frame
                return cached.bounds;
            }
        }
        
        // Calculate visible tile bounds
        const scaledMargin = margin / camera.zoom;
        const viewBounds = {
            startX: Math.max(0, Math.floor((camera.x - scaledMargin) / tileSize)),
            startY: Math.max(0, Math.floor((camera.y - scaledMargin) / tileSize)),
            endX: Math.ceil((camera.x + camera.width / camera.zoom + scaledMargin) / tileSize),
            endY: Math.ceil((camera.y + camera.height / camera.zoom + scaledMargin) / tileSize)
        };
        
        // Cache the result
        this.frustumCache.set(cacheKey, {
            bounds: viewBounds,
            timestamp: performance.now()
        });
        
        // Clean old cache entries periodically
        if (this.frustumCache.size > 10) {
            this.cleanCache();
        }
        
        return viewBounds;
    }
    
    // Cull a list of objects and return only visible ones
    cullObjects(objects, camera, margin = this.defaultMargin) {
        this.stats.totalObjects = objects.length;
        this.stats.visibleObjects = 0;
        this.stats.lastUpdateTime = performance.now();
        
        if (!this.cullingEnabled) {
            this.stats.visibleObjects = objects.length;
            return objects;
        }
        
        const frustum = this.getCameraFrustum(camera, margin);
        const visibleObjects = [];
        
        for (const object of objects) {
            const bounds = this.getObjectBounds(object);
            if (bounds && this.boundsIntersectFrustum(bounds, frustum)) {
                visibleObjects.push(object);
                this.stats.visibleObjects++;
            }
        }
        
        this.stats.culledObjects = this.stats.totalObjects - this.stats.visibleObjects;
        return visibleObjects;
    }
    
    // Advanced frustum culling for entities with prediction
    cullEntitiesWithPrediction(entities, camera, deltaTime, margin = this.defaultMargin) {
        const predictedMargin = margin + this.calculatePredictionMargin(entities, deltaTime);
        return this.cullObjects(entities, camera, predictedMargin);
    }
    
    // Calculate prediction margin based on entity velocities
    calculatePredictionMargin(entities, deltaTime) {
        let maxVelocity = 0;
        
        for (const entity of entities) {
            if (entity.velocity) {
                const speed = Math.sqrt(entity.velocity.x ** 2 + entity.velocity.y ** 2);
                maxVelocity = Math.max(maxVelocity, speed);
            }
        }
        
        // Predict movement for next few frames
        return maxVelocity * deltaTime * 3; // 3 frame prediction
    }
    
    // Get object bounds in world coordinates
    getObjectBounds(object) {
        // Handle different object types
        if (object.x !== undefined && object.y !== undefined) {
            return {
                x: object.x,
                y: object.y,
                width: object.width || 32,
                height: object.height || 32
            };
        }
        
        // Handle tile objects
        if (object.tileX !== undefined && object.tileY !== undefined) {
            const tileSize = object.tileSize || 32;
            return {
                x: object.tileX * tileSize,
                y: object.tileY * tileSize,
                width: tileSize,
                height: tileSize
            };
        }
        
        // Handle custom bounds
        if (object.bounds) {
            return object.bounds;
        }
        
        return null;
    }
    
    // Get camera frustum with margin
    getCameraFrustum(camera, margin = this.defaultMargin) {
        const scaledMargin = margin / camera.zoom;
        
        return {
            left: camera.x - scaledMargin,
            right: camera.x + camera.width / camera.zoom + scaledMargin,
            top: camera.y - scaledMargin,
            bottom: camera.y + camera.height / camera.zoom + scaledMargin
        };
    }
    
    // Check if bounds intersect with frustum
    boundsIntersectFrustum(bounds, frustum) {
        return !(
            bounds.x + bounds.width < frustum.left ||
            bounds.x > frustum.right ||
            bounds.y + bounds.height < frustum.top ||
            bounds.y > frustum.bottom
        );
    }
    
    // Hierarchical culling for large numbers of objects
    hierarchicalCull(objects, camera, gridSize = 256, margin = this.defaultMargin) {
        // Group objects into spatial grid cells
        const grid = new Map();
        
        for (const object of objects) {
            const bounds = this.getObjectBounds(object);
            if (!bounds) continue;
            
            const cellX = Math.floor(bounds.x / gridSize);
            const cellY = Math.floor(bounds.y / gridSize);
            const cellKey = `${cellX},${cellY}`;
            
            if (!grid.has(cellKey)) {
                grid.set(cellKey, []);
            }
            grid.get(cellKey).push(object);
        }
        
        // Cull grid cells first, then objects within visible cells
        const frustum = this.getCameraFrustum(camera, margin);
        const visibleObjects = [];
        
        for (const [cellKey, cellObjects] of grid.entries()) {
            const [cellX, cellY] = cellKey.split(',').map(n => parseInt(n));
            const cellBounds = {
                x: cellX * gridSize,
                y: cellY * gridSize,
                width: gridSize,
                height: gridSize
            };
            
            // Check if cell is visible
            if (this.boundsIntersectFrustum(cellBounds, frustum)) {
                // Cull individual objects within the visible cell
                visibleObjects.push(...this.cullObjects(cellObjects, camera, margin));
            }
        }
        
        return visibleObjects;
    }
    
    // Clean expired cache entries
    cleanCache() {
        const now = performance.now();
        const maxAge = 100; // 100ms
        
        for (const [key, entry] of this.frustumCache.entries()) {
            if (now - entry.timestamp > maxAge) {
                this.frustumCache.delete(key);
            }
        }
    }
    
    // Enable/disable culling for debugging
    setCullingEnabled(enabled) {
        this.cullingEnabled = enabled;
        if (!enabled) {
            this.frustumCache.clear();
        }
    }
    
    // Set default margin for all culling operations
    setDefaultMargin(margin) {
        this.defaultMargin = margin;
        this.frustumCache.clear(); // Clear cache since margin changed
    }
    
    // Get culling statistics
    getStats() {
        const cullRatio = this.stats.totalObjects > 0 ? 
            (this.stats.culledObjects / this.stats.totalObjects) : 0;
            
        return {
            ...this.stats,
            cullRatio: cullRatio,
            cullPercentage: Math.round(cullRatio * 100)
        };
    }
    
    // Reset statistics
    resetStats() {
        this.stats = {
            totalObjects: 0,
            visibleObjects: 0,
            culledObjects: 0,
            lastUpdateTime: performance.now()
        };
    }
    
    // Create optimized tile iterator for large tile maps
    createTileIterator(tileMap, camera, margin = this.defaultMargin) {
        const viewBounds = this.getTileViewBounds(camera, tileMap.tileSize, margin);
        
        return {
            *[Symbol.iterator]() {
                for (let y = viewBounds.startY; y <= viewBounds.endY; y++) {
                    for (let x = viewBounds.startX; x <= viewBounds.endX; x++) {
                        if (x >= 0 && x < tileMap.width && y >= 0 && y < tileMap.height) {
                            yield { x, y, worldX: x * tileMap.tileSize, worldY: y * tileMap.tileSize };
                        }
                    }
                }
            },
            bounds: viewBounds
        };
    }
    
    // Adaptive margin calculation based on camera movement
    calculateAdaptiveMargin(camera, previousCamera, baseMargin = this.defaultMargin) {
        if (!previousCamera) return baseMargin;
        
        // Calculate camera velocity
        const deltaX = camera.x - previousCamera.x;
        const deltaY = camera.y - previousCamera.y;
        const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Increase margin based on movement speed
        const velocityMultiplier = Math.min(velocity / 100, 3); // Cap at 3x margin
        return baseMargin * (1 + velocityMultiplier);
    }
    
    // Debug visualization for culling bounds
    renderDebugBounds(renderSystem, camera, margin = this.defaultMargin) {
        if (!renderSystem || !camera) return;
        
        const frustum = this.getCameraFrustum(camera, margin);
        
        // Render frustum bounds
        renderSystem.drawRect(
            frustum.left, frustum.top,
            frustum.right - frustum.left,
            frustum.bottom - frustum.top,
            'rgba(255, 255, 0, 0.2)',
            {
                layer: 999,
                stroke: true,
                strokeColor: '#ffff00',
                strokeWidth: 2
            }
        );
        
        // Render camera center
        renderSystem.drawRect(
            camera.x + camera.width / (2 * camera.zoom) - 5,
            camera.y + camera.height / (2 * camera.zoom) - 5,
            10, 10,
            '#ff0000',
            { layer: 1000 }
        );
    }
}