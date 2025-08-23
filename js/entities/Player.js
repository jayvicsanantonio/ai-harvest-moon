// Player entity representing the main character
// Manages player state, movement, inventory, and interactions

import { MovementComponent } from '../engine/MovementSystem.js';
import { AnimationStateMachine } from '../engine/AnimationSystem.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { InventoryUI } from '../ui/InventoryUI.js';

export class Player {
    constructor(x = 0, y = 0, gameEngine = null) {
        // Position and physics
        this.x = x;
        this.y = y;
        this.width = 28; // Slightly smaller than tile for better feel
        this.height = 28;
        this.collisionBodyId = null;
        
        // Movement properties
        this.moveSpeed = 120; // pixels per second
        this.facing = 'down';
        this.isMoving = false;
        this.targetX = x;
        this.targetY = y;
        this.moveProgress = 0;
        
        // Animation system
        this.currentSprite = 'player_idle_down';
        this.animations = new Map();
        this.currentAnimation = null;
        this.animationTime = 0;
        this.frameTime = 150; // ms per frame
        
        // Game state
        this.stamina = {
            current: 100,
            max: 100,
            regenRate: 10 // per second when idle
        };
        
        this.inventory = new InventorySystem();
        this.inventoryUI = new InventoryUI(this);
        this.money = 500;
        this.tools = new Map();
        this.seeds = {
            turnip: 10,
            potato: 5,
            carrot: 5,
            corn: 2,
            tomato: 2
        };
        this.relationships = new Map();
        this.currentTool = null;
        this.currentSeed = 'turnip';
        
        // References to game systems
        this.gameEngine = gameEngine;
        
        // Enhanced movement system
        this.movement = new MovementComponent(this, {
            speed: this.moveSpeed,
            smoothing: 0.15,
            gridBased: false
        });
        
        // Animation state machine
        this.animationStateMachine = null;
        this.entityId = `player_${Date.now()}`;
        
        this.setupAnimations();
        this.initializeTools();
    }
    
    setupAnimations() {
        // Define animation frames for each direction
        this.animations.set('idle_down', ['player_idle_down']);
        this.animations.set('idle_up', ['player_idle_up']);
        this.animations.set('idle_left', ['player_idle_left']);
        this.animations.set('idle_right', ['player_idle_right']);
        
        this.animations.set('walk_down', ['player_walk_down_1', 'player_walk_down_2', 'player_walk_down_3', 'player_walk_down_2']);
        this.animations.set('walk_up', ['player_walk_up_1', 'player_walk_up_2', 'player_walk_up_3', 'player_walk_up_2']);
        this.animations.set('walk_left', ['player_walk_left_1', 'player_walk_left_2', 'player_walk_left_3', 'player_walk_left_2']);
        this.animations.set('walk_right', ['player_walk_right_1', 'player_walk_right_2', 'player_walk_right_3', 'player_walk_right_2']);
        
        // Set initial animation
        this.setAnimation('idle_down');
    }
    
    initializeTools() {
        // Create tools using ToolSystem if available
        if (this.gameEngine?.toolSystem) {
            const toolSystem = this.gameEngine.toolSystem;
            
            // Create basic tools
            const hoe = toolSystem.createTool('basic_hoe', this.entityId);
            const wateringCan = toolSystem.createTool('basic_watering_can', this.entityId);
            const axe = toolSystem.createTool('basic_axe', this.entityId);
            const pickaxe = toolSystem.createTool('basic_pickaxe', this.entityId);
            
            // Add tools to inventory system
            if (hoe) this.inventory.addItem('hoe', 1, 'normal', { toolId: hoe.id });
            if (wateringCan) this.inventory.addItem('watering_can', 1, 'normal', { toolId: wateringCan.id });
            if (axe) this.inventory.addItem('axe', 1, 'normal', { toolId: axe.id });
            if (pickaxe) this.inventory.addItem('pickaxe', 1, 'normal', { toolId: pickaxe.id });
            
            // Set default active tool
            if (hoe) {
                toolSystem.setActiveTool(this.entityId, hoe.id);
                this.currentTool = 'hoe';
            }
        }
        
        // Add starting seeds to inventory
        this.inventory.addItem('turnip_seeds', 10);
        this.inventory.addItem('potato_seeds', 5);
        this.inventory.addItem('carrot_seeds', 5);
        this.inventory.addItem('corn_seeds', 2);
        this.inventory.addItem('tomato_seeds', 2);
        
        // Keep tools map for backward compatibility
        this.tools.set('hoe', { durability: 100, efficiency: 1 });
        this.tools.set('watering_can', { water: 20, capacity: 20, efficiency: 1 });
        this.tools.set('seeds', { seeds: this.seeds, efficiency: 1 });
        this.tools.set('axe', { durability: 100, efficiency: 1 });
        this.tools.set('pickaxe', { durability: 100, efficiency: 1 });
        this.currentTool = 'hoe';
        
        console.log('Player initialized with starting tools and seeds');
    }
    
