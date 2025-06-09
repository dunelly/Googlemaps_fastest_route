const { chromium } = require('playwright');

async function manualInspection() {
  console.log('🔍 Opening browser for manual inspection...');
  console.log('📱 This will stay open so you can inspect the mobile view manually');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 0
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
    console.log('📱 Loading SmashRoutes...');
    await page.goto(`file://${__dirname}/index.html`);
    await page.waitForTimeout(2000);
    
    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'manual-inspection.png', fullPage: true });
    
    // Log some basic info
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    const bodyClass = await page.evaluate(() => document.body.className);
    console.log(`🏷️ Body classes: "${bodyClass}"`);
    
    const tabNavVisible = await page.isVisible('.tab-navigation');
    const desktopModeVisible = await page.isVisible('.desktop-planning-mode');
    const mobileNavVisible = await page.isVisible('.mobile-navigation-mode');
    
    console.log(`📋 Tab navigation visible: ${tabNavVisible}`);
    console.log(`💻 Desktop mode visible: ${desktopModeVisible}`);
    console.log(`📱 Mobile navigation visible: ${mobileNavVisible}`);
    
    console.log('\n✨ Browser is now open for manual inspection!');
    console.log('🔍 You can inspect the mobile view and test the overlays manually');
    console.log('⌨️ Press Ctrl+C to close when done');
    
    // Keep the browser open indefinitely
    await new Promise(() => {}); // This will keep it open until manually closed
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

manualInspection().catch(console.error);