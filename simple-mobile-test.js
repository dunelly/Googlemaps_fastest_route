const { chromium } = require('playwright');

async function testMobileOverlaysSimple() {
  console.log('🧪 Simple Mobile Overlay Test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 }, // iPhone 15
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    // Grant location permissions to avoid popup
    permissions: ['geolocation'],
    geolocation: { latitude: 40.7128, longitude: -74.0060 } // NYC
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Loading SmashRoutes...');
    await page.goto(`file://${__dirname}/index.html`);
    
    // Wait a bit for initial load
    await page.waitForTimeout(3000);
    
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ path: 'mobile-test-1-initial.png', fullPage: true });
    
    // Check the page title
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // List all visible buttons
    console.log('🔍 Finding visible buttons...');
    const buttons = await page.$$eval('button:visible', buttons => 
      buttons.map(btn => ({
        text: btn.textContent?.trim(),
        id: btn.id,
        visible: btn.offsetParent !== null
      }))
    );
    console.log('Visible buttons:', buttons.filter(b => b.visible));
    
    // Check for tabs specifically
    const tabs = await page.$$eval('[class*="tab"]', elements => 
      elements.map(el => ({
        text: el.textContent?.trim(),
        id: el.id,
        classes: el.className
      }))
    );
    console.log('Tab elements:', tabs);
    
    // Try to find the Plan Route tab
    try {
      await page.waitForSelector('button', { timeout: 5000 });
      const planRouteSelector = 'button:has-text("Plan Route"), #planRouteTab, .tab-button';
      const planRouteExists = await page.locator(planRouteSelector).first().isVisible({ timeout: 2000 });
      
      if (planRouteExists) {
        console.log('✅ Plan Route tab found, clicking...');
        await page.locator(planRouteSelector).first().click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'mobile-test-2-plan-route.png', fullPage: true });
      } else {
        console.log('⚠️  Plan Route tab not found');
      }
    } catch (error) {
      console.log('⚠️  Error with Plan Route tab:', error.message);
    }
    
    // Try to find Manage Files tab
    try {
      const manageFilesSelector = 'button:has-text("Manage Files"), #manageFilesTab';
      const manageFilesExists = await page.locator(manageFilesSelector).first().isVisible({ timeout: 2000 });
      
      if (manageFilesExists) {
        console.log('✅ Manage Files tab found, clicking...');
        await page.locator(manageFilesSelector).first().click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'mobile-test-3-manage-files.png', fullPage: true });
        
        // Look for Excel History button
        const excelHistoryExists = await page.locator('#excel-history-btn').isVisible({ timeout: 2000 });
        if (excelHistoryExists) {
          console.log('📊 Excel History button found, clicking...');
          await page.locator('#excel-history-btn').click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'mobile-test-4-excel-history.png', fullPage: true });
          
          // Check if overlay is visible
          const overlayVisible = await page.isVisible('.excel-history-overlay, .excel-history-panel');
          console.log(`📋 Excel History overlay visible: ${overlayVisible}`);
        }
      } else {
        console.log('⚠️  Manage Files tab not found');
      }
    } catch (error) {
      console.log('⚠️  Error with Manage Files:', error.message);
    }
    
    // Check for any modals or overlays
    console.log('🔍 Checking for overlays...');
    const overlays = await page.$$eval('[class*="overlay"], [class*="modal"]', elements => 
      elements.map(el => ({
        id: el.id,
        classes: el.className,
        visible: el.offsetParent !== null,
        display: window.getComputedStyle(el).display
      }))
    );
    console.log('Overlay elements:', overlays);
    
    console.log('✅ Test completed successfully!');
    console.log('📸 Screenshots saved: mobile-test-1-initial.png, mobile-test-2-plan-route.png, mobile-test-3-manage-files.png, mobile-test-4-excel-history.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Keep browser open for 5 seconds so you can see it
    console.log('⏳ Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testMobileOverlaysSimple().catch(console.error);