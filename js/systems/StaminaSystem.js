// Stamina system managing energy consumption and regeneration
// Handles player fatigue, activity costs, and recovery mechanics

export class StaminaSystem {
    constructor() {
        this.entities = new Map();
        this.activityCosts = new Map();
        this.recoveryItems = new Map();
        
        this.setupDefaultCosts();
        this.setupRecoveryItems();
    }
    
    setupDefaultCosts() {
        // Activity stamina costs
        this.activityCosts.set('walking', 2); // per second
        this.activityCosts.set('running', 8); // per second
        this.activityCosts.set('tool_use', 15); // per use
        this.activityCosts.set('farming', 12); // per action
        this.activityCosts.set('mining', 18); // per swing
        this.activityCosts.set('fishing', 5); // per cast
        this.activityCosts.set('chopping', 20); // per swing
        this.activityCosts.set('swimming', 25); // per second
        this.activityCosts.set('jumping', 10); // per jump
    }
    
    setupRecoveryItems() {
        // Food items and their stamina recovery
        this.recoveryItems.set('coffee', 25);
        this.recoveryItems.set('energy_drink', 50);
        this.recoveryItems.set('apple', 15);
        this.recoveryItems.set('bread', 20);
        this.recoveryItems.set('cooked_fish', 35);
        this.recoveryItems.set('meal', 60);
        this.recoveryItems.set('sleep', 100); // Full recovery
    }
    
    // Register an entity with stamina
    addEntity(entityId, maxStamina = 100, regenRate = 10) {
        this.entities.set(entityId, {
            current: maxStamina,
            max: maxStamina,
            regenRate, // per second when idle
            lastActivity: 0,
            isExhausted: false,
            exhaustionThreshold: 0.1, // 10% of max stamina
            statusEffects: new Map(),
            
            // Activity tracking
            isActive: false,
            currentActivity: null,
            activityTime: 0,
            
            // Recovery state
            isRecovering: false,
            recoveryMultiplier: 1.0,
            
            // Callbacks
            onExhaustion: null,
            onRecovery: null,
            onChange: null
        });
    }
    
    // Remove entity from system
    removeEntity(entityId) {
        this.entities.delete(entityId);
    }
    
    // Update stamina for all entities
    update(deltaTime) {
        const deltaSeconds = deltaTime / 1000;
        
        for (const [entityId, stamina] of this.entities.entries()) {
            this.updateEntityStamina(entityId, stamina, deltaSeconds);
        }
    }
    
    updateEntityStamina(entityId, stamina, deltaSeconds) {
        const wasExhausted = stamina.isExhausted;
        
        // Handle active activities
        if (stamina.isActive && stamina.currentActivity) {
            stamina.activityTime += deltaSeconds;
            
            const cost = this.getActivityCost(stamina.currentActivity);
            if (cost > 0) {
                this.consumeStamina(entityId, cost * deltaSeconds);
            }
        }
        
        // Handle regeneration when idle
        if (!stamina.isActive && stamina.current < stamina.max) {
            const regenAmount = stamina.regenRate * stamina.recoveryMultiplier * deltaSeconds;
            this.restoreStamina(entityId, regenAmount);
        }
        
        // Update status effects
        this.updateStatusEffects(entityId, stamina, deltaSeconds);
        
        // Check exhaustion state changes
        const isExhausted = stamina.current <= (stamina.max * stamina.exhaustionThreshold);
        if (isExhausted !== wasExhausted) {
            stamina.isExhausted = isExhausted;
            
            if (isExhausted && stamina.onExhaustion) {
                stamina.onExhaustion(entityId);
            } else if (!isExhausted && stamina.onRecovery) {
                stamina.onRecovery(entityId);
            }
        }
    }
    
    updateStatusEffects(entityId, stamina, deltaSeconds) {
        for (const [effectName, effect] of stamina.statusEffects.entries()) {
            effect.duration -= deltaSeconds;
            
            // Apply effect
            if (effect.type === 'regen_boost') {
                stamina.recoveryMultiplier = effect.multiplier;
            }
            
            // Remove expired effects
            if (effect.duration <= 0) {
                stamina.statusEffects.delete(effectName);
                if (effect.type === 'regen_boost') {
                    stamina.recoveryMultiplier = 1.0;
                }
            }
        }
    }
    
