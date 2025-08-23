// Base Scene class for managing game scenes with lifecycle methods
// Provides foundation for scene transitions, asset management, and state persistence

export class Scene {
    constructor(name) {
        this.name = name;
        this.isLoaded = false;
        this.isActive = false;
        this.entities = [];
        this.assets = new Set(); // Track scene-specific assets
        this.transitionData = null; // Data passed between scenes
        
        // Scene lifecycle callbacks
        this.onLoad = null;
        this.onUnload = null;
        this.onActivate = null;
        this.onDeactivate = null;
        
        // Performance tracking
        this.updateTime = 0;
        this.renderTime = 0;
    }
    
    // Initialize scene - called once when scene is first created
    async init(engine) {
        this.engine = engine;
        await this.load();
        this.isLoaded = true;
        
        if (this.onLoad) {
            this.onLoad();
        }
        
        console.log(`Scene '${this.name}' initialized`);
    }
    
    // Load scene assets and setup - override in subclasses
    async load() {
        // Override in subclasses to load scene-specific assets
        console.log(`Loading scene: ${this.name}`);
    }
    
    // Unload scene assets and cleanup
    async unload() {
        // Clean up scene-specific assets
        for (const assetName of this.assets) {
            if (this.engine.assetManager) {
                this.engine.assetManager.unloadAsset(assetName);
            }
        }
        this.assets.clear();
        
        // Clean up entities
        this.cleanup();
        this.isLoaded = false;
        
        if (this.onUnload) {
            this.onUnload();
        }
        
        console.log(`Scene '${this.name}' unloaded`);
    }
    
    // Activate scene - called when scene becomes active
    activate(transitionData = null) {
        this.isActive = true;
        this.transitionData = transitionData;
        
        if (this.onActivate) {
            this.onActivate(transitionData);
        }
        
        console.log(`Scene '${this.name}' activated`);
    }
    
    // Deactivate scene - called when scene becomes inactive
    deactivate() {
        this.isActive = false;
        
        if (this.onDeactivate) {
            this.onDeactivate();
        }
        
        console.log(`Scene '${this.name}' deactivated`);
    }
    
    // Update scene - called every frame when active
    update(deltaTime, inputManager) {
        if (!this.isActive || !this.isLoaded) return;
        
        const startTime = performance.now();
        
        // Update all entities
        for (const entity of this.entities) {
            if (entity.update) {
                entity.update(deltaTime, inputManager);
            }
        }
        
        // Override in subclasses for scene-specific updates
        this.updateScene(deltaTime, inputManager);
        
        this.updateTime = performance.now() - startTime;
    }
    
    // Render scene - called every frame when active
    render(renderSystem) {
        if (!this.isActive || !this.isLoaded) return;
        
        const startTime = performance.now();
        
        // Override in subclasses for scene-specific rendering
        this.renderScene(renderSystem);
        
        this.renderTime = performance.now() - startTime;
    }
    
    // Scene-specific update logic - override in subclasses
    updateScene(deltaTime, inputManager) {
        // Override in subclasses
    }
    
    // Scene-specific render logic - override in subclasses
    renderScene(renderSystem) {
        // Default: render all entities
        const visibleEntities = renderSystem.cullEntities(this.entities);
        
        for (const entity of visibleEntities) {
            if (entity.render) {
                entity.render(renderSystem);
            }
        }
    }
    
    // Add entity to scene
    addEntity(entity) {
        this.entities.push(entity);
        
        // Initialize entity if it has an init method
        if (entity.init && this.engine) {
            entity.init(this.engine);
        }
    }
    
    // Remove entity from scene
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }
    
    // Find entity by type or predicate
    findEntity(predicate) {
        if (typeof predicate === 'string') {
            // Find by entity type/name
            return this.entities.find(entity => 
                entity.constructor.name.toLowerCase().includes(predicate.toLowerCase()) ||
                entity.name === predicate
            );
        } else if (typeof predicate === 'function') {
            // Find by custom predicate function
            return this.entities.find(predicate);
        }
        return null;
    }
    
    // Get all entities of a specific type
    getEntitiesOfType(type) {
        if (typeof type === 'string') {
            return this.entities.filter(entity => 
                entity.constructor.name.toLowerCase().includes(type.toLowerCase())
            );
        } else {
            // Filter by constructor/class
            return this.entities.filter(entity => entity instanceof type);
        }
    }
    
    // Queue asset for loading
    queueAsset(assetName, assetPath, options = {}) {
        if (this.engine.assetManager) {
            this.engine.assetManager.queueSprite(assetName, assetPath, options);
            this.assets.add(assetName);
        }
    }
    
    // Get scene transition data
    getTransitionData() {
        return this.transitionData;
    }
    
    // Set scene transition data
    setTransitionData(data) {
        this.transitionData = data;
    }
    
    // Clean up scene resources
    cleanup() {
        this.entities = [];
        this.transitionData = null;
    }
    
    // Get scene performance stats
    getPerformanceStats() {
        return {
            updateTime: this.updateTime,
            renderTime: this.renderTime,
            totalTime: this.updateTime + this.renderTime,
            entityCount: this.entities.length,
            assetCount: this.assets.size
        };
    }
    
    // Check if scene has specific entity
    hasEntity(entity) {
        return this.entities.includes(entity);
    }
    
    // Handle scene-specific input - override in subclasses
    handleInput(inputManager) {
        // Override in subclasses for scene-specific input handling
    }
    
    // Save scene state - override in subclasses
    saveState() {
        return {
            name: this.name,
            entities: this.entities.map(entity => ({
                type: entity.constructor.name,
                data: entity.serialize ? entity.serialize() : null
            }))
        };
    }
    
    // Load scene state - override in subclasses
    loadState(stateData) {
        // Override in subclasses to restore scene state
        console.log(`Loading state for scene: ${this.name}`, stateData);
    }
    
    // Pause scene updates
    pause() {
        this.isActive = false;
    }
    
    // Resume scene updates
    resume() {
        this.isActive = true;
    }
    
    // Check if scene is ready for transitions
    isReadyForTransition() {
        return this.isLoaded && !this.hasLoadingAssets();
    }
    
    // Check if scene has assets still loading
    hasLoadingAssets() {
        if (!this.engine.assetManager) return false;
        
        for (const assetName of this.assets) {
            if (!this.engine.assetManager.isLoaded(assetName)) {
                return true;
            }
        }
        return false;
    }
}