    init(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Register collision body
        if (gameEngine.collisionSystem) {
            this.collisionBodyId = gameEngine.collisionSystem.addBody(
                this.x + 2, this.y + 2, this.width - 4, this.height - 4,
                {
                    layer: gameEngine.collisionSystem.layers.ENTITIES,
                    solid: true,
                    userData: { type: 'player', entity: this }
                }
            );
        }
        
        // Register with stamina system
        if (gameEngine.staminaSystem) {
            gameEngine.staminaSystem.addEntity(this.entityId, this.stamina.max, this.stamina.regenRate);
            
            // Set up stamina callbacks
            gameEngine.staminaSystem.setCallbacks(this.entityId, {
                onExhaustion: () => this.onExhaustion(),
                onRecovery: () => this.onRecovery(),
                onChange: (id, current, old) => this.onStaminaChange(current, old)
            });
        }
        
        // Set up animation state machine
        if (gameEngine.animationSystem) {
            this.animationStateMachine = new AnimationStateMachine(gameEngine.animationSystem, this.entityId);
            this.setupAnimationStateMachine();
        }
    }
    
    setupAnimationStateMachine() {
        if (!this.animationStateMachine) return;
        
        // Add animation states
        this.animationStateMachine.addState('idle_down', 'idle_down');
        this.animationStateMachine.addState('idle_up', 'idle_up');
        this.animationStateMachine.addState('idle_left', 'idle_left');
        this.animationStateMachine.addState('idle_right', 'idle_right');
        this.animationStateMachine.addState('walk_down', 'walk_down');
        this.animationStateMachine.addState('walk_up', 'walk_up');
        this.animationStateMachine.addState('walk_left', 'walk_left');
        this.animationStateMachine.addState('walk_right', 'walk_right');
        
        // Add transitions based on movement and facing
        const addDirectionalTransitions = (direction) => {
            // Idle to walking
            this.animationStateMachine.addTransition(
                `idle_${direction}`, `walk_${direction}`,
                (params) => params.get('isMoving') && params.get('facing') === direction
            );
            
            // Walking to idle
            this.animationStateMachine.addTransition(
                `walk_${direction}`, `idle_${direction}`,
                (params) => !params.get('isMoving') && params.get('facing') === direction
            );
            
            // Direction changes
            ['down', 'up', 'left', 'right'].forEach(otherDir => {
                if (otherDir !== direction) {
                    this.animationStateMachine.addTransition(
                        `idle_${direction}`, `idle_${otherDir}`,
                        (params) => !params.get('isMoving') && params.get('facing') === otherDir
                    );
                    this.animationStateMachine.addTransition(
                        `walk_${direction}`, `walk_${otherDir}`,
                        (params) => params.get('isMoving') && params.get('facing') === otherDir
                    );
                }
            });
        };
        
        ['down', 'up', 'left', 'right'].forEach(addDirectionalTransitions);
        
        // Start with idle_down
        this.animationStateMachine.forceState('idle_down');
    }
    
