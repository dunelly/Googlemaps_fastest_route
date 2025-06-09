const { chromium } = require('playwright');

async function testV2Mobile() {
  console.log('🧪 Testing Mobile Navigation v2');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Loading app...');
    await page.goto('http://127.0.0.1:5500/index.html');
    await page.waitForTimeout(3000);
    
    // Check if v2 interface exists
    const v2Interface = await page.isVisible('.mobile-nav-v2');
    console.log(`🎯 Mobile v2 interface: ${v2Interface ? '✅ FOUND' : '❌ NOT FOUND'}`);
    
    if (v2Interface) {
      console.log('✅ SUCCESS: Clean mobile interface is working!');
      
      // Test tabs
      const planTab = await page.isVisible('#planTab');
      const filesTab = await page.isVisible('#filesTab');
      console.log(`📋 Plan tab: ${planTab ? '✅' : '❌'}`);
      console.log(`📁 Files tab: ${filesTab ? '✅' : '❌'}`);
      
      // Test files tab
      if (filesTab) {
        await page.click('#filesTab');
        await page.waitForTimeout(1000);
        
        const filesList = await page.isVisible('#filesList');
        console.log(`📂 Files list: ${filesList ? '✅' : '❌'}`);
      }
      
      // Test plan tab
      if (planTab) {
        await page.click('#planTab');
        await page.waitForTimeout(1000);
        
        const loadBtn = await page.isVisible('#loadAddressesBtn');
        const mapContainer = await page.isVisible('#mobileMapV2');
        console.log(`📊 Load button: ${loadBtn ? '✅' : '❌'}`);
        console.log(`🗺️ Map container: ${mapContainer ? '✅' : '❌'}`);
      }
      
    } else {
      console.log('❌ v2 interface not found, checking what exists...');
      
      const oldInterface = await page.isVisible('.mobile-navigation-mode');
      const desktopInterface = await page.isVisible('.desktop-planning-mode');
      
      console.log(`📱 Old mobile interface: ${oldInterface ? '✅' : '❌'}`);
      console.log(`💻 Desktop interface: ${desktopInterface ? '✅' : '❌'}`);
      
      // Check console for errors
      const logs = await page.evaluate(() => {
        return window.console._logs || 'No logs captured';
      });
      console.log('📋 Console logs:', logs);
    }
    
    await page.screenshot({ path: 'v2-test.png' });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'v2-error.png' });
  } finally {
    console.log('⏳ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testV2Mobile().catch(console.error);