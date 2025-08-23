// Dialogue system managing conversation UI, dialogue trees, and NPC interactions
// Handles text display, response options, and conversation flow

export class DialogueSystem {
    constructor() {
        this.gameEngine = null;
        this.isActive = false;
        this.currentDialogue = null;
        this.currentNPC = null;
        this.currentPlayer = null;
        
        // Dialogue display settings
        this.dialogueBox = {
            x: 50,
            y: 450,
            width: 700,
            height: 120,
            padding: 20,
            backgroundColor: '#000000',
            borderColor: '#ffffff',
            textColor: '#ffffff'
        };
        
        // Text animation and display
        this.displayedText = '';
        this.fullText = '';
        this.textSpeed = 30; // characters per second
        this.isTextAnimating = false;
        this.textAnimationTimer = 0;
        this.currentCharIndex = 0;
        
        // Response system
        this.responses = [];
        this.currentResponseIndex = 0;
        this.showingResponses = false;
        this.responseBox = {
            x: 450,
            y: 300,
            width: 300,
            height: 140,
            padding: 15
        };
        
        // Dialogue tree system
        this.dialogueTree = null;
        this.currentNode = null;
        this.dialogueHistory = [];
        this.conversationContext = {};
        
        // Input handling
        this.lastInputTime = 0;
        this.inputCooldown = 200; // 200ms between inputs
        this.skipTextKey = 'Space';
        this.nextDialogueKey = 'Space';
        this.selectResponseKey = 'Space';
        this.cancelKey = 'Escape';
        
        // Audio integration
        this.soundEffects = {
            textSound: 'sfx_text_beep',
            confirmSound: 'sfx_confirm',
            selectSound: 'sfx_select',
            cancelSound: 'sfx_cancel'
        };
        
        // Statistics and analytics
        this.stats = {
            totalConversations: 0,
            averageConversationLength: 0,
            mostTalkedToNPC: null,
            longestConversation: 0
        };
        
        console.log('DialogueSystem initialized');
    }
    
    init(gameEngine) {
        this.gameEngine = gameEngine;
        console.log('DialogueSystem connected to GameEngine');
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        // Update text animation
        if (this.isTextAnimating) {
            this.updateTextAnimation(deltaTime);
        }
    }
    
    updateTextAnimation(deltaTime) {
        this.textAnimationTimer += deltaTime;
        
        const targetCharIndex = Math.floor(
            (this.textAnimationTimer / 1000) * this.textSpeed
        );
        
        if (targetCharIndex > this.currentCharIndex && 
            this.currentCharIndex < this.fullText.length) {
            
            this.currentCharIndex = Math.min(targetCharIndex, this.fullText.length);
            this.displayedText = this.fullText.substring(0, this.currentCharIndex);
            
            // Play text sound effect
            if (this.currentCharIndex % 3 === 0) { // Every 3rd character
                this.playSound('textSound');
            }
        }
        
        // Check if text animation is complete
        if (this.currentCharIndex >= this.fullText.length) {
            this.isTextAnimating = false;
            this.showResponsesIfAvailable();
        }
    }
    
    // Main dialogue management
    startDialogue(npc, player, dialogueData = null) {
        if (this.isActive) {
            console.warn('Dialogue already active');
            return false;
        }
        
        this.isActive = true;
        this.currentNPC = npc;
        this.currentPlayer = player;
        this.conversationContext = {};
        
        // Get dialogue from NPC or use provided data
        const dialogueResult = dialogueData || npc.startDialogue(player.entityId);
        
        if (!dialogueResult.success) {
            this.endDialogue();
            return false;
        }
        
        // Initialize dialogue tree if available
        if (dialogueResult.dialogueTree) {
            this.dialogueTree = dialogueResult.dialogueTree;
            this.currentNode = this.dialogueTree.startNode || 'start';
            this.processDialogueNode(this.currentNode);
        } else {
            // Simple single dialogue
            this.displayDialogue({
                text: dialogueResult.dialogue,
                speaker: npc.name,
                responses: this.getDefaultResponses()
            });
        }
        
        this.stats.totalConversations++;
        
        console.log(`Started dialogue with ${npc.name}`);
        return true;
    }
    
