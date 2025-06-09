const { chromium } = require('playwright');
const path = require('path');

async function testMobileFileLoading() {
  console.log('🔍 Testing Mobile File Loading...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    isMobile: true,
    hasTouch: true
  });
  
  const page = await context.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    console.log('🌐', msg.text());
  });
  
  try {
    const localPath = `file://${path.resolve(__dirname, 'index.html')}`;
    await page.goto(localPath);
    
    console.log('📱 Page loaded, waiting for initialization...');
    await page.waitForTimeout(3000);
    
    // Add mock authentication and files with proper structure
    await page.evaluate(() => {
      // Mock authentication
      window.excelHistoryCurrentUser = {
        uid: 'test-user',
        email: 'test@example.com'
      };
      
      // Mock saved files with correct structure (using 'id' not 'fileId')
      window.savedExcelFiles = {
        'excel_1701234567890': {
          id: 'excel_1701234567890',
          fileName: 'Drew Main list - PRE-FORECLOSURE FEB-MARCH 2025 PT.2.xlsx',
          addressCount: 23,
          uploadDate: '2025-06-08T10:00:00Z',
          processedData: [
            {
              id: 1,
              address: '1234 Spring Branch Dr, Houston, TX 77080',
              lat: 29.7854,
              lng: -95.4934,
              firstName: 'John',
              lastName: 'Smith'
            },
            {
              id: 2,
              address: '5678 Memorial Dr, Houston, TX 77007',
              lat: 29.7633,
              lng: -95.4067,
              firstName: 'Mary',
              lastName: 'Johnson'
            }
          ]
        },
        'excel_1701234567891': {
          id: 'excel_1701234567891',
          fileName: 'Houston Properties - March 2025.xlsx',
          addressCount: 15,
          uploadDate: '2025-06-07T15:30:00Z',
          processedData: [
            {
              id: 3,
              address: '9012 Westheimer Rd, Houston, TX 77063',
              lat: 29.7400,
              lng: -95.4827,
              firstName: 'Bob',
              lastName: 'Wilson'
            }
          ]
        }
      };
      
      console.log('📊 Mock data structure added:', Object.keys(window.savedExcelFiles));
    });
    
    // Switch to Files tab
    console.log('📁 Switching to Files tab...');
    await page.click('.mobile-tab[data-tab="files"]');
    await page.waitForTimeout(1000);
    
    // Trigger mobile files reload
    await page.evaluate(() => {
      if (window.mobileNav) {
        window.mobileNav.loadSavedFiles();
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Check if files are displayed
    const filesCount = await page.locator('.mobile-file-item').count();
    console.log('📋 Files displayed:', filesCount);
    
    if (filesCount > 0) {
      console.log('✅ Files are visible, testing Load Addresses...');
      
      // Take screenshot before clicking
      await page.screenshot({ path: 'test-files-before-load.png' });
      
      // Click the first "Load Addresses" button
      await page.click('.mobile-load-file-btn');
      await page.waitForTimeout(3000);
      
      // Check if we switched to route tab
      const routeTabActive = await page.locator('.mobile-tab[data-tab="route"].active').isVisible();
      console.log('📍 Route tab active after load:', routeTabActive);
      
      // Check if addresses were loaded
      const addressesLoaded = await page.evaluate(() => {
        return window.addresses ? window.addresses.length : 0;
      });
      console.log('📊 Addresses loaded:', addressesLoaded);
      
      // Take screenshot after loading
      await page.screenshot({ path: 'test-files-after-load.png' });
      
      if (addressesLoaded > 0) {
        console.log('✅ File loading successful!');
      } else {
        console.log('⚠️ File loaded but no addresses found');
      }
      
    } else {
      console.log('❌ No files displayed');
    }
    
    console.log('📸 Screenshots saved:');
    console.log('  - test-files-before-load.png');
    console.log('  - test-files-after-load.png');
    
    // Keep browser open for inspection
    console.log('🔍 Browser will stay open for 20 seconds...');
    await page.waitForTimeout(20000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  testMobileFileLoading().catch(console.error);
}