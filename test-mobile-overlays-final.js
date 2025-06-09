const { chromium } = require('playwright');

async function testOverlayFunctionality() {
  console.log('🧪 Testing Mobile Overlay Functionality...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800
  });
  
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 }, // iPhone 15
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    permissions: ['geolocation'],
    geolocation: { latitude: 40.7128, longitude: -74.0060 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Loading app...');
    await page.goto(`file://${__dirname}/index.html`);
    await page.waitForTimeout(3000);
    
    console.log('📸 Initial mobile view...');
    await page.screenshot({ path: 'test-1-initial.png', fullPage: true });
    
    // Test 1: Paste Addresses Modal
    console.log('🔍 Test 1: Testing Paste Addresses Modal');
    try {
      // Click the paste addresses button
      await page.click('button:has-text("📋 Paste Addresses")');
      await page.waitForTimeout(1000);
      
      // Check if modal is visible
      const modalVisible = await page.isVisible('#pasteAddressesModal.active');
      console.log(`✅ Paste modal visible: ${modalVisible}`);
      
      if (modalVisible) {
        await page.screenshot({ path: 'test-2-paste-modal.png', fullPage: true });
        
        // Test modal responsiveness by checking its size
        const modalBox = await page.boundingBox('#pasteAddressesModal .modal-content');
        console.log(`📐 Modal dimensions: ${modalBox?.width}x${modalBox?.height}`);
        
        // Close modal
        await page.click('#pasteAddressesModal .close-btn');
        await page.waitForTimeout(500);
      }
    } catch (error) {
      console.log(`❌ Paste modal test failed: ${error.message}`);
    }
    
    // Test 2: File Upload Modal
    console.log('🔍 Test 2: Testing File Upload Modal');
    try {
      await page.click('button:has-text("📁 Upload File")');
      await page.waitForTimeout(1000);
      
      const uploadModalVisible = await page.isVisible('#uploadFileModal.active');
      console.log(`✅ Upload modal visible: ${uploadModalVisible}`);
      
      if (uploadModalVisible) {
        await page.screenshot({ path: 'test-3-upload-modal.png', fullPage: true });
        
        // Test modal responsiveness
        const modalBox = await page.boundingBox('#uploadFileModal .modal-content');
        console.log(`📐 Upload modal dimensions: ${modalBox?.width}x${modalBox?.height}`);
        
        // Close modal
        await page.click('#uploadFileModal .close-btn');
        await page.waitForTimeout(500);
      }
    } catch (error) {
      console.log(`❌ Upload modal test failed: ${error.message}`);
    }
    
    // Test 3: Switch to Files tab and test Excel History
    console.log('🔍 Test 3: Testing Files Tab and Excel History');
    try {
      // Click Files tab
      await page.click('#fileManagementTab');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-4-files-tab.png', fullPage: true });
      
      // Try to find and click sign in (needed for Excel history)
      const signInBtn = await page.locator('button:has-text("Sign In"), #show-login-btn').first();
      if (await signInBtn.isVisible()) {
        console.log('🔐 Found Sign In button, clicking...');
        await signInBtn.click();
        await page.waitForTimeout(1000);
        
        // Check if Firebase UI appeared
        const firebaseUIVisible = await page.isVisible('#firebaseui-auth-container');
        console.log(`🔥 Firebase UI visible: ${firebaseUIVisible}`);
        
        if (firebaseUIVisible) {
          await page.screenshot({ path: 'test-5-firebase-auth.png', fullPage: true });
        }
      }
      
    } catch (error) {
      console.log(`❌ Files tab test failed: ${error.message}`);
    }
    
    // Test 4: Check CSS fixes are applied
    console.log('🔍 Test 4: Verifying CSS fixes');
    
    // Check modal overlay CSS properties
    const modalOverlayStyles = await page.evaluate(() => {
      const modal = document.querySelector('#pasteAddressesModal');
      if (modal) {
        const styles = window.getComputedStyle(modal);
        return {
          width: styles.width,
          left: styles.left,
          right: styles.right,
          position: styles.position
        };
      }
      return null;
    });
    
    if (modalOverlayStyles) {
      console.log('📏 Modal overlay styles:', modalOverlayStyles);
    }
    
    // Check button sizes for touch targets
    const buttonSizes = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      return Array.from(buttons).slice(0, 5).map(btn => {
        const rect = btn.getBoundingClientRect();
        return {
          text: btn.textContent?.trim().substring(0, 20),
          width: rect.width,
          height: rect.height,
          minHeight: window.getComputedStyle(btn).minHeight
        };
      });
    });
    
    console.log('🎯 Button touch targets:', buttonSizes);
    
    // Final screenshot showing mobile responsiveness
    await page.screenshot({ path: 'test-6-final-mobile.png', fullPage: true });
    
    console.log('✅ All overlay tests completed!');
    console.log('📸 Screenshots saved in current directory');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    console.log('⏳ Keeping browser open for review...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testOverlayFunctionality().catch(console.error);