    processDialogueNode(nodeId) {
        if (!this.dialogueTree || !this.dialogueTree.nodes) {
            console.error('Invalid dialogue tree');
            this.endDialogue();
            return;
        }
        
        const node = this.dialogueTree.nodes[nodeId];
        if (!node) {
            console.error(`Dialogue node '${nodeId}' not found`);
            this.endDialogue();
            return;
        }
        
        // Process node conditions
        if (node.conditions && !this.evaluateConditions(node.conditions)) {
            // Move to fallback node or end dialogue
            if (node.fallback) {
                this.processDialogueNode(node.fallback);
            } else {
                this.endDialogue();
            }
            return;
        }
        
        // Execute node actions
        if (node.actions) {
            this.executeNodeActions(node.actions);
        }
        
        // Display dialogue
        this.displayDialogue({
            text: this.processDialogueText(node.text),
            speaker: node.speaker || this.currentNPC.name,
            responses: this.processNodeResponses(node.responses || [])
        });
        
        // Store current node
        this.currentNode = nodeId;
        this.dialogueHistory.push(nodeId);
    }
    
    processDialogueText(text) {
        if (typeof text === 'string') return text;
        
        // Handle conditional text
        if (text.conditions) {
            for (const condition of text.conditions) {
                if (this.evaluateConditions(condition.if)) {
                    return condition.text;
                }
            }
        }
        
        // Fallback to default text
        return text.default || "...";
    }
    
    processNodeResponses(responses) {
        const processedResponses = [];
        
        for (const response of responses) {
            // Check if response should be shown
            if (response.conditions && !this.evaluateConditions(response.conditions)) {
                continue;
            }
            
            processedResponses.push({
                text: response.text,
                action: response.action,
                nextNode: response.nextNode,
                requiresItem: response.requiresItem,
                friendshipRequirement: response.friendshipRequirement
            });
        }
        
        // Add default responses if none available
        if (processedResponses.length === 0) {
            processedResponses.push(...this.getDefaultResponses());
        }
        
        return processedResponses;
    }
    
    evaluateConditions(conditions) {
        if (!conditions) return true;
        
        for (const condition of conditions) {
            switch (condition.type) {
                case 'friendship':
                    const relationship = this.currentNPC.getRelationshipData(this.currentPlayer.entityId);
                    if (relationship.friendshipPoints < condition.value) {
                        return false;
                    }
                    break;
                    
                case 'has_item':
                    if (!this.currentPlayer.inventory.hasItem(condition.item, condition.quantity || 1)) {
                        return false;
                    }
                    break;
                    
                case 'time_of_day':
                    const timeData = this.gameEngine?.timeSystem?.getTimeData();
                    if (!timeData || timeData.timeOfDay < condition.min || timeData.timeOfDay > condition.max) {
                        return false;
                    }
                    break;
                    
                case 'weather':
                    const weather = this.gameEngine?.weatherSystem?.getCurrentWeather();
                    if (!weather || weather.type !== condition.weather) {
                        return false;
                    }
                    break;
                    
                case 'custom':
                    if (!this.evaluateCustomCondition(condition)) {
                        return false;
                    }
                    break;
            }
        }
        
        return true;
    }
    
    evaluateCustomCondition(condition) {
        // Handle custom conditions based on game state
        switch (condition.key) {
            case 'first_meeting':
                const relationship = this.currentNPC.getRelationshipData(this.currentPlayer.entityId);
                return relationship.totalInteractions === 0;
                
            case 'daily_limit':
                return this.currentNPC.dailyInteractions < this.currentNPC.maxDailyInteractions;
                
            default:
                return true;
        }
    }
    
    executeNodeActions(actions) {
        for (const action of actions) {
            switch (action.type) {
                case 'add_friendship':
                    this.currentNPC.updateRelationship(
                        this.currentPlayer.entityId, 
                        action.amount, 
                        'dialogue'
                    );
                    break;
                    
                case 'give_item':
                    this.currentPlayer.inventory.addItem(action.item, action.quantity || 1);
                    break;
                    
                case 'take_item':
                    this.currentPlayer.inventory.removeItem(action.item, action.quantity || 1);
                    break;
                    
                case 'set_flag':
                    this.conversationContext[action.flag] = action.value || true;
                    break;
                    
                case 'change_mood':
                    this.currentNPC.mood = action.mood;
                    break;
            }
        }
    }
    
    displayDialogue(dialogueData) {
        this.fullText = dialogueData.text;
        this.displayedText = '';
        this.currentCharIndex = 0;
        this.textAnimationTimer = 0;
        this.isTextAnimating = true;
        this.responses = dialogueData.responses || [];
        this.showingResponses = false;
        this.currentResponseIndex = 0;
        
        this.currentDialogue = {
            speaker: dialogueData.speaker,
            text: dialogueData.text,
            responses: dialogueData.responses
        };
    }
    
    showResponsesIfAvailable() {
        if (this.responses.length > 0) {
            this.showingResponses = true;
        }
    }
    
