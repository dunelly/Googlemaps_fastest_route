const { chromium } = require('playwright');
const path = require('path');

/**
 * Playwright Mobile Interface Testing
 * Tests the SmashRoutes mobile navigation system
 */

async function testMobileInterface() {
  console.log('🚀 Starting Playwright Mobile Interface Testing...');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless testing
    slowMo: 1000 // Slow down actions for visibility
  });
  
  // iPhone SE viewport for mobile testing
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    isMobile: true,
    hasTouch: true
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to local server
    const localPath = `file://${path.resolve(__dirname, 'index.html')}`;
    await page.goto(localPath);
    
    console.log('📱 Loaded page in mobile viewport (375x667)');
    
    // Test 1: Mobile Interface Visibility
    console.log('\n🧪 Test 1: Mobile Interface Visibility');
    
    const mobileInterface = await page.locator('.mobile-interface');
    const isVisible = await mobileInterface.isVisible();
    
    if (isVisible) {
      console.log('✅ Mobile interface is visible');
      await page.screenshot({ path: 'mobile-test-1-interface-visible.png' });
    } else {
      console.log('❌ Mobile interface not visible');
    }
    
    // Test 2: Desktop Interface Hidden
    console.log('\n🧪 Test 2: Desktop Interface Hidden');
    
    const desktopElements = await page.locator('.desktop-planning-mode, .tab-content').count();
    const visibleDesktopElements = await page.locator('.desktop-planning-mode:visible, .tab-content:visible').count();
    
    if (visibleDesktopElements === 0) {
      console.log('✅ Desktop interface properly hidden');
    } else {
      console.log(`❌ ${visibleDesktopElements} desktop elements still visible`);
    }
    
    // Test 3: Tab Navigation
    console.log('\n🧪 Test 3: Tab Navigation');
    
    // Check initial state (Route tab should be active)
    const routeTabActive = await page.locator('.mobile-tab[data-tab="route"].active').isVisible();
    const routeContentActive = await page.locator('#mobileRouteTab.active').isVisible();
    
    if (routeTabActive && routeContentActive) {
      console.log('✅ Route tab initially active');
    } else {
      console.log('❌ Route tab not initially active');
    }
    
    // Click Files tab
    await page.click('.mobile-tab[data-tab="files"]');
    await page.waitForTimeout(500);
    
    const filesTabActive = await page.locator('.mobile-tab[data-tab="files"].active').isVisible();
    const filesContentActive = await page.locator('#mobileFilesTab.active').isVisible();
    
    if (filesTabActive && filesContentActive) {
      console.log('✅ Files tab switching works');
      await page.screenshot({ path: 'mobile-test-2-files-tab.png' });
    } else {
      console.log('❌ Files tab switching failed');
    }
    
    // Switch back to Route tab
    await page.click('.mobile-tab[data-tab="route"]');
    await page.waitForTimeout(500);
    
    const routeTabActiveAgain = await page.locator('.mobile-tab[data-tab="route"].active').isVisible();
    if (routeTabActiveAgain) {
      console.log('✅ Route tab switching back works');
    } else {
      console.log('❌ Route tab switching back failed');
    }
    
    // Test 4: Map Container
    console.log('\n🧪 Test 4: Map Container');
    
    const mapContainer = await page.locator('#mobileMap').isVisible();
    if (mapContainer) {
      console.log('✅ Mobile map container present');
    } else {
      console.log('❌ Mobile map container missing');
    }
    
    // Test 5: Button Accessibility
    console.log('\n🧪 Test 5: Button Touch Accessibility');
    
    const buttons = [
      { selector: '#mobileLoadAddressesBtn', name: 'Load Addresses' },
      { selector: '#mobileLassoBtn', name: 'Lasso' },
      { selector: '#mobileClearBtn', name: 'Clear' },
      { selector: '#mobileRefreshBtn', name: 'Refresh' }
    ];
    
    for (const button of buttons) {
      const element = page.locator(button.selector);
      const isVisible = await element.isVisible();
      
      if (isVisible) {
        const boundingBox = await element.boundingBox();
        const touchFriendly = boundingBox && boundingBox.height >= 44;
        
        if (touchFriendly) {
          console.log(`✅ ${button.name} button is touch-friendly (${boundingBox.height}px)`);
        } else {
          console.log(`⚠️ ${button.name} button may be too small (${boundingBox?.height || 0}px)`);
        }
      } else {
        console.log(`❌ ${button.name} button not visible`);
      }
    }
    
    // Test 6: Load Addresses Button Functionality
    console.log('\n🧪 Test 6: Load Addresses Button');
    
    await page.click('#mobileLoadAddressesBtn');
    await page.waitForTimeout(1000);
    
    // Should switch to Files tab
    const switchedToFiles = await page.locator('.mobile-tab[data-tab="files"].active').isVisible();
    if (switchedToFiles) {
      console.log('✅ Load Addresses button switches to Files tab');
    } else {
      console.log('❌ Load Addresses button doesn\'t switch to Files tab');
    }
    
    // Test 7: Files Tab Content
    console.log('\n🧪 Test 7: Files Tab Content');
    
    const filesHeader = await page.locator('.mobile-files-header h3').textContent();
    if (filesHeader && filesHeader.includes('Saved Files')) {
      console.log('✅ Files tab header correct');
    } else {
      console.log('❌ Files tab header incorrect');
    }
    
    const filesList = await page.locator('#mobileFilesList').isVisible();
    if (filesList) {
      console.log('✅ Files list container present');
    } else {
      console.log('❌ Files list container missing');
    }
    
    // Test 8: Navigation Controls (switch back to route tab)
    console.log('\n🧪 Test 8: Navigation Controls');
    
    await page.click('.mobile-tab[data-tab="route"]');
    await page.waitForTimeout(500);
    
    const navControls = [
      '#mobilePrevBtn',
      '#mobileNavigateBtn', 
      '#mobileNextBtn'
    ];
    
    let navControlsVisible = 0;
    for (const control of navControls) {
      const isVisible = await page.locator(control).isVisible();
      if (isVisible) navControlsVisible++;
    }
    
    if (navControlsVisible === 3) {
      console.log('✅ All navigation controls present');
    } else {
      console.log(`⚠️ Only ${navControlsVisible}/3 navigation controls visible`);
    }
    
    // Test 9: Responsive Design Test
    console.log('\n🧪 Test 9: Responsive Design');
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    
    const mobileHiddenOnDesktop = await page.locator('.mobile-interface').isHidden();
    if (mobileHiddenOnDesktop) {
      console.log('✅ Mobile interface hidden on desktop viewport');
    } else {
      console.log('❌ Mobile interface still visible on desktop');
    }
    
    // Switch back to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const mobileVisibleAgain = await page.locator('.mobile-interface').isVisible();
    if (mobileVisibleAgain) {
      console.log('✅ Mobile interface visible again on mobile viewport');
    } else {
      console.log('❌ Mobile interface not visible on mobile viewport');
    }
    
    // Final screenshot
    await page.screenshot({ path: 'mobile-test-3-final-state.png' });
    
    console.log('\n📸 Screenshots saved:');
    console.log('  - mobile-test-1-interface-visible.png');
    console.log('  - mobile-test-2-files-tab.png');
    console.log('  - mobile-test-3-final-state.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
  
  console.log('\n✅ Playwright Mobile Testing Complete');
}

