const { chromium } = require('playwright');
const path = require('path');

async function testRealExcelGeocoding() {
  console.log('🏠 Testing Real Excel File with Geocoding...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    console.log('🌐', msg.text());
  });
  
  // Listen to errors
  page.on('pageerror', error => {
    console.error('❌ Page Error:', error.message);
  });
  
  try {
    const localPath = `file://${path.resolve(__dirname, 'index.html')}`;
    await page.goto(localPath);
    
    console.log('📱 Page loaded, waiting for initialization...');
    await page.waitForTimeout(3000);
    
    // Mock auth first
    await page.evaluate(() => {
      window.excelHistoryCurrentUser = {
        uid: 'test-user',
        email: 'test@example.com'
      };
    });
    
    console.log('📁 Going to Files tab...');
    await page.click('#manageFilesTab');
    await page.waitForTimeout(1000);
    
    // Upload the real Excel file
    console.log('📊 Uploading real Excel file...');
    
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles('/Users/mr.nguyen/Desktop/routebeta2/Drew Main list - PRE-FORECLOSURE FEB-MARCH 2025 PT.2.xlsx');
    
    // Wait for file processing
    console.log('⏳ Waiting for file processing...');
    await page.waitForTimeout(5000);
    
    // Check if file was processed and shows up in history
    const fileVisible = await page.evaluate(() => {
      return document.querySelector('.excel-file-item') !== null;
    });
    
    console.log('📁 Excel file visible in history:', fileVisible);
    
    if (fileVisible) {
      // Click "Load Addresses" to trigger the geocoding process
      console.log('🔄 Loading addresses from Excel file...');
      await page.click('button[onclick*="loadExcelAddresses"]');
      
      // Wait for loading and geocoding process
      console.log('🌍 Waiting for geocoding process to complete...');
      await page.waitForTimeout(15000); // Give more time for geocoding
      
      // Go back to Plan Route tab to check Create Route button
      console.log('🗺️ Switching to Plan Route tab...');
      await page.click('#planRouteTab');
      await page.waitForTimeout(2000);
      
      // Check the state of loaded addresses
      const addressResults = await page.evaluate(() => {
        const addresses = window.currentlyDisplayedItems || [];
        const withCoords = addresses.filter(addr => 
          (addr.latitude || addr.lat) && (addr.longitude || addr.lng)
        );
        
        return {
          totalAddresses: addresses.length,
          addressesWithCoords: withCoords.length,
          sampleAddress: addresses[0] ? {
            address: addresses[0].address,
            hasLatitude: !!(addresses[0].latitude || addresses[0].lat),
            hasLongitude: !!(addresses[0].longitude || addresses[0].lng),
            coords: `${addresses[0].latitude || addresses[0].lat || 'none'}, ${addresses[0].longitude || addresses[0].lng || 'none'}`
          } : null
        };
      });
      
      console.log('📍 Address loading results:');
      console.log('- Total addresses loaded:', addressResults.totalAddresses);
      console.log('- Addresses with coordinates:', addressResults.addressesWithCoords);
      console.log('- Sample address:', addressResults.sampleAddress);
      
      // Check Create Route button state
      const createRouteBtn = await page.locator('#createRouteBtn');
      const buttonText = await createRouteBtn.textContent();
      const isEnabled = await createRouteBtn.isEnabled();
      
      console.log('🚀 Create Route button text:', buttonText);
      console.log('✅ Create Route button enabled:', isEnabled);
      
      if (isEnabled && addressResults.addressesWithCoords > 0) {
        console.log('🖱️ Testing Create Route with real geocoded addresses...');
        
        // Click Create Route button
        await createRouteBtn.click();
        
        // Wait for route creation
        await page.waitForTimeout(5000);
        
        // Check if route was created successfully
        const routeResults = await page.evaluate(() => {
          return {
            routeMarkersCount: document.querySelectorAll('.numbered-route-marker').length,
            routePolylineExists: document.querySelector('path[stroke="#007bff"]') !== null,
            buttonText: document.getElementById('createRouteBtn').textContent
          };
        });
        
        console.log('🎯 Route visualization results:');
        console.log('- Numbered markers created:', routeResults.routeMarkersCount);
        console.log('- Route line visible:', routeResults.routePolylineExists);
        console.log('- Button state after:', routeResults.buttonText);
        
        if (routeResults.routeMarkersCount > 0) {
          console.log('✅ SUCCESS: Route created with numbered markers!');
          
          // Test clicking on a marker to see popup
          console.log('🖱️ Testing marker popup...');
          const marker = await page.locator('.numbered-route-marker').first();
          if (await marker.count() > 0) {
            await marker.click();
            await page.waitForTimeout(1000);
            
            const popupVisible = await page.evaluate(() => {
              return document.querySelector('.leaflet-popup') !== null;
            });
            console.log('💬 Marker popup visible:', popupVisible);
          }
        } else {
          console.log('❌ FAILURE: No route markers created');
        }
        
        // Test lasso selection
        console.log('🎯 Testing lasso selection...');
        
        // First, clear any existing selections
        await page.click('button:has-text("Clear Selections")');
        await page.waitForTimeout(1000);
        
        // Get map bounds to create a lasso selection
        const mapCenter = await page.evaluate(() => {
          if (window.map) {
            const center = window.map.getCenter();
            const bounds = window.map.getBounds();
            return {
              lat: center.lat,
              lng: center.lng,
              north: bounds.getNorth(),
              south: bounds.getSouth(),
              east: bounds.getEast(),
              west: bounds.getWest()
            };
          }
          return null;
        });
        
        if (mapCenter) {
          console.log('🗺️ Map center:', mapCenter);
          
          // Create a polygon selection around some addresses
          await page.evaluate((bounds) => {
            if (window.map && window.drawnItems) {
              // Create a polygon that covers part of the map
              const polygon = L.polygon([
                [bounds.south + 0.01, bounds.west + 0.01],
                [bounds.north - 0.01, bounds.west + 0.01], 
                [bounds.north - 0.01, bounds.east - 0.01],
                [bounds.south + 0.01, bounds.east - 0.01]
              ]);
              
              window.drawnItems.addLayer(polygon);
              
              // Trigger the selection event manually
              window.map.fire('draw:created', { layer: polygon });
            }
          }, mapCenter);
          
          await page.waitForTimeout(2000);
          
          // Check if lasso selection worked
          const lassoResults = await page.evaluate(() => {
            return {
              selectedCount: window.selectedItemsInShape ? window.selectedItemsInShape.length : 0,
              buttonText: document.getElementById('createRouteBtn').textContent
            };
          });
          
          console.log('🎯 Lasso selection results:');
          console.log('- Selected addresses:', lassoResults.selectedCount);
          console.log('- Button text after selection:', lassoResults.buttonText);
          
          if (lassoResults.selectedCount > 0) {
            console.log('✅ Lasso selection working! Testing route with selected addresses...');
            
            // Create route with selected addresses
            await createRouteBtn.click();
            await page.waitForTimeout(3000);
            
            const selectedRouteResults = await page.evaluate(() => {
              return {
                routeMarkersCount: document.querySelectorAll('.numbered-route-marker').length,
                buttonText: document.getElementById('createRouteBtn').textContent
              };
            });
            
            console.log('🎯 Selected route results:');
            console.log('- Markers for selected addresses:', selectedRouteResults.routeMarkersCount);
          }
        }
        
      } else {
        console.log('❌ Create Route button not enabled or no geocoded addresses');
      }
    } else {
      console.log('❌ Excel file not visible in Files tab');
    }
    
    // Final status
    console.log('🏁 Test completed - leaving browser open for inspection');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testRealExcelGeocoding().catch(console.error);