    getDefaultResponses() {
        return [
            {
                text: "Thanks for talking with me.",
                action: 'end_dialogue',
                nextNode: null
            },
            {
                text: "I should get going.",
                action: 'end_dialogue',
                nextNode: null
            }
        ];
    }
    
    // Input handling
    handleInput(inputManager) {
        if (!this.isActive) return;
        
        const now = Date.now();
        if (now - this.lastInputTime < this.inputCooldown) return;
        
        // Handle escape key to close dialogue
        if (inputManager.isKeyPressed(this.cancelKey)) {
            this.endDialogue();
            this.lastInputTime = now;
            return;
        }
        
        if (this.showingResponses) {
            this.handleResponseInput(inputManager);
        } else {
            this.handleDialogueInput(inputManager);
        }
    }
    
    handleDialogueInput(inputManager) {
        const now = Date.now();
        
        if (inputManager.isKeyPressed(this.skipTextKey)) {
            if (this.isTextAnimating) {
                // Skip text animation
                this.displayedText = this.fullText;
                this.currentCharIndex = this.fullText.length;
                this.isTextAnimating = false;
                this.showResponsesIfAvailable();
                this.playSound('confirmSound');
            } else if (this.responses.length === 0) {
                // No responses available, end dialogue
                this.endDialogue();
            }
            
            this.lastInputTime = now;
        }
    }
    
    handleResponseInput(inputManager) {
        const now = Date.now();
        
        // Navigate responses with arrow keys
        if (inputManager.isKeyPressed('ArrowUp')) {
            this.currentResponseIndex = Math.max(0, this.currentResponseIndex - 1);
            this.playSound('selectSound');
            this.lastInputTime = now;
        } else if (inputManager.isKeyPressed('ArrowDown')) {
            this.currentResponseIndex = Math.min(
                this.responses.length - 1, 
                this.currentResponseIndex + 1
            );
            this.playSound('selectSound');
            this.lastInputTime = now;
        }
        
        // Select response
        if (inputManager.isKeyPressed(this.selectResponseKey)) {
            this.selectResponse(this.currentResponseIndex);
            this.lastInputTime = now;
        }
    }
    
    selectResponse(responseIndex) {
        if (responseIndex < 0 || responseIndex >= this.responses.length) return;
        
        const response = this.responses[responseIndex];
        this.playSound('confirmSound');
        
        // Execute response action
        switch (response.action) {
            case 'end_dialogue':
                this.endDialogue();
                break;
                
            case 'continue_dialogue':
                if (response.nextNode) {
                    this.processDialogueNode(response.nextNode);
                } else {
                    this.endDialogue();
                }
                break;
                
            case 'give_gift':
                this.handleGiftGiving();
                break;
                
            case 'shop':
                this.openShop();
                break;
                
            default:
                if (response.nextNode) {
                    this.processDialogueNode(response.nextNode);
                } else {
                    this.endDialogue();
                }
                break;
        }
    }
    
    handleGiftGiving() {
        // TODO: Implement gift selection UI
        // For now, just show a placeholder message
        this.displayDialogue({
            text: "What would you like to give me?",
            speaker: this.currentNPC.name,
            responses: [
                {
                    text: "Never mind.",
                    action: 'end_dialogue'
                }
            ]
        });
    }
    
    openShop() {
        // TODO: Integrate with shop system
        console.log(`Opening shop for ${this.currentNPC.name}`);
        this.endDialogue();
    }
    
    endDialogue() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.currentDialogue = null;
        this.currentNPC = null;
        this.currentPlayer = null;
        this.dialogueTree = null;
        this.currentNode = null;
        this.dialogueHistory = [];
        this.conversationContext = {};
        
        this.displayedText = '';
        this.fullText = '';
        this.responses = [];
        this.showingResponses = false;
        this.isTextAnimating = false;
        