    update(deltaTime, inputManager) {
        if (!this.gameEngine) return;
        
        // Handle input and movement
        this.handleInput(inputManager, deltaTime);
        
        // Update movement system
        this.movement.update(deltaTime);
        
        // Update facing direction based on movement
        if (this.movement.isMoving) {
            this.facing = this.movement.getFacing();
            this.isMoving = true;
            
            // Start walking activity for stamina
            if (this.gameEngine.staminaSystem) {
                this.gameEngine.staminaSystem.startActivity(this.entityId, 'walking');
            }
        } else {
            this.isMoving = false;
            
            // Stop walking activity
            if (this.gameEngine.staminaSystem) {
                this.gameEngine.staminaSystem.stopActivity(this.entityId);
            }
        }
        
        // Handle farming interactions
        if (inputManager.isKeyPressed('Space')) {
            this.handleFarmingAction();
        }
        
        // Handle tool switching
        if (inputManager.isKeyPressed('KeyQ')) {
            this.switchTool();
        }
        
        // Handle seed switching
        if (inputManager.isKeyPressed('KeyE')) {
            this.switchSeed();
        }
        
        // Handle inventory UI
        if (inputManager.isKeyPressed('KeyI')) {
            this.inventoryUI.toggle();
        }
        
        // Update inventory UI input
        this.inventoryUI.handleInput(inputManager);
        
        // Update animation state machine
        if (this.animationStateMachine) {
            this.animationStateMachine.setParameter('isMoving', this.isMoving);
            this.animationStateMachine.setParameter('facing', this.facing);
            this.animationStateMachine.update();
            
            // Get current sprite from animation system
            if (this.gameEngine.animationSystem) {
                const sprite = this.gameEngine.animationSystem.getCurrentSprite(this.entityId);
                if (sprite) {
                    this.currentSprite = sprite;
                }
            }
        } else {
            // Fallback to old animation system
            this.updateAnimation(deltaTime);
        }
        
        // Update camera to follow player
        if (this.gameEngine.renderSystem) {
            this.gameEngine.renderSystem.centerCameraOn(
                this.x + this.width / 2,
                this.y + this.height / 2,
                0.05 // Smooth following
            );
        }
    }
    
    handleInput(inputManager, deltaTime) {
        const movement = inputManager.getMovementVector();
        
        // Check if player has enough stamina to move
        const canMove = !this.gameEngine.staminaSystem || 
                       this.gameEngine.staminaSystem.canPerformActivity(this.entityId, 'walking');
        
        if ((movement.x !== 0 || movement.y !== 0) && canMove) {
            // Calculate movement distance
            const moveDistance = this.moveSpeed * deltaTime / 1000;
            const deltaX = movement.x * moveDistance;
            const deltaY = movement.y * moveDistance;
            
            // Use enhanced movement system
            this.movement.moveWithCollision(deltaX, deltaY);
        }
        
        // Handle tool usage
        if (inputManager.isActionPressed('use_tool')) {
            this.useTool();
        }
        
        // Handle interaction
        if (inputManager.isActionPressed('interact')) {
            this.interact();
        }
        
        // Handle tool switching (1-9 keys)
        for (let i = 1; i <= 9; i++) {
            if (inputManager.isActionPressed(`tool_${i}`)) {
                this.switchTool(i);
            }
        }
    }
    
