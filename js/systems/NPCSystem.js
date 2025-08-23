// NPC management system handling villager spawning, interactions, and social mechanics
// Manages NPC lifecycle, relationship tracking, and village population

import { NPC } from '../entities/NPC.js';

export class NPCSystem {
    constructor() {
        this.gameEngine = null;
        this.npcs = new Map(); // entityId -> NPC instance
        this.npcsByLocation = new Map(); // scene name -> NPC array
        
        // NPC database with predefined villagers
        this.npcDatabase = {
            'merchant_tom': {
                id: 'merchant_tom',
                name: 'Tom',
                profession: 'shopkeeper',
                age: 'adult',
                personality: 'friendly',
                description: 'The local general store owner who sells seeds and basic supplies.',
                sprite: 'npc_merchant',
                movementType: 'stationary',
                chattiness: 0.8,
                generosity: 0.6,
                lovedGifts: ['coffee', 'gold_ore'],
                likedGifts: ['crops', 'milk', 'eggs'],
                dislikedGifts: ['weeds', 'trash'],
                hatedGifts: ['monster_items'],
                shopInventory: {
                    'turnip_seeds': { price: 20, stock: 50 },
                    'potato_seeds': { price: 30, stock: 30 },
                    'hay': { price: 10, stock: 100 }
                }
            },
            'farmer_mary': {
                id: 'farmer_mary',
                name: 'Mary',
                profession: 'farmer',
                age: 'adult',
                personality: 'hardworking',
                description: 'An experienced farmer who knows everything about crops.',
                sprite: 'npc_farmer_woman',
                movementType: 'wander',
                movementRange: 96,
                chattiness: 0.6,
                generosity: 0.7,
                helpfulness: 0.9,
                lovedGifts: ['parsnip', 'quality_fertilizer'],
                likedGifts: ['vegetables', 'farming_tools'],
                dislikedGifts: ['junk', 'monster_items'],
                hatedGifts: ['trash', 'rotten_food']
            },
            'blacksmith_bob': {
                id: 'blacksmith_bob',
                name: 'Bob',
                profession: 'blacksmith',
                age: 'adult',
                personality: 'gruff',
                description: 'The village blacksmith who can upgrade your tools.',
                sprite: 'npc_blacksmith',
                movementType: 'stationary',
                chattiness: 0.3,
                generosity: 0.4,
                helpfulness: 0.8,
                lovedGifts: ['copper_ore', 'iron_ore', 'coal'],
                likedGifts: ['gems', 'tools'],
                neutralGifts: ['crops'],
                dislikedGifts: ['flowers', 'cooked_food'],
                hatedGifts: ['trash', 'weeds']
            },
            'villager_alice': {
                id: 'villager_alice',
                name: 'Alice',
                profession: 'villager',
                age: 'young',
                personality: 'cheerful',
                description: 'A cheerful young woman who loves flowers and nature.',
                sprite: 'npc_young_woman',
                movementType: 'patrol',
                patrolPoints: [
                    { x: 300, y: 200 },
                    { x: 400, y: 200 },
                    { x: 400, y: 300 },
                    { x: 300, y: 300 }
                ],
                chattiness: 0.9,
                generosity: 0.8,
                curiosity: 0.9,
                lovedGifts: ['flowers', 'gems', 'honey'],
                likedGifts: ['fruits', 'cooked_food'],
                neutralGifts: ['vegetables'],
                dislikedGifts: ['fish', 'monster_items'],
                hatedGifts: ['trash', 'weeds', 'rotten_food']
            }
        };
        
        // System statistics
        this.stats = {
            totalNPCs: 0,
            activeConversations: 0,
            totalRelationshipPoints: 0,
            averageRelationship: 0,
            giftsGivenToday: 0,
            conversationsToday: 0
        };
        
        // Interaction settings
        this.playerInteractionRange = 48; // 1.5 tiles
        this.lastInteractionTime = 0;
        this.interactionCooldown = 500; // 0.5 second global cooldown
        
        // Event tracking
        this.villageEvents = [];
        this.relationshipEvents = [];
        
        console.log('NPCSystem initialized');
    }
    
