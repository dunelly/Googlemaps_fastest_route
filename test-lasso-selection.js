const { chromium } = require('playwright');
const path = require('path');

async function testLassoSelection() {
  console.log('🎯 Testing Lasso Selection After Z-Index Fixes...');
  
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
          fileName: 'Houston Properties.xlsx',
          addressCount: 5,
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
            },
            {
              id: 4,
              address: '1111 Main St, Houston, TX 77002',
              lat: 29.7630,
              lng: -95.3631,
              firstName: 'Alice',
              lastName: 'Brown'
            },
            {
              id: 5,
              address: '2222 Richmond Ave, Houston, TX 77098',
              lat: 29.7407,
              lng: -95.4011,
              firstName: 'David',
              lastName: 'Davis'
            }
          ]
        }
      };
    });
    
    // Load addresses
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
    
    // Verify we're on route tab with addresses loaded
    const routeTabActive = await page.locator('.mobile-tab[data-tab="route"].active').isVisible();
    console.log('📍 Route tab active:', routeTabActive);
    
    const addressesLoaded = await page.evaluate(() => window.addresses?.length || 0);
    console.log('📊 Addresses loaded:', addressesLoaded);
    
    // Check selection tools visibility
    const lassoVisible = await page.locator('#mobileLassoBtn').isVisible();
    const clearVisible = await page.locator('#mobileClearBtn').isVisible();
    console.log('🎯 Lasso button visible:', lassoVisible);
    console.log('🗑️ Clear button visible:', clearVisible);
    
    if (lassoVisible) {
      console.log('\n🎯 Testing lasso selection...');
      
      // Click lasso button to activate
      await page.click('#mobileLassoBtn');
      await page.waitForTimeout(1000);
      
      // Check if lasso is active
      const lassoActive = await page.locator('#mobileLassoBtn.active').isVisible();
      console.log('✅ Lasso active after click:', lassoActive);
      
      // Get marker positions for selection
      const markerInfo = await page.evaluate(() => {
        const markers = [];
        if (window.mobileMap && window.mobileMapMarkers) {
          window.mobileMapMarkers.forEach((marker, index) => {
            const latLng = marker.getLatLng();
            markers.push({
              index: index,
              lat: latLng.lat,
              lng: latLng.lng,
              position: window.mobileMap.latLngToContainerPoint(latLng)
            });
          });
        }
        return markers;
      });
      
      console.log('📍 Found markers:', markerInfo.length);
      markerInfo.forEach((marker, i) => {
        console.log(`  Marker ${i}: (${marker.position.x}, ${marker.position.y})`);
      });
      
      if (markerInfo.length >= 2) {
        console.log('\n🖱️ Performing lasso selection...');
        
        // Find map container position
        const mapBounds = await page.locator('#mobileMap').boundingBox();
        console.log('🗺️ Map bounds:', mapBounds);
        
        // Draw a selection polygon around first 3 markers
        const selectedMarkers = markerInfo.slice(0, 3);
        const selectionPoints = [];
        
        // Create a bounding box around selected markers with padding
        const minX = Math.min(...selectedMarkers.map(m => m.position.x)) - 20;
        const maxX = Math.max(...selectedMarkers.map(m => m.position.x)) + 20;
        const minY = Math.min(...selectedMarkers.map(m => m.position.y)) - 20;
        const maxY = Math.max(...selectedMarkers.map(m => m.position.y)) + 20;
        
        // Draw rectangle selection
        const startX = mapBounds.x + minX;
        const startY = mapBounds.y + minY;
        const endX = mapBounds.x + maxX;
        const endY = mapBounds.y + maxY;
        
        console.log(`🔷 Drawing selection: (${startX}, ${startY}) to (${endX}, ${endY})`);
        
        // Perform drag to select
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(endX, startY);
        await page.mouse.move(endX, endY);
        await page.mouse.move(startX, endY);
        await page.mouse.move(startX, startY);
        await page.mouse.up();
        
        await page.waitForTimeout(2000);
        
        // Check how many addresses were selected
        const selectedCount = await page.evaluate(() => {
          return window.selectedAddresses ? window.selectedAddresses.length : 0;
        });
        
        console.log('✅ Addresses selected:', selectedCount);
        
        // Check if Create Route button is visible
        const createRouteVisible = await page.locator('#mobileCreateRouteBtn').isVisible();
        console.log('🚀 Create Route button visible:', createRouteVisible);
        
        if (createRouteVisible && selectedCount > 0) {
          console.log('\n🚀 Testing route creation...');
          await page.click('#mobileCreateRouteBtn');
          await page.waitForTimeout(3000);
          
          // Check if navigation mode activated
          const destCardVisible = await page.locator('#mobileDestinationCard').isVisible();
          console.log('📍 Destination card visible:', destCardVisible);
          
          if (destCardVisible) {
            console.log('✅ Route creation successful! Navigation mode activated.');
            
            // Test navigation controls
            const navControls = {
              prev: await page.locator('#mobilePrevBtn').isVisible(),
              navigate: await page.locator('#mobileNavigateBtn').isVisible(),
              next: await page.locator('#mobileNextBtn').isVisible()
            };
            
            console.log('🎮 Navigation controls:', navControls);
          }
        }
        
      } else {
        console.log('⚠️ Not enough markers for selection test');
      }
      
    } else {
      console.log('❌ Lasso button not visible');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-lasso-complete.png', fullPage: true });
    console.log('📸 Screenshot saved: test-lasso-complete.png');
    
    console.log('\n🔍 Browser will stay open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  testLassoSelection().catch(console.error);
}