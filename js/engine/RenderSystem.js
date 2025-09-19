// Advanced rendering system with sprite batching and camera controls
// Handles Canvas 2D rendering with optimization for pixel art games

import { ViewportCulling } from './ViewportCulling.js';

export class RenderSystem {
    constructor(canvas, ctx, assetManager = null) {
        console.log('RenderSystem constructor called with:', {
            canvas: !!canvas,
            canvasType: typeof canvas,
            ctx: !!ctx,
            assetManager: !!assetManager
        });
        this.canvas = canvas;
        this.ctx = ctx;
        this.assetManager = assetManager;
        
        // Camera system
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1,
            width: canvas.width,
            height: canvas.height
        };
        
        // Rendering state
        this.spriteBatches = new Map();
        this.renderQueue = [];
        this.clearColor = '#87CEEB';
        
        // Weather effects state
        this.weatherEffects = {
            skyTint: '#87CEEB',
            lightLevel: 1.0,
            visibility: 1.0
        };
        
        // Performance tracking
        this.stats = {
            drawCalls: 0,
            spritesRendered: 0,
            batchesUsed: 0,
            culledSprites: 0,
            totalSprites: 0
        };
        
        // Viewport culling system
        this.viewportCulling = new ViewportCulling();
        
        // Viewport culling bounds
        this.cullBounds = {
            left: 0,
            right: canvas.width,
            top: 0,
            bottom: canvas.height
        };
        