    init(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Set up time-based callbacks
        if (gameEngine.timeSystem) {
            gameEngine.timeSystem.on('onDayChange', (timeData) => {
                this.onNewDay(timeData);
            });
            
            gameEngine.timeSystem.on('onSeasonChange', (seasonData) => {
                this.onSeasonChange(seasonData);
            });
        }
        
        console.log('NPCSystem connected to GameEngine');
    }
    
    update(deltaTime) {
        // Update all NPCs
        for (const npc of this.npcs.values()) {
            npc.update(deltaTime);
        }
        
        // Update system statistics
        this.updateStatistics();
        
        // Process village events
        this.processVillageEvents();
    }
    
    updateStatistics() {
        let totalRelationshipPoints = 0;
        this.stats.totalNPCs = this.npcs.size;
        
        for (const npc of this.npcs.values()) {
            const relationship = npc.getRelationshipData('player');
            totalRelationshipPoints += relationship.friendshipPoints;
        }
        
        this.stats.totalRelationshipPoints = totalRelationshipPoints;
        this.stats.averageRelationship = this.stats.totalNPCs > 0 ? 
            Math.round(totalRelationshipPoints / this.stats.totalNPCs) : 0;
    }
    
    // NPC management
    spawnNPC(npcId, x, y, sceneId = null) {
        const npcData = this.npcDatabase[npcId];
        if (!npcData) {
            console.error(`NPC data not found for ID: ${npcId}`);
            return null;
        }
        
        try {
            // Create NPC entity
            const npc = new NPC(x, y, npcData, this.gameEngine);
            npc.init(this.gameEngine);
            
            // Register NPC in system
            this.npcs.set(npc.entityId, npc);
            
            // Add to location tracking
            if (sceneId) {
                if (!this.npcsByLocation.has(sceneId)) {
                    this.npcsByLocation.set(sceneId, []);
                }
                this.npcsByLocation.get(sceneId).push(npc);
            }
            
            // Add to current scene if available
            const currentScene = this.gameEngine.sceneManager?.getCurrentScene();
            if (currentScene) {
                currentScene.addEntity(npc);
            }
            
            console.log(`Spawned NPC: ${npc.name} at (${x}, ${y})`);
            return npc;
            
        } catch (error) {
            console.error(`Failed to spawn NPC ${npcId}:`, error);
            return null;
        }
    }
    
    removeNPC(npcId) {
        const npc = this.npcs.get(npcId);
        if (!npc) return false;
        
        // Remove from current scene
        const currentScene = this.gameEngine.sceneManager?.getCurrentScene();
        if (currentScene) {
            const entityIndex = currentScene.entities.indexOf(npc);
            if (entityIndex !== -1) {
                currentScene.entities.splice(entityIndex, 1);
            }
        }
        
        // Remove from location tracking
        for (const [sceneId, npcList] of this.npcsByLocation.entries()) {
            const index = npcList.indexOf(npc);
            if (index !== -1) {
                npcList.splice(index, 1);
                break;
            }
        }
        
        // Cleanup NPC
        npc.destroy();
        
        // Remove from system
        this.npcs.delete(npcId);
        
        console.log(`Removed NPC: ${npc.name}`);
        return true;
    }
    