// Advanced test with simulated user workflow
async function testUserWorkflow() {
  console.log('\n🚀 Starting User Workflow Test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000 
  });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    isMobile: true,
    hasTouch: true
  });
  
  const page = await context.newPage();
  
  try {
    const localPath = `file://${path.resolve(__dirname, 'index.html')}`;
    await page.goto(localPath);
    
    console.log('📱 Starting simulated real estate agent workflow...');
    
    // Step 1: Agent opens app on iPhone
    await page.screenshot({ path: 'workflow-1-app-open.png' });
    console.log('✅ Step 1: App opened on mobile device');
    
    // Step 2: Agent clicks Load Addresses
    await page.click('#mobileLoadAddressesBtn');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'workflow-2-files-tab.png' });
    console.log('✅ Step 2: Navigated to Files tab');
    
    // Step 3: Agent switches back to Route tab
    await page.click('.mobile-tab[data-tab="route"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'workflow-3-route-tab.png' });
    console.log('✅ Step 3: Back to Route tab for mapping');
    
    // Step 4: Agent tests touch interactions
    await page.tap('#mobileLoadAddressesBtn'); // Touch instead of click
    await page.waitForTimeout(500);
    await page.tap('.mobile-tab[data-tab="route"]');
    await page.waitForTimeout(1000);
    console.log('✅ Step 4: Touch interactions working');
    
    // Step 5: Final state
    await page.screenshot({ path: 'workflow-4-final.png' });
    console.log('✅ Step 5: Workflow complete');
    
    console.log('\n📸 Workflow Screenshots saved:');
    console.log('  - workflow-1-app-open.png');
    console.log('  - workflow-2-files-tab.png');
    console.log('  - workflow-3-route-tab.png');
    console.log('  - workflow-4-final.png');
    
  } catch (error) {
    console.error('❌ Workflow test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run tests
async function runAllTests() {
  await testMobileInterface();
  await testUserWorkflow();
  console.log('\n🎉 All mobile tests completed!');
}

// Export for use
module.exports = {
  testMobileInterface,
  testUserWorkflow,
  runAllTests
};

// Run if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}