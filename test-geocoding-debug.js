const { chromium } = require('playwright');
const path = require('path');

async function testGeocodingDebug() {
  console.log('🌍 Testing Geocoding Process...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
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
    
    // Test geocoding directly
    await page.evaluate(() => {
      console.log('🧪 Testing geocoding function directly...');
      
      // Create test addresses WITHOUT coordinates
      const testAddresses = [
        {
          id: 1,
          address: '1234 Spring Branch Dr, Houston, TX 77080',
          firstName: 'John',
          lastName: 'Smith'
        },
        {
          id: 2,
          address: '5678 Memorial Dr, Houston, TX 77007',
          firstName: 'Jane', 
          lastName: 'Doe'
        }
      ];
      
      console.log('📍 Test addresses (before geocoding):', testAddresses);
      
      // Check if geocoding function exists
      if (typeof window.geocodeAddresses === 'function') {
        console.log('✅ geocodeAddresses function available');
        
        // Test geocoding
        window.geocodeAddresses(testAddresses).then(result => {
          console.log('🌍 Geocoding completed!');
          console.log('📍 Result:', result);
          console.log('📍 First address after geocoding:', result[0]);
          
          // Check if coordinates were added
          if (result[0] && (result[0].latitude || result[0].lat)) {
            console.log('✅ SUCCESS: Coordinates added!');
            console.log('- Latitude:', result[0].latitude || result[0].lat);
            console.log('- Longitude:', result[0].longitude || result[0].lng);
          } else {
            console.log('❌ FAILURE: No coordinates added');
          }
        }).catch(error => {
          console.error('❌ Geocoding failed:', error);
        });
        
      } else {
        console.log('❌ geocodeAddresses function NOT available');
      }
    });
    
    // Wait for geocoding to complete
    await page.waitForTimeout(10000);
    
    // Now test the Excel loading process
    console.log('📊 Testing Excel loading with geocoding...');
    
    await page.evaluate(() => {
      // Mock auth
      window.excelHistoryCurrentUser = {
        uid: 'test-user',
        email: 'test@example.com'
      };
      
      // Create a mock Excel file entry
      window.savedExcelFiles = {
        'test-excel': {
          id: 'test-excel',
          fileName: 'Test Houston Addresses.xlsx',
          processedData: [
            {
              id: 1,
              address: '1234 Spring Branch Dr, Houston, TX 77080',
              firstName: 'John',
              lastName: 'Smith'
              // Note: NO coordinates yet
            },
            {
              id: 2, 
              address: '5678 Memorial Dr, Houston, TX 77007',
              firstName: 'Jane',
              lastName: 'Doe'
              // Note: NO coordinates yet
            }
          ],
          uploadDate: new Date().toISOString(),
          addressCount: 2
        }
      };
      
      console.log('📂 Mock Excel file created');
    });
    
    // Go to Files tab
    await page.click('#manageFilesTab');
    await page.waitForTimeout(2000);
    
    // Check if files show up
    const fileVisible = await page.evaluate(() => {
      return document.querySelector('.excel-file-item') !== null;
    });
    console.log('📁 Mock file visible in Files tab:', fileVisible);
    
    if (fileVisible) {
      // Click "Load Addresses" button
      console.log('🔄 Clicking Load Addresses button...');
      await page.click('button[onclick*="loadExcelAddresses"]');
      
      // Wait for loading and geocoding
      await page.waitForTimeout(8000);
      
      // Check results
      const results = await page.evaluate(() => {
        return {
          currentlyDisplayedItems: window.currentlyDisplayedItems ? window.currentlyDisplayedItems.length : 0,
          sampleItem: window.currentlyDisplayedItems && window.currentlyDisplayedItems[0] ? {
            address: window.currentlyDisplayedItems[0].address,
            hasLatitude: 'latitude' in window.currentlyDisplayedItems[0],
            hasLat: 'lat' in window.currentlyDisplayedItems[0],
            latitude: window.currentlyDisplayedItems[0].latitude,
            lat: window.currentlyDisplayedItems[0].lat,
            coordinates: `${window.currentlyDisplayedItems[0].latitude || window.currentlyDisplayedItems[0].lat || 'none'}, ${window.currentlyDisplayedItems[0].longitude || window.currentlyDisplayedItems[0].lng || 'none'}`
          } : null
        };
      });
      
      console.log('📊 Excel loading results:', results);
      
      // Go back to Plan Route tab
      await page.click('#planRouteTab');
      await page.waitForTimeout(1000);
      
      // Check Create Route button
      const createRouteBtn = await page.locator('#createRouteBtn');
      const buttonText = await createRouteBtn.textContent();
      const isEnabled = await createRouteBtn.isEnabled();
      
      console.log('📝 Create Route button text:', buttonText);
      console.log('✅ Create Route button enabled:', isEnabled);
      
      if (isEnabled) {
        console.log('🖱️ Testing Create Route with geocoded addresses...');
        await createRouteBtn.click();
        
        await page.waitForTimeout(3000);
        
        const routeMarkers = await page.evaluate(() => {
          return document.querySelectorAll('.numbered-route-marker').length;
        });
        
        console.log('🎯 Route markers created:', routeMarkers);
      }
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testGeocodingDebug().catch(console.error);