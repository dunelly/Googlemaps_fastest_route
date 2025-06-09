const { chromium } = require('playwright');
const path = require('path');

async function testRealDataDebug() {
  console.log('🔍 Testing Create Route with REAL application data...');
  
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
    
    // Check what's actually in the global variables BEFORE adding mock data
    await page.evaluate(() => {
      console.log('🔍 BEFORE - Checking real app state:');
      console.log('- window.addresses:', window.addresses);
      console.log('- window.currentlyDisplayedItems:', window.currentlyDisplayedItems);
      console.log('- window.selectedItemsInShape:', window.selectedItemsInShape);
      console.log('- window.map:', !!window.map);
      console.log('- window.desktopRouteCreator:', !!window.desktopRouteCreator);
    });
    
    // Mock Excel file loading like the real app does
    await page.evaluate(() => {
      console.log('📁 Setting up realistic Excel file simulation...');
      
      // Mock authentication
      window.excelHistoryCurrentUser = {
        uid: 'test-user',
        email: 'test@example.com'
      };
      
      // Create realistic Excel file data structure
      const mockExcelData = [
        {
          'Address': '1234 Spring Branch Dr, Houston, TX 77080',
          'First Name': 'John',
          'Last Name': 'Smith',
          'Auction Date': '2025-06-15'
        },
        {
          'Address': '5678 Memorial Dr, Houston, TX 77007', 
          'First Name': 'Jane',
          'Last Name': 'Doe',
          'Auction Date': '2025-06-15'
        },
        {
          'Address': '9012 Westheimer Rd, Houston, TX 77063',
          'First Name': 'Bob', 
          'Last Name': 'Johnson',
          'Auction Date': '2025-06-15'
        },
        {
          'Address': '3456 Richmond Ave, Houston, TX 77046',
          'First Name': 'Alice',
          'Last Name': 'Wilson', 
          'Auction Date': '2025-06-15'
        }
      ];
      
      // Mock the Excel processing result (what would come from Excel operations)
      window.currentlyDisplayedItems = mockExcelData.map((row, index) => ({
        id: index + 1,
        address: row['Address'],
        firstName: row['First Name'],
        lastName: row['Last Name'],
        auctionDate: row['Auction Date'],
        lat: [29.7854, 29.7633, 29.7370, 29.7389][index],
        lng: [-95.4934, -95.4347, -95.4837, -95.4089][index],
        latitude: [29.7854, 29.7633, 29.7370, 29.7389][index],
        longitude: [-95.4934, -95.4347, -95.4837, -95.4089][index]
      }));
      
      console.log('✅ Mock Excel data created:', window.currentlyDisplayedItems.length, 'items');
      console.log('📍 Sample item structure:', window.currentlyDisplayedItems[0]);
    });
    
    await page.waitForTimeout(1000);
    
    // Call the same function the real app calls when Excel data is loaded
    await page.evaluate(() => {
      console.log('📡 Triggering populateAddressSelection like real app...');
      if (typeof populateAddressSelection === 'function') {
        populateAddressSelection(window.currentlyDisplayedItems);
      } else {
        console.log('❌ populateAddressSelection function not found');
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Check button state after "loading" data
    const createRouteBtn = await page.locator('#createRouteBtn');
    const buttonText = await createRouteBtn.textContent();
    const isEnabled = await createRouteBtn.isEnabled();
    
    console.log('📝 Button text after loading:', buttonText);
    console.log('✅ Button enabled after loading:', isEnabled);
    
    if (isEnabled) {
      console.log('🖱️ Clicking Create Route button...');
      await createRouteBtn.click();
      
      await page.waitForTimeout(3000);
      
      // Check what getLoadedAddresses actually returns
      const loadedAddressesInfo = await page.evaluate(() => {
        if (window.desktopRouteCreator) {
          const addresses = window.desktopRouteCreator.getLoadedAddresses();
          return {
            count: addresses.length,
            sample: addresses[0],
            hasCoordinates: addresses[0] && (addresses[0].latitude || addresses[0].lat),
            coordinateFields: addresses[0] ? Object.keys(addresses[0]).filter(key => 
              key.includes('lat') || key.includes('lng') || key.includes('longitude')
            ) : []
          };
        }
        return null;
      });
      
      console.log('📍 Loaded addresses info:', loadedAddressesInfo);
      
      // Check for route markers and lines
      const routeMarkers = await page.evaluate(() => {
        return document.querySelectorAll('.numbered-route-marker').length;
      });
      
      const polylineExists = await page.evaluate(() => {
        return document.querySelectorAll('.leaflet-overlay-pane svg g path[stroke="#007bff"]').length > 0;
      });
      
      console.log('🎯 Route markers found:', routeMarkers);
      console.log('📍 Route line exists:', polylineExists);
      
      // Check map layers
      const mapLayers = await page.evaluate(() => {
        if (window.map && window.map._layers) {
          return Object.keys(window.map._layers).length;
        }
        return 0;
      });
      console.log('🗺️ Total map layers:', mapLayers);
      
    } else {
      console.log('❌ Button still disabled after loading data');
      
      // Debug why button is disabled
      await page.evaluate(() => {
        console.log('🔍 Debugging disabled button:');
        if (window.desktopRouteCreator) {
          const addresses = window.desktopRouteCreator.getLoadedAddresses();
          console.log('- getLoadedAddresses() returns:', addresses.length, 'addresses');
          console.log('- Sample address:', addresses[0]);
        }
      });
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testRealDataDebug().catch(console.error);