// Advanced rendering system with sprite batching and camera controls
// Handles Canvas 2D rendering with optimization for pixel art games

export class RenderSystem {
    constructor(canvas, ctx, assetManager = null) {
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
        
        // Performance tracking
        this.stats = {
            drawCalls: 0,
            spritesRendered: 0,
            batchesUsed: 0
        };
        
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
        this.ctx.fillStyle = this.clearColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Reset performance stats
        this.stats.drawCalls = 0;
        this.stats.spritesRendered = 0;
        this.stats.batchesUsed = 0;
        
        // Clear render queue
        this.renderQueue = [];
    }
    
    setClearColor(color) {
        this.clearColor = color;
    }
    
    // Queue a sprite for rendering
    drawSprite(sprite, x, y, width = 32, height = 32, options = {}) {
        // Viewport culling
        if (!this.isInViewport(x, y, width, height)) {
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
        
        // Apply camera transformation
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Sort render queue by layer (back to front)
        this.renderQueue.sort((a, b) => a.layer - b.layer);
        
        // Create sprite batches grouped by texture and render state
        const batches = this.createSpriteBatches(this.renderQueue);
        
        // Render batches efficiently
        this.renderBatches(batches);
        
        // Render non-sprite items individually
        const nonSpriteItems = this.renderQueue.filter(item => item.type !== 'sprite');
        for (const item of nonSpriteItems) {
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
        if (sprite.type === 'sprite_frame') {
            // Draw from spritesheet
            const frame = sprite.frame;
            this.ctx.drawImage(
                sprite.image,
                frame.x, frame.y, frame.width, frame.height,
                x, y, width, height
            );
        } else {
            // Draw full image
            this.ctx.drawImage(sprite.image, x, y, width, height);
        }
    }
    
    renderSpriteFallback(item) {
        // Fallback colored rectangle
        this.ctx.fillStyle = this.getSpriteColor(item.sprite);
        
        if (item.rotation !== 0) {
            this.ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
            this.ctx.rotate(item.rotation);
            this.ctx.fillRect(-item.width / 2, -item.height / 2, item.width, item.height);
        } else {
            this.ctx.fillRect(item.x, item.y, item.width, item.height);
        }
    }
    
    getSpriteColor(spriteId) {
        // Color mapping for different sprite types
        const colorMap = {
            'player': '#ff9800',
            'player_idle_down': '#ff9800',
            'player_idle_up': '#ff9800',
            'player_idle_left': '#ff9800',
            'player_idle_right': '#ff9800',
            'player_walk_down_1': '#ff9800',
            'player_walk_down_2': '#ff9800',
            'player_walk_down_3': '#ff9800',
            'grass': '#4caf50',
            'dirt': '#8d6e63',
            'stone': '#9e9e9e',
            'water': '#2196f3'
        };
        
        return colorMap[spriteId] || '#e91e63'; // Pink for unknown sprites
    }
    
    renderRect(item) {
        this.ctx.fillStyle = item.color;
        this.ctx.fillRect(item.x, item.y, item.width, item.height);
        
        if (item.stroke) {
            this.ctx.strokeStyle = item.strokeColor;
            this.ctx.lineWidth = item.strokeWidth;
            this.ctx.strokeRect(item.x, item.y, item.width, item.height);
        }
    }
    
    renderText(item) {
        this.ctx.font = item.font;
        this.ctx.fillStyle = item.color;
        this.ctx.textAlign = item.align;
        this.ctx.fillText(item.text, item.x, item.y);
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
        return { ...this.stats };
    }
    
    resize(width, height) {
        this.camera.width = width;
        this.camera.height = height;
        this.updateCullBounds();
    }
}