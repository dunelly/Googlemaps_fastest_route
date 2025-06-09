const { chromium } = require('playwright');
const path = require('path');

async function testRealExcelData() {
  console.log('🔍 Testing with ACTUAL Excel file data...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
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
    
    // Set up auth so we can use Files tab
    await page.evaluate(() => {
      window.excelHistoryCurrentUser = {
        uid: 'test-user',
        email: 'test@example.com'
      };
    });
    
    console.log('📁 Switching to Files tab to load real data...');
    
    // Click on Files tab
    await page.click('#manageFilesTab');
    await page.waitForTimeout(1000);
    
    // Check what files are available
    const filesAvailable = await page.evaluate(() => {
      return window.savedExcelFiles ? Object.keys(window.savedExcelFiles).length : 0;
    });
    console.log('📊 Saved Excel files available:', filesAvailable);
    
    if (filesAvailable === 0) {
      console.log('⚠️ No saved Excel files found. Let\'s create a realistic simulation...');
      
      // Simulate what happens when Excel file is "loaded" without proper geocoding
      await page.evaluate(() => {
        // This simulates Excel data BEFORE geocoding (like your real scenario)
        const rawExcelData = [
          { 'Address': '1234 Spring Branch Dr, Houston, TX 77080', 'First Name': 'John', 'Last Name': 'Smith' },
          { 'Address': '5678 Memorial Dr, Houston, TX 77007', 'First Name': 'Jane', 'Last Name': 'Doe' },
          { 'Address': '9012 Westheimer Rd, Houston, TX 77063', 'First Name': 'Bob', 'Last Name': 'Johnson' },
          { 'Address': '3456 Richmond Ave, Houston, TX 77046', 'First Name': 'Alice', 'Last Name': 'Wilson' }
        ];
        
        // Create currentlyDisplayedItems WITHOUT coordinates (like real Excel import)
        window.currentlyDisplayedItems = rawExcelData.map((row, index) => ({
          id: index + 1,
          address: row['Address'],
          firstName: row['First Name'],
          lastName: row['Last Name'],
          // NO latitude/longitude - this is the problem!
        }));
        
        console.log('❌ Created Excel data WITHOUT coordinates (realistic scenario)');
        console.log('📍 Sample item:', window.currentlyDisplayedItems[0]);
        
        // Trigger address loading
        if (typeof populateAddressSelection === 'function') {
          populateAddressSelection(window.currentlyDisplayedItems);
        }
      });
      
      await page.waitForTimeout(2000);
      
      // Go back to Plan Route tab
      await page.click('#planRouteTab');
      await page.waitForTimeout(1000);
      
      // Check button state
      const createRouteBtn = await page.locator('#createRouteBtn');
      const buttonText = await createRouteBtn.textContent();
      const isEnabled = await createRouteBtn.isEnabled();
      
      console.log('📝 Button text with NO coordinates:', buttonText);
      console.log('✅ Button enabled with NO coordinates:', isEnabled);
      
      if (isEnabled) {
        console.log('🖱️ Clicking Create Route button with NO coordinates...');
        await createRouteBtn.click();
        
        await page.waitForTimeout(3000);
        
        // Check what happens
        const routeMarkers = await page.evaluate(() => {
          return document.querySelectorAll('.numbered-route-marker').length;
        });
        
        console.log('🎯 Route markers created with NO coordinates:', routeMarkers);
        
        // Check the actual address data being processed
        await page.evaluate(() => {
          console.log('🔍 DEBUGGING NO COORDINATES SCENARIO:');
          if (window.desktopRouteCreator) {
            const addresses = window.desktopRouteCreator.getLoadedAddresses();
            console.log('- Addresses count:', addresses.length);
            console.log('- First address structure:', addresses[0]);
            console.log('- Has latitude?', addresses[0] && 'latitude' in addresses[0]);
            console.log('- Has longitude?', addresses[0] && 'longitude' in addresses[0]);
            console.log('- Has lat?', addresses[0] && 'lat' in addresses[0]);
            console.log('- Has lng?', addresses[0] && 'lng' in addresses[0]);
          }
        });
      }
      
      console.log('\n🔧 NOW TESTING WITH COORDINATES ADDED...');
      
      // Now add coordinates and test again
      await page.evaluate(() => {
        // Add coordinates to existing data
        const coordinates = [
          { lat: 29.7854, lng: -95.4934 },
          { lat: 29.7633, lng: -95.4347 }, 
          { lat: 29.7370, lng: -95.4837 },
          { lat: 29.7389, lng: -95.4089 }
        ];
        
        window.currentlyDisplayedItems = window.currentlyDisplayedItems.map((item, index) => ({
          ...item,
          latitude: coordinates[index].lat,
          longitude: coordinates[index].lng,
          lat: coordinates[index].lat,
          lng: coordinates[index].lng
        }));
        
        console.log('✅ Added coordinates to existing data');
        console.log('📍 Updated sample item:', window.currentlyDisplayedItems[0]);
        
        // Trigger address loading again
        if (typeof populateAddressSelection === 'function') {
          populateAddressSelection(window.currentlyDisplayedItems);
        }
      });
      
      await page.waitForTimeout(2000);
      
      // Test with coordinates
      const buttonTextWithCoords = await createRouteBtn.textContent();
      console.log('📝 Button text WITH coordinates:', buttonTextWithCoords);
      
      console.log('🖱️ Clicking Create Route button WITH coordinates...');
      await createRouteBtn.click();
      
      await page.waitForTimeout(3000);
      
      const routeMarkersWithCoords = await page.evaluate(() => {
        return document.querySelectorAll('.numbered-route-marker').length;
      });
      
      console.log('🎯 Route markers created WITH coordinates:', routeMarkersWithCoords);
      
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testRealExcelData().catch(console.error);