    // Player interaction handling
    handlePlayerInteraction(player, interactionType, targetNPC = null) {
        const now = Date.now();
        if (now - this.lastInteractionTime < this.interactionCooldown) {
            return { success: false, message: 'Too soon for another interaction' };
        }
        
        // Find nearby NPC if not specified
        if (!targetNPC) {
            targetNPC = this.getNearestNPC(player.x, player.y);
        }
        
        if (!targetNPC) {
            return { success: false, message: 'No one nearby to talk to' };
        }
        
        const distance = Math.sqrt(
            Math.pow(player.x - targetNPC.x, 2) + 
            Math.pow(player.y - targetNPC.y, 2)
        );
        
        if (distance > this.playerInteractionRange) {
            return { success: false, message: 'Too far away' };
        }
        
        this.lastInteractionTime = now;
        
        // Handle specific interaction types
        switch (interactionType) {
            case 'talk':
                return this.handleTalkInteraction(player, targetNPC);
            case 'gift':
                return this.handleGiftInteraction(player, targetNPC);
            case 'shop':
                return this.handleShopInteraction(player, targetNPC);
            case 'examine':
                return this.handleExamineInteraction(targetNPC);
            default:
                return { success: false, message: 'Unknown interaction type' };
        }
    }
    
    handleTalkInteraction(player, npc) {
        // Start dialogue through dialogue system
        if (this.gameEngine.dialogueSystem) {
            const result = this.gameEngine.dialogueSystem.startDialogue(npc, player);
            if (result) {
                this.stats.conversationsToday++;
                this.stats.activeConversations++;
                
                // Track relationship event
                this.relationshipEvents.push({
                    type: 'conversation',
                    npcId: npc.npcId,
                    timestamp: Date.now(),
                    friendshipBefore: npc.getRelationshipData(player.entityId).friendshipPoints
                });
                
                return { success: true, message: `Started conversation with ${npc.name}` };
            }
        }
        
        // Fallback to direct NPC dialogue
        const dialogueResult = npc.startDialogue(player.entityId);
        if (dialogueResult.success) {
            this.stats.conversationsToday++;
            return { 
                success: true, 
                message: dialogueResult.dialogue,
                npc: npc.name 
            };
        }
        
        return { 
            success: false, 
            message: dialogueResult.message || 'Could not start conversation' 
        };
    }
    
    handleGiftInteraction(player, npc, giftItem = null) {
        // If no gift item specified, need to show item selection
        if (!giftItem) {
            return { 
                success: false, 
                message: 'Select an item to give',
                requiresItemSelection: true 
            };
        }
        
        // Check if player has the item
        if (!player.inventory.hasItem(giftItem, 1)) {
            return { success: false, message: `You don't have ${giftItem}` };
        }
        
        // Remove item from player inventory
        const removed = player.inventory.removeItem(giftItem, 1);
        if (!removed) {
            return { success: false, message: 'Failed to give gift' };
        }
        
        // Give gift to NPC
        const giftResult = npc.receiveGift(giftItem, player.entityId);
        
        if (giftResult.success) {
            this.stats.giftsGivenToday++;
            
            // Track relationship event
            this.relationshipEvents.push({
                type: 'gift',
                npcId: npc.npcId,
                giftItem: giftItem,
                reaction: giftResult.reaction,
                friendshipChange: giftResult.friendshipChange,
                timestamp: Date.now()
            });
        }
        
        return giftResult;
    }
    
    handleShopInteraction(player, npc) {
        if (npc.profession !== 'shopkeeper' || !npc.shopInventory) {
            return { success: false, message: `${npc.name} is not a shopkeeper` };
        }
        
        // TODO: Integrate with shop system
        console.log(`Opening shop for ${npc.name}`, npc.shopInventory);
        return { 
            success: true, 
            message: `Welcome to ${npc.name}'s shop!`,
            shopData: npc.shopInventory 
        };
    }
    
    handleExamineInteraction(npc) {
        const status = npc.getStatusInfo();
        const relationship = npc.getRelationshipData('player');
        
        return {
            success: true,
            message: `${status.name}: ${npc.description}`,
            details: {
                profession: npc.profession,
                mood: status.mood,
                relationship: relationship.relationshipLevel,
                friendshipPoints: relationship.friendshipPoints,
                availability: status.isAvailable ? 'Available' : 'Busy'
            }
        };
    }
    