        this.init();
    }
    
    init() {
        // Configure context for pixel-perfect rendering
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        console.log('RenderSystem initialized');
    }
    
    setCamera(x, y, zoom = 1) {
        this.camera.x = x;
        this.camera.y = y;
        this.camera.zoom = Math.max(0.1, Math.min(5.0, zoom)); // Clamp zoom
        this.updateCullBounds();
    }
    
    updateCullBounds() {
        const margin = 64; // Extra margin for smooth scrolling
        this.cullBounds.left = this.camera.x - margin;
        this.cullBounds.right = this.camera.x + this.camera.width / this.camera.zoom + margin;
        this.cullBounds.top = this.camera.y - margin;
        this.cullBounds.bottom = this.camera.y + this.camera.height / this.camera.zoom + margin;
    }
    
    isInViewport(x, y, width, height) {
        return !(x + width < this.cullBounds.left || 
                x > this.cullBounds.right || 
                y + height < this.cullBounds.top || 
                y > this.cullBounds.bottom);
    }
    
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.camera.x) * this.camera.zoom,
            y: (worldY - this.camera.y) * this.camera.zoom
        };
    }
    
    screenToWorld(screenX, screenY) {
        return {
            x: screenX / this.camera.zoom + this.camera.x,
            y: screenY / this.camera.zoom + this.camera.y
        };
    }
    
    clear() {
        if (!this.canvas) {
            console.warn('RenderSystem: Canvas is null in clear() method');
            return;
        }
        this.ctx.fillStyle = this.clearColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Reset performance stats
        this.stats.drawCalls = 0;
        this.stats.spritesRendered = 0;
        this.stats.batchesUsed = 0;
        this.stats.culledSprites = 0;
        this.stats.totalSprites = 0;
        
        // Clear render queue
        this.renderQueue = [];
    }
    
    setClearColor(color) {
        this.clearColor = color;
    }
    
    // Queue a sprite for rendering with enhanced culling
    drawSprite(sprite, x, y, width = 32, height = 32, options = {}) {
        this.stats.totalSprites++;
        
        // Enhanced viewport culling using ViewportCulling system
        const spriteObject = { x, y, width, height };
        if (!this.viewportCulling.isVisible(spriteObject, this.camera)) {
            this.stats.culledSprites++;
            return;
        }
        
        const renderItem = {
            type: 'sprite',
            sprite,
            x, y, width, height,
            layer: options.layer || 0,
            rotation: options.rotation || 0,
            alpha: options.alpha || 1,
            flipX: options.flipX || false,
            flipY: options.flipY || false,
            tint: options.tint || null
        };
        
        this.renderQueue.push(renderItem);
    }
    
    // Queue a rectangle for rendering
    drawRect(x, y, width, height, color, options = {}) {
        if (!this.isInViewport(x, y, width, height)) {
            return;
        }
        
        const renderItem = {
            type: 'rect',
            x, y, width, height, color,
            layer: options.layer || 0,
            alpha: options.alpha || 1,
            stroke: options.stroke || false,
            strokeWidth: options.strokeWidth || 1,
            strokeColor: options.strokeColor || '#000000'
        };
        
        this.renderQueue.push(renderItem);
    }
    
    // Queue circle for rendering
    drawCircle(x, y, radius, color, options = {}) {
        const diameter = radius * 2;
        if (!this.isInViewport(x - radius, y - radius, diameter, diameter)) {
            return;
        }
        
        const renderItem = {
            type: 'circle',
            x, y, radius, color,
            layer: options.layer || 0,
            alpha: options.alpha || 1,
            stroke: options.stroke || false,
            strokeWidth: options.strokeWidth || 1,
            strokeColor: options.strokeColor || '#000000'
        };
        
        this.renderQueue.push(renderItem);
    }
    
    // Queue text for rendering
    drawText(text, x, y, options = {}) {
        const renderItem = {
            type: 'text',
            text, x, y,
            layer: options.layer || 0,
            font: options.font || '16px Arial',
            color: options.color || '#000000',
            align: options.align || 'left',
            alpha: options.alpha || 1
        };
        
        this.renderQueue.push(renderItem);
    }
    
    // Render all queued items using sprite batching optimization
    flush() {
        this.ctx.save();
        
        // Sort render queue by layer (back to front)
        this.renderQueue.sort((a, b) => a.layer - b.layer);
        
        // Separate world-space and screen-space items (UI elements use layer >= 100)
        const worldItems = this.renderQueue.filter(item => item.layer < 100);
        const screenItems = this.renderQueue.filter(item => item.layer >= 100);
        
        // Render world-space items with camera transformation
        this.ctx.save();
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Create sprite batches for world items
        const worldBatches = this.createSpriteBatches(worldItems);
        this.renderBatches(worldBatches);
        
        // Render world non-sprite items
        const worldNonSpriteItems = worldItems.filter(item => item.type !== 'sprite');
        for (const item of worldNonSpriteItems) {
            this.renderItem(item);
        }
        
        this.ctx.restore();
        
        // Render screen-space items without camera transformation
        const screenBatches = this.createSpriteBatches(screenItems);
        this.renderBatches(screenBatches);
        
        // Render screen non-sprite items
        const screenNonSpriteItems = screenItems.filter(item => item.type !== 'sprite');
        for (const item of screenNonSpriteItems) {
            this.renderItem(item);
        }
        
        this.ctx.restore();
        
        // Clear queue after rendering
        this.renderQueue = [];
    }
    
    // Create sprite batches grouped by texture and render state for optimal rendering
    createSpriteBatches(renderQueue) {
        const batches = new Map();
        const spriteItems = renderQueue.filter(item => item.type === 'sprite');
        
        for (const item of spriteItems) {
            // Create a batch key based on sprite texture and render state
            const batchKey = this.getBatchKey(item);
            
            if (!batches.has(batchKey)) {
                batches.set(batchKey, {
                    sprite: item.sprite,
                    alpha: item.alpha,
                    items: [],
                    hasTransforms: false
                });
            }
            
            const batch = batches.get(batchKey);
            batch.items.push(item);
            
            // Check if any items in batch have transforms
            if (item.rotation !== 0 || item.flipX || item.flipY) {
                batch.hasTransforms = true;
            }
        }
        
        return batches;
    }
    
    // Generate a batch key for grouping similar sprites
    getBatchKey(item) {
        // Group by sprite texture and basic render state
        // Items with different alphas or transforms get separate batches
        const transformKey = (item.rotation !== 0 || item.flipX || item.flipY) ? '_t' : '';
        const alphaKey = item.alpha !== 1 ? `_a${item.alpha}` : '';
        return `${item.sprite}${transformKey}${alphaKey}`;
    }
    
    // Render sprite batches efficiently
    renderBatches(batches) {
        let lastAlpha = 1;
        
        for (const [batchKey, batch] of batches) {
            // Set alpha state once per batch
            if (batch.alpha !== lastAlpha) {
                this.ctx.globalAlpha = batch.alpha;
                lastAlpha = batch.alpha;
            }
            
            // Get sprite data once per batch
            let spriteData = null;
            if (this.assetManager) {
                spriteData = this.assetManager.getSprite(batch.sprite);
                if (!spriteData) {
                    console.log(`DEBUG: Could not find sprite '${batch.sprite}' in AssetManager`);
                }
            } else {
                console.log('DEBUG: AssetManager is null in RenderSystem');
            }
            
            // Render all items in the batch
            if (batch.hasTransforms) {
                // Items with transforms need individual rendering
                this.renderBatchWithTransforms(batch, spriteData);
            } else {
                // Simple items can be batched more efficiently
                this.renderSimpleBatch(batch, spriteData);
            }
            
            this.stats.batchesUsed++;
        }
        
        // Reset alpha to 1
        if (lastAlpha !== 1) {
            this.ctx.globalAlpha = 1;
        }
    }
    
    // Render batch items with transforms (rotation, flips)
    renderBatchWithTransforms(batch, spriteData) {
        for (const item of batch.items) {
            this.ctx.save();
            
            if (spriteData && spriteData.image) {
                // Apply transformations
                this.ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
                
                if (item.rotation !== 0) {
                    this.ctx.rotate(item.rotation);
                }
                
                if (item.flipX || item.flipY) {
                    this.ctx.scale(item.flipX ? -1 : 1, item.flipY ? -1 : 1);
                }
                
                this.drawSpriteImage(spriteData, -item.width / 2, -item.height / 2, item.width, item.height);
            } else {
                // Fallback rendering with transforms
                this.ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
                
                if (item.rotation !== 0) {
                    this.ctx.rotate(item.rotation);
                }
                
                if (item.flipX || item.flipY) {
                    this.ctx.scale(item.flipX ? -1 : 1, item.flipY ? -1 : 1);
                }
                
                this.ctx.fillStyle = this.getSpriteColor(item.sprite);
                this.ctx.fillRect(-item.width / 2, -item.height / 2, item.width, item.height);
            }
            
            this.ctx.restore();
            this.stats.spritesRendered++;
        }
    }
    
    // Render simple batch items without transforms (most efficient)
    renderSimpleBatch(batch, spriteData) {
        if (spriteData && spriteData.image) {
            // Render using actual sprite image
            for (const item of batch.items) {
                this.drawSpriteImage(spriteData, item.x, item.y, item.width, item.height);
                this.stats.spritesRendered++;
            }
        } else {
            // Fallback rendering - can still optimize by setting fillStyle once
            this.ctx.fillStyle = this.getSpriteColor(batch.sprite);
            for (const item of batch.items) {
                this.ctx.fillRect(item.x, item.y, item.width, item.height);
                this.stats.spritesRendered++;
            }
        }
    }
    
    // Render individual non-sprite items (rects, text)
    renderItem(item) {
        this.ctx.save();
        
        // Apply alpha if specified
        if (item.alpha !== 1) {
            this.ctx.globalAlpha = item.alpha;
        }
        
        switch (item.type) {
            case 'rect':
                this.renderRect(item);
                break;
            case 'circle':
                this.renderCircle(item);
                break;
            case 'text':
                this.renderText(item);
                break;
            default:
                console.warn(`Unknown render item type: ${item.type}`);
                break;
        }
        
        this.ctx.restore();
        this.stats.drawCalls++;
    }
    
    drawSpriteImage(sprite, x, y, width, height) {
        // Round positions for pixel-perfect rendering
        const pixelX = Math.round(x);
        const pixelY = Math.round(y);
        const pixelWidth = Math.round(width);
        const pixelHeight = Math.round(height);
        
        if (sprite.type === 'sprite_frame') {
            // Draw from spritesheet
            const frame = sprite.frame;
            this.ctx.drawImage(
                sprite.image,
                frame.x, frame.y, frame.width, frame.height,
                pixelX, pixelY, pixelWidth, pixelHeight
            );
        } else {
            // Draw full image
            this.ctx.drawImage(sprite.image, pixelX, pixelY, pixelWidth, pixelHeight);
        }
    }
    
    renderSpriteFallback(item) {
        // Fallback colored rectangle with pixel-perfect positioning
        this.ctx.fillStyle = this.getSpriteColor(item.sprite);
        
        const pixelX = Math.round(item.x);
        const pixelY = Math.round(item.y);
        const pixelWidth = Math.round(item.width);
        const pixelHeight = Math.round(item.height);
        
        if (item.rotation !== 0) {
            this.ctx.translate(pixelX + pixelWidth / 2, pixelY + pixelHeight / 2);
            this.ctx.rotate(item.rotation);
            this.ctx.fillRect(-pixelWidth / 2, -pixelHeight / 2, pixelWidth, pixelHeight);
        } else {
            this.ctx.fillRect(pixelX, pixelY, pixelWidth, pixelHeight);
        }
    }
    
    getSpriteColor(spriteId) {
        // Color mapping for different sprite types
        const colorMap = {
            // Player sprites
            'player': '#ff9800',
            'player_idle_down': '#ff9800',
            'player_idle_up': '#ff9800',
            'player_idle_left': '#ff9800',
            'player_idle_right': '#ff9800',
            'player_walk_down_1': '#ff9800',
            'player_walk_down_2': '#ff9800',
            'player_walk_down_3': '#ff9800',
            'player_walk_up_1': '#ff9800',
            'player_walk_up_2': '#ff9800',
            'player_walk_up_3': '#ff9800',
            'player_walk_left_1': '#ff9800',
            'player_walk_left_2': '#ff9800',
            'player_walk_left_3': '#ff9800',
            'player_walk_right_1': '#ff9800',
            'player_walk_right_2': '#ff9800',
            'player_walk_right_3': '#ff9800',
            
            // Environment tiles
            'grass_tile': '#4caf50',
            'dirt_tile': '#8d6e63',
            'farmland_tile': '#a0522d',
            'water_tile': '#2196f3',
            'stone_tile': '#9e9e9e',
            
            // Objects
            'tree': '#2e7d32',
            'rock': '#757575',
            'fence': '#8d6e63',
            'house': '#f57c00',
            'barn': '#d32f2f',
            
            // Tools
            'hoe': '#795548',
            'watering_can': '#2196f3',
            'axe': '#616161',
            'pickaxe': '#455a64',
            
            // Legacy names (for backward compatibility)
            'grass': '#4caf50',
            'dirt': '#8d6e63',
            'stone': '#9e9e9e',
            'water': '#2196f3'
        };
        
        return colorMap[spriteId] || '#e91e63'; // Pink for unknown sprites
    }
    
    renderRect(item) {
        // Use pixel-perfect positioning
        const pixelX = Math.round(item.x);
        const pixelY = Math.round(item.y);
        const pixelWidth = Math.round(item.width);
        const pixelHeight = Math.round(item.height);
        
        this.ctx.fillStyle = item.color;
        this.ctx.fillRect(pixelX, pixelY, pixelWidth, pixelHeight);
        
        if (item.stroke) {
            this.ctx.strokeStyle = item.strokeColor;
            this.ctx.lineWidth = item.strokeWidth;
            this.ctx.strokeRect(pixelX, pixelY, pixelWidth, pixelHeight);
        }
    }
    
    renderCircle(item) {
        // Use pixel-perfect positioning
        const pixelX = Math.round(item.x);
        const pixelY = Math.round(item.y);
        const pixelRadius = Math.round(item.radius);
        
        this.ctx.beginPath();
        this.ctx.arc(pixelX, pixelY, pixelRadius, 0, 2 * Math.PI);
        this.ctx.fillStyle = item.color;
        this.ctx.fill();
        
        if (item.stroke) {
            this.ctx.strokeStyle = item.strokeColor;
            this.ctx.lineWidth = item.strokeWidth;
            this.ctx.stroke();
        }
    }
    
    renderText(item) {
        // Use pixel-perfect positioning for text
        const pixelX = Math.round(item.x);
        const pixelY = Math.round(item.y);
        
        this.ctx.font = item.font;
        this.ctx.fillStyle = item.color;
        this.ctx.textAlign = item.align;
        this.ctx.fillText(item.text, pixelX, pixelY);
    }
    
    centerCameraOn(targetX, targetY, smoothing = 0.1) {
        // Calculate target camera position (center the viewport on target)
        const targetCameraX = targetX - this.camera.width / (2 * this.camera.zoom);
        const targetCameraY = targetY - this.camera.height / (2 * this.camera.zoom);
        
        // Smooth camera movement using linear interpolation
        this.camera.x += (targetCameraX - this.camera.x) * smoothing;
        this.camera.y += (targetCameraY - this.camera.y) * smoothing;
        
        this.updateCullBounds();
    }
    
    getStats() {
        const cullRatio = this.stats.totalSprites > 0 ? 
            (this.stats.culledSprites / this.stats.totalSprites) : 0;
            
        return { 
            ...this.stats,
            cullRatio,
            cullPercentage: Math.round(cullRatio * 100),
            viewportCullingStats: this.viewportCulling.getStats()
        };
    }
    
    // Enable/disable viewport culling
    setCullingEnabled(enabled) {
        this.viewportCulling.setCullingEnabled(enabled);
    }
    
    // Set culling margin for different scenarios
    setCullingMargin(margin) {
        this.viewportCulling.setDefaultMargin(margin);
    }
    
    // Cull a list of entities before rendering
    cullEntities(entities, deltaTime = 0) {
        if (deltaTime > 0) {
            return this.viewportCulling.cullEntitiesWithPrediction(entities, this.camera, deltaTime);
        } else {
            return this.viewportCulling.cullObjects(entities, this.camera);
        }
    }
    
    // Render debug culling information
    renderCullingDebug() {
        if (!this.canvas) {
            console.warn('RenderSystem: Canvas is null in renderCullingDebug()');
            return;
        }
        this.viewportCulling.renderDebugBounds(this, this.camera);
        
        // Show culling stats as text
        const stats = this.getStats();
        this.drawText(
            `Culled: ${stats.culledSprites}/${stats.totalSprites} (${stats.cullPercentage}%)`,
            10, this.canvas.height - 20,
            { color: '#ffffff', layer: 1000 }
        );
    }
    
    resize(width, height) {
        this.camera.width = width;
        this.camera.height = height;
        this.updateCullBounds();
    }
    
    // Weather effects support
    setWeatherEffects(effects) {
        this.weatherEffects = { ...this.weatherEffects, ...effects };
        // Update clear color based on sky tint
        this.clearColor = this.weatherEffects.skyTint;
    }
    
    getWeatherEffects() {
        return { ...this.weatherEffects };
    }
    
    applyWeatherLighting(alpha = 1.0) {
        // Apply global lighting based on weather
        const adjustedAlpha = alpha * this.weatherEffects.lightLevel * this.weatherEffects.visibility;
        this.ctx.globalAlpha = Math.max(0.1, Math.min(1.0, adjustedAlpha));
        return adjustedAlpha;
    }
    
    resetWeatherLighting() {
        this.ctx.globalAlpha = 1.0;
    }
}