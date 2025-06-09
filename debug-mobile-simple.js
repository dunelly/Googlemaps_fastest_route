const { chromium } = require('playwright');
const path = require('path');

async function debugMobileInterface() {
  console.log('🔍 Debugging Mobile Interface...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    isMobile: true,
    hasTouch: true
  });
  
  const page = await context.newPage();
  
  // Listen to console logs from the page
  page.on('console', msg => {
    console.log('🌐 Browser:', msg.text());
  });
  
  try {
    const localPath = `file://${path.resolve(__dirname, 'index.html')}`;
    await page.goto(localPath);
    
    console.log('📱 Page loaded, waiting for mobile navigation to initialize...');
    await page.waitForTimeout(3000);
    
    // Check if mobile navigation exists
    const mobileNavExists = await page.evaluate(() => {
      return typeof window.mobileNav !== 'undefined';
    });
    
    console.log('Mobile Nav exists:', mobileNavExists);
    
    // Add mock addresses
    await page.evaluate(() => {
      window.addresses = [
        {
          id: 1,
          address: "1234 Spring Branch Dr, Houston, TX 77080",
          latitude: 29.7854,
          longitude: -95.4934,
          firstName: "John",
          lastName: "Smith"
        },
        {
          id: 2,
          address: "5678 Memorial Dr, Houston, TX 77007",
          latitude: 29.7633,
          longitude: -95.4067,
          firstName: "Mary",
          lastName: "Johnson"
        }
      ];
      
      console.log('📊 Added mock addresses:', window.addresses.length);
    });
    
    await page.waitForTimeout(1000);
    
    // Try to manually trigger address display
    await page.evaluate(() => {
      console.log('🔧 Manually triggering address display...');
      if (window.mobileNav) {
        console.log('📱 MobileNav found, calling displayAddresses...');
        window.mobileNav.displayAddresses();
      } else {
        console.log('❌ MobileNav not found');
      }
    });
    
    await page.waitForTimeout(3000);
    
    // Check if selection tools are visible
    const selectionToolsVisible = await page.locator('.mobile-selection-tools').isVisible();
    console.log('Selection tools visible:', selectionToolsVisible);
    
    // Take a screenshot
    await page.screenshot({ path: 'debug-mobile-simple.png' });
    
    // Wait for user to inspect
    console.log('🔍 Browser will stay open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  debugMobileInterface().catch(console.error);
}