    // Utility methods
    getNearestNPC(x, y) {
        let nearestNPC = null;
        let nearestDistance = Infinity;
        
        for (const npc of this.npcs.values()) {
            const distance = Math.sqrt(
                Math.pow(x - npc.x, 2) + 
                Math.pow(y - npc.y, 2)
            );
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestNPC = npc;
            }
        }
        
        return nearestDistance <= this.playerInteractionRange ? nearestNPC : null;
    }
    
    getNPCsInRange(x, y, range) {
        const npcsInRange = [];
        
        for (const npc of this.npcs.values()) {
            const distance = Math.sqrt(
                Math.pow(x - npc.x, 2) + 
                Math.pow(y - npc.y, 2)
            );
            
            if (distance <= range) {
                npcsInRange.push(npc);
            }
        }
        
        return npcsInRange;
    }
    
    getNPCById(npcId) {
        return this.npcs.get(npcId) || null;
    }
    
    getNPCByGameId(gameId) {
        for (const npc of this.npcs.values()) {
            if (npc.npcId === gameId) {
                return npc;
            }
        }
        return null;
    }
    
    getAllNPCs() {
        return Array.from(this.npcs.values());
    }
    
    getNPCsByLocation(sceneId) {
        return this.npcsByLocation.get(sceneId) || [];
    }
    
    getNPCsByProfession(profession) {
        return Array.from(this.npcs.values()).filter(
            npc => npc.profession === profession
        );
    }
    
    // Bulk operations
    spawnVillageNPCs(sceneId) {
        const villageNPCs = [
            { id: 'merchant_tom', x: 300, y: 150 },
            { id: 'farmer_mary', x: 200, y: 200 },
            { id: 'blacksmith_bob', x: 400, y: 180 },
            { id: 'villager_alice', x: 350, y: 250 }
        ];
        
        const spawnedNPCs = [];
        
        for (const npcConfig of villageNPCs) {
            const npc = this.spawnNPC(npcConfig.id, npcConfig.x, npcConfig.y, sceneId);
            if (npc) {
                spawnedNPCs.push(npc);
            }
        }
        
        console.log(`Spawned ${spawnedNPCs.length} village NPCs in ${sceneId}`);
        return spawnedNPCs;
    }
    
    // Time-based events
    onNewDay(timeData) {
        console.log(`New day - updating ${this.npcs.size} NPCs`);
        
        // Reset daily stats
        this.stats.conversationsToday = 0;
        this.stats.giftsGivenToday = 0;
        this.stats.activeConversations = 0;
        
        // Clear daily events
        this.relationshipEvents = [];
        
        // Generate village events
        this.generateDailyVillageEvents();
    }
    
    onSeasonChange(seasonData) {
        console.log(`Season changed to ${seasonData.season} - updating NPC schedules`);
        
        // Update NPC schedules and behaviors for new season
        for (const npc of this.npcs.values()) {
            this.updateNPCForSeason(npc, seasonData.season);
        }
    }
    
    updateNPCForSeason(npc, season) {
        // Update NPC mood and availability based on season
        const seasonalMoods = {
            SPRING: 'happy',
            SUMMER: 'excited',
            AUTUMN: 'neutral',
            WINTER: 'sad'
        };
        
        if (Math.random() < 0.3) { // 30% chance to change mood
            npc.mood = seasonalMoods[season] || 'neutral';
        }
    }
    
    generateDailyVillageEvents() {
        // Generate random village events that affect NPC behavior
        if (Math.random() < 0.1) { // 10% chance
            const events = [
                'festival_preparation',
                'good_weather',
                'market_day',
                'community_project'
            ];
            
            const event = events[Math.floor(Math.random() * events.length)];
            this.villageEvents.push({
                type: event,
                date: this.gameEngine?.timeSystem?.getTimeData()?.day || 1,
                description: this.getEventDescription(event)
            });
            
            console.log(`Village event: ${event}`);
        }
    }
    
    getEventDescription(eventType) {
        const descriptions = {
            festival_preparation: "The villagers are busy preparing for an upcoming festival.",
            good_weather: "The beautiful weather has everyone in high spirits.",
            market_day: "It's market day and everyone is bustling about.",
            community_project: "The village is working together on a community project."
        };
        
        return descriptions[eventType] || "Something interesting is happening in the village.";
    }
    
    processVillageEvents() {
        // Process active village events and their effects on NPCs
        for (const event of this.villageEvents) {
            this.applyEventEffects(event);
        }
    }
    
    applyEventEffects(event) {
        // Apply event effects to NPCs
        switch (event.type) {
            case 'good_weather':
                for (const npc of this.npcs.values()) {
                    if (Math.random() < 0.5) {
                        npc.mood = 'happy';
                    }
                }
                break;
                
            case 'festival_preparation':
                for (const npc of this.npcs.values()) {
                    npc.energy = Math.min(100, npc.energy + 20);
                    if (Math.random() < 0.3) {
                        npc.mood = 'excited';
                    }
                }
                break;
        }
    }
    
    // System information and debugging
    getSystemStats() {
        return {
            ...this.stats,
            villageEvents: this.villageEvents.length,
            relationshipEvents: this.relationshipEvents.length,
            npcsByProfession: this.getNPCProfessionCounts()
        };
    }
    
    getNPCProfessionCounts() {
        const counts = {};
        for (const npc of this.npcs.values()) {
            counts[npc.profession] = (counts[npc.profession] || 0) + 1;
        }
        return counts;
    }
    
    getRelationshipSummary(playerId = 'player') {
        const relationships = [];
        
        for (const npc of this.npcs.values()) {
            const relationship = npc.getRelationshipData(playerId);
            relationships.push({
                npcName: npc.name,
                level: relationship.relationshipLevel,
                points: relationship.friendshipPoints,
                interactions: relationship.totalInteractions,
                gifts: relationship.giftsReceived
            });
        }
        
        return relationships.sort((a, b) => b.points - a.points);
    }
    
    // Debug methods
    renderDebug(renderSystem) {
        if (!this.gameEngine.isDebugMode()) return;
        
        let yOffset = 280;
        const stats = this.getSystemStats();
        
        renderSystem.drawText(
            `NPCs: ${stats.totalNPCs} | Avg Relationship: ${stats.averageRelationship}`,
            10, yOffset, { color: '#00ffff', layer: 1000 }
        );
        yOffset += 15;
        
        renderSystem.drawText(
            `Conversations: ${stats.conversationsToday} | Gifts: ${stats.giftsGivenToday}`,
            10, yOffset, { color: '#00ffff', layer: 1000 }
        );
        
        // Highlight NPCs that can be interacted with
        const player = this.getPlayer();
        if (player) {
            const nearbyNPCs = this.getNPCsInRange(player.x, player.y, this.playerInteractionRange);
            for (const npc of nearbyNPCs) {
                if (npc.canInteract().canInteract) {
                    renderSystem.drawRect(
                        npc.x - 2, npc.y - 2, 
                        npc.width + 4, npc.height + 4,
                        '#00ffff', 
                        { alpha: 0.3, layer: npc.renderLayer - 1 }
                    );
                }
            }
        }
    }
    
    getPlayer() {
        const currentScene = this.gameEngine?.sceneManager?.getCurrentScene();
        if (!currentScene) return null;
        
        return currentScene.entities?.find(entity => 
            entity.constructor.name === 'Player'
        ) || null;
    }
    
    // Cleanup
    cleanup() {
        // Remove all NPCs
        for (const npc of this.npcs.values()) {
            npc.destroy();
        }
        
        this.npcs.clear();
        this.npcsByLocation.clear();
        this.villageEvents = [];
        this.relationshipEvents = [];
        
        console.log('NPCSystem cleaned up');
    }
}