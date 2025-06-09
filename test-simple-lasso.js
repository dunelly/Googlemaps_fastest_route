const { chromium } = require('playwright');
const path = require('path');

async function testSimpleLasso() {
  console.log('🎯 Testing Simple Lasso Selection...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
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
    
    console.log('📱 Page loaded, setting up mock data...');
    await page.waitForTimeout(3000);
    
    // Add mock authentication and files
    await page.evaluate(() => {
      window.excelHistoryCurrentUser = {
        uid: 'test-user',
        email: 'test@example.com'
      };
      
      window.savedExcelFiles = {
        'excel_test': {
          id: 'excel_test',
          fileName: 'Simple Test.xlsx',
          addressCount: 3,
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
            },
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
    });
    
    // Load addresses first
    console.log('📁 Loading addresses...');
    await page.click('.mobile-tab[data-tab="files"]');
    await page.waitForTimeout(1000);
    
    await page.evaluate(() => {
      if (window.mobileNav) {
        window.mobileNav.loadSavedFiles();
      }
    });
    await page.waitForTimeout(1000);
    
    await page.click('.mobile-load-file-btn');
    await page.waitForTimeout(3000);
    
    // Verify addresses loaded
    const addressesLoaded = await page.evaluate(() => window.addresses?.length || 0);
    const markersCount = await page.evaluate(() => window.mobileMapMarkers?.length || 0);
    console.log('📊 Addresses loaded:', addressesLoaded);
    console.log('📍 Markers created:', markersCount);
    
    if (markersCount > 0) {
      console.log('\n🎯 Testing simple lasso selection...');
      
      // Check if lasso button is visible
      const lassoVisible = await page.locator('#mobileLassoBtn').isVisible();
      console.log('🎯 Lasso button visible:', lassoVisible);
      
      if (lassoVisible) {
        // Click lasso button to activate
        await page.click('#mobileLassoBtn');
        await page.waitForTimeout(1000);
        
        // Check if lasso is active
        const lassoActive = await page.locator('#mobileLassoBtn.active').isVisible();
        console.log('✅ Lasso active after click:', lassoActive);
        
        if (lassoActive) {
          console.log('🖱️ Drawing selection on map...');
          
          // Get map bounds for drawing
          const mapBounds = await page.locator('#mobileMap').boundingBox();
          console.log('🗺️ Map bounds:', mapBounds);
          
          // Draw a simple rectangle to select markers
          const startX = mapBounds.x + 50;
          const startY = mapBounds.y + 100;
          const endX = mapBounds.x + mapBounds.width - 50;
          const endY = mapBounds.y + mapBounds.height - 100;
          
          console.log(`🔷 Drawing from (${startX}, ${startY}) to (${endX}, ${endY})`);
          
          // Perform drawing gesture
          await page.mouse.move(startX, startY);
          await page.mouse.down();
          await page.waitForTimeout(200);
          
          await page.mouse.move(endX, startY);
          await page.waitForTimeout(200);
          
          await page.mouse.move(endX, endY);
          await page.waitForTimeout(200);
          
          await page.mouse.move(startX, endY);
          await page.waitForTimeout(200);
          
          await page.mouse.move(startX, startY);
          await page.mouse.up();
          
          await page.waitForTimeout(3000);
          
          // Check selection results
          const selectedCount = await page.evaluate(() => window.selectedAddresses?.length || 0);
          console.log('✅ Addresses selected:', selectedCount);
          
          const createRouteVisible = await page.locator('#mobileCreateRouteBtn').isVisible();
          console.log('🚀 Create Route button visible:', createRouteVisible);
          
          if (selectedCount > 0) {
            console.log('🎉 Lasso selection working! Selected addresses:');
            const selectedAddresses = await page.evaluate(() => {
              return window.selectedAddresses?.map(addr => addr.address) || [];
            });
            selectedAddresses.forEach(addr => console.log(`  - ${addr}`));
            
            if (createRouteVisible) {
              console.log('\n🚀 Testing Create Route...');
              await page.click('#mobileCreateRouteBtn');
              await page.waitForTimeout(2000);
              
              const destCardVisible = await page.locator('#mobileDestinationCard').isVisible();
              console.log('📍 Navigation card visible:', destCardVisible);
              
              if (destCardVisible) {
                console.log('🎉 Complete workflow successful! Route created and navigation started.');
              }
            }
          }
        }
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-simple-lasso.png', fullPage: true });
    console.log('📸 Screenshot saved: test-simple-lasso.png');
    
    console.log('\n🔍 Browser will stay open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  testSimpleLasso().catch(console.error);
}