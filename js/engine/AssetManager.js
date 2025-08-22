// Asset management system for loading and caching game resources
// Handles sprites, audio, and other game assets with progressive loading

export class AssetManager {
    constructor() {
        // Asset storage
        this.sprites = new Map();
        this.spritesheets = new Map();
        this.audio = new Map();
        this.fonts = new Map();
        this.data = new Map();
        
        // Loading state
        this.loadQueue = [];
        this.loadedAssets = new Set();
        this.failedAssets = new Set();
        this.isLoading = false;
        this.loadProgress = 0;
        this.totalAssets = 0;
        
        // Configuration
        this.basePath = './assets/';
        this.retryAttempts = 3;
        this.retryDelay = 1000; // ms
        
        // Callbacks
        this.onProgress = null;
        this.onComplete = null;
        this.onError = null;
        
        // Fallback assets
        this.fallbackSprite = null;
        this.fallbackAudio = null;
        
        this.createFallbackAssets();
    }
    
    createFallbackAssets() {
        // Create fallback sprite (simple colored rectangle)
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ff00ff'; // Magenta for missing sprites
        ctx.fillRect(0, 0, 32, 32);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, 30, 30);
        
        // Add "?" text
        ctx.fillStyle = '#000000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('?', 16, 22);
        
        this.fallbackSprite = canvas;
    }
    
    // Add asset to loading queue
    queueAsset(type, id, path, options = {}) {
        if (this.loadedAssets.has(id)) {
            console.warn(`Asset ${id} already loaded`);
            return;
        }
        
        this.loadQueue.push({
            type,
            id,
            path: this.basePath + path,
            options,
            attempts: 0
        });
    }
    
    // Queue sprite asset
    queueSprite(id, path, options = {}) {
        this.queueAsset('sprite', id, path, options);
    }
    
    // Queue spritesheet with metadata
    queueSpritesheet(id, imagePath, metadataPath, options = {}) {
        this.queueAsset('spritesheet', id, imagePath, { 
            ...options, 
            metadataPath: this.basePath + metadataPath 
        });
    }
    
    // Queue audio asset
    queueAudio(id, path, options = {}) {
        this.queueAsset('audio', id, path, options);
    }
    
    // Queue font asset
    queueFont(family, path, options = {}) {
        this.queueAsset('font', family, path, options);
    }
    
    // Queue JSON data
    queueData(id, path, options = {}) {
        this.queueAsset('data', id, path, options);
    }
    
    // Start loading all queued assets
    async loadAll() {
        if (this.isLoading) {
            console.warn('Asset loading already in progress');
            return;
        }
        
        this.isLoading = true;
        this.totalAssets = this.loadQueue.length;
        this.loadProgress = 0;
        
        console.log(`Starting to load ${this.totalAssets} assets...`);
        
        // Process queue with priority loading
        const priorityAssets = this.loadQueue.filter(asset => asset.options.priority === 'high');
        const normalAssets = this.loadQueue.filter(asset => asset.options.priority !== 'high');
        
        // Load high priority assets first
        await this.processAssetBatch(priorityAssets, 1); // Sequential for critical assets
        await this.processAssetBatch(normalAssets, 4);   // Parallel for others
        
        this.isLoading = false;
        
        if (this.onComplete) {
            this.onComplete(this.loadedAssets.size, this.failedAssets.size);
        }
        
        console.log(`Asset loading complete: ${this.loadedAssets.size} loaded, ${this.failedAssets.size} failed`);
    }
    
    // Process assets in batches for better performance
    async processAssetBatch(assets, batchSize) {
        for (let i = 0; i < assets.length; i += batchSize) {
            const batch = assets.slice(i, i + batchSize);
            const promises = batch.map(asset => this.loadAsset(asset));
            await Promise.allSettled(promises);
        }
    }
    
    // Load individual asset
    async loadAsset(assetInfo) {
        try {
            let asset = null;
            
            switch (assetInfo.type) {
                case 'sprite':
                    asset = await this.loadSprite(assetInfo);
                    this.sprites.set(assetInfo.id, asset);
                    break;
                    
                case 'spritesheet':
                    asset = await this.loadSpritesheet(assetInfo);
                    this.spritesheets.set(assetInfo.id, asset);
                    break;
                    
                case 'audio':
                    asset = await this.loadAudio(assetInfo);
                    this.audio.set(assetInfo.id, asset);
                    break;
                    
                case 'font':
                    asset = await this.loadFont(assetInfo);
                    this.fonts.set(assetInfo.id, asset);
                    break;
                    
                case 'data':
                    asset = await this.loadData(assetInfo);
                    this.data.set(assetInfo.id, asset);
                    break;
                    
                default:
                    throw new Error(`Unknown asset type: ${assetInfo.type}`);
            }
            
            this.loadedAssets.add(assetInfo.id);
            this.updateProgress();
            
        } catch (error) {
            console.error(`Failed to load asset ${assetInfo.id}:`, error);
            
            // Retry logic
            assetInfo.attempts++;
            if (assetInfo.attempts < this.retryAttempts) {
                console.log(`Retrying asset ${assetInfo.id} (attempt ${assetInfo.attempts + 1}/${this.retryAttempts})`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return this.loadAsset(assetInfo);
            }
            
            this.failedAssets.add(assetInfo.id);
            this.updateProgress();
            
            if (this.onError) {
                this.onError(assetInfo.id, error);
            }
        }
    }
    
    // Load sprite image
    async loadSprite(assetInfo) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                resolve({
                    image: img,
                    width: img.width,
                    height: img.height,
                    type: 'sprite',
                    ...assetInfo.options
                });
            };
            
            img.onerror = () => {
                reject(new Error(`Failed to load image: ${assetInfo.path}`));
            };
            
            // Handle CORS if needed
            if (assetInfo.options.crossOrigin) {
                img.crossOrigin = assetInfo.options.crossOrigin;
            }
            
            img.src = assetInfo.path;
        });
    }
    
    // Load spritesheet with metadata
    async loadSpritesheet(assetInfo) {
        // Load image and metadata concurrently
        const [image, metadata] = await Promise.all([
            this.loadSprite(assetInfo),
            fetch(assetInfo.options.metadataPath).then(r => r.json())
        ]);
        
        // Process spritesheet frames
        const frames = {};
        for (const [frameId, frameData] of Object.entries(metadata.frames)) {
            frames[frameId] = {
                x: frameData.frame.x,
                y: frameData.frame.y,
                width: frameData.frame.w,
                height: frameData.frame.h,
                sourceSize: frameData.sourceSize,
                spriteSourceSize: frameData.spriteSourceSize
            };
        }
        
        return {
            image: image.image,
            frames,
            animations: metadata.animations || {},
            type: 'spritesheet'
        };
    }
    
    // Load audio asset
    async loadAudio(assetInfo) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            
            audio.oncanplaythrough = () => {
                resolve({
                    audio,
                    duration: audio.duration,
                    type: 'audio',
                    ...assetInfo.options
                });
            };
            
            audio.onerror = () => {
                reject(new Error(`Failed to load audio: ${assetInfo.path}`));
            };
            
            // Set audio properties
            if (assetInfo.options.loop) audio.loop = true;
            if (assetInfo.options.volume !== undefined) audio.volume = assetInfo.options.volume;
            if (assetInfo.options.preload) audio.preload = assetInfo.options.preload;
            
            audio.src = assetInfo.path;
            audio.load();
        });
    }
    
    // Load font
    async loadFont(assetInfo) {
        const font = new FontFace(assetInfo.id, `url(${assetInfo.path})`);
        await font.load();
        document.fonts.add(font);
        
        return {
            family: assetInfo.id,
            type: 'font',
            ...assetInfo.options
        };
    }
    
    // Load JSON data
    async loadData(assetInfo) {
        const response = await fetch(assetInfo.path);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return {
            data,
            type: 'data',
            ...assetInfo.options
        };
    }
    
    // Update loading progress
    updateProgress() {
        const loaded = this.loadedAssets.size + this.failedAssets.size;
        this.loadProgress = this.totalAssets > 0 ? loaded / this.totalAssets : 1;
        
        if (this.onProgress) {
            this.onProgress(this.loadProgress, loaded, this.totalAssets);
        }
    }
    
    // Get sprite by ID
    getSprite(id) {
        if (this.sprites.has(id)) {
            return this.sprites.get(id);
        }
        
        // Check spritesheets
        for (const [sheetId, sheet] of this.spritesheets.entries()) {
            if (sheet.frames[id]) {
                return {
                    image: sheet.image,
                    frame: sheet.frames[id],
                    type: 'sprite_frame',
                    spritesheet: sheetId
                };
            }
        }
        
        console.warn(`Sprite ${id} not found, using fallback`);
        return {
            image: this.fallbackSprite,
            width: 32,
            height: 32,
            type: 'fallback'
        };
    }
    
    // Get audio by ID
    getAudio(id) {
        const audio = this.audio.get(id);
        if (!audio) {
            console.warn(`Audio ${id} not found`);
            return this.fallbackAudio;
        }
        return audio;
    }
    
    // Get spritesheet by ID
    getSpritesheet(id) {
        return this.spritesheets.get(id);
    }
    
    // Get data by ID
    getData(id) {
        const data = this.data.get(id);
        return data ? data.data : null;
    }
    
    // Check if asset is loaded
    isLoaded(id) {
        return this.loadedAssets.has(id);
    }
    
    // Get loading progress
    getProgress() {
        return {
            progress: this.loadProgress,
            loaded: this.loadedAssets.size,
            failed: this.failedAssets.size,
            total: this.totalAssets,
            isLoading: this.isLoading
        };
    }
    
    // Set callbacks
    setCallbacks({ onProgress, onComplete, onError } = {}) {
        if (onProgress) this.onProgress = onProgress;
        if (onComplete) this.onComplete = onComplete;
        if (onError) this.onError = onError;
    }
    
    // Preload critical assets
    async preloadCritical() {
        const criticalAssets = this.loadQueue.filter(asset => asset.options.critical === true);
        await this.processAssetBatch(criticalAssets, 1);
    }
    
    // Unload asset to free memory
    unloadAsset(id) {
        this.sprites.delete(id);
        this.spritesheets.delete(id);
        this.audio.delete(id);
        this.fonts.delete(id);
        this.data.delete(id);
        this.loadedAssets.delete(id);
    }
    
    // Clear all assets
    clear() {
        this.sprites.clear();
        this.spritesheets.clear();
        this.audio.clear();
        this.fonts.clear();
        this.data.clear();
        this.loadedAssets.clear();
        this.failedAssets.clear();
        this.loadQueue = [];
    }
    
    // Get asset statistics
    getStats() {
        return {
            sprites: this.sprites.size,
            spritesheets: this.spritesheets.size,
            audio: this.audio.size,
            fonts: this.fonts.size,
            data: this.data.size,
            totalLoaded: this.loadedAssets.size,
            totalFailed: this.failedAssets.size,
            queueSize: this.loadQueue.length,
            isLoading: this.isLoading
        };
    }
}