    // Consume stamina for an entity
    consumeStamina(entityId, amount) {
        const stamina = this.entities.get(entityId);
        if (!stamina) return false;
        
        const oldValue = stamina.current;
        stamina.current = Math.max(0, stamina.current - amount);
        stamina.lastActivity = Date.now();
        
        if (stamina.onChange) {
            stamina.onChange(entityId, stamina.current, oldValue);
        }
        
        return stamina.current > 0;
    }
    
    // Restore stamina for an entity
    restoreStamina(entityId, amount) {
        const stamina = this.entities.get(entityId);
        if (!stamina) return false;
        
        const oldValue = stamina.current;
        stamina.current = Math.min(stamina.max, stamina.current + amount);
        
        if (stamina.onChange) {
            stamina.onChange(entityId, stamina.current, oldValue);
        }
        
        return true;
    }
    
    // Start an activity for an entity
    startActivity(entityId, activityName) {
        const stamina = this.entities.get(entityId);
        if (!stamina) return false;
        
        // Check if entity has enough stamina for this activity
        const cost = this.getActivityCost(activityName);
        if (cost > 0 && stamina.current < cost) {
            return false; // Not enough stamina
        }
        
        stamina.isActive = true;
        stamina.currentActivity = activityName;
        stamina.activityTime = 0;
        
        return true;
    }
    
    // Stop current activity for an entity
    stopActivity(entityId) {
        const stamina = this.entities.get(entityId);
        if (!stamina) return;
        
        stamina.isActive = false;
        stamina.currentActivity = null;
        stamina.activityTime = 0;
    }
    
    // Use an item to recover stamina
    useRecoveryItem(entityId, itemName) {
        const stamina = this.entities.get(entityId);
        if (!stamina) return false;
        
        const recoveryAmount = this.recoveryItems.get(itemName);
        if (recoveryAmount === undefined) return false;
        
        this.restoreStamina(entityId, recoveryAmount);
        
        // Special case for sleep - full recovery
        if (itemName === 'sleep') {
            stamina.current = stamina.max;
            stamina.isExhausted = false;
            
            // Add temporary regeneration boost
            this.addStatusEffect(entityId, 'well_rested', {
                type: 'regen_boost',
                multiplier: 1.5,
                duration: 300 // 5 minutes
            });
        }
        
        return true;
    }
    
    // Add status effect
    addStatusEffect(entityId, effectName, effect) {
        const stamina = this.entities.get(entityId);
        if (!stamina) return false;
        
        stamina.statusEffects.set(effectName, { ...effect });
        return true;
    }
    
    // Remove status effect
    removeStatusEffect(entityId, effectName) {
        const stamina = this.entities.get(entityId);
        if (!stamina) return false;
        
        return stamina.statusEffects.delete(effectName);
    }
    
    // Get activity cost
    getActivityCost(activityName) {
        return this.activityCosts.get(activityName) || 0;
    }
    
    // Set activity cost
    setActivityCost(activityName, cost) {
        this.activityCosts.set(activityName, cost);
    }
    
    // Get stamina info for an entity
    getStamina(entityId) {
        return this.entities.get(entityId);
    }
    
    // Get stamina percentage
    getStaminaPercentage(entityId) {
        const stamina = this.entities.get(entityId);
        if (!stamina) return 0;
        
        return stamina.current / stamina.max;
    }
    
    // Check if entity is exhausted
    isExhausted(entityId) {
        const stamina = this.entities.get(entityId);
        return stamina ? stamina.isExhausted : false;
    }
    
    // Check if entity can perform activity
    canPerformActivity(entityId, activityName) {
        const stamina = this.entities.get(entityId);
        if (!stamina) return false;
        
        const cost = this.getActivityCost(activityName);
        return stamina.current >= cost;
    }
    
    // Set callbacks
    setCallbacks(entityId, callbacks = {}) {
        const stamina = this.entities.get(entityId);
        if (!stamina) return false;
        
        if (callbacks.onExhaustion) stamina.onExhaustion = callbacks.onExhaustion;
        if (callbacks.onRecovery) stamina.onRecovery = callbacks.onRecovery;
        if (callbacks.onChange) stamina.onChange = callbacks.onChange;
        
        return true;
    }
    
    // Get system statistics
    getStats() {
        return {
            totalEntities: this.entities.size,
            exhaustedEntities: Array.from(this.entities.values()).filter(s => s.isExhausted).length,
            activeEntities: Array.from(this.entities.values()).filter(s => s.isActive).length
        };
    }
}