const { chromium } = require('playwright');

async function testMobileOverlays() {
  console.log('🧪 Testing SmashRoutes Mobile Overlays...');
  
  // Launch browser in mobile mode
  const browser = await chromium.launch({ 
    headless: false, // Set to true if you want it headless
    slowMo: 1000 // Slow down for visibility
  });
  
  const context = await browser.newContext({
    // iPhone 15 viewport
    viewport: { width: 393, height: 852 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to your app
    const appUrl = `file://${__dirname}/index.html`;
    console.log(`📱 Loading app: ${appUrl}`);
    await page.goto(appUrl);
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    console.log('📸 Taking screenshot of initial mobile view...');
    await page.screenshot({ path: 'mobile-initial.png', fullPage: true });
    
    // Wait for the page to fully load
    console.log('⏳ Waiting for page to load...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check what tabs are available
    console.log('🔍 Looking for tabs...');
    const tabs = await page.$$eval('button', buttons => 
      buttons.map(btn => ({
        text: btn.textContent?.trim(),
        id: btn.id,
        classes: btn.className
      })).filter(btn => btn.text)
    );
    console.log('Available buttons:', tabs);
    
    // Test clicking on Plan Route tab first
    try {
      console.log('📋 Testing Plan Route tab...');
      const planRouteBtn = await page.locator('button:has-text("Plan Route")').first();
      if (await planRouteBtn.isVisible()) {
        await planRouteBtn.click();
        await page.waitForTimeout(1000);
        console.log('✅ Plan Route tab clicked');
      }
    } catch (error) {
      console.log('⚠️  Plan Route tab not found');
    }
    
    // Test the Paste Addresses functionality
    console.log('🔍 Testing Paste Addresses Modal...');
    try {
      // Look for paste button in the page
      const pasteButton = await page.locator('button:has-text("Paste Addresses")').first();
      if (await pasteButton.isVisible()) {
        await pasteButton.click();
        await page.waitForTimeout(1000);
        
        // Check if modal is visible
        const modalVisible = await page.isVisible('#pasteAddressesModal');
        console.log(`📋 Paste Addresses Modal visible: ${modalVisible}`);
        
        if (modalVisible) {
          await page.screenshot({ path: 'mobile-paste-modal.png', fullPage: true });
          // Try to close modal
          await page.click('.close-btn, button:has-text("Cancel")');
          await page.waitForTimeout(500);
        }
      } else {
        console.log('⚠️  Paste Addresses button not visible');
      }
    } catch (error) {
      console.log('⚠️  Paste Addresses functionality error:', error.message);
    }
    
    // Test Manage Files tab
    console.log('📁 Testing Manage Files Tab...');
    try {
      const manageFilesBtn = await page.locator('button:has-text("Manage Files")').first();
      if (await manageFilesBtn.isVisible()) {
        await manageFilesBtn.click();
        await page.waitForTimeout(1000);
        
        console.log('📸 Taking screenshot of file management section...');
        await page.screenshot({ path: 'mobile-file-management.png', fullPage: true });
        
        // Test Excel history button (the 📊 emoji button)
        try {
          const excelHistoryBtn = await page.locator('#excel-history-btn').first();
          if (await excelHistoryBtn.isVisible()) {
            console.log('🔘 Found Excel History button, clicking...');
            await excelHistoryBtn.click();
            await page.waitForTimeout(1000);
            
            const historyPanelVisible = await page.isVisible('.excel-history-overlay');
            console.log(`📊 Excel History Panel visible: ${historyPanelVisible}`);
            
            if (historyPanelVisible) {
              await page.screenshot({ path: 'mobile-excel-history.png', fullPage: true });
              // Close panel
              await page.click('.close-btn');
              await page.waitForTimeout(500);
            }
          } else {
            console.log('⚠️  Excel History button not visible');
          }
        } catch (error) {
          console.log('⚠️  Excel History error:', error.message);
        }
      } else {
        console.log('⚠️  Manage Files tab not visible');
      }
    } catch (error) {
      console.log('⚠️  Manage Files error:', error.message);
    }
    
    // Test viewport dimensions
    const viewport = page.viewportSize();
    console.log(`📱 Viewport: ${viewport.width}x${viewport.height}`);
    
    // Check for any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });
    
    console.log('✅ Mobile overlay testing complete!');
    console.log('📸 Screenshots saved: mobile-initial.png, mobile-paste-modal.png, mobile-file-management.png, mobile-excel-history.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testMobileOverlays().catch(console.error);