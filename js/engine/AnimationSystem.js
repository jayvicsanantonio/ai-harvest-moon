// Animation system for managing sprite animations and transitions
// Handles frame timing, animation blending, and state machines

export class AnimationSystem {
    constructor() {
        this.animations = new Map();
        this.activeAnimations = new Map();
        this.animationQueue = new Map(); // Queue system for chained animations
        this.blendingAnimations = new Map(); // For animation blending/transitions
        this.globalSpeed = 1.0; // Global animation speed multiplier
    }
    
    // Register an animation with frames, timing, and advanced options
    registerAnimation(name, options) {
        // Support both old format and new options object
        if (Array.isArray(options)) {
            // Legacy format: registerAnimation(name, frames, frameTime, loop)
            options = {
                frames: options,
                frameTime: arguments[2] || 150,
                loop: arguments[3] !== undefined ? arguments[3] : true
            };
        }
        
        const animation = {
            frames: options.frames || [],
            frameTime: options.frameTime || 150,
            loop: options.loop !== undefined ? options.loop : true,
            priority: options.priority || 0,
            blendMode: options.blendMode || 'replace', // 'replace', 'additive', 'blend'
            events: options.events || {}, // Frame-based events: {frameIndex: callback}
            tags: options.tags || [], // Animation tags for grouping/filtering
            speed: options.speed || 1.0, // Animation-specific speed multiplier
            totalTime: (options.frames || []).length * (options.frameTime || 150)
        };
        
        this.animations.set(name, animation);
    }
    
    // Start an animation for an entity with advanced options
    startAnimation(entityId, animationName, options = {}) {
        const animation = this.animations.get(animationName);
        if (!animation) {
            console.warn(`Animation ${animationName} not found`);
            return false;
        }
        
        const currentActive = this.activeAnimations.get(entityId);
        const priority = options.priority || animation.priority;
        const force = options.force || false;
        const queue = options.queue || false;
        
        // Handle priority and queueing
        if (currentActive && !force) {
            if (priority < currentActive.animation.priority) {
                // Lower priority, queue it or ignore
                if (queue) {
                    this.queueAnimation(entityId, animationName, options);
                }
                return false;
            }
        }
        
        // Handle animation queuing
        if (queue && currentActive && !currentActive.completed) {
            this.queueAnimation(entityId, animationName, options);
            return true;
        }
        
        const activeAnimation = {
            name: animationName,
            animation,
            currentTime: options.startTime || 0,
            currentFrame: 0,
            onComplete: options.onComplete || null,
            completed: false,
            speed: (options.speed || 1.0) * animation.speed,
            blendWeight: options.blendWeight || 1.0,
            lastEventFrame: -1 // Track last fired event frame
        };
        
        this.activeAnimations.set(entityId, activeAnimation);
        
        // Fire start event if exists
        if (animation.events[0]) {
            animation.events[0](entityId, 0);
            activeAnimation.lastEventFrame = 0;
        }
        
        return true;
    }
    
    // Queue an animation to play after current one completes
    queueAnimation(entityId, animationName, options = {}) {
        if (!this.animationQueue.has(entityId)) {
            this.animationQueue.set(entityId, []);
        }
        
        this.animationQueue.get(entityId).push({
            name: animationName,
            options: options
        });
    }
    
    // Process animation queue for an entity
    processQueue(entityId) {
        const queue = this.animationQueue.get(entityId);
        if (!queue || queue.length === 0) return;
        
        const nextAnim = queue.shift();
        this.startAnimation(entityId, nextAnim.name, nextAnim.options);
        
        // Clean up empty queues
        if (queue.length === 0) {
            this.animationQueue.delete(entityId);
        }
    }
    
