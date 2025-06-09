const { chromium } = require('playwright');

async function testManualWorkflow() {
  console.log('🔍 MANUAL WORKFLOW TEST - Open browser and follow along');
  console.log('===============================================');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Opening SmashRoutes mobile interface...');
    await page.goto('http://127.0.0.1:5500/index.html');
    await page.waitForTimeout(3000);
    
    console.log('\n🎯 FOLLOW THESE STEPS IN THE BROWSER:');
    console.log('1. 📱 Mobile interface should be visible');
    console.log('2. 👤 Sign in to your Firebase account');
    console.log('3. 📁 Click Files tab to see your Excel files');
    console.log('4. 📊 Look for "Druze List" file');
    console.log('5. 📍 Click "Load Addresses" on the file');
    console.log('6. 🗺️ Switch to Plan Route tab to see addresses on map');
    console.log('7. 🔵 Use lasso tool to select addresses');
    console.log('8. 🗺️ Click "Create Route" button');
    console.log('9. 🧭 Click "Start Navigation" button');
    console.log('10. ⬅️➡️ Test Previous/Next navigation');
    console.log('11. 📋 Click "View Route" to see route overview panel');
    
    console.log('\n⏳ Browser will stay open for 3 minutes for manual testing...');
    console.log('⚠️  If something doesn\'t work, that\'s the bug we need to fix!');
    
    // Keep browser open for manual testing
    await page.waitForTimeout(180000); // 3 minutes
    
  } catch (error) {
    console.error('❌ Test setup failed:', error);
  } finally {
    console.log('\n🔚 Manual test session ending...');
    await browser.close();
  }
}

async function quickDiagnostic() {
  console.log('\n🔧 QUICK DIAGNOSTIC - Checking mobile interface elements...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    isMobile: true
  });
  const page = await context.newPage();
  
  try {
    await page.goto('http://127.0.0.1:5500/index.html');
    await page.waitForTimeout(3000);
    
    // Check what's actually on the page
    const mobileCheck = await page.evaluate(() => {
      return {
        mobileInterface: !!document.querySelector('.mobile-navigation-mode'),
        planRouteTab: !!document.querySelector('#mobilePlanRouteTab'),
        filesTab: !!document.querySelector('#mobileFileManagementTab'),
        loadAddressesBtn: !!document.querySelector('#autoLoadDataBtn'),
        mobileMap: !!document.querySelector('#mobileMap'),
        selectionTools: !!document.querySelector('.mobile-selection-tools'),
        routeOverviewBtn: !!document.querySelector('#mobileViewRouteBtn'),
        destinationCard: !!document.querySelector('#mobileDestinationCard'),
        navigationControls: !!document.querySelector('.mobile-navigation-controls')
      };
    });
    
    console.log('\n📊 ELEMENT AVAILABILITY:');
    Object.entries(mobileCheck).forEach(([key, value]) => {
      console.log(`   ${value ? '✅' : '❌'} ${key}`);
    });
    
    // Check if enhanced mobile interface was created
    const enhancedElements = await page.evaluate(() => {
      const container = document.querySelector('.mobile-navigation-mode');
      if (container) {
        return {
          hasRouteOverview: !!container.querySelector('#mobileRouteOverview'),
          hasEnhancedFiles: !!container.querySelector('#mobileRefreshFilesBtn'),
          hasDestinationCard: !!container.querySelector('#mobileDestinationCard'),
          hasViewRouteBtn: !!container.querySelector('#mobileViewRouteBtn'),
          hasPrevNextBtns: !!container.querySelector('#mobilePreviousBtn')
        };
      }
      return null;
    });
    
    console.log('\n🚀 ENHANCED FEATURES:');
    if (enhancedElements) {
      Object.entries(enhancedElements).forEach(([key, value]) => {
        console.log(`   ${value ? '✅' : '❌'} ${key}`);
      });
    } else {
      console.log('   ❌ No enhanced elements found');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  } finally {
    await browser.close();
  }
}

// Run both tests
console.log('🧪 Running diagnostic first...');
quickDiagnostic().then(() => {
  console.log('\n🔄 Starting manual workflow test...');
  testManualWorkflow().catch(console.error);
});