    updateFacing(deltaX, deltaY) {
        // Prioritize the stronger movement direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            this.facing = deltaX > 0 ? 'right' : 'left';
        } else if (deltaY !== 0) {
            this.facing = deltaY > 0 ? 'down' : 'up';
        }
    }
    
    move(deltaX, deltaY) {
        if (!this.gameEngine?.collisionSystem) {
            // Fallback movement without collision
            this.x += deltaX;
            this.y += deltaY;
            this.isMoving = true;
            return;
        }
        
        // Use collision system for movement
        const actualMovement = this.gameEngine.collisionSystem.moveBody(
            this.collisionBodyId, deltaX, deltaY
        );
        
        // Update player position based on actual movement
        this.x += actualMovement.x;
        this.y += actualMovement.y;
        
        this.isMoving = actualMovement.x !== 0 || actualMovement.y !== 0;
        
        // Consume stamina when moving
        if (this.isMoving) {
            const staminaCost = 5 * Math.abs(actualMovement.x + actualMovement.y);
            this.consumeStamina(staminaCost);
        }
    }
    
    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
        
        // Determine current animation based on state
        let animationName;
        if (this.isMoving) {
            animationName = `walk_${this.facing}`;
        } else {
            animationName = `idle_${this.facing}`;
        }
        
        // Change animation if needed
        if (this.currentAnimation !== animationName) {
            this.setAnimation(animationName);
        }
        
        // Update sprite frame
        if (this.currentAnimation) {
            const frames = this.animations.get(this.currentAnimation);
            if (frames && frames.length > 0) {
                const frameIndex = Math.floor(this.animationTime / this.frameTime) % frames.length;
                this.currentSprite = frames[frameIndex];
            }
        }
    }
    
    setAnimation(animationName) {
        if (this.animations.has(animationName)) {
            this.currentAnimation = animationName;
            this.animationTime = 0;
        }
    }
    
    useTool() {
        if (!this.currentTool || this.stamina.current < 10) return;
        
        // Calculate target tile based on facing direction
        const tileSize = 32;
        let targetX = Math.floor(this.x / tileSize);
        let targetY = Math.floor(this.y / tileSize);
        
        switch (this.facing) {
            case 'up': targetY -= 1; break;
            case 'down': targetY += 1; break;
            case 'left': targetX -= 1; break;
            case 'right': targetX += 1; break;
        }
        
        // Consume stamina for tool use
        this.consumeStamina(10);
        
        // Emit tool use event
        this.emitEvent('toolUsed', {
            tool: this.currentTool,
            targetX,
            targetY,
            playerX: this.x,
            playerY: this.y
        });
    }
    
    interact() {
        // Calculate interaction target based on facing direction
        const interactionRange = 40;
        let targetX = this.x + this.width / 2;
        let targetY = this.y + this.height / 2;
        
        switch (this.facing) {
            case 'up': targetY -= interactionRange; break;
            case 'down': targetY += interactionRange; break;
            case 'left': targetX -= interactionRange; break;
            case 'right': targetX += interactionRange; break;
        }
        
        // Check for interactable objects
        if (this.gameEngine?.collisionSystem) {
            const collisions = this.gameEngine.collisionSystem.checkPoint(
                targetX, targetY,
                this.gameEngine.collisionSystem.layers.OBJECTS | 
                this.gameEngine.collisionSystem.layers.TRIGGERS
            );
            
            if (collisions) {
                this.emitEvent('interaction', {
                    target: collisions.userData,
                    playerX: this.x,
                    playerY: this.y
                });
            }
        }
    }
    
    switchTool(toolNumber) {
        const toolNames = Array.from(this.tools.keys());
        if (toolNumber > 0 && toolNumber <= toolNames.length) {
            this.currentTool = toolNames[toolNumber - 1];
            this.emitEvent('toolChanged', { tool: this.currentTool });
        }
    }
    
    // Stamina system callbacks
    onExhaustion() {
        this.emitEvent('playerExhausted', { stamina: this.getStaminaFromSystem() });
        // Could add visual effects, force slower movement, etc.
    }
    
    onRecovery() {
        this.emitEvent('playerRecovered', { stamina: this.getStaminaFromSystem() });
    }
    
    onStaminaChange(current, old) {
        // Update local stamina for UI
        this.stamina.current = current;
        this.emitEvent('staminaChanged', { current, old, max: this.stamina.max });
    }
    
    getStaminaFromSystem() {
        if (this.gameEngine.staminaSystem) {
            return this.gameEngine.staminaSystem.getStamina(this.entityId);
        }
        return this.stamina;
    }
    
    // Handle farming actions based on current tool and position
    handleFarmingAction() {
        if (!this.gameEngine.farmingSystem) return;
        
        const farmingSystem = this.gameEngine.farmingSystem;
        const currentTool = this.tools.get(this.currentTool);
        
        if (!currentTool) {
            console.log(`No ${this.currentTool} available!`);
            return;
        }
        
        // Calculate target position based on facing direction
        const targetX = this.x + (this.facing === 'right' ? 32 : this.facing === 'left' ? -32 : 0);
        const targetY = this.y + (this.facing === 'down' ? 32 : this.facing === 'up' ? -32 : 0);
        
        // Check if target position is farmable
        if (!farmingSystem.isFarmableTile(targetX, targetY)) {
            console.log('Cannot farm here - not a farmable area');
            return;
        }
        
        // Get farm tile to check current state
        const farmTile = farmingSystem.getFarmTile(targetX, targetY);
        
        // Perform action based on tool type and soil state
        let actionPerformed = false;
        
        if (this.currentTool === 'hoe') {
            if (farmTile.soilState === farmingSystem.soilStates.UNTILLED) {
                actionPerformed = farmingSystem.tillSoil(targetX, targetY, this, {
                    type: 'hoe',
                    durability: currentTool.durability,
                    efficiency: currentTool.efficiency
                });
                
                if (actionPerformed) {
                    // Update tool durability
                    currentTool.durability = Math.max(0, currentTool.durability - 1);
                }
            } else {
                console.log('Soil is already tilled or has a crop');
            }
        } else if (this.currentTool === 'watering_can') {
            if (farmTile.soilState !== farmingSystem.soilStates.UNTILLED) {
                actionPerformed = farmingSystem.waterSoil(targetX, targetY, this, {
                    type: 'watering_can',
                    water: currentTool.water,
                    capacity: currentTool.capacity,
                    efficiency: currentTool.efficiency
                });
                
                if (actionPerformed) {
                    // Update watering can water level
                    currentTool.water = Math.max(0, currentTool.water - 1);
                }
            } else {
                console.log('Till the soil first before watering');
            }
        } else if (this.currentTool === 'seeds') {
            if (farmTile.soilState === farmingSystem.soilStates.TILLED || 
                farmTile.soilState === farmingSystem.soilStates.WATERED) {
                const tileX = Math.floor(targetX / 32);
                const tileY = Math.floor(targetY / 32);
                
                actionPerformed = farmingSystem.plantSeed(tileX, tileY, this.currentSeed, this, {
                    type: 'seeds',
                    seeds: currentTool.seeds,
                    efficiency: currentTool.efficiency
                });
                
                if (actionPerformed) {
                    console.log(`Planted ${this.currentSeed} seed`);
                }
            } else {
                console.log('Prepare the soil first (till and optionally water)');
            }
        }
        
        // Check if there's a harvestable crop (hands - no tool required)
        if (!actionPerformed) {
            const tileX = Math.floor(targetX / 32);
            const tileY = Math.floor(targetY / 32);
            const crop = farmingSystem.getCropAt(tileX, tileY);
            
            if (crop && crop.isReadyForHarvest()) {
                const harvestResult = farmingSystem.harvestCrop(tileX, tileY, this);
                if (harvestResult) {
                    console.log(`Harvested ${harvestResult.amount}x ${harvestResult.itemType}!`);
                    actionPerformed = true;
                }
            }
        }
        
        // Visual feedback
        if (actionPerformed) {
            console.log(`Used ${this.currentTool} at position (${Math.floor(targetX/32)}, ${Math.floor(targetY/32)})`);
        }
    }
    
    // Switch between available seed types
    switchSeed() {
        const seedTypes = ['turnip', 'potato', 'carrot', 'corn', 'tomato'];
        const availableSeeds = seedTypes.filter(seedType => {
            const seedItemId = `${seedType}_seeds`;
            return this.inventory.hasItem(seedItemId, 1);
        });
        
        if (availableSeeds.length === 0) {
            console.log('No seeds available!');
            return;
        }
        
        const currentIndex = availableSeeds.indexOf(this.currentSeed);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % availableSeeds.length;
        
        this.currentSeed = availableSeeds[nextIndex];
        const seedItemId = `${this.currentSeed}_seeds`;
        const seedCount = this.inventory.getItemCount(seedItemId);
        console.log(`Selected ${this.currentSeed} seeds (${seedCount} remaining)`);
    }
    
    // Switch between available tools
    switchTool() {
        const toolTypes = Array.from(this.tools.keys());
        const currentIndex = toolTypes.indexOf(this.currentTool);
        const nextIndex = (currentIndex + 1) % toolTypes.length;
        
        this.currentTool = toolTypes[nextIndex];
        console.log(`Switched to ${this.currentTool}`);
        
        // Show tool status
        const tool = this.tools.get(this.currentTool);
        if (tool) {
            if (this.currentTool === 'watering_can') {
                console.log(`${this.currentTool}: ${tool.water}/${tool.capacity} water`);
            } else {
                console.log(`${this.currentTool}: ${tool.durability} durability`);
            }
        }
    }
    
    render(renderSystem) {
        // Draw the player sprite with current animation frame
        renderSystem.drawSprite(
            this.currentSprite,
            this.x,
            this.y,
            this.width,
            this.height,
            {
                layer: 10, // Above ground tiles
                flipX: false,
                flipY: false
            }
        );
        
        // Draw stamina bar above player if not at full stamina
        if (this.stamina.current < this.stamina.max) {
            const barWidth = this.width;
            const barHeight = 4;
            const barY = this.y - 8;
            
            // Background
            renderSystem.drawRect(
                this.x, barY, barWidth, barHeight, '#333333',
                { layer: 15, alpha: 0.8 }
            );
            
            // Stamina fill
            const fillWidth = (this.stamina.current / this.stamina.max) * barWidth;
            renderSystem.drawRect(
                this.x, barY, fillWidth, barHeight, '#4CAF50',
                { layer: 16 }
            );
        }
        
        // Render inventory UI if open
        this.inventoryUI.render(renderSystem);
    }
    
    consumeStamina(amount) {
        this.stamina.current = Math.max(0, this.stamina.current - amount);
    }

    restoreStamina(amount) {
        this.stamina.current = Math.min(this.stamina.max, this.stamina.current + amount);
    }

    addToInventory(item, quantity = 1) {
        const current = this.inventory.get(item) || 0;
        this.inventory.set(item, current + quantity);
        this.emitEvent('inventoryChanged', { item, quantity, total: current + quantity });
    }

    removeFromInventory(item, quantity = 1) {
        const current = this.inventory.get(item) || 0;
        if (current >= quantity) {
            this.inventory.set(item, current - quantity);
            this.emitEvent('inventoryChanged', { item, quantity: -quantity, total: current - quantity });
            return true;
        }
        return false;
    }
    
    // Event system for game integration
    emitEvent(eventType, data) {
        if (this.gameEngine) {
            const event = new CustomEvent(eventType, { 
                detail: { player: this, ...data } 
            });
            window.dispatchEvent(event);
        }
    }
    
    // Get current position as tile coordinates
    getTilePosition() {
        return {
            x: Math.floor(this.x / 32),
            y: Math.floor(this.y / 32)
        };
    }
    
    // Get player state for saving
    getState() {
        return {
            x: this.x,
            y: this.y,
            facing: this.facing,
            stamina: { ...this.stamina },
            inventory: Object.fromEntries(this.inventory),
            money: this.money,
            tools: Object.fromEntries(this.tools),
            currentTool: this.currentTool,
            relationships: Object.fromEntries(this.relationships)
        };
    }
    
    // Restore player state from save
    setState(state) {
        this.x = state.x || this.x;
        this.y = state.y || this.y;
        this.facing = state.facing || this.facing;
        this.stamina = { ...this.stamina, ...state.stamina };
        this.inventory = new Map(Object.entries(state.inventory || {}));
        this.money = state.money || this.money;
        this.tools = new Map(Object.entries(state.tools || {}));
        this.currentTool = state.currentTool || this.currentTool;
        this.relationships = new Map(Object.entries(state.relationships || {}));
        
        // Update collision body position
        if (this.gameEngine?.collisionSystem && this.collisionBodyId) {
            this.gameEngine.collisionSystem.updateBody(
                this.collisionBodyId, this.x + 2, this.y + 2
            );
        }
    }
}