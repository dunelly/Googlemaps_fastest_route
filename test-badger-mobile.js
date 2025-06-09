const { chromium } = require('playwright');

async function testBadgerMobileInterface() {
  console.log('🧪 Testing BadgerMaps-Style Mobile Interface...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    permissions: ['geolocation']
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Loading SmashRoutes with mobile interface...');
    await page.goto(`file://${__dirname}/index.html`);
    
    // Wait for mobile navigation controller to initialize
    await page.waitForTimeout(2000);
    console.log('⏳ Waiting for mobile navigation controller...');
    
    // Wait specifically for mobile interface to be created
    await page.waitForSelector('.mobile-navigation-mode', { timeout: 10000 });
    console.log('✅ Mobile interface detected');
    
    // Additional wait for interface to be fully rendered
    await page.waitForTimeout(1000);
    
    // Check if mobile interface is active
    const mobileInterfaceVisible = await page.isVisible('.mobile-navigation-mode');
    console.log(`📱 Mobile interface visible: ${mobileInterfaceVisible}`);
    
    if (mobileInterfaceVisible) {
      console.log('📸 Taking screenshots of mobile interface...');
      
      // Screenshot 1: Initial mobile interface
      await page.screenshot({ path: 'badger-1-initial.png', fullPage: true });
      
      // Check for the correct mobile IDs
      const mobilePlanTabExists = await page.locator('#mobilePlanRouteTab').count();
      const mobilePlanTabVisible = await page.isVisible('#mobilePlanRouteTab');
      const mobileFilesTabExists = await page.locator('#mobileFileManagementTab').count(); 
      const mobileFilesTabVisible = await page.isVisible('#mobileFileManagementTab');
      
      console.log(`📋 Plan Route tab: exists: ${mobilePlanTabExists > 0}, visible: ${mobilePlanTabVisible}`);
      console.log(`📁 Files tab: exists: ${mobileFilesTabExists > 0}, visible: ${mobileFilesTabVisible}`);
      
      if (mobilePlanTabVisible) {
        await page.click('#mobilePlanRouteTab');
        await page.waitForTimeout(1000);
        console.log('✅ Plan Route tab clicked');
        
        // Check for mobile map
        const mobileMapVisible = await page.isVisible('#mobileMap');
        console.log(`🗺️ Mobile map visible: ${mobileMapVisible}`);
        
        // Check for planning controls
        const planningControlsVisible = await page.isVisible('.mobile-planning-controls');
        console.log(`🎮 Planning controls visible: ${planningControlsVisible}`);
        
        // Screenshot 2: Plan Route tab active
        await page.screenshot({ path: 'badger-2-plan-route.png', fullPage: true });
        
        // Test Load Addresses button
        const loadAddressesBtn = await page.isVisible('#autoLoadDataBtn');
        console.log(`📊 Load Addresses button visible: ${loadAddressesBtn}`);
        
        if (loadAddressesBtn) {
          console.log('🔘 Clicking Load Addresses...');
          await page.click('#autoLoadDataBtn');
          await page.waitForTimeout(1000);
          
          // Screenshot 3: After clicking load addresses
          await page.screenshot({ path: 'badger-3-load-addresses.png', fullPage: true });
        }
        
        // Test selection tools
        const lassoBtn = await page.isVisible('#mobileLassoBtn');
        const boxBtn = await page.isVisible('#mobileBoxSelectBtn');
        console.log(`🔵 Lasso tool visible: ${lassoBtn}`);
        console.log(`⬜ Box tool visible: ${boxBtn}`);
        
        // Test switching to Files tab using correct mobile ID
        if (mobileFilesTabVisible) {
          console.log('📁 Switching to Files tab...');
          await page.click('#mobileFileManagementTab');
          await page.waitForTimeout(1000);
          
          // Screenshot 4: Files tab
          await page.screenshot({ path: 'badger-4-files-tab.png', fullPage: true });
          
          // Check file management interface
          const fileManagementVisible = await page.isVisible('.mobile-file-management');
          console.log(`📊 File management interface visible: ${fileManagementVisible}`);
        }
        
        // Test navigation simulation
        console.log('🧭 Testing navigation mode simulation...');
        await page.click('#mobilePlanRouteTab'); // Switch back to plan route
        await page.waitForTimeout(500);
        
        // Simulate starting navigation (if create route button exists)
        const createRouteBtn = await page.isVisible('#mobileCreateRouteBtn');
        if (createRouteBtn) {
          await page.click('#mobileCreateRouteBtn');
          await page.waitForTimeout(500);
          
          const startNavBtn = await page.isVisible('#mobileStartNavigationBtn');
          if (startNavBtn) {
            console.log('🧭 Starting navigation mode...');
            await page.click('#mobileStartNavigationBtn');
            await page.waitForTimeout(1000);
            
            // Check if destination card appears
            const destinationCardVisible = await page.isVisible('#mobileDestinationCard');
            console.log(`🏠 Destination card visible: ${destinationCardVisible}`);
            
            // Check if navigation controls appear
            const navControlsVisible = await page.isVisible('.mobile-navigation-controls');
            console.log(`🎮 Navigation controls visible: ${navControlsVisible}`);
            
            // Screenshot 5: Navigation mode
            await page.screenshot({ path: 'badger-5-navigation-mode.png', fullPage: true });
          }
        }
      }
    } else {
      console.log('❌ Mobile interface not visible - checking why...');
      
      const bodyClasses = await page.evaluate(() => document.body.className);
      console.log(`🏷️ Body classes: "${bodyClasses}"`);
      
      const desktopModeVisible = await page.isVisible('.desktop-planning-mode');
      console.log(`💻 Desktop mode visible: ${desktopModeVisible}`);
      
      // Take screenshot anyway to see what's showing
      await page.screenshot({ path: 'badger-debug.png', fullPage: true });
    }
    
    console.log('✅ BadgerMaps mobile interface test completed!');
    console.log('📸 Screenshots saved: badger-1-initial.png through badger-5-navigation-mode.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'badger-error.png', fullPage: true });
  } finally {
    console.log('⏳ Keeping browser open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testBadgerMobileInterface().catch(console.error);