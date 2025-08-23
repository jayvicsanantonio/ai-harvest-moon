// Non-Player Character entity with dialogue, relationships, and social mechanics
// Handles NPC AI, conversation systems, and gift preferences

export class NPC {
    constructor(x, y, npcData, gameEngine) {
        this.x = x;
        this.y = y;
        this.gameEngine = gameEngine;
        
        // Entity management
        this.entityId = `npc_${npcData.id}_${Math.random().toString(36).substr(2, 9)}`;
        this.width = 32;
        this.height = 32;
        this.renderLayer = 6;
        
        // NPC identity and configuration
        this.npcId = npcData.id;
        this.name = npcData.name;
        this.profession = npcData.profession || 'villager';
        this.age = npcData.age || 'adult';
        this.personality = npcData.personality || 'friendly';
        this.description = npcData.description || 'A friendly villager';
        
        // Visual appearance
        this.sprite = npcData.sprite || 'npc_default';
        this.direction = 'down';
        this.currentAnimation = null;
        this.animationTimer = 0;
        
        // Movement and behavior
        this.movementType = npcData.movementType || 'stationary'; // stationary, patrol, wander
        this.movementSpeed = npcData.movementSpeed || 50; // pixels per second
        this.movementTimer = 0;
        this.movementInterval = 5000 + Math.random() * 5000; // 5-10 seconds
        this.homePosition = { x: x, y: y };
        this.patrolPoints = npcData.patrolPoints || [];
        this.currentPatrolIndex = 0;
        this.movementRange = npcData.movementRange || 64; // 2 tiles
        
        // Relationship system
        this.relationships = new Map(); // playerId -> relationship data
        this.baseRelationship = {
            friendshipPoints: 0,
            relationshipLevel: 'stranger',
            lastInteraction: 0,
            totalInteractions: 0,
            giftsReceived: 0,
            conversationsHad: 0
        };
        
        // Relationship levels and thresholds
        this.relationshipLevels = [
            { level: 'stranger', threshold: 0, name: 'Stranger' },
            { level: 'acquaintance', threshold: 100, name: 'Acquaintance' },
            { level: 'friend', threshold: 300, name: 'Friend' },
            { level: 'good_friend', threshold: 600, name: 'Good Friend' },
            { level: 'best_friend', threshold: 1000, name: 'Best Friend' },
            { level: 'heart_1', threshold: 1500, name: 'Heart Level 1' },
            { level: 'heart_2', threshold: 2000, name: 'Heart Level 2' }
        ];
        
        // Gift preferences
        this.giftPreferences = {
            loved: npcData.lovedGifts || [],
            liked: npcData.likedGifts || [],
            neutral: npcData.neutralGifts || [],
            disliked: npcData.dislikedGifts || [],
            hated: npcData.hatedGifts || []
        };
        
        // Dialogue system
        this.dialogues = new Map(); // relationshipLevel -> dialogue arrays
        this.currentDialogue = null;
        this.dailyInteractions = 0;
        this.maxDailyInteractions = 3;
        this.lastInteractionDay = 0;
        
        // Schedule and availability
        this.schedule = npcData.schedule || this.createDefaultSchedule();
        this.currentActivity = 'idle';
        this.isAvailable = true;
        this.shopInventory = npcData.shopInventory || null;
        
        // Personality traits affecting interactions
        this.traits = {
            chattiness: npcData.chattiness || 0.5, // 0-1, affects dialogue frequency
            generosity: npcData.generosity || 0.5, // affects gift giving behavior
            curiosity: npcData.curiosity || 0.5, // affects question asking
            helpfulness: npcData.helpfulness || 0.5, // affects quest giving
            moodiness: npcData.moodiness || 0.3 // affects mood swings
        };
        
        // Current state
        this.mood = 'neutral'; // happy, neutral, sad, excited, angry
        this.energy = 100;
        this.interactionCooldown = 1000; // 1 second between interactions
        this.lastInteractionTime = 0;
        
        console.log(`Created NPC: ${this.name} (${this.profession}) at (${x}, ${y})`);
    }
    
