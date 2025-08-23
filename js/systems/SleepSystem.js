// Sleep system for day advancement and stamina restoration
// Handles bed interactions, day transitions, and sleep benefits

export class SleepSystem {
    constructor() {
        this.sleepLocations = new Map(); // bedId -> bed properties
        this.sleepDuration = 8 * 60; // 8 hours in game minutes
        this.wakeUpTime = 6 * 60; // 6:00 AM in game minutes
        
        // Sleep benefits
        this.staminaRestoration = 100; // Full stamina restoration
        this.healthBonus = 5; // Small health bonus
        this.moodBonus = 10; // Mood improvement
        
        // Sleep state
        this.isSleeping = false;
        this.sleepStartTime = 0;
        this.sleepLocation = null;
        
        console.log('SleepSystem initialized');
    }
    
    // Register a bed location
    registerBed(bedId, x, y, properties = {}) {
        this.sleepLocations.set(bedId, {
            id: bedId,
            x: x,
            y: y,
            width: properties.width || 64,
            height: properties.height || 32,
            comfort: properties.comfort || 1.0,
            quality: properties.quality || 'basic',
            isOccupied: false,
            ownerId: properties.ownerId || null,
            ...properties
        });
        
        console.log(`Registered bed: ${bedId} at (${x}, ${y})`);
    }
    
    // Check if player can sleep at a location
    canSleepAt(bedId, player) {
        const bed = this.sleepLocations.get(bedId);
        if (!bed) {
            return { canSleep: false, reason: 'No bed found at this location' };
        }
        
        if (bed.isOccupied && bed.ownerId !== player.entityId) {
            return { canSleep: false, reason: 'This bed is already occupied' };
        }
        
        if (bed.ownerId && bed.ownerId !== player.entityId) {
            return { canSleep: false, reason: 'This is not your bed' };
        }
        
        // Check if it's too early to sleep
        const gameEngine = player.gameEngine;
        if (gameEngine?.timeSystem) {
            const timeData = gameEngine.timeSystem.getTimeData();
            const currentTime = timeData.time;
            
            // Can only sleep after 6 PM or before 6 AM
            if (currentTime >= 6 * 60 && currentTime < 18 * 60) {
                return { canSleep: false, reason: 'Too early to sleep. Sleep after 6 PM.' };
            }
        }
        
        return { canSleep: true, bed: bed };
    }
    
    // Check if player is near a bed
    isNearBed(player) {
        for (const bed of this.sleepLocations.values()) {
            const distance = Math.sqrt(
                Math.pow(player.x - bed.x, 2) + 
                Math.pow(player.y - bed.y, 2)
            );
            
            if (distance < 48) { // Within 48 pixels
                return { nearBed: true, bedId: bed.id };
            }
        }
        
        return { nearBed: false };
    }
    
    // Start sleeping process
    startSleep(bedId, player) {
        const sleepCheck = this.canSleepAt(bedId, player);
        if (!sleepCheck.canSleep) {
            return { success: false, message: sleepCheck.reason };
        }
        
        const bed = sleepCheck.bed;
        const gameEngine = player.gameEngine;
        
        if (!gameEngine?.timeSystem) {
            return { success: false, message: 'Time system not available' };
        }
        
        // Start sleep process
        this.isSleeping = true;
        this.sleepStartTime = gameEngine.timeSystem.currentTime;
        this.sleepLocation = bedId;
        bed.isOccupied = true;
        
        // Calculate sleep benefits based on bed quality
        const sleepBenefits = this.calculateSleepBenefits(bed, player);
        
        // Advance time to next morning
        this.advanceToMorning(gameEngine.timeSystem);
        
        // Apply sleep benefits
        this.applySleepBenefits(player, sleepBenefits);
        
        // End sleep
        this.endSleep();
        
        console.log(`${player.entityId || 'Player'} slept in ${bedId}`);
        
        return {
            success: true,
            message: `You slept well and woke up refreshed!`,
            benefits: sleepBenefits,
            timeAdvanced: true
        };
    }
    
    // Calculate sleep benefits based on bed quality and other factors
    calculateSleepBenefits(bed, player) {
        const comfort = bed.comfort || 1.0;
        const qualityMultiplier = this.getQualityMultiplier(bed.quality);
        
        return {
            staminaRestored: Math.floor(this.staminaRestoration * comfort * qualityMultiplier),
            healthBonus: Math.floor(this.healthBonus * comfort),
            moodBonus: Math.floor(this.moodBonus * comfort),
            qualityBonus: qualityMultiplier > 1 ? 'You slept exceptionally well!' : null
        };
    }
    
    // Get quality multiplier for different bed types
    getQualityMultiplier(quality) {
        const multipliers = {
            'poor': 0.8,
            'basic': 1.0,
            'good': 1.2,
            'excellent': 1.5,
            'luxury': 2.0
        };
        
        return multipliers[quality] || 1.0;
    }
    
    // Advance time to next morning
    advanceToMorning(timeSystem) {
        const currentTime = timeSystem.currentTime;
        
        // If it's past midnight, advance to wake-up time same day
        if (currentTime < this.wakeUpTime) {
            timeSystem.setTime(Math.floor(this.wakeUpTime / 60), this.wakeUpTime % 60);
        } else {
            // Otherwise, advance to next day wake-up time
            timeSystem.advanceDay();
            timeSystem.setTime(Math.floor(this.wakeUpTime / 60), this.wakeUpTime % 60);
        }
        
        console.log(`Advanced time to next morning: ${timeSystem.getFormattedTime()}`);
    }
    
