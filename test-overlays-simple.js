const { chromium } = require('playwright');

async function testOverlaysSimple() {
  console.log('🧪 Testing overlays after CSS fix...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800
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
    await page.goto(`file://${__dirname}/index.html`);
    await page.waitForTimeout(3000);
    
    console.log('📱 Initial mobile view');
    await page.screenshot({ path: 'fixed-1-initial.png', fullPage: true });
    
    // Check if tabs are visible and working
    const tabsVisible = await page.isVisible('.tab-navigation');
    console.log(`📋 Tabs visible: ${tabsVisible}`);
    
    if (tabsVisible) {
      // Test clicking Plan Route tab
      await page.click('#planRouteTab');
      await page.waitForTimeout(1000);
      console.log('✅ Plan Route tab clicked');
      
      // Test Paste Addresses modal
      const pasteButtonVisible = await page.isVisible('#pasteAddressesBtn');
      console.log(`📋 Paste button visible: ${pasteButtonVisible}`);
      
      if (pasteButtonVisible) {
        await page.click('#pasteAddressesBtn');
        await page.waitForTimeout(1000);
        
        const modalVisible = await page.isVisible('#pasteAddressesModal.active');
        console.log(`🪟 Paste modal visible: ${modalVisible}`);
        
        if (modalVisible) {
          await page.screenshot({ path: 'fixed-2-paste-modal.png', fullPage: true });
          
          // Check modal size
          const modalBox = await page.locator('#pasteAddressesModal .modal-content').boundingBox();
          console.log(`📐 Modal size: ${modalBox?.width}x${modalBox?.height}`);
          
          // Close modal
          await page.click('#pasteAddressesModal .close-btn');
          await page.waitForTimeout(500);
        }
      }
      
      // Test Manage Files tab
      await page.click('#manageFilesTab');
      await page.waitForTimeout(1000);
      console.log('✅ Manage Files tab clicked');
      await page.screenshot({ path: 'fixed-3-manage-files.png', fullPage: true });
      
      // Test upload modal
      const uploadButtonVisible = await page.isVisible('#uploadFileBtn');
      console.log(`📁 Upload button visible: ${uploadButtonVisible}`);
      
      if (uploadButtonVisible) {
        await page.click('#uploadFileBtn');
        await page.waitForTimeout(1000);
        
        const uploadModalVisible = await page.isVisible('#uploadFileModal.active');
        console.log(`🪟 Upload modal visible: ${uploadModalVisible}`);
        
        if (uploadModalVisible) {
          await page.screenshot({ path: 'fixed-4-upload-modal.png', fullPage: true });
          
          // Check upload modal size
          const uploadModalBox = await page.locator('#uploadFileModal .modal-content').boundingBox();
          console.log(`📐 Upload modal size: ${uploadModalBox?.width}x${uploadModalBox?.height}`);
          
          // Close modal
          await page.click('#uploadFileModal .close-btn');
          await page.waitForTimeout(500);
        }
      }
    }
    
    console.log('✅ Overlay tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testOverlaysSimple().catch(console.error);