    // Update all active animations with events and improved timing
    update(deltaTime) {
        const scaledDelta = deltaTime * this.globalSpeed;
        
        for (const [entityId, activeAnim] of this.activeAnimations.entries()) {
            if (activeAnim.completed || activeAnim.paused) continue;
            
            // Apply entity-specific speed and global speed
            activeAnim.currentTime += scaledDelta * activeAnim.speed;
            
            // Calculate current frame
            const frameIndex = Math.floor(activeAnim.currentTime / activeAnim.animation.frameTime);
            
            // Fire animation events
            if (frameIndex !== activeAnim.currentFrame && frameIndex < activeAnim.animation.frames.length) {
                // Fire events for frames we've crossed
                for (let i = activeAnim.currentFrame + 1; i <= frameIndex; i++) {
                    if (activeAnim.animation.events[i] && i > activeAnim.lastEventFrame) {
                        activeAnim.animation.events[i](entityId, i);
                        activeAnim.lastEventFrame = i;
                    }
                }
            }
            
            if (frameIndex >= activeAnim.animation.frames.length) {
                if (activeAnim.animation.loop) {
                    // Loop animation - reset timing and events
                    activeAnim.currentTime = 0;
                    activeAnim.currentFrame = 0;
                    activeAnim.lastEventFrame = -1;
                    
                    // Fire start event again on loop
                    if (activeAnim.animation.events[0]) {
                        activeAnim.animation.events[0](entityId, 0);
                        activeAnim.lastEventFrame = 0;
                    }
                } else {
                    // Animation completed
                    activeAnim.completed = true;
                    activeAnim.currentFrame = activeAnim.animation.frames.length - 1;
                    
                    if (activeAnim.onComplete) {
                        activeAnim.onComplete(entityId);
                    }
                    
                    // Process animation queue
                    this.processQueue(entityId);
                }
            } else {
                activeAnim.currentFrame = frameIndex;
            }
        }
        
        // Clean up completed non-looping animations
        const toDelete = [];
        for (const [entityId, activeAnim] of this.activeAnimations.entries()) {
            if (activeAnim.completed && !activeAnim.animation.loop) {
                toDelete.push(entityId);
            }
        }
        
        for (const entityId of toDelete) {
            this.activeAnimations.delete(entityId);
        }
    }
    
    // Get current sprite frame for an entity
    getCurrentSprite(entityId) {
        const activeAnim = this.activeAnimations.get(entityId);
        if (!activeAnim) return null;
        
        const frames = activeAnim.animation.frames;
        return frames[activeAnim.currentFrame] || frames[0];
    }
    
    // Stop animation for an entity
    stopAnimation(entityId) {
        this.activeAnimations.delete(entityId);
    }
    
    // Check if animation is playing
    isPlaying(entityId, animationName = null) {
        const activeAnim = this.activeAnimations.get(entityId);
        if (!activeAnim) return false;
        
        if (animationName) {
            return activeAnim.name === animationName && !activeAnim.completed;
        }
        
        return !activeAnim.completed;
    }
    
    // Get animation progress (0-1)
    getProgress(entityId) {
        const activeAnim = this.activeAnimations.get(entityId);
        if (!activeAnim) return 0;
        
        return Math.min(activeAnim.currentTime / activeAnim.animation.totalTime, 1);
    }
    
    // Set global animation speed multiplier
    setGlobalSpeed(speed) {
        this.globalSpeed = Math.max(0, speed);
    }
    
    // Get global animation speed
    getGlobalSpeed() {
        return this.globalSpeed;
    }
    
    // Pause all animations for an entity
    pauseAnimation(entityId) {
        const activeAnim = this.activeAnimations.get(entityId);
        if (activeAnim) {
            activeAnim.paused = true;
        }
    }
    
    // Resume animation for an entity
    resumeAnimation(entityId) {
        const activeAnim = this.activeAnimations.get(entityId);
        if (activeAnim) {
            activeAnim.paused = false;
        }
    }
    
    // Get all animations with specific tag
    getAnimationsByTag(tag) {
        const result = [];
        for (const [name, animation] of this.animations.entries()) {
            if (animation.tags.includes(tag)) {
                result.push(name);
            }
        }
        return result;
    }
    