    // Apply sleep benefits to player
    applySleepBenefits(player, benefits) {
        // Restore stamina
        if (player.gameEngine?.staminaSystem) {
            player.gameEngine.staminaSystem.restoreStamina(
                player.entityId, 
                benefits.staminaRestored
            );
        }
        
        // Apply other benefits (health, mood) if systems exist
        if (player.health !== undefined) {
            player.health = Math.min(
                player.maxHealth || 100, 
                (player.health || 100) + benefits.healthBonus
            );
        }
        
        if (player.mood !== undefined) {
            player.mood = Math.min(100, (player.mood || 50) + benefits.moodBonus);
        }
        
        console.log(`Applied sleep benefits: ${JSON.stringify(benefits)}`);
    }
    
    // End sleep process
    endSleep() {
        if (this.sleepLocation) {
            const bed = this.sleepLocations.get(this.sleepLocation);
            if (bed) {
                bed.isOccupied = false;
            }
        }
        
        this.isSleeping = false;
        this.sleepStartTime = 0;
        this.sleepLocation = null;
    }
    
    // Handle player interaction with bed
    handleBedInteraction(player) {
        const nearBedCheck = this.isNearBed(player);
        if (!nearBedCheck.nearBed) {
            return { success: false, message: 'No bed nearby' };
        }
        
        return this.startSleep(nearBedCheck.bedId, player);
    }
    
    // Auto-sleep when player is exhausted (optional feature)
    checkAutoSleep(player) {
        if (!player.gameEngine?.staminaSystem || !player.gameEngine?.timeSystem) {
            return false;
        }
        
        const currentStamina = player.gameEngine.staminaSystem.getStamina(player.entityId);
        const timeData = player.gameEngine.timeSystem.getTimeData();
        
        // Auto-sleep if stamina is very low and it's late at night
        if (currentStamina <= 5 && timeData.time >= 22 * 60) {
            const nearBedCheck = this.isNearBed(player);
            if (nearBedCheck.nearBed) {
                console.log('Player is exhausted and near bed - triggering auto-sleep');
                return this.startSleep(nearBedCheck.bedId, player);
            }
        }
        
        return false;
    }
    
    // Get sleep location info
    getBedInfo(bedId) {
        return this.sleepLocations.get(bedId);
    }
    
    // Get all beds
    getAllBeds() {
        return Array.from(this.sleepLocations.values());
    }
    
    // Update system (for future features like dream sequences)
    update(deltaTime) {
        // Currently no update logic needed
        // Future: could handle dream events, sleep animations, etc.
    }
    
    // Render sleep system debug info
    renderDebug(renderSystem) {
        if (!renderSystem) return;
        
        const debugColor = '#9370db';
        let yOffset = 180;
        
        // Show sleep system status
        renderSystem.drawText(
            `Sleep - Locations: ${this.sleepLocations.size}, Sleeping: ${this.isSleeping}`,
            10, yOffset, { color: debugColor, layer: 1000 }
        );
        
        // Render bed locations
        for (const bed of this.sleepLocations.values()) {
            // Draw bed outline
            renderSystem.drawRect(
                bed.x - 2, bed.y - 2, bed.width + 4, bed.height + 4,
                debugColor, { alpha: 0.3, layer: 5 }
            );
            
            // Draw bed fill
            renderSystem.drawRect(
                bed.x, bed.y, bed.width, bed.height,
                bed.isOccupied ? '#ff0000' : '#00ff00', 
                { alpha: 0.2, layer: 6 }
            );
            
            // Label
            renderSystem.drawText(
                bed.id,
                bed.x + bed.width / 2, bed.y - 8,
                { color: debugColor, fontSize: 10, textAlign: 'center', layer: 1001 }
            );
        }
    }
    
    // Get system statistics
    getStats() {
        return {
            totalBeds: this.sleepLocations.size,
            occupiedBeds: Array.from(this.sleepLocations.values()).filter(bed => bed.isOccupied).length,
            currentlySleeping: this.isSleeping,
            sleepLocation: this.sleepLocation,
            wakeUpTime: this.wakeUpTime
        };
    }
    
    // Serialize sleep system state
    serialize() {
        const beds = Array.from(this.sleepLocations.entries());
        
        return {
            sleepLocations: beds,
            isSleeping: this.isSleeping,
            sleepStartTime: this.sleepStartTime,
            sleepLocation: this.sleepLocation,
            wakeUpTime: this.wakeUpTime
        };
    }
    
    // Deserialize sleep system state
    deserialize(data) {
        if (data.sleepLocations) {
            this.sleepLocations = new Map(data.sleepLocations);
        }
        
        this.isSleeping = data.isSleeping || false;
        this.sleepStartTime = data.sleepStartTime || 0;
        this.sleepLocation = data.sleepLocation || null;
        this.wakeUpTime = data.wakeUpTime || this.wakeUpTime;
        
        console.log(`Loaded ${this.sleepLocations.size} bed locations from save data`);
    }
}