        this.playSound('cancelSound');
        console.log('Dialogue ended');
    }
    
    // Rendering
    render(renderSystem) {
        if (!this.isActive || !this.currentDialogue) return;
        
        this.renderDialogueBox(renderSystem);
        
        if (this.showingResponses) {
            this.renderResponseBox(renderSystem);
        }
    }
    
    renderDialogueBox(renderSystem) {
        const box = this.dialogueBox;
        
        // Draw dialogue box background
        renderSystem.drawRect(
            box.x, box.y, box.width, box.height,
            box.backgroundColor,
            { alpha: 0.9, layer: 900 }
        );
        
        // Draw border
        renderSystem.drawRect(
            box.x - 2, box.y - 2, box.width + 4, box.height + 4,
            box.borderColor,
            { alpha: 0.8, layer: 899 }
        );
        
        // Draw speaker name
        if (this.currentDialogue.speaker) {
            renderSystem.drawText(
                this.currentDialogue.speaker,
                box.x + box.padding,
                box.y + box.padding,
                {
                    color: '#FFD700',
                    fontSize: 16,
                    fontWeight: 'bold',
                    layer: 901
                }
            );
        }
        
        // Draw dialogue text
        this.renderWrappedText(
            renderSystem,
            this.displayedText,
            box.x + box.padding,
            box.y + box.padding + 25,
            box.width - (box.padding * 2),
            box.textColor
        );
        
        // Draw continue indicator
        if (!this.isTextAnimating && !this.showingResponses) {
            const indicatorX = box.x + box.width - box.padding - 20;
            const indicatorY = box.y + box.height - box.padding - 10;
            
            renderSystem.drawText(
                '▼',
                indicatorX, indicatorY,
                {
                    color: '#FFD700',
                    fontSize: 12,
                    layer: 901
                }
            );
        }
    }
    
    renderResponseBox(renderSystem) {
        if (this.responses.length === 0) return;
        
        const box = this.responseBox;
        
        // Draw response box background
        renderSystem.drawRect(
            box.x, box.y, box.width, box.height,
            '#1a1a1a',
            { alpha: 0.95, layer: 902 }
        );
        
        // Draw border
        renderSystem.drawRect(
            box.x - 2, box.y - 2, box.width + 4, box.height + 4,
            '#ffffff',
            { alpha: 0.8, layer: 901 }
        );
        
        // Draw responses
        for (let i = 0; i < this.responses.length; i++) {
            const response = this.responses[i];
            const y = box.y + box.padding + (i * 25);
            const isSelected = i === this.currentResponseIndex;
            
            // Highlight selected response
            if (isSelected) {
                renderSystem.drawRect(
                    box.x + 5, y - 2, box.width - 10, 20,
                    '#333333',
                    { alpha: 0.8, layer: 902 }
                );
            }
            
            // Draw response text
            renderSystem.drawText(
                `${isSelected ? '► ' : '  '}${response.text}`,
                box.x + box.padding,
                y,
                {
                    color: isSelected ? '#FFD700' : '#FFFFFF',
                    fontSize: 14,
                    layer: 903
                }
            );
        }
    }
    
    renderWrappedText(renderSystem, text, x, y, maxWidth, color) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        const lineHeight = 18;
        
        for (const word of words) {
            const testLine = line + word + ' ';
            const testWidth = this.getTextWidth(testLine, 14);
            
            if (testWidth > maxWidth && line !== '') {
                renderSystem.drawText(
                    line.trim(),
                    x, currentY,
                    {
                        color: color,
                        fontSize: 14,
                        layer: 901
                    }
                );
                line = word + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        
        // Draw remaining text
        if (line.trim() !== '') {
            renderSystem.drawText(
                line.trim(),
                x, currentY,
                {
                    color: color,
                    fontSize: 14,
                    layer: 901
                }
            );
        }
    }
    
    getTextWidth(text, fontSize) {
        // Approximate text width calculation
        return text.length * (fontSize * 0.6);
    }
    
    playSound(soundType) {
        const soundId = this.soundEffects[soundType];
        if (soundId && this.gameEngine?.assetManager) {
            // this.gameEngine.assetManager.playAudio(soundId);
            console.log(`Playing sound: ${soundId}`);
        }
    }
    
    // Utility methods
    isDialogueActive() {
        return this.isActive;
    }
    
    getCurrentNPC() {
        return this.currentNPC;
    }
    
    getStats() {
        return { ...this.stats };
    }
    
    // Debug methods
    renderDebug(renderSystem) {
        if (!this.gameEngine.isDebugMode() || !this.isActive) return;
        
        let yOffset = 250;
        const debugColor = '#ff00ff';
        
        renderSystem.drawText(
            `Dialogue: ${this.currentNPC?.name} | Node: ${this.currentNode}`,
            10, yOffset, { color: debugColor, layer: 1000 }
        );
        yOffset += 15;
        
        renderSystem.drawText(
            `Responses: ${this.responses.length} | Selected: ${this.currentResponseIndex}`,
            10, yOffset, { color: debugColor, layer: 1000 }
        );
        yOffset += 15;
        
        renderSystem.drawText(
            `Text Progress: ${this.currentCharIndex}/${this.fullText.length}`,
            10, yOffset, { color: debugColor, layer: 1000 }
        );
    }
}