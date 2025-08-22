// Input management system for keyboard and mouse controls
// Provides consistent input handling across all game systems

export class InputManager {
    constructor() {
        // Key state tracking for frame-based input
        this.keys = new Map();
        this.keysPressed = new Map(); // Keys pressed this frame
        this.keysReleased = new Map(); // Keys released this frame
        this.previousKeys = new Map(); // Keys from previous frame
        
        // Action bindings
        this.keyBindings = new Map();
        this.actionStates = new Map();
        
        // Mouse state
        this.mouse = {
            x: 0,
            y: 0,
            left: false,
            right: false,
            middle: false,
            leftPressed: false,
            rightPressed: false,
            leftReleased: false,
            rightReleased: false
        };
        
        // Input buffering for consistent timing
        this.inputBuffer = [];
        this.bufferSize = 5; // Frames to buffer inputs
        
        this.setupDefaultBindings();
        this.bindEvents();
    }

    setupDefaultBindings() {
        // Movement bindings
        this.keyBindings.set('ArrowUp', 'move_up');
        this.keyBindings.set('ArrowDown', 'move_down');
        this.keyBindings.set('ArrowLeft', 'move_left');
        this.keyBindings.set('ArrowRight', 'move_right');
        this.keyBindings.set('KeyW', 'move_up');
        this.keyBindings.set('KeyS', 'move_down');
        this.keyBindings.set('KeyA', 'move_left');
        this.keyBindings.set('KeyD', 'move_right');
        
        // Action bindings
        this.keyBindings.set('Space', 'action');
        this.keyBindings.set('KeyE', 'interact');
        this.keyBindings.set('KeyF', 'use_tool');
        this.keyBindings.set('KeyQ', 'quick_action');
        
        // UI bindings
        this.keyBindings.set('KeyI', 'inventory');
        this.keyBindings.set('KeyM', 'map');
        this.keyBindings.set('Escape', 'menu');
        this.keyBindings.set('Enter', 'confirm');
        
        // Tool selection (1-9 keys)
        for (let i = 1; i <= 9; i++) {
            this.keyBindings.set(`Digit${i}`, `tool_${i}`);
        }
    }

    bindEvents() {
        // Keyboard events
        document.addEventListener('keydown', (event) => {
            if (!this.keys.get(event.code)) {
                this.keysPressed.set(event.code, true);
            }
            this.keys.set(event.code, true);
            
            // Add to input buffer
            this.addToBuffer({
                type: 'keydown',
                code: event.code,
                timestamp: performance.now()
            });
            
            // Prevent default for game keys to avoid browser shortcuts
            if (this.keyBindings.has(event.code)) {
                event.preventDefault();
            }
        });

        document.addEventListener('keyup', (event) => {
            this.keysReleased.set(event.code, true);
            this.keys.set(event.code, false);
            
            this.addToBuffer({
                type: 'keyup',
                code: event.code,
                timestamp: performance.now()
            });
        });
        
        // Mouse events
        document.addEventListener('mousemove', (event) => {
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
        });
        
        document.addEventListener('mousedown', (event) => {
            switch (event.button) {
                case 0: // Left click
                    this.mouse.leftPressed = true;
                    this.mouse.left = true;
                    break;
                case 1: // Middle click
                    this.mouse.middle = true;
                    break;
                case 2: // Right click
                    this.mouse.rightPressed = true;
                    this.mouse.right = true;
                    event.preventDefault(); // Prevent context menu
                    break;
            }
        });
        
        document.addEventListener('mouseup', (event) => {
            switch (event.button) {
                case 0: // Left click
                    this.mouse.leftReleased = true;
                    this.mouse.left = false;
                    break;
                case 1: // Middle click
                    this.mouse.middle = false;
                    break;
                case 2: // Right click
                    this.mouse.rightReleased = true;
                    this.mouse.right = false;
                    break;
            }
        });
        
        // Prevent right-click context menu
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }
    
    addToBuffer(input) {
        this.inputBuffer.push(input);
        if (this.inputBuffer.length > this.bufferSize) {
            this.inputBuffer.shift();
        }
    }
    
    // Call this each frame to update input states
    update() {
        // Clear frame-specific states
        this.keysPressed.clear();
        this.keysReleased.clear();
        this.mouse.leftPressed = false;
        this.mouse.rightPressed = false;
        this.mouse.leftReleased = false;
        this.mouse.rightReleased = false;
        
        // Update action states based on current key bindings
        this.updateActionStates();
    }
    
    updateActionStates() {
        for (const [key, action] of this.keyBindings) {
            const isPressed = this.keys.get(key) || false;
            const wasPressed = this.previousKeys.get(key) || false;
            
            this.actionStates.set(action, {
                held: isPressed,
                pressed: isPressed && !wasPressed,
                released: !isPressed && wasPressed
            });
        }
        
        // Copy current keys to previous for next frame
        this.previousKeys = new Map(this.keys);
    }

    // Check if action is currently held down
    isActionHeld(action) {
        const state = this.actionStates.get(action);
        return state ? state.held : false;
    }
    
    // Check if action was pressed this frame
    isActionPressed(action) {
        const state = this.actionStates.get(action);
        return state ? state.pressed : false;
    }
    
    // Check if action was released this frame
    isActionReleased(action) {
        const state = this.actionStates.get(action);
        return state ? state.released : false;
    }

    // Direct key state checks
    isKeyHeld(key) {
        return this.keys.get(key) || false;
    }
    
    isKeyPressed(key) {
        return this.keysPressed.get(key) || false;
    }
    
    isKeyReleased(key) {
        return this.keysReleased.get(key) || false;
    }
    
    // Mouse state checks
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
    
    isMousePressed(button = 'left') {
        switch (button) {
            case 'left': return this.mouse.leftPressed;
            case 'right': return this.mouse.rightPressed;
            case 'middle': return this.mouse.middle;
            default: return false;
        }
    }
    
    isMouseHeld(button = 'left') {
        switch (button) {
            case 'left': return this.mouse.left;
            case 'right': return this.mouse.right;
            case 'middle': return this.mouse.middle;
            default: return false;
        }
    }
    
    isMouseReleased(button = 'left') {
        switch (button) {
            case 'left': return this.mouse.leftReleased;
            case 'right': return this.mouse.rightReleased;
            default: return false;
        }
    }
    
    // Get movement input as vector
    getMovementVector() {
        let x = 0;
        let y = 0;
        
        if (this.isActionHeld('move_left')) x -= 1;
        if (this.isActionHeld('move_right')) x += 1;
        if (this.isActionHeld('move_up')) y -= 1;
        if (this.isActionHeld('move_down')) y += 1;
        
        // Normalize diagonal movement
        if (x !== 0 && y !== 0) {
            const length = Math.sqrt(x * x + y * y);
            x /= length;
            y /= length;
        }
        
        return { x, y };
    }
    
    // Customize key bindings
    bindKey(key, action) {
        this.keyBindings.set(key, action);
    }
    
    unbindKey(key) {
        this.keyBindings.delete(key);
    }
    
    // Get all keys bound to an action
    getKeysForAction(action) {
        const keys = [];
        for (const [key, boundAction] of this.keyBindings) {
            if (boundAction === action) {
                keys.push(key);
            }
        }
        return keys;
    }
    
    // Debug: Get input buffer for the last few frames
    getInputBuffer() {
        return [...this.inputBuffer];
    }
}