    init(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Set up time-based callbacks
        if (gameEngine.timeSystem) {
            gameEngine.timeSystem.on('onDayChange', (timeData) => {
                this.onNewDay(timeData);
            });
            
            gameEngine.timeSystem.on('onHourChange', (timeData) => {
                this.onHourChange(timeData);
            });
        }
        
        // Initialize dialogue based on NPC data
        this.initializeDialogues();
        
        // Start with idle animation
        this.setAnimation('idle');
    }
    
    createDefaultSchedule() {
        // Simple default schedule - can be overridden by NPC data
        return {
            6: { activity: 'morning_routine', location: 'home' },
            8: { activity: 'work', location: 'workplace' },
            12: { activity: 'lunch', location: 'home' },
            14: { activity: 'work', location: 'workplace' },
            18: { activity: 'evening_social', location: 'village_center' },
            20: { activity: 'dinner', location: 'home' },
            22: { activity: 'sleep', location: 'home' }
        };
    }
    
    initializeDialogues() {
        // Initialize basic dialogue sets for different relationship levels
        this.dialogues.set('stranger', [
            "Hello there! I don't think we've met before.",
            "Welcome to our village!",
            "Nice weather we're having, isn't it?"
        ]);
        
        this.dialogues.set('acquaintance', [
            `Oh, hello ${this.getPlayerName()}! How are you today?`,
            "I've seen you around the village. How are you settling in?",
            "Good to see you again!"
        ]);
        
        this.dialogues.set('friend', [
            "Hey there, friend! Always good to see you.",
            "How's the farm life treating you?",
            "I was just thinking about you!"
        ]);
        
        this.dialogues.set('good_friend', [
            "My dear friend! I'm so glad you stopped by.",
            "You know, you're one of my favorite people in this village.",
            "I always look forward to our conversations."
        ]);
        
        // Add profession-specific dialogues
        this.addProfessionDialogues();
    }
    
    addProfessionDialogues() {
        const professionDialogues = {
            shopkeeper: [
                "Welcome to my shop! What can I get for you today?",
                "I just got some new items in stock you might like.",
                "Business has been good thanks to customers like you!"
            ],
            farmer: [
                "The crops are looking good this season.",
                "Have you tried the new farming techniques?",
                "Weather's been perfect for growing lately."
            ],
            blacksmith: [
                "Need any tools upgraded? I'm your man!",
                "Been working on some fine pieces lately.",
                "A good tool makes all the difference in farming."
            ]
        };
        
        const dialogues = professionDialogues[this.profession];
        if (dialogues) {
            // Add profession-specific dialogues to each relationship level
            for (const [level, levelDialogues] of this.dialogues.entries()) {
                levelDialogues.push(...dialogues);
            }
        }
    }
    
    update(deltaTime) {
        // Update timers
        this.animationTimer += deltaTime;
        this.movementTimer += deltaTime;
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Update movement based on movement type
        this.updateMovement(deltaTime);
        
        // Update mood and energy
        this.updateMoodAndEnergy(deltaTime);
        
        // Update current activity based on schedule
        this.updateSchedule();
    }
    
    updateAnimation(deltaTime) {
        // Simple animation cycling
        if (this.animationTimer >= 2000) { // Change animation every 2 seconds
            this.setAnimation(this.getCurrentAnimationKey());
            this.animationTimer = 0;
        }
    }
    
    getCurrentAnimationKey() {
        const baseSprite = this.sprite;
        const directions = ['down', 'left', 'right', 'up'];
        const directionIndex = directions.indexOf(this.direction);
        
        // Return direction-specific sprite or default
        return `${baseSprite}_${this.direction}` || `${baseSprite}_idle`;
    }
    
    setAnimation(animationKey) {
        if (this.currentAnimation !== animationKey) {
            this.currentAnimation = animationKey;
            
            // Integrate with animation system
            if (this.gameEngine?.animationSystem) {
                this.gameEngine.animationSystem.stopAnimation(this.entityId);
                this.gameEngine.animationSystem.startAnimation(
                    this.entityId,
                    animationKey,
                    {
                        loop: true,
                        priority: 1,
                        tags: ['npc', this.profession]
                    }
                );
            }
        }
    }
    