    // Clear animation queue for entity
    clearQueue(entityId) {
        this.animationQueue.delete(entityId);
    }
    
    // Get queue length for entity
    getQueueLength(entityId) {
        const queue = this.animationQueue.get(entityId);
        return queue ? queue.length : 0;
    }
    
    // Advanced: Cross-fade between animations (for smooth transitions)
    crossFade(entityId, toAnimation, duration = 300) {
        const currentActive = this.activeAnimations.get(entityId);
        if (!currentActive) {
            return this.startAnimation(entityId, toAnimation);
        }
        
        // Store current animation for blending
        this.blendingAnimations.set(entityId, {
            from: { ...currentActive },
            to: toAnimation,
            duration,
            currentTime: 0,
            blendProgress: 0
        });
        
        // Start new animation with reduced opacity initially
        return this.startAnimation(entityId, toAnimation, { 
            blendWeight: 0,
            force: true
        });
    }
}

// Animation State Machine for complex character animations
export class AnimationStateMachine {
    constructor(animationSystem, entityId) {
        this.animationSystem = animationSystem;
        this.entityId = entityId;
        this.currentState = null;
        this.states = new Map();
        this.transitions = new Map();
        this.parameters = new Map();
    }
    
    // Add animation state
    addState(stateName, animationName, onEnter = null, onExit = null) {
        this.states.set(stateName, {
            animationName,
            onEnter,
            onExit
        });
    }
    
    // Add transition between states
    addTransition(fromState, toState, condition) {
        const key = `${fromState}->${toState}`;
        this.transitions.set(key, condition);
    }
    
    // Set parameter for conditions with type safety
    setParameter(name, value) {
        const oldValue = this.parameters.get(name);
        this.parameters.set(name, value);
        
        // Trigger immediate transition check if parameter changed
        if (oldValue !== value) {
            this.update();
        }
    }
    
    // Get parameter value with default
    getParameter(name, defaultValue = null) {
        return this.parameters.has(name) ? this.parameters.get(name) : defaultValue;
    }
    
    // Set multiple parameters at once
    setParameters(paramObj) {
        let hasChanges = false;
        for (const [name, value] of Object.entries(paramObj)) {
            if (this.parameters.get(name) !== value) {
                hasChanges = true;
                this.parameters.set(name, value);
            }
        }
        
        // Only update if parameters actually changed
        if (hasChanges) {
            this.update();
        }
    }
    
    // Convenience methods for boolean parameters (triggers)
    trigger(triggerName) {
        this.setParameter(triggerName, true);
        // Auto-reset trigger after one update cycle
        setTimeout(() => {
            if (this.parameters.get(triggerName)) {
                this.parameters.set(triggerName, false);
            }
        }, 0);
    }
    
    // Update state machine
    update() {
        // Check for valid transitions from current state
        if (this.currentState) {
            for (const [transitionKey, condition] of this.transitions.entries()) {
                if (transitionKey.startsWith(this.currentState + '->')) {
                    const targetState = transitionKey.split('->')[1];
                    
                    if (condition(this.parameters)) {
                        this.transitionTo(targetState);
                        break;
                    }
                }
            }
        }
    }
    
    // Transition to a new state
    transitionTo(stateName) {
        if (!this.states.has(stateName)) {
            console.warn(`State ${stateName} not found`);
            return false;
        }
        
        // Exit current state
        if (this.currentState) {
            const currentStateData = this.states.get(this.currentState);
            if (currentStateData.onExit) {
                currentStateData.onExit();
            }
        }
        
        // Enter new state
        const newStateData = this.states.get(stateName);
        this.currentState = stateName;
        
        if (newStateData.onEnter) {
            newStateData.onEnter();
        }
        
        // Start animation
        this.animationSystem.startAnimation(this.entityId, newStateData.animationName);
        
        return true;
    }
    
    // Get current state
    getCurrentState() {
        return this.currentState;
    }
    
    // Force state without transitions
    forceState(stateName) {
        this.transitionTo(stateName);
    }
}