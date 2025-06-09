const { chromium } = require('playwright');
const path = require('path');

/**
 * Mobile Interface Testing with Mock Data
 * Tests the complete mobile workflow with simulated addresses
 */

async function testWithMockData() {
  console.log('🚀 Starting Mobile Test with Mock Data...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    isMobile: true,
    hasTouch: true
  });
  
  const page = await context.newPage();
  
  try {
    const localPath = `file://${path.resolve(__dirname, 'index.html')}`;
    await page.goto(localPath);
    
    console.log('📱 Loaded SmashRoutes mobile interface');
    
    // Inject mock data for testing
    await page.evaluate(() => {
      // Mock addresses data (Drew's List style)
      window.addresses = [
        {
          id: 1,
          address: "1234 Spring Branch Dr, Houston, TX 77080",
          latitude: 29.7854,
          longitude: -95.4934,
          firstName: "John",
          lastName: "Smith",
          auctionDate: "2025-02-15"
        },
        {
          id: 2,
          address: "5678 Memorial Dr, Houston, TX 77007",
          latitude: 29.7633,
          longitude: -95.4067,
          firstName: "Mary",
          lastName: "Johnson",
          auctionDate: "2025-02-15"
        },
        {
          id: 3,
          address: "9012 Westheimer Rd, Houston, TX 77063",
          latitude: 29.7400,
          longitude: -95.4827,
          firstName: "Bob",
          lastName: "Wilson",
          auctionDate: "2025-02-15"
        },
        {
          id: 4,
          address: "3456 Richmond Ave, Houston, TX 77027",
          latitude: 29.7365,
          longitude: -95.4015,
          firstName: "Sarah",
          lastName: "Davis",
          auctionDate: "2025-02-15"
        },
        {
          id: 5,
          address: "7890 Bellaire Blvd, Houston, TX 77036",
          latitude: 29.7060,
          longitude: -95.4618,
          firstName: "Mike",
          lastName: "Brown",
          auctionDate: "2025-02-15"
        }
      ];
      
      // Mock saved files
      window.savedExcelFiles = [
        {
          fileId: "drew-list-feb-2025",
          fileName: "Drew Main list - PRE-FORECLOSURE FEB-MARCH 2025 PT.2.xlsx",
          addressCount: 23,
          uploadDate: "2025-06-08T10:00:00Z"
        }
      ];
      
      // Mock current user
      window.currentUser = {
        uid: "test-user",
        email: "agent@realestate.com"
      };
      
      console.log('📊 Mock data injected:', window.addresses.length, 'addresses');
    });
    
    // Test 1: Initial mobile interface
    console.log('\n🧪 Test 1: Initial Mobile Interface');
    await page.screenshot({ path: 'mock-test-1-initial.png' });
    
    const mobileVisible = await page.locator('.mobile-interface').isVisible();
    console.log(mobileVisible ? '✅ Mobile interface visible' : '❌ Mobile interface not visible');
    
    // Test 2: Files tab with mock data
    console.log('\n🧪 Test 2: Files Tab with Mock Data');
    await page.click('.mobile-tab[data-tab="files"]');
    await page.waitForTimeout(1000);
    
    // Trigger file loading
    await page.evaluate(() => {
      if (window.mobileNav) {
        window.mobileNav.loadSavedFiles();
      }
    });
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'mock-test-2-files-loaded.png' });
    
    const fileItems = await page.locator('.mobile-file-item').count();
    console.log(`✅ Found ${fileItems} file item(s)`);
    
    // Test 3: Load addresses from file
    console.log('\n🧪 Test 3: Load Addresses');
    
    // Simulate loading addresses
    await page.evaluate(() => {
      // Trigger address display
      if (window.mobileNav) {
        window.mobileNav.showRouteTab();
        setTimeout(() => {
          if (window.mobileNav.mobileMap) {
            window.mobileNav.displayAddresses();
          }
        }, 500);
      }
    });
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'mock-test-3-addresses-loaded.png' });
    
    // Check if selection tools are now visible
    const selectionToolsVisible = await page.locator('.mobile-selection-tools').isVisible();
    console.log(selectionToolsVisible ? '✅ Selection tools visible after loading addresses' : '❌ Selection tools still hidden');
    
    // Test 4: Lasso selection
    console.log('\n🧪 Test 4: Lasso Selection');
    
    if (selectionToolsVisible) {
      await page.click('#mobileLassoBtn');
      await page.waitForTimeout(1000);
      
      const lassoActive = await page.locator('#mobileLassoBtn.active').isVisible();
      console.log(lassoActive ? '✅ Lasso tool activated' : '⚠️ Lasso tool not active');
      
      // Simulate address selection
      await page.evaluate(() => {
        // Mock selecting 3 addresses
        if (window.mobileNav) {
          window.mobileNav.selectedAddresses = window.addresses.slice(0, 3);
          window.mobileNav.showCreateRouteButton();
        }
      });
      
      await page.waitForTimeout(1000);
      const createRouteVisible = await page.locator('#mobileCreateRouteBtn:not(.hidden)').isVisible();
      console.log(createRouteVisible ? '✅ Create Route button appeared' : '❌ Create Route button not visible');
      
      await page.screenshot({ path: 'mock-test-4-lasso-selection.png' });
    }
    
    // Test 5: Route creation and navigation
    console.log('\n🧪 Test 5: Route Creation');
    
    const createRouteBtn = await page.locator('#mobileCreateRouteBtn:not(.hidden)');
    if (await createRouteBtn.isVisible()) {
      await createRouteBtn.click();
      await page.waitForTimeout(1000);
      
      const destinationCard = await page.locator('.mobile-destination-card.active').isVisible();
      console.log(destinationCard ? '✅ Destination card displayed' : '❌ Destination card not visible');
      
      if (destinationCard) {
        // Check navigation controls
        const prevBtn = await page.locator('#mobilePrevBtn').isVisible();
        const nextBtn = await page.locator('#mobileNextBtn').isVisible();
        const navigateBtn = await page.locator('#mobileNavigateBtn').isVisible();
        
        console.log(prevBtn ? '✅ Previous button visible' : '❌ Previous button missing');
        console.log(nextBtn ? '✅ Next button visible' : '❌ Next button missing');
        console.log(navigateBtn ? '✅ Navigate button visible' : '❌ Navigate button missing');
        
        // Test navigation controls
        if (nextBtn) {
          await page.click('#mobileNextBtn');
          await page.waitForTimeout(500);
          console.log('✅ Next button clicked successfully');
        }
        
        await page.screenshot({ path: 'mock-test-5-navigation-active.png' });
      }
    }
    
    // Test 6: Google Maps integration (without actually opening)
    console.log('\n🧪 Test 6: Google Maps Integration');
    
    const navigateBtn = await page.locator('#mobileNavigateBtn');
    if (await navigateBtn.isVisible()) {
      // We won't actually click it to avoid opening Google Maps
      console.log('✅ Navigate button ready for Google Maps integration');
    } else {
      console.log('❌ Navigate button not available');
    }
    
    // Final screenshot
    await page.screenshot({ path: 'mock-test-6-final-state.png' });
    
    console.log('\n📸 Mock Test Screenshots:');
    console.log('  - mock-test-1-initial.png');
    console.log('  - mock-test-2-files-loaded.png');
    console.log('  - mock-test-3-addresses-loaded.png');
    console.log('  - mock-test-4-lasso-selection.png');
    console.log('  - mock-test-5-navigation-active.png');
    console.log('  - mock-test-6-final-state.png');
    
  } catch (error) {
    console.error('❌ Mock data test failed:', error);
    await page.screenshot({ path: 'mock-test-error.png' });
  } finally {
    await browser.close();
  }
  
  console.log('\n✅ Mock Data Testing Complete');
}

// Run test
if (require.main === module) {
  testWithMockData().catch(console.error);
}

module.exports = { testWithMockData };