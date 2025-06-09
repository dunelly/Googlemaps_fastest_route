const { chromium } = require('playwright');
const path = require('path');

async function testCreateRouteDebug() {
  console.log('🧪 Testing Create Route Button Functionality...');
  
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
  
  // Listen to errors
  page.on('pageerror', error => {
    console.error('❌ Page Error:', error.message);
  });
  
  try {
    const localPath = `file://${path.resolve(__dirname, 'index.html')}`;
    await page.goto(localPath);
    
    console.log('📱 Page loaded, waiting for initialization...');
    await page.waitForTimeout(3000);
    
    // Add mock authentication and files
    await page.evaluate(() => {
      console.log('🔧 Setting up mock data...');
      
      window.excelHistoryCurrentUser = {
        uid: 'test-user',
        email: 'test@example.com'
      };
      
      // Mock addresses with proper coordinates
      window.addresses = [
        {
          id: 1,
          address: '1234 Spring Branch Dr, Houston, TX 77080',
          latitude: 29.7854,
          longitude: -95.4934,
          firstName: 'John',
          lastName: 'Smith'
        },
        {
          id: 2,
          address: '5678 Memorial Dr, Houston, TX 77007',
          latitude: 29.7633,
          longitude: -95.4347,
          firstName: 'Jane',
          lastName: 'Doe'
        },
        {
          id: 3,
          address: '9012 Westheimer Rd, Houston, TX 77063',
          latitude: 29.7370,
          longitude: -95.4837,
          firstName: 'Bob',
          lastName: 'Johnson'
        },
        {
          id: 4,
          address: '3456 Richmond Ave, Houston, TX 77046',
          latitude: 29.7389,
          longitude: -95.4089,
          firstName: 'Alice',
          lastName: 'Wilson'
        }
      ];
      
      window.currentlyDisplayedItems = window.addresses;
      
      console.log('✅ Mock data set up with', window.addresses.length, 'addresses');
      console.log('📍 Sample address:', window.addresses[0]);
      
      // Check if map is available
      console.log('🗺️ Map available:', !!window.map);
      console.log('🎯 Desktop route creator available:', !!window.desktopRouteCreator);
      
      // Trigger the addressesLoaded event to update button state
      document.dispatchEvent(new CustomEvent('addressesLoaded', { 
        detail: { count: window.addresses.length } 
      }));
      console.log('📡 Dispatched addressesLoaded event');
      
      // Manually update button state if available
      if (window.desktopRouteCreator) {
        window.desktopRouteCreator.updateButtonState();
        console.log('🔄 Manually updated button state');
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Check if Create Route button exists and is visible
    const createRouteBtn = await page.locator('#createRouteBtn');
    const isVisible = await createRouteBtn.isVisible();
    console.log('🔍 Create Route button visible:', isVisible);
    
    if (isVisible) {
      const buttonText = await createRouteBtn.textContent();
      console.log('📝 Button text:', buttonText);
      
      const isEnabled = await createRouteBtn.isEnabled();
      console.log('✅ Button enabled:', isEnabled);
      
      if (isEnabled) {
        console.log('🖱️ Clicking Create Route button...');
        await createRouteBtn.click();
        
        await page.waitForTimeout(3000);
        
        // Check if route was created by looking for numbered markers
        const routeMarkers = await page.evaluate(() => {
          return document.querySelectorAll('.numbered-route-marker').length;
        });
        console.log('🎯 Route markers found:', routeMarkers);
        
        // Check for polyline (route line)
        const polylineExists = await page.evaluate(() => {
          return document.querySelectorAll('.leaflet-overlay-pane svg g path[stroke="#007bff"]').length > 0;
        });
        console.log('📍 Route line exists:', polylineExists);
        
        // Get final button text
        const finalButtonText = await createRouteBtn.textContent();
        console.log('📝 Final button text:', finalButtonText);
        
        // Check map state
        await page.evaluate(() => {
          console.log('🗺️ Final map state check:');
          console.log('- Map available:', !!window.map);
          console.log('- Desktop route creator:', !!window.desktopRouteCreator);
          if (window.desktopRouteCreator) {
            console.log('- Route markers:', window.desktopRouteCreator.routeMarkers ? window.desktopRouteCreator.routeMarkers.length : 0);
            console.log('- Route polyline:', !!window.desktopRouteCreator.routePolyline);
          }
        });
        
      } else {
        console.log('❌ Button is disabled');
      }
    } else {
      console.log('❌ Create Route button not found or not visible');
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testCreateRouteDebug().catch(console.error);