# Harvest Moon Web Game

A web-based farming simulation game inspired by Harvest Moon, built with vanilla JavaScript and HTML5 Canvas.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Python 3.6 or higher (for development server)

### Running the Game

#### Option 1: Quick Start (Recommended)
```bash
npm run dev
```
This will:
1. Start the development server on port 8000
2. Automatically open the game in your browser
3. Navigate to http://localhost:8000

#### Option 2: Manual Start
```bash
# Start the development server
npm start

# Then manually open your browser and go to:
# http://localhost:8000
```

#### Option 3: Alternative Server
If you prefer using Node.js instead of Python:
```bash
# Install a simple HTTP server
npm install -g http-server

# Start the server
http-server -p 8000

# Open http://localhost:8000 in your browser
```

## 🎮 Game Controls

- **Arrow Keys / WASD**: Move player
- **H**: Use hoe (till soil)
- **W**: Use watering can
- **P**: Plant seeds
- **R**: Harvest crops
- **I**: Open inventory
- **F**: Start fishing
- **M**: Mining mode
- **Q**: Open cooking interface
- **U**: Tool upgrades
- **B**: Building upgrades
- **A**: View achievements
- **Enter**: Sleep (advance to next day)
- **F1**: Toggle debug mode

## 🛠 Development

### Project Structure
```
ai-harvest-moon/
├── index.html              # Main HTML file
├── js/                     # Game source code
│   ├── engine/             # Core game engine
│   ├── systems/            # Game systems (farming, time, etc.)
│   ├── entities/           # Game entities (player, crops, etc.)
│   ├── scenes/             # Game scenes (farm, village, etc.)
│   └── utils/              # Utility functions
├── styles/                 # CSS styles
├── tests/                  # Test files
└── assets/                 # Game assets (sprites, audio, data)
```

### Available Scripts

- `npm start` - Start development server
- `npm run dev` - Start server and open browser
- `npm test` - Run unit tests
- `npm run test-browser` - Run browser tests with Playwright
- `npm run clean` - Clean up temporary files

### Testing
```bash
# Run all tests (unit, integration, performance)
npm test

# Run browser automation tests
npm run test-browser
```

### Development Notes

- The game uses ES6 modules, so it must be served via HTTP (not file://)
- Assets will use fallback colored rectangles when sprite files are missing
- Debug mode (F1) shows performance metrics and system information
- The game includes comprehensive testing with 58+ test cases

## 🎯 Game Features

### Completed Systems
- ✅ Core game engine with 60fps rendering
- ✅ Player movement and animation
- ✅ Farming system (tilling, planting, watering, harvesting)
- ✅ Time and seasonal systems
- ✅ Day/night cycle with sleep mechanics
- ✅ Weather system affecting crops
- ✅ Save/load system with localStorage
- ✅ Animal care system (cows, chickens, sheep)
- ✅ NPC interactions and dialogue
- ✅ Fishing mini-game with timing mechanics
- ✅ Mining system with rock breaking
- ✅ Cooking system with recipes
- ✅ Tool and building upgrade systems
- ✅ Achievement system with 19+ achievements
- ✅ Comprehensive testing suite

### Technical Features
- Entity-Component-System architecture
- Spatial collision detection system
- Asset management with fallbacks
- Performance monitoring and optimization
- Cross-system integration testing
- Memory leak prevention

## 🐛 Troubleshooting

### Loading Screen Stuck
The game includes multiple fallback mechanisms:
- 10-second asset loading timeout
- 15-second emergency game start
- Fallback sprites for missing assets

### CORS Errors
Make sure you're accessing the game via `http://localhost:8000`, not by opening the HTML file directly.

### Port Already in Use
If port 8000 is busy, try:
```bash
# Kill existing server
lsof -i :8000
kill [PID]

# Or use a different port
python3 -m http.server 8080
```

### Performance Issues
- Press F1 to enable debug mode and monitor FPS
- The game targets 60fps with fallback to 30fps under load
- Performance tests ensure smooth operation with large farms

## 📝 License

MIT License - Feel free to modify and distribute!

## 🚀 Next Steps

1. Run `npm run dev` to start developing
2. Open http://localhost:8000 to play
3. Press F1 for debug information
4. Check the console for detailed logging

Happy farming! 🌾