const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    const consoleMessages = [];
    const pageErrors = [];
    
    // Listen to console messages and store them
    page.on('console', msg => {
        const message = `${msg.type()}: ${msg.text()}`;
        consoleMessages.push(message);
        console.log(`BROWSER: ${message}`);
    });
    
    // Listen to page errors and store them
    page.on('pageerror', error => {
        const errorMessage = `${error.message}\n${error.stack || ''}`;
        pageErrors.push(errorMessage);
        console.error(`PAGE ERROR: ${errorMessage}`);
    });
    
    try {
        console.log('=== STARTING LOADING SCREEN DEBUG TEST ===');
        console.log('Navigating to http://localhost:8000...');
        await page.goto('http://localhost:8000', { waitUntil: 'networkidle' });
        
        console.log('Page loaded, monitoring loading progress...');
        
        // Wait for loading screen to appear
        console.log('Waiting for loading screen to appear...');
        await page.waitForSelector('#loading-screen', { timeout: 5000 });
        console.log('Loading screen is visible');
        
        // Monitor loading progress until it reaches 56/56 or times out
        let loadingComplete = false;
        let attempts = 0;
        const maxAttempts = 60; // 30 seconds with 0.5s intervals
        
        while (!loadingComplete && attempts < maxAttempts) {
            attempts++;
            
            const loadingText = await page.textContent('#loading-text').catch(() => 'N/A');
            console.log(`Attempt ${attempts}: Loading text: ${loadingText}`);
            
            if (loadingText && loadingText.includes('56/56')) {
                console.log('🎯 FOUND: Loading shows 56/56 - assets should be fully loaded!');
                loadingComplete = true;
                
                // Take screenshot of the stuck state
                await page.screenshot({ path: 'loading-stuck-screenshot.png' });
                console.log('Screenshot of stuck state saved as loading-stuck-screenshot.png');
                
                // Now investigate why the transition isn't happening
                await investigateLoadingIssue(page);
                break;
            }
            
            await page.waitForTimeout(500);
        }
        
        if (!loadingComplete) {
            console.log(`⚠️  Loading didn't complete after ${maxAttempts} attempts`);
            const finalLoadingText = await page.textContent('#loading-text').catch(() => 'N/A');
            console.log(`Final loading text: ${finalLoadingText}`);
        }
        
        // Check if game container eventually becomes visible
        try {
            console.log('Checking if game container becomes visible...');
            await page.waitForSelector('#game-container[style*="flex"]', { timeout: 10000 });
            console.log('✅ SUCCESS: Game container is now visible!');
        } catch (timeoutError) {
            console.log('❌ Game container still not visible after loading completion');
            await debugGameContainerState(page);
        }
        
    } catch (error) {
        console.error('Test failed:', error);
        await page.screenshot({ path: 'error-screenshot.png' });
    }
    
    // Print summary of all console messages and errors
    console.log('\n=== CONSOLE MESSAGES SUMMARY ===');
    consoleMessages.forEach((msg, i) => console.log(`${i + 1}. ${msg}`));
    
    if (pageErrors.length > 0) {
        console.log('\n=== PAGE ERRORS SUMMARY ===');
        pageErrors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
    }
    
    // Keep browser open for observation
    console.log('\nKeeping browser open for 10 seconds for observation...');
    await page.waitForTimeout(10000);
    
    await browser.close();
}

async function investigateLoadingIssue(page) {
    console.log('\n=== INVESTIGATING LOADING ISSUE ===');
    
    // Check DOM elements visibility and styles
    const loadingScreenVisible = await page.isVisible('#loading-screen');
    const gameContainerVisible = await page.isVisible('#game-container');
    
    console.log(`Loading screen visible: ${loadingScreenVisible}`);
    console.log(`Game container visible: ${gameContainerVisible}`);
    
    // Get computed styles
    const loadingScreenStyle = await page.evaluate(() => {
        const element = document.getElementById('loading-screen');
        if (!element) return 'Element not found';
        const styles = window.getComputedStyle(element);
        return {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            zIndex: styles.zIndex
        };
    });
    
    const gameContainerStyle = await page.evaluate(() => {
        const element = document.getElementById('game-container');
        if (!element) return 'Element not found';
        const styles = window.getComputedStyle(element);
        return {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity
        };
    });
    
    console.log('Loading screen styles:', loadingScreenStyle);
    console.log('Game container styles:', gameContainerStyle);
    
    // Check if assetsLoaded event listeners are attached
    const eventListenerInfo = await page.evaluate(() => {
        const info = {
            hasAssetLoaderInWindow: typeof window.AssetLoader !== 'undefined',
            hasMainJsLoaded: typeof window.game !== 'undefined',
            documentReadyState: document.readyState,
            assetsLoadedEventListeners: []
        };
        
        // Try to get information about event listeners (limited by browser security)
        try {
            // Check if we can access the AssetLoader
            if (window.AssetLoader) {
                info.assetLoaderMethods = Object.getOwnPropertyNames(window.AssetLoader);
            }
        } catch (e) {
            info.assetLoaderError = e.message;
        }
        
        return info;
    });
    
    console.log('Event listener info:', eventListenerInfo);
    
    // Try to manually dispatch the assetsLoaded event to see what happens
    console.log('Testing manual assetsLoaded event dispatch...');
    await page.evaluate(() => {
        console.log('Manually dispatching assetsLoaded event...');
        document.dispatchEvent(new Event('assetsLoaded'));
    });
    
    await page.waitForTimeout(2000);
    
    // Check if that changed anything
    const afterManualEventGameVisible = await page.isVisible('#game-container');
    const afterManualEventLoadingVisible = await page.isVisible('#loading-screen');
    
    console.log(`After manual event - Game container visible: ${afterManualEventGameVisible}`);
    console.log(`After manual event - Loading screen visible: ${afterManualEventLoadingVisible}`);
}

async function debugGameContainerState(page) {
    console.log('\n=== DEBUGGING GAME CONTAINER STATE ===');
    
    const gameContainerExists = await page.$('#game-container') !== null;
    console.log(`Game container exists in DOM: ${gameContainerExists}`);
    
    if (gameContainerExists) {
        const containerInfo = await page.evaluate(() => {
            const container = document.getElementById('game-container');
            return {
                innerHTML: container.innerHTML.length,
                hasCanvas: container.querySelector('canvas') !== null,
                style: container.getAttribute('style'),
                computedDisplay: window.getComputedStyle(container).display,
                computedVisibility: window.getComputedStyle(container).visibility,
                offsetWidth: container.offsetWidth,
                offsetHeight: container.offsetHeight
            };
        });
        
        console.log('Game container info:', containerInfo);
    }
    
    // Final screenshot
    await page.screenshot({ path: 'final-debug-screenshot.png' });
    console.log('Final debug screenshot saved as final-debug-screenshot.png');
}

testGame();