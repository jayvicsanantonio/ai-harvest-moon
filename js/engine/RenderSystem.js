// Advanced rendering system with sprite batching and camera controls
// Handles Canvas 2D rendering with optimization for pixel art games

export class RenderSystem {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
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
    
    // Render all queued items
    flush() {
        this.ctx.save();
        
        // Apply camera transformation
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Sort render queue by layer (back to front)
        this.renderQueue.sort((a, b) => a.layer - b.layer);
        
        // Render all items
        for (const item of this.renderQueue) {
            this.renderItem(item);
        }
        
        this.ctx.restore();
        
        // Clear queue after rendering
        this.renderQueue = [];
    }
    
    renderItem(item) {
        this.ctx.save();
        
        // Apply alpha if specified
        if (item.alpha !== 1) {
            this.ctx.globalAlpha = item.alpha;
        }
        
        switch (item.type) {
            case 'sprite':
                this.renderSprite(item);
                break;
            case 'rect':
                this.renderRect(item);
                break;
            case 'text':
                this.renderText(item);
                break;
        }
        
        this.ctx.restore();
        this.stats.drawCalls++;
    }
    
    renderSprite(item) {
        // For now, render as colored rectangle (sprites will be added with AssetManager)
        this.ctx.fillStyle = item.sprite === 'player' ? '#ff9800' : '#4caf50';
        
        if (item.rotation !== 0) {
            this.ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
            this.ctx.rotate(item.rotation);
            this.ctx.fillRect(-item.width / 2, -item.height / 2, item.width, item.height);
        } else {
            this.ctx.fillRect(item.x, item.y, item.width, item.height);
        }
        
        this.stats.spritesRendered++;
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