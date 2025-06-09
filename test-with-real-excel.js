const { chromium } = require('playwright');
const path = require('path');

async function testWithRealExcel() {
  console.log('📊 Testing with REAL Drew Main List Excel file...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800
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
    
    // Set up auth
    await page.evaluate(() => {
      window.excelHistoryCurrentUser = {
        uid: 'test-user',
        email: 'test@example.com'
      };
    });
    
    console.log('📁 Going to upload the real Excel file...');
    
    // Click on Upload File button
    await page.click('#uploadFileBtn');
    await page.waitForTimeout(1000);
    
    // Upload the Drew Main List file
    const fileInput = await page.locator('#excelFileModal');
    const excelPath = path.resolve(__dirname, 'Drew Main list - PRE-FORECLOSURE FEB-MARCH 2025 PT.2.xlsx');
    
    console.log('📂 Uploading file:', excelPath);
    await fileInput.setInputFiles(excelPath);
    await page.waitForTimeout(3000);
    
    // Check if column mapping interface appears
    const columnMappingVisible = await page.locator('#uploadStep2').isVisible();
    console.log('🗂️ Column mapping interface visible:', columnMappingVisible);
    
    if (columnMappingVisible) {
      console.log('📋 Configuring column mapping...');
      
      // Map columns (you might need to adjust these based on actual Excel structure)
      await page.selectOption('select[data-field="address"]', { index: 1 }); // Usually first column
      await page.selectOption('select[data-field="firstName"]', { index: 2 }); // Usually second column  
      await page.selectOption('select[data-field="lastName"]', { index: 3 }); // Usually third column
      
      await page.waitForTimeout(1000);
      
      console.log('✅ Confirming column mapping...');
      await page.click('#confirmColumnMappingBtn');
      
      // Wait for geocoding to complete
      console.log('🌍 Waiting for geocoding to complete...');
      await page.waitForTimeout(10000); // Give time for geocoding
      
      // Check if geocoding progress is done
      await page.waitForSelector('#confirmColumnMappingBtn:not([disabled])', { timeout: 30000 });
    }
    
    await page.waitForTimeout(2000);
    
    // Go to Plan Route tab
    console.log('📍 Switching to Plan Route tab...');
    await page.click('#planRouteTab');
    await page.waitForTimeout(2000);
    
    // Check what data was loaded
    const addressData = await page.evaluate(() => {
      return {
        currentlyDisplayedItems: window.currentlyDisplayedItems ? window.currentlyDisplayedItems.length : 0,
        addresses: window.addresses ? window.addresses.length : 0,
        sampleItem: window.currentlyDisplayedItems && window.currentlyDisplayedItems[0] ? {
          address: window.currentlyDisplayedItems[0].address,
          hasLatitude: 'latitude' in window.currentlyDisplayedItems[0],
          hasLongitude: 'longitude' in window.currentlyDisplayedItems[0],
          hasLat: 'lat' in window.currentlyDisplayedItems[0],
          hasLng: 'lng' in window.currentlyDisplayedItems[0],
          latitude: window.currentlyDisplayedItems[0].latitude,
          longitude: window.currentlyDisplayedItems[0].longitude
        } : null
      };
    });
    
    console.log('📊 Loaded address data:', addressData);
    
    // Check Create Route button
    const createRouteBtn = await page.locator('#createRouteBtn');
    const buttonText = await createRouteBtn.textContent();
    const isEnabled = await createRouteBtn.isEnabled();
    
    console.log('📝 Create Route button text:', buttonText);
    console.log('✅ Create Route button enabled:', isEnabled);
    
    if (isEnabled) {
      console.log('🖱️ Clicking Create Route button...');
      await createRouteBtn.click();
      
      await page.waitForTimeout(5000);
      
      // Check for route markers
      const routeMarkers = await page.evaluate(() => {
        return document.querySelectorAll('.numbered-route-marker').length;
      });
      
      const polylineExists = await page.evaluate(() => {
        return document.querySelectorAll('.leaflet-overlay-pane svg g path[stroke="#007bff"]').length > 0;
      });
      
      const addressMarkersVisible = await page.evaluate(() => {
        return document.querySelectorAll('.leaflet-marker-icon').length;
      });
      
      console.log('🎯 Route markers created:', routeMarkers);
      console.log('📍 Route line exists:', polylineExists);
      console.log('📌 Address markers visible:', addressMarkersVisible);
      
      if (routeMarkers === 0) {
        console.log('❌ No route markers - checking debug info...');
        await page.evaluate(() => {
          console.log('🔍 DEBUG INFO:');
          if (window.desktopRouteCreator) {
            const addresses = window.desktopRouteCreator.getLoadedAddresses();
            console.log('- Loaded addresses count:', addresses.length);
            if (addresses.length > 0) {
              console.log('- First address:', addresses[0]);
              console.log('- Has coordinates:', !!addresses[0].latitude && !!addresses[0].longitude);
            }
          }
        });
      }
      
    } else {
      console.log('❌ Create Route button is disabled');
    }
    
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testWithRealExcel().catch(console.error);