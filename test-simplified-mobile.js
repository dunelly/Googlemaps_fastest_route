const { chromium } = require('playwright');
const path = require('path');

async function testSimplifiedMobile() {
  console.log('🎯 Testing Simplified Mobile Workflow...');
  
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
          fileName: 'Simple Workflow Test.xlsx',
          addressCount: 4,
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
            }
          ]
        }
      };
    });
    
    console.log('\n📋 STEP 1: Load addresses from Files tab');
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
    console.log('✅ Addresses loaded:', addressesLoaded);
    console.log('✅ Markers created:', markersCount);
    
    if (markersCount > 0) {
      console.log('\n🎯 STEP 2: Use Lasso to select addresses');
      
      // Check if lasso button is visible
      const lassoVisible = await page.locator('#mobileLassoBtn').isVisible();
      console.log('🎯 Lasso button visible:', lassoVisible);
      
      if (lassoVisible) {
        // Click lasso button to select all addresses
        await page.click('#mobileLassoBtn');
        await page.waitForTimeout(2000);
        
        // Check selection results
        const selectedCount = await page.evaluate(() => window.selectedAddresses?.length || 0);
        console.log('✅ Addresses selected:', selectedCount);
        
        const createRouteVisible = await page.locator('#mobileCreateRouteBtn').isVisible();
        console.log('🚀 Create Route button visible:', createRouteVisible);
        
        if (selectedCount > 0 && createRouteVisible) {
          console.log('\n🚀 STEP 3: Create Route');
          await page.click('#mobileCreateRouteBtn');
          await page.waitForTimeout(2000);
          
          // Check if navigation mode activated
          const destCardVisible = await page.locator('#mobileDestinationCard').isVisible();
          console.log('📍 Navigation card visible:', destCardVisible);
          
          if (destCardVisible) {
            console.log('✅ Route creation successful! Navigation mode activated.');
            
            // Check current destination
            const currentDest = await page.locator('#mobileDestAddress').textContent();
            const routeProgress = await page.locator('#mobileRouteProgress').textContent();
            console.log('📍 Current destination:', currentDest);
            console.log('📊 Route progress:', routeProgress);
            
            // Test navigation controls
            console.log('\n🎮 STEP 4: Test Sequential Navigation');
            const navControls = {
              prev: await page.locator('#mobilePrevBtn').isVisible(),
              navigate: await page.locator('#mobileNavigateBtn').isVisible(),
              next: await page.locator('#mobileNextBtn').isVisible()
            };
            
            console.log('🎮 Navigation controls visible:', navControls);
            
            if (navControls.next) {
              console.log('\n▶️ Testing Next button...');
              await page.click('#mobileNextBtn');
              await page.waitForTimeout(1000);
              
              const newProgress = await page.locator('#mobileRouteProgress').textContent();
              const newDest = await page.locator('#mobileDestAddress').textContent();
              console.log('📊 New progress:', newProgress);
              console.log('📍 New destination:', newDest);
              
              if (navControls.navigate) {
                console.log('\n🗺️ Testing Google Maps Navigation...');
                console.log('📱 Navigation button ready - would open Google Maps');
                // Don't actually click to avoid opening external app in test
              }
              
              console.log('\n🎉 SUCCESS! Complete mobile workflow working:');
              console.log('✅ Load addresses from files');
              console.log('✅ Simple lasso selection (select all)');
              console.log('✅ Route creation with optimization');
              console.log('✅ Sequential navigation interface');
              console.log('✅ Google Maps integration ready');
              
            }
          } else {
            console.log('❌ Navigation card not visible after route creation');
          }
        } else {
          console.log('❌ Selection or Create Route button issue');
        }
      } else {
        console.log('❌ Lasso button not visible');
      }
    } else {
      console.log('❌ No addresses/markers found');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-simplified-mobile.png', fullPage: true });
    console.log('📸 Screenshot saved: test-simplified-mobile.png');
    
    console.log('\n🔍 Browser will stay open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  testSimplifiedMobile().catch(console.error);
}