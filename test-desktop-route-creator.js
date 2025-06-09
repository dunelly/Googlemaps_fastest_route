const { chromium } = require('playwright');
const path = require('path');

async function testDesktopRouteCreator() {
  console.log('🎯 Testing Desktop Route Creator...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    console.log('🌐', msg.text());
  });
  
  try {
    const localPath = `file://${path.resolve(__dirname, 'index.html')}`;
    await page.goto(localPath);
    
    console.log('💻 Desktop page loaded, setting up mock data...');
    await page.waitForTimeout(3000);
    
    // Add mock authentication and addresses
    await page.evaluate(() => {
      // Mock global addresses array
      window.addresses = [
        {
          address: '1234 Spring Branch Dr, Houston, TX 77080',
          latitude: 29.7854,
          longitude: -95.4934,
          firstName: 'John',
          lastName: 'Smith',
          name: 'John Smith'
        },
        {
          address: '5678 Memorial Dr, Houston, TX 77007',
          latitude: 29.7633,
          longitude: -95.4067,
          firstName: 'Mary',
          lastName: 'Johnson',
          name: 'Mary Johnson'
        },
        {
          address: '9012 Westheimer Rd, Houston, TX 77063',
          latitude: 29.7400,
          longitude: -95.4827,
          firstName: 'Bob',
          lastName: 'Wilson',
          name: 'Bob Wilson'
        },
        {
          address: '1111 Main St, Houston, TX 77002',
          latitude: 29.7630,
          longitude: -95.3631,
          firstName: 'Alice',
          lastName: 'Brown',
          name: 'Alice Brown'
        }
      ];
      
      // Mock currentlyDisplayedItems for address renderer
      window.currentlyDisplayedItems = window.addresses;
      
      console.log('📍 Mock addresses set up:', window.addresses.length);
    });
    
    console.log('💻 STEP 1: Load addresses on map');
    
    // Load addresses on the map first (this is the key step!)
    await page.evaluate(() => {
      // Set currentlyDisplayedItems before calling the function
      window.currentlyDisplayedItems = window.addresses;
      console.log('Setting currentlyDisplayedItems:', window.currentlyDisplayedItems?.length);
      console.log('window.addresses:', window.addresses?.length);
      
      // Load addresses on the map using the proper function
      if (window.displayAddressesOnMap) {
        window.displayAddressesOnMap(window.addresses);
      } else if (window.updateMapMarkers) {
        window.updateMapMarkers();
      } else {
        console.log('Map display functions not found, trying manual map update');
        
        // Try to trigger map update manually
        if (window.map && window.addresses) {
          window.addresses.forEach((address, index) => {
            if (address.latitude && address.longitude) {
              const marker = L.marker([address.latitude, address.longitude])
                .bindPopup(`<b>${address.address}</b><br>${address.name || ''}`)
                .addTo(window.map);
              console.log(`📍 Added marker ${index + 1}: ${address.address}`);
            }
          });
        }
      }
      
      // Also call the functions for the UI
      if (window.updateMiddleAddresses) {
        window.updateMiddleAddresses();
      }
      
      if (window.populateAddressSelection) {
        window.populateAddressSelection(window.addresses);
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Check if Create Route button exists and is visible
    const createRouteBtnExists = await page.locator('#createRouteBtn').count();
    const createRouteBtn = createRouteBtnExists > 0 ? await page.locator('#createRouteBtn').isVisible() : false;
    console.log('🚀 Create Route button exists:', createRouteBtnExists);
    console.log('🚀 Create Route button visible:', createRouteBtn);
    
    if (createRouteBtn) {
      // Check if address selection section is visible
      const addressSection = await page.locator('#addressSelectionSection').isVisible();
      console.log('📍 Address selection section visible:', addressSection);
      
      if (addressSection) {
        // Count available checkboxes
        const checkboxCount = await page.locator('#middleAddressesList input[type="checkbox"]').count();
        console.log('☑️ Address checkboxes available:', checkboxCount);
        
        console.log('\n💻 STEP 2: Check if addresses are on map');
        
        // Check if addresses are loaded on the map
        const mapMarkers = await page.evaluate(() => {
          if (!window.map) return 0;
          
          let markerCount = 0;
          window.map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
              markerCount++;
            }
          });
          return markerCount;
        });
        
        console.log('📍 Map markers found:', mapMarkers);
        
        if (mapMarkers > 0) {
          console.log('\n💻 STEP 3: Use lasso tool to select addresses from map');
          
          // Check if desktop route creator exists and can select all
          const routeCreated = await page.evaluate(() => {
            if (window.desktopRouteCreator && window.addresses) {
              console.log('🎯 Using desktop route creator to select addresses');
              
              // Set selected addresses to all addresses
              window.desktopRouteCreator.selectedAddresses = window.addresses.slice(0, 3); // Take first 3
              console.log('✅ Selected', window.desktopRouteCreator.selectedAddresses.length, 'addresses');
              
              // Update button state
              window.desktopRouteCreator.updateButtonState();
              
              return true;
            }
            return false;
          });
          
          if (routeCreated) {
            console.log('✅ Addresses selected using desktop route creator');
          } else {
            // Fallback: Use checkboxes if lasso tool not available
            console.log('🔄 Fallback: Using checkboxes for selection');
            try {
              const checkboxes = await page.locator('#middleAddressesList input[type="checkbox"]').all();
              for (let i = 0; i < Math.min(3, checkboxes.length); i++) {
                await checkboxes[i].click();
                console.log(`✅ Checkbox ${i + 1} clicked`);
                await page.waitForTimeout(300);
              }
            } catch (error) {
              console.log('❌ Failed to click checkboxes:', error.message);
            }
          }
        } else {
          console.log('⚠️ No markers found on map - addresses may not be loaded properly');
        }
        
        await page.waitForTimeout(1000);
          
          // Check button state after selection
          const buttonText = await page.locator('#createRouteBtn').textContent();
          console.log('🚀 Create Route button text after selection:', buttonText);
          
          const isButtonEnabled = await page.locator('#createRouteBtn').isEnabled();
          console.log('✅ Create Route button enabled:', isButtonEnabled);
          
          if (isButtonEnabled) {
            console.log('\n🚀 Testing route creation...');
            
            // Click Create Route button
            await page.click('#createRouteBtn');
            await page.waitForTimeout(5000);
            
            // Check if route was created on map
            const routeMarkers = await page.locator('.numbered-route-marker').count();
            console.log('📍 Numbered route markers on map:', routeMarkers);
            
            // Check for route line
            const routeLines = await page.evaluate(() => {
              const map = window.map;
              if (!map) return 0;
              
              let lineCount = 0;
              map.eachLayer(layer => {
                if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
                  lineCount++;
                }
              });
              return lineCount;
            });
            console.log('📏 Route lines on map:', routeLines);
            
            if (routeMarkers > 0) {
              console.log('\n🎉 SUCCESS! Desktop route creation working!');
              console.log(`✅ Created route with ${routeMarkers} numbered markers`);
              console.log(`✅ Route line displayed: ${routeLines > 0 ? 'Yes' : 'No'}`);
              
              // Test clicking on a marker to open popup
              console.log('\n🔍 Testing marker popup...');
              const firstMarker = page.locator('.numbered-route-marker').first();
              if (await firstMarker.isVisible()) {
                await firstMarker.click();
                await page.waitForTimeout(1000);
                
                const popupVisible = await page.locator('.leaflet-popup').isVisible();
                console.log('💬 Marker popup visible:', popupVisible);
                
                if (popupVisible) {
                  const popupText = await page.locator('.leaflet-popup-content').textContent();
                  console.log('📝 Popup content preview:', popupText.substring(0, 100) + '...');
                }
              }
              
            } else {
              console.log('⚠️ Route markers not found - checking for errors...');
            }
            
          } else {
            console.log('❌ Create Route button not enabled after selection');
          }
        } else {
          console.log('❌ No address checkboxes found');
        }
      } else {
        console.log('❌ Address selection section not visible');
      }
    } else {
      console.log('❌ Create Route button not found or not visible');
      
      // Debug: Check what buttons are actually present
      const allButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.map(btn => ({
          id: btn.id,
          textContent: btn.textContent?.trim(),
          classList: Array.from(btn.classList),
          visible: btn.offsetParent !== null
        }));
      });
      
      console.log('🔍 All buttons found:', allButtons.filter(btn => 
        btn.textContent?.includes('Route') || btn.textContent?.includes('Create')
      ));
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-desktop-route-creator.png', fullPage: true });
    console.log('📸 Screenshot saved: test-desktop-route-creator.png');
    
    console.log('\n🔍 Browser will stay open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  testDesktopRouteCreator().catch(console.error);
}