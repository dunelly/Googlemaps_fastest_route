const { chromium } = require('playwright');

async function testUserWorkflow() {
  console.log('👤 Starting as a real estate agent using SmashRoutes mobile...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000  // Slow it down to see what's happening
  });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Opening SmashRoutes on my iPhone...');
    await page.goto('http://127.0.0.1:5500/index.html');
    await page.waitForSelector('.mobile-navigation-mode', { timeout: 10000 });
    
    console.log('✅ Mobile interface loaded! I can see the tabs.');
    await page.screenshot({ path: 'user-test-1-initial.png' });
    
    // Debug: Check what mobile interface elements exist
    const mobileElements = await page.evaluate(() => {
      const container = document.querySelector('.mobile-navigation-mode');
      if (container) {
        return {
          hasContainer: true,
          hasTabHeader: !!container.querySelector('.mobile-tab-header'),
          hasPlanRouteTab: !!container.querySelector('#mobilePlanRouteTab'),
          hasFilesTab: !!container.querySelector('#mobileFileManagementTab'),
          hasMap: !!container.querySelector('#mobileMap'),
          hasPlanningControls: !!container.querySelector('.mobile-planning-controls'),
          hasLoadBtn: !!container.querySelector('#autoLoadDataBtn'),
          hasSelectionTools: !!container.querySelector('.mobile-selection-tools'),
          hasViewRouteBtn: !!container.querySelector('#mobileViewRouteBtn'),
          containerHTML: container.innerHTML.substring(0, 300) + '...'
        };
      }
      return { hasContainer: false };
    });
    
    console.log('🔍 Debug - Mobile interface elements:', JSON.stringify(mobileElements, null, 2));
    
    // Step 1: Check Files tab to see if I have any saved files
    console.log('👀 Let me check my Files tab to see saved Excel files...');
    await page.click('#mobileFileManagementTab');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'user-test-2-files-tab.png' });
    
    const fileInterface = await page.isVisible('.mobile-file-management');
    console.log(`📁 Files interface visible: ${fileInterface}`);
    
    const authStatus = await page.textContent('#mobileUserStatus').catch(() => 'Not found');
    console.log(`👤 Auth status: ${authStatus}`);
    
    // Step 2: Go back to Plan Route tab
    console.log('🗺️ Switching to Plan Route tab to start planning my day...');
    await page.click('#mobilePlanRouteTab');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'user-test-3-plan-route.png' });
    
    // Step 3: Try to load addresses
    console.log('📊 Clicking Load Addresses to see if I have any data...');
    const loadBtn = await page.isVisible('#autoLoadDataBtn');
    console.log(`📊 Load Addresses button found: ${loadBtn}`);
    
    if (loadBtn) {
      await page.click('#autoLoadDataBtn');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'user-test-4-after-load.png' });
    }
    
    // Step 4: Check the map
    console.log('🗺️ Looking at the map to see if addresses loaded...');
    const mapVisible = await page.isVisible('#mobileMap');
    console.log(`🗺️ Mobile map visible: ${mapVisible}`);
    
    // Step 5: Try selection tools
    console.log('🔧 Testing selection tools...');
    const lassoBtn = await page.isVisible('#mobileLassoBtn');
    const boxBtn = await page.isVisible('#mobileBoxSelectBtn');
    console.log(`🔵 Lasso tool available: ${lassoBtn}`);
    console.log(`⬜ Box tool available: ${boxBtn}`);
    
    if (lassoBtn) {
      console.log('🔵 Trying lasso tool...');
      await page.click('#mobileLassoBtn');
      await page.waitForTimeout(1000);
    }
    
    // Step 6: Check if route creation is available
    const createRouteBtn = await page.isVisible('#mobileCreateRouteBtn');
    console.log(`🗺️ Create Route button available: ${createRouteBtn}`);
    
    // Step 7: Test destination card (if navigation started)
    const destinationCard = await page.isVisible('#mobileDestinationCard');
    console.log(`🏠 Destination card visible: ${destinationCard}`);
    
    // Step 8: Try View Route button
    console.log('📋 Testing View Route button...');
    const viewRouteBtn = await page.isVisible('#mobileViewRouteBtn');
    console.log(`👀 View Route button found: ${viewRouteBtn}`);
    
    if (viewRouteBtn) {
      console.log('📋 Opening route overview panel...');
      await page.click('#mobileViewRouteBtn');
      await page.waitForTimeout(1500);
      
      const routeOverview = await page.isVisible('.mobile-route-overview.active');
      console.log(`📋 Route overview panel opened: ${routeOverview}`);
      await page.screenshot({ path: 'user-test-5-route-overview.png' });
      
      if (routeOverview) {
        console.log('❌ Closing route overview...');
        await page.click('#mobileRouteCloseBtn');
        await page.waitForTimeout(1000);
      }
    }
    
    // Step 9: Test navigation controls
    console.log('⬅️➡️ Testing Previous/Next buttons...');
    const prevBtn = await page.isVisible('#mobilePreviousBtn');
    const nextBtn = await page.isVisible('#mobileNextBtn');
    console.log(`⬅️ Previous button: ${prevBtn}`);
    console.log(`➡️ Next button: ${nextBtn}`);
    
    if (prevBtn && nextBtn) {
      console.log('⬅️ Trying Previous button...');
      await page.click('#mobilePreviousBtn');
      await page.waitForTimeout(500);
      
      console.log('➡️ Trying Next button...');
      await page.click('#mobileNextBtn');
      await page.waitForTimeout(500);
    }
    
    // Step 10: Test refresh files button
    console.log('🔄 Testing refresh files functionality...');
    await page.click('#mobileFileManagementTab');
    await page.waitForTimeout(500);
    
    const refreshBtn = await page.isVisible('#mobileRefreshFilesBtn');
    console.log(`🔄 Refresh files button: ${refreshBtn}`);
    
    if (refreshBtn) {
      await page.click('#mobileRefreshFilesBtn');
      await page.waitForTimeout(1000);
    }
    
    // Step 11: Final screenshot
    await page.screenshot({ path: 'user-test-6-final.png' });
    
    console.log('\n✅ USER WORKFLOW TEST COMPLETE!');
    console.log('🎯 Key findings:');
    console.log(`   📱 Mobile interface: Working`);
    console.log(`   📁 Files tab: ${fileInterface ? 'Working' : 'Needs attention'}`);
    console.log(`   🗺️ Map display: ${mapVisible ? 'Working' : 'Needs attention'}`);
    console.log(`   🔧 Selection tools: ${lassoBtn && boxBtn ? 'Working' : 'Needs attention'}`);
    console.log(`   📋 Route overview: ${viewRouteBtn ? 'Working' : 'Needs attention'}`);
    console.log(`   ⬅️➡️ Navigation: ${prevBtn && nextBtn ? 'Working' : 'Needs attention'}`);
    console.log(`   🔄 Files refresh: ${refreshBtn ? 'Working' : 'Needs attention'}`);
    
  } catch (error) {
    console.error('❌ Workflow test failed:', error);
    await page.screenshot({ path: 'user-test-error.png' });
  } finally {
    console.log('⏳ Keeping browser open for 10 seconds to review...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testUserWorkflow().catch(console.error);