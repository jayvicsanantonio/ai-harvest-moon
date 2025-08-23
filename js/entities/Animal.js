// Animal entity with happiness, hunger, and behavior state management
// Handles animal AI, care interactions, and product generation systems

export class Animal {
    constructor(x, y, animalType, gameEngine) {
        this.x = x;
        this.y = y;
        this.animalType = animalType;
        this.gameEngine = gameEngine;
        
        // Entity management
        this.entityId = `animal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.width = 32;
        this.height = 32;
        this.renderLayer = 5;
        
        // Animal type configurations
        this.animalConfigs = {
            cow: {
                name: 'Cow',
                maxHappiness: 100,
                maxHunger: 100,
                product: 'milk',
                productValue: 120,
                productCooldown: 86400000, // 24 hours in milliseconds
                feedTypes: ['hay', 'grass'],
                petBonus: 15,
                animations: {
                    idle: ['cow_idle_down', 'cow_idle_left', 'cow_idle_right', 'cow_idle_up'],
                    eating: ['cow_eating'],
                    happy: ['cow_happy']
                }
            },
            chicken: {
                name: 'Chicken',
                maxHappiness: 100,
                maxHunger: 80,
                product: 'egg',
                productValue: 50,
                productCooldown: 43200000, // 12 hours
                feedTypes: ['seeds', 'grain'],
                petBonus: 10,
                animations: {
                    idle: ['chicken_idle_down', 'chicken_idle_left', 'chicken_idle_right', 'chicken_idle_up'],
                    eating: ['chicken_eating'],
                    happy: ['chicken_happy']
                }
            },
            sheep: {
                name: 'Sheep',
                maxHappiness: 100,
                maxHunger: 90,
                product: 'wool',
                productValue: 180,
                productCooldown: 172800000, // 48 hours
                feedTypes: ['grass', 'hay'],
                petBonus: 12,
                animations: {
                    idle: ['sheep_idle_down', 'sheep_idle_left', 'sheep_idle_right', 'sheep_idle_up'],
                    eating: ['sheep_eating'],
                    happy: ['sheep_happy']
                }
            }
        };
        
        // Initialize animal stats based on type
        const config = this.animalConfigs[animalType];
        if (!config) {
            throw new Error(`Unknown animal type: ${animalType}`);
        }
        
        this.config = config;
        this.name = config.name;
        
        // Core stats
        this.happiness = 75; // Start with decent happiness
        this.maxHappiness = config.maxHappiness;
        this.hunger = 60; // Start slightly hungry
        this.maxHunger = config.maxHunger;
        
        // Care tracking
        this.lastFed = 0;
        this.lastPetted = 0;
        this.lastProductGenerated = Date.now();
        this.timesInteractedToday = 0;
        
        // Product management
        this.hasProduct = false;
        this.productQuality = 'normal';
        this.productHistory = [];
        
        // Behavior state machine
        this.behaviorStates = {
            IDLE: 'idle',
            EATING: 'eating',
            SLEEPING: 'sleeping',
            HAPPY: 'happy',
            DISTRESSED: 'distressed',
            PRODUCING: 'producing'
        };
        
        this.currentState = this.behaviorStates.IDLE;
        this.stateTimer = 0;
        this.stateChangeCooldown = 2000; // 2 seconds between state changes
        
        // Movement and animation
        this.direction = 'down';
        this.currentAnimation = null;
        this.animationTimer = 0;
        this.moveTimer = 0;
        this.moveInterval = 5000; // Move every 5 seconds when idle
        
        // Decay rates (per hour in real time)
        this.happinessDecayRate = 2;
        this.hungerDecayRate = 5;
        
        // Interaction tracking
        this.interactionCooldown = 1000; // 1 second between interactions
        this.lastInteraction = 0;
        
        console.log(`Created ${this.name} at (${x}, ${y})`);
    }
    
    init(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Set up time-based callbacks for daily care
        if (gameEngine.timeSystem) {
            gameEngine.timeSystem.on('onDayChange', (timeData) => {
                this.onNewDay(timeData);
            });
        }
        
        // Start with idle animation
        this.setAnimation('idle');
    }
    
    update(deltaTime) {
        // Update timers
        this.stateTimer += deltaTime;
        this.animationTimer += deltaTime;
        this.moveTimer += deltaTime;
        
        // Apply stat decay over time
        this.updateStatDecay(deltaTime);
        
        // Update behavior state machine
        this.updateBehaviorState(deltaTime);
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Check for product generation
        this.checkProductGeneration();
        
        // Random movement when idle
        if (this.currentState === this.behaviorStates.IDLE && this.moveTimer >= this.moveInterval) {
            this.performRandomMovement();
            this.moveTimer = 0;
        }
    }
    
    updateStatDecay(deltaTime) {
        // Convert delta time to hours for decay calculation
        const hoursElapsed = deltaTime / (1000 * 60 * 60);
        
        // Apply happiness decay
        if (this.happiness > 0) {
            this.happiness = Math.max(0, this.happiness - (this.happinessDecayRate * hoursElapsed));
        }
        
        // Apply hunger decay (hunger increases over time)
        if (this.hunger < this.maxHunger) {
            this.hunger = Math.min(this.maxHunger, this.hunger + (this.hungerDecayRate * hoursElapsed));
        }
    }
    
    updateBehaviorState(deltaTime) {
        // State transition logic based on stats and conditions
        const newState = this.calculateNextState();
        
        if (newState !== this.currentState && this.stateTimer >= this.stateChangeCooldown) {
            this.changeState(newState);
        }
    }
    
    calculateNextState() {
        // Priority-based state selection
        
        // Distressed state - low happiness or high hunger
        if (this.happiness < 20 || this.hunger > 80) {
            return this.behaviorStates.DISTRESSED;
        }
        
        // Happy state - high happiness and low hunger
        if (this.happiness > 80 && this.hunger < 30) {
            return this.behaviorStates.HAPPY;
        }
        
        // Eating state - if recently fed or moderately hungry
        const timeSinceLastFed = Date.now() - this.lastFed;
        if (timeSinceLastFed < 30000 && this.hunger > 40) { // 30 seconds after feeding
            return this.behaviorStates.EATING;
        }
        
        // Producing state - when generating product
        if (this.isGeneratingProduct()) {
            return this.behaviorStates.PRODUCING;
        }
        
        // Default to idle
        return this.behaviorStates.IDLE;
    }
    
    changeState(newState) {
        const oldState = this.currentState;
        this.currentState = newState;
        this.stateTimer = 0;
        
        // Handle state-specific setup
        this.onStateEnter(newState, oldState);
        
        console.log(`${this.name} changed from ${oldState} to ${newState}`);
    }
    
    onStateEnter(newState, oldState) {
        switch (newState) {
            case this.behaviorStates.HAPPY:
                this.setAnimation('happy');
                break;
            case this.behaviorStates.EATING:
                this.setAnimation('eating');
                break;
            case this.behaviorStates.DISTRESSED:
                // Increase decay rates when distressed
                this.happinessDecayRate = 4;
                this.hungerDecayRate = 8;
                break;
            case this.behaviorStates.IDLE:
            default:
                this.setAnimation('idle');
                // Reset decay rates
                this.happinessDecayRate = 2;
                this.hungerDecayRate = 5;
                break;
        }
    }
    
    updateAnimation(deltaTime) {
        // Basic animation cycling - more sophisticated animation handling could be added
        if (this.animationTimer >= 2000) { // Change animation frame every 2 seconds
            this.setAnimation(this.getStateAnimation());
            this.animationTimer = 0;
        }
    }
    
    getStateAnimation() {
        const animations = this.config.animations;
        
        switch (this.currentState) {
            case this.behaviorStates.HAPPY:
                return animations.happy?.[0] || animations.idle[0];
            case this.behaviorStates.EATING:
                return animations.eating?.[0] || animations.idle[0];
            case this.behaviorStates.DISTRESSED:
            case this.behaviorStates.PRODUCING:
            case this.behaviorStates.IDLE:
            default:
                // Cycle through idle animations based on direction
                const idleAnimations = animations.idle;
                const directionIndex = ['down', 'left', 'right', 'up'].indexOf(this.direction);
                return idleAnimations[directionIndex] || idleAnimations[0];
        }
    }
    
    setAnimation(animationKey) {
        if (this.currentAnimation !== animationKey) {
            this.currentAnimation = animationKey;
            
            // Integrate with animation system
            if (this.gameEngine?.animationSystem) {
                // Stop current animation if running
                if (this.currentAnimation) {
                    this.gameEngine.animationSystem.stopAnimation(this.entityId);
                }
                
                // Start new animation
                this.gameEngine.animationSystem.startAnimation(
                    this.entityId,
                    animationKey,
                    {
                        loop: true,
                        priority: 1,
                        tags: ['animal', this.animalType, this.currentState]
                    }
                );
            }
        }
    }
    
    performRandomMovement() {
        // Simple random movement within a small area
        const moveDistance = 16; // Half a tile
        const directions = ['up', 'down', 'left', 'right'];
        const newDirection = directions[Math.floor(Math.random() * directions.length)];
        
        let newX = this.x;
        let newY = this.y;
        
        switch (newDirection) {
            case 'up':
                newY -= moveDistance;
                break;
            case 'down':
                newY += moveDistance;
                break;
            case 'left':
                newX -= moveDistance;
                break;
            case 'right':
                newX += moveDistance;
                break;
        }
        
        // Basic boundary checking (keep within reasonable bounds)
        const bounds = this.getMovementBounds();
        if (newX >= bounds.left && newX <= bounds.right && 
            newY >= bounds.top && newY <= bounds.bottom) {
            this.x = newX;
            this.y = newY;
            this.direction = newDirection;
        }
    }
    
    getMovementBounds() {
        // Allow movement within a 3x3 tile area from spawn point
        const spawnX = this.x;
        const spawnY = this.y;
        const range = 48; // 1.5 tiles
        
        return {
            left: spawnX - range,
            right: spawnX + range,
            top: spawnY - range,
            bottom: spawnY + range
        };
    }
    
    // Animal care interactions
    feed(feedType, player) {
        if (Date.now() - this.lastInteraction < this.interactionCooldown) {
            return { success: false, message: 'Wait a moment before interacting again.' };
        }
        
        // Check if feed type is appropriate
        if (!this.config.feedTypes.includes(feedType)) {
            return { 
                success: false, 
                message: `${this.name} doesn't eat ${feedType}. Try ${this.config.feedTypes.join(' or ')}.` 
            };
        }
        
        // Check if player has the feed item
        if (!player.inventory.hasItem(feedType, 1)) {
            return { 
                success: false, 
                message: `You don't have any ${feedType}.` 
            };
        }
        
        // Consume feed from inventory
        player.inventory.removeItem(feedType, 1);
        
        // Apply feeding effects
        const hungerReduction = 30;
        const happinessBonus = 10;
        
        this.hunger = Math.max(0, this.hunger - hungerReduction);
        this.happiness = Math.min(this.maxHappiness, this.happiness + happinessBonus);
        this.lastFed = Date.now();
        this.lastInteraction = Date.now();
        
        // Change to eating state
        this.changeState(this.behaviorStates.EATING);
        
        console.log(`Fed ${this.name} with ${feedType}`);
        return { 
            success: true, 
            message: `${this.name} enjoys the ${feedType}!`,
            effects: {
                hunger: -hungerReduction,
                happiness: happinessBonus
            }
        };
    }
    
    pet(player) {
        if (Date.now() - this.lastInteraction < this.interactionCooldown) {
            return { success: false, message: 'Wait a moment before petting again.' };
        }
        
        // Limit petting effectiveness per day
        if (this.timesInteractedToday >= 3) {
            return { 
                success: false, 
                message: `${this.name} has been petted enough for today.` 
            };
        }
        
        // Apply petting effects
        const happinessBonus = this.config.petBonus;
        this.happiness = Math.min(this.maxHappiness, this.happiness + happinessBonus);
        this.lastPetted = Date.now();
        this.lastInteraction = Date.now();
        this.timesInteractedToday++;
        
        // Change to happy state
        this.changeState(this.behaviorStates.HAPPY);
        
        console.log(`Petted ${this.name}`);
        return { 
            success: true, 
            message: `${this.name} loves the attention! (+${happinessBonus} happiness)`,
            effects: {
                happiness: happinessBonus
            }
        };
    }
    
    collectProduct(player) {
        if (!this.hasProduct) {
            return { 
                success: false, 
                message: `${this.name} doesn't have any ${this.config.product} ready.` 
            };
        }
        
        // Add product to player inventory
        const productItem = `${this.config.product}_${this.productQuality}`;
        const added = player.inventory.addItem(productItem, 1);
        
        if (!added) {
            return { 
                success: false, 
                message: 'Your inventory is full!' 
            };
        }
        
        // Clear product and reset generation timer
        this.hasProduct = false;
        this.lastProductGenerated = Date.now();
        this.productHistory.push({
            timestamp: Date.now(),
            quality: this.productQuality,
            value: this.calculateProductValue()
        });
        
        console.log(`Collected ${productItem} from ${this.name}`);
        return { 
            success: true, 
            message: `Collected ${this.productQuality} ${this.config.product} from ${this.name}!`,
            product: {
                type: this.config.product,
                quality: this.productQuality,
                value: this.calculateProductValue()
            }
        };
    }
    
    // Product generation system
    checkProductGeneration() {
        if (this.hasProduct) return;
        
        const timeSinceLastProduct = Date.now() - this.lastProductGenerated;
        
        if (timeSinceLastProduct >= this.config.productCooldown) {
            this.generateProduct();
        }
    }
    
    generateProduct() {
        this.hasProduct = true;
        this.productQuality = this.calculateProductQuality();
        this.changeState(this.behaviorStates.PRODUCING);
        
        console.log(`${this.name} produced ${this.productQuality} ${this.config.product}`);
    }
    
    calculateProductQuality() {
        // Quality based on happiness and care
        if (this.happiness >= 80) {
            return Math.random() < 0.3 ? 'gold' : 'silver';
        } else if (this.happiness >= 50) {
            return Math.random() < 0.5 ? 'silver' : 'normal';
        } else {
            return 'normal';
        }
    }
    
    calculateProductValue() {
        const baseValue = this.config.productValue;
        const qualityMultipliers = {
            normal: 1.0,
            silver: 1.5,
            gold: 2.0
        };
        
        return Math.floor(baseValue * qualityMultipliers[this.productQuality]);
    }
    
    isGeneratingProduct() {
        const timeSinceLastProduct = Date.now() - this.lastProductGenerated;
        const productionTime = this.config.productCooldown * 0.9; // 90% of cooldown
        
        return timeSinceLastProduct >= productionTime && timeSinceLastProduct < this.config.productCooldown;
    }
    
    // Daily reset and care tracking
    onNewDay(timeData) {
        // Reset daily interaction counter
        this.timesInteractedToday = 0;
        
        // Apply daily happiness decay if not cared for
        const daysSinceLastCare = this.getDaysSinceLastCare();
        if (daysSinceLastCare > 0) {
            const happinessLoss = daysSinceLastCare * 10;
            this.happiness = Math.max(0, this.happiness - happinessLoss);
            console.log(`${this.name} lost ${happinessLoss} happiness from lack of care`);
        }
        
        console.log(`New day for ${this.name}: Happiness ${this.happiness}, Hunger ${this.hunger}`);
    }
    
    getDaysSinceLastCare() {
        const lastCare = Math.max(this.lastFed, this.lastPetted);
        if (lastCare === 0) return 1; // Never cared for
        
        const timeDiff = Date.now() - lastCare;
        return Math.floor(timeDiff / (24 * 60 * 60 * 1000));
    }
    
    // Rendering and visual information
    render(renderSystem) {
        // Render animal sprite
        if (this.currentAnimation && renderSystem.assetManager) {
            renderSystem.drawSprite(
                this.currentAnimation,
                this.x,
                this.y,
                this.width,
                this.height,
                { layer: this.renderLayer }
            );
        } else {
            // Fallback rendering
            const color = this.getAnimalColor();
            renderSystem.drawRect(
                this.x,
                this.y,
                this.width,
                this.height,
                color,
                { layer: this.renderLayer }
            );
        }
        
        // Render status indicators
        this.renderStatusIndicators(renderSystem);
    }
    
    renderStatusIndicators(renderSystem) {
        // Product ready indicator
        if (this.hasProduct) {
            renderSystem.drawText(
                '!',
                this.x + this.width / 2,
                this.y - 10,
                { 
                    color: '#FFD700', 
                    fontSize: 16, 
                    align: 'center',
                    layer: this.renderLayer + 1 
                }
            );
        }
        
        // Happiness indicator (in debug mode or when very low)
        if (this.gameEngine.isDebugMode() || this.happiness < 30) {
            const heartColor = this.happiness > 50 ? '#FF69B4' : 
                             this.happiness > 20 ? '#FFA500' : '#FF4444';
            
            renderSystem.drawText(
                '♥',
                this.x + this.width - 8,
                this.y - 8,
                { 
                    color: heartColor, 
                    fontSize: 12,
                    layer: this.renderLayer + 1 
                }
            );
        }
    }
    
    getAnimalColor() {
        const colors = {
            cow: '#8B4513',      // Brown
            chicken: '#FFFF00',  // Yellow
            sheep: '#FFFFFF'     // White
        };
        return colors[this.animalType] || '#888888';
    }
    
    // Utility and information methods
    getStatusInfo() {
        return {
            entityId: this.entityId,
            type: this.animalType,
            name: this.name,
            position: { x: this.x, y: this.y },
            happiness: Math.round(this.happiness),
            hunger: Math.round(this.hunger),
            state: this.currentState,
            hasProduct: this.hasProduct,
            productType: this.config.product,
            productQuality: this.productQuality,
            timesInteractedToday: this.timesInteractedToday,
            daysSinceLastCare: this.getDaysSinceLastCare()
        };
    }
    
    getInteractionOptions(player) {
        const options = [];
        
        // Feed options
        for (const feedType of this.config.feedTypes) {
            if (player.inventory.hasItem(feedType, 1)) {
                options.push({
                    action: 'feed',
                    item: feedType,
                    label: `Feed ${feedType}`,
                    enabled: this.hunger > 20
                });
            }
        }
        
        // Pet option
        if (this.timesInteractedToday < 3) {
            options.push({
                action: 'pet',
                label: 'Pet',
                enabled: true
            });
        }
        
        // Collect product option
        if (this.hasProduct) {
            options.push({
                action: 'collect',
                label: `Collect ${this.config.product}`,
                enabled: true
            });
        }
        
        return options;
    }
    
    // Cleanup
    destroy() {
        // Remove any callbacks or references
        console.log(`${this.name} removed from game`);
    }
}