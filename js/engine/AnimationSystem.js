// Animation system for managing sprite animations and transitions
// Handles frame timing, animation blending, and state machines

export class AnimationSystem {
    constructor() {
        this.animations = new Map();
        this.activeAnimations = new Map();
    }
    
    // Register an animation with frames and timing
    registerAnimation(name, frames, frameTime = 150, loop = true) {
        this.animations.set(name, {
            frames,
            frameTime,
            loop,
            totalTime: frames.length * frameTime
        });
    }
    
    // Start an animation for an entity
    startAnimation(entityId, animationName, onComplete = null) {
        const animation = this.animations.get(animationName);
        if (!animation) {
            console.warn(`Animation ${animationName} not found`);
            return false;
        }
        
        this.activeAnimations.set(entityId, {
            name: animationName,
            animation,
            currentTime: 0,
            currentFrame: 0,
            onComplete,
            completed: false
        });
        
        return true;
    }
    
    // Update all active animations
    update(deltaTime) {
        for (const [entityId, activeAnim] of this.activeAnimations.entries()) {
            if (activeAnim.completed) continue;
            
            activeAnim.currentTime += deltaTime;
            
            // Calculate current frame
            const frameIndex = Math.floor(activeAnim.currentTime / activeAnim.animation.frameTime);
            
            if (frameIndex >= activeAnim.animation.frames.length) {
                if (activeAnim.animation.loop) {
                    // Loop animation
                    activeAnim.currentTime = 0;
                    activeAnim.currentFrame = 0;
                } else {
                    // Animation completed
                    activeAnim.completed = true;
                    activeAnim.currentFrame = activeAnim.animation.frames.length - 1;
                    
                    if (activeAnim.onComplete) {
                        activeAnim.onComplete(entityId);
                    }
                }
            } else {
                activeAnim.currentFrame = frameIndex;
            }
        }
        
        // Clean up completed non-looping animations
        for (const [entityId, activeAnim] of this.activeAnimations.entries()) {
            if (activeAnim.completed && !activeAnim.animation.loop) {
                this.activeAnimations.delete(entityId);
            }
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
    
    // Set parameter for conditions
    setParameter(name, value) {
        this.parameters.set(name, value);
    }
    
    // Get parameter value
    getParameter(name) {
        return this.parameters.get(name);
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