    updateMovement(deltaTime) {
        if (this.movementType === 'stationary' || this.movementTimer < this.movementInterval) {
            return;
        }
        
        this.movementTimer = 0;
        
        switch (this.movementType) {
            case 'wander':
                this.performRandomWander();
                break;
            case 'patrol':
                this.performPatrol();
                break;
        }
    }
    
    performRandomWander() {
        const directions = ['up', 'down', 'left', 'right'];
        const direction = directions[Math.floor(Math.random() * directions.length)];
        const distance = 16 + Math.random() * 16; // 0.5-1 tile
        
        let newX = this.x;
        let newY = this.y;
        
        switch (direction) {
            case 'up':
                newY -= distance;
                break;
            case 'down':
                newY += distance;
                break;
            case 'left':
                newX -= distance;
                break;
            case 'right':
                newX += distance;
                break;
        }
        
        // Check if movement is within allowed range
        const distanceFromHome = Math.sqrt(
            Math.pow(newX - this.homePosition.x, 2) + 
            Math.pow(newY - this.homePosition.y, 2)
        );
        
        if (distanceFromHome <= this.movementRange) {
            this.x = newX;
            this.y = newY;
            this.direction = direction;
        }
    }
    
    performPatrol() {
        if (this.patrolPoints.length === 0) return;
        
        const targetPoint = this.patrolPoints[this.currentPatrolIndex];
        const dx = targetPoint.x - this.x;
        const dy = targetPoint.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 16) { // Close enough to patrol point
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
        } else {
            // Move towards patrol point
            const moveDistance = 16;
            const moveX = (dx / distance) * moveDistance;
            const moveY = (dy / distance) * moveDistance;
            
            this.x += moveX;
            this.y += moveY;
            
            // Update direction based on movement
            if (Math.abs(moveX) > Math.abs(moveY)) {
                this.direction = moveX > 0 ? 'right' : 'left';
            } else {
                this.direction = moveY > 0 ? 'down' : 'up';
            }
        }
    }
    
    updateMoodAndEnergy(deltaTime) {
        // Simple mood and energy updates
        const hoursElapsed = deltaTime / (1000 * 60 * 60);
        
        // Energy decreases slightly over time
        this.energy = Math.max(0, this.energy - (hoursElapsed * 2));
        
        // Mood can change randomly based on moodiness trait
        if (Math.random() < this.traits.moodiness * 0.0001) { // Very low chance per frame
            const moods = ['happy', 'neutral', 'sad', 'excited'];
            this.mood = moods[Math.floor(Math.random() * moods.length)];
        }
    }
    
    updateSchedule() {
        if (!this.gameEngine?.timeSystem) return;
        
        const timeData = this.gameEngine.timeSystem.getTimeData();
        const currentHour = Math.floor(timeData.timeOfDay / 60); // Convert minutes to hours
        
        const scheduledActivity = this.schedule[currentHour];
        if (scheduledActivity && scheduledActivity.activity !== this.currentActivity) {
            this.currentActivity = scheduledActivity.activity;
            this.onActivityChange(scheduledActivity);
        }
    }
    
    onActivityChange(activity) {
        // Handle activity changes (moving to locations, changing availability, etc.)
        switch (activity.activity) {
            case 'sleep':
                this.isAvailable = false;
                break;
            case 'work':
                this.isAvailable = true;
                break;
            default:
                this.isAvailable = true;
                break;
        }
        
        console.log(`${this.name} is now doing: ${activity.activity}`);
    }
    
    // Relationship management
    getRelationshipData(playerId = 'player') {
        if (!this.relationships.has(playerId)) {
            this.relationships.set(playerId, { ...this.baseRelationship });
        }
        return this.relationships.get(playerId);
    }
    
    updateRelationship(playerId, friendshipChange, interactionType = 'talk') {
        const relationship = this.getRelationshipData(playerId);
        
        relationship.friendshipPoints = Math.max(0, relationship.friendshipPoints + friendshipChange);
        relationship.lastInteraction = Date.now();
        relationship.totalInteractions++;
        
        if (interactionType === 'talk') {
            relationship.conversationsHad++;
        } else if (interactionType === 'gift') {
            relationship.giftsReceived++;
        }
        
        // Update relationship level
        const newLevel = this.calculateRelationshipLevel(relationship.friendshipPoints);
        if (newLevel !== relationship.relationshipLevel) {
            const oldLevel = relationship.relationshipLevel;
            relationship.relationshipLevel = newLevel;
            console.log(`${this.name}'s relationship with player changed from ${oldLevel} to ${newLevel}`);
        }
        
        return relationship;
    }
    
    calculateRelationshipLevel(friendshipPoints) {
        for (let i = this.relationshipLevels.length - 1; i >= 0; i--) {
            if (friendshipPoints >= this.relationshipLevels[i].threshold) {
                return this.relationshipLevels[i].level;
            }
        }
        return 'stranger';
    }
    
    getRelationshipLevelName(level) {
        const levelData = this.relationshipLevels.find(l => l.level === level);
        return levelData ? levelData.name : 'Unknown';
    }
    
    // Interaction methods
    canInteract(playerId = 'player') {
        const now = Date.now();
        if (now - this.lastInteractionTime < this.interactionCooldown) {
            return { canInteract: false, reason: 'interaction_cooldown' };
        }
        
        if (!this.isAvailable) {
            return { canInteract: false, reason: 'npc_busy' };
        }
        
        const currentDay = this.getCurrentDay();
        if (currentDay !== this.lastInteractionDay) {
            this.dailyInteractions = 0;
            this.lastInteractionDay = currentDay;
        }
        
        if (this.dailyInteractions >= this.maxDailyInteractions) {
            return { canInteract: false, reason: 'max_daily_interactions' };
        }
        
        return { canInteract: true };
    }
    
    startDialogue(playerId = 'player') {
        const interactionCheck = this.canInteract(playerId);
        if (!interactionCheck.canInteract) {
            return {
                success: false,
                reason: interactionCheck.reason,
                message: this.getInteractionBlockedMessage(interactionCheck.reason)
            };
        }
        
        const relationship = this.getRelationshipData(playerId);
        const dialogueOptions = this.getDialogueOptions(relationship.relationshipLevel);
        
        // Select dialogue based on mood and relationship
        const dialogue = this.selectDialogue(dialogueOptions, relationship);
        
        this.currentDialogue = dialogue;
        this.lastInteractionTime = Date.now();
        this.dailyInteractions++;
        
        // Update relationship for conversation
        this.updateRelationship(playerId, this.getConversationFriendshipGain(), 'talk');
        
        return {
            success: true,
            dialogue: dialogue,
            npcName: this.name,
            relationshipLevel: relationship.relationshipLevel,
            friendshipPoints: relationship.friendshipPoints
        };
    }
    
    getDialogueOptions(relationshipLevel) {
        return this.dialogues.get(relationshipLevel) || this.dialogues.get('stranger');
    }
    
    selectDialogue(dialogueOptions, relationship) {
        // Select dialogue based on various factors
        let availableDialogues = [...dialogueOptions];
        
        // Add mood-specific dialogues
        availableDialogues = availableDialogues.concat(this.getMoodSpecificDialogues());
        
        // Add time/season specific dialogues
        availableDialogues = availableDialogues.concat(this.getContextualDialogues());
        
        // Select random dialogue from available options
        const selectedDialogue = availableDialogues[Math.floor(Math.random() * availableDialogues.length)];
        
        // Process dialogue for dynamic content
        return this.processDialogue(selectedDialogue, relationship);
    }
    
    getMoodSpecificDialogues() {
        const moodDialogues = {
            happy: [
                "I'm having such a wonderful day!",
                "Everything seems to be going perfectly today!",
                "I can't help but smile when I see you!"
            ],
            sad: [
                "I've been feeling a bit down lately...",
                "Things haven't been going so well for me.",
                "Thank you for checking on me."
            ],
            excited: [
                "Oh! I have so much to tell you!",
                "I can barely contain my excitement!",
                "You won't believe what happened today!"
            ]
        };
        
        return moodDialogues[this.mood] || [];
    }
    
    getContextualDialogues() {
        const contextDialogues = [];
        
        // Add weather-based dialogue
        if (this.gameEngine?.weatherSystem) {
            const weather = this.gameEngine.weatherSystem.getCurrentWeather();
            if (weather.type === 'rainy') {
                contextDialogues.push("This rain is perfect for the crops!");
            } else if (weather.type === 'sunny') {
                contextDialogues.push("What beautiful sunshine we're having!");
            }
        }
        
        // Add seasonal dialogue
        if (this.gameEngine?.seasonalSystem) {
            const season = this.gameEngine.seasonalSystem.currentSeason;
            const seasonalDialogue = {
                SPRING: "Spring is such a wonderful time for new beginnings!",
                SUMMER: "I love these warm summer days.",
                AUTUMN: "The autumn colors are so beautiful this year.",
                WINTER: "Winter can be harsh, but it's also peaceful."
            };
            
            if (seasonalDialogue[season]) {
                contextDialogues.push(seasonalDialogue[season]);
            }
        }
        
        return contextDialogues;
    }
    
    processDialogue(dialogue, relationship) {
        // Replace placeholders in dialogue
        return dialogue
            .replace(/\{playerName\}/g, this.getPlayerName())
            .replace(/\{npcName\}/g, this.name)
            .replace(/\{relationship\}/g, this.getRelationshipLevelName(relationship.relationshipLevel));
    }
    
    getPlayerName() {
        // TODO: Get actual player name from save data or player entity
        return 'Farmer';
    }
    
    getConversationFriendshipGain() {
        // Base friendship gain for conversation
        let gain = 5;
        
        // Modify based on chattiness trait
        gain *= (0.5 + this.traits.chattiness);
        
        // Modify based on mood
        const moodModifiers = {
            happy: 1.5,
            excited: 1.3,
            neutral: 1.0,
            sad: 0.7,
            angry: 0.3
        };
        
        gain *= moodModifiers[this.mood] || 1.0;
        
        return Math.round(gain);
    }
    
    getInteractionBlockedMessage(reason) {
        const messages = {
            interaction_cooldown: "I just spoke with you. Give me a moment!",
            npc_busy: `I'm busy right now. Come back later.`,
            max_daily_interactions: "I've had enough conversations for today. See you tomorrow!"
        };
        
        return messages[reason] || "I can't talk right now.";
    }
    
    // Gift system
    receiveGift(giftItem, playerId = 'player') {
        const interactionCheck = this.canInteract(playerId);
        if (!interactionCheck.canInteract) {
            return {
                success: false,
                reason: interactionCheck.reason,
                message: this.getInteractionBlockedMessage(interactionCheck.reason)
            };
        }
        
        const giftReaction = this.evaluateGift(giftItem);
        const relationship = this.getRelationshipData(playerId);
        
        // Update relationship based on gift reaction
        this.updateRelationship(playerId, giftReaction.friendshipChange, 'gift');
        
        this.lastInteractionTime = Date.now();
        this.dailyInteractions++;
        
        return {
            success: true,
            reaction: giftReaction.reaction,
            message: giftReaction.message,
            friendshipChange: giftReaction.friendshipChange,
            newFriendshipPoints: relationship.friendshipPoints
        };
    }
    
    evaluateGift(giftItem) {
        if (this.giftPreferences.loved.includes(giftItem)) {
            return {
                reaction: 'loved',
                friendshipChange: 80,
                message: `Oh wow! I absolutely love ${giftItem}! Thank you so much!`
            };
        } else if (this.giftPreferences.liked.includes(giftItem)) {
            return {
                reaction: 'liked',
                friendshipChange: 45,
                message: `Thank you for the ${giftItem}! I really like it.`
            };
        } else if (this.giftPreferences.disliked.includes(giftItem)) {
            return {
                reaction: 'disliked',
                friendshipChange: -20,
                message: `Oh... ${giftItem}... well, thank you, I suppose.`
            };
        } else if (this.giftPreferences.hated.includes(giftItem)) {
            return {
                reaction: 'hated',
                friendshipChange: -40,
                message: `Why would you give me ${giftItem}? I really don't like this.`
            };
        } else {
            return {
                reaction: 'neutral',
                friendshipChange: 20,
                message: `Thanks for the ${giftItem}. It's the thought that counts!`
            };
        }
    }
    
    // Time-based events
    onNewDay(timeData) {
        // Reset daily interaction counter
        this.dailyInteractions = 0;
        this.lastInteractionDay = this.getCurrentDay();
        
        // Reset energy
        this.energy = 100;
        
        // Random mood change for new day
        if (Math.random() < this.traits.moodiness) {
            const moods = ['happy', 'neutral', 'sad', 'excited'];
            this.mood = moods[Math.floor(Math.random() * moods.length)];
        }
        
        console.log(`${this.name} starts a new day in ${this.mood} mood`);
    }
    
    onHourChange(timeData) {
        // Update schedule and activity
        this.updateSchedule();
    }
    
    getCurrentDay() {
        return this.gameEngine?.timeSystem?.getTimeData()?.day || 1;
    }
    
    // Rendering
    render(renderSystem) {
        // Render NPC sprite
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
            const color = this.getNPCColor();
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
        // Interaction indicator
        if (this.canInteract().canInteract) {
            renderSystem.drawText(
                '💬',
                this.x + this.width / 2,
                this.y - 15,
                { 
                    color: '#FFD700', 
                    fontSize: 16, 
                    align: 'center',
                    layer: this.renderLayer + 1 
                }
            );
        }
        
        // Mood indicator (in debug mode)
        if (this.gameEngine.isDebugMode()) {
            const moodEmojis = {
                happy: '😊',
                neutral: '😐',
                sad: '😢',
                excited: '🤩',
                angry: '😠'
            };
            
            renderSystem.drawText(
                moodEmojis[this.mood] || '😐',
                this.x + this.width - 8,
                this.y - 8,
                { 
                    fontSize: 12,
                    layer: this.renderLayer + 1 
                }
            );
        }
    }
    
    getNPCColor() {
        const professionColors = {
            shopkeeper: '#4169E1',   // Royal blue
            farmer: '#228B22',       // Forest green
            blacksmith: '#8B4513',   // Saddle brown
            villager: '#9370DB'      // Medium purple
        };
        return professionColors[this.profession] || '#9370DB';
    }
    
    // Information and utility methods
    getStatusInfo() {
        const relationship = this.getRelationshipData();
        
        return {
            entityId: this.entityId,
            npcId: this.npcId,
            name: this.name,
            profession: this.profession,
            position: { x: this.x, y: this.y },
            mood: this.mood,
            energy: this.energy,
            currentActivity: this.currentActivity,
            isAvailable: this.isAvailable,
            dailyInteractions: this.dailyInteractions,
            relationship: {
                level: relationship.relationshipLevel,
                points: relationship.friendshipPoints,
                totalInteractions: relationship.totalInteractions
            }
        };
    }
    
    getInteractionOptions(player) {
        const options = [];
        
        if (this.canInteract().canInteract) {
            options.push({
                action: 'talk',
                label: 'Talk',
                enabled: true
            });
            
            // Gift option if player has items
            if (player.inventory && player.inventory.getTotalItems() > 0) {
                options.push({
                    action: 'gift',
                    label: 'Give Gift',
                    enabled: true
                });
            }
            
            // Shop option for shopkeepers
            if (this.profession === 'shopkeeper' && this.shopInventory) {
                options.push({
                    action: 'shop',
                    label: 'Browse Shop',
                    enabled: true
                });
            }
        }
        
        return options;
    }
    
    // Cleanup
    destroy() {
        console.log(`${this.name} removed from game`);
    }
}