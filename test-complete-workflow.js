const { chromium } = require('playwright');

async function testCompleteWorkflow() {
  console.log('👤 Real Estate Agent: Starting my day with SmashRoutes...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Opening SmashRoutes on live server...');
    await page.goto('http://127.0.0.1:5500/index.html');
    await page.waitForTimeout(3000); // Give it time to load
    
    console.log('✅ App loaded! Taking screenshot...');
    await page.screenshot({ path: 'workflow-1-loaded.png' });
    
    // Check if we can see the interface
    const mobileInterface = await page.isVisible('.mobile-navigation-mode');
    console.log(`📱 Mobile interface detected: ${mobileInterface}`);
    
    if (!mobileInterface) {
      console.log('❌ Mobile interface not detected, checking desktop...');
      const desktopInterface = await page.isVisible('.desktop-planning-mode');
      console.log(`💻 Desktop interface visible: ${desktopInterface}`);
      
      if (desktopInterface) {
        console.log('🔄 Switching to mobile viewport to trigger mobile mode...');
        await page.setViewportSize({ width: 360, height: 640 });
        await page.waitForTimeout(2000);
        await page.reload();
        await page.waitForTimeout(3000);
      }
    }
    
    console.log('📁 Step 1: Checking Files tab for "Druze List" Excel file...');
    
    // Try to click Files tab (check multiple possible selectors)
    let filesTabClicked = false;
    const filesSelectors = ['#mobileFileManagementTab', '#fileManagementTab', '[data-tab="files"]'];
    
    for (const selector of filesSelectors) {
      if (await page.isVisible(selector)) {
        console.log(`📁 Found files tab with selector: ${selector}`);
        await page.click(selector);
        await page.waitForTimeout(1500);
        filesTabClicked = true;
        break;
      }
    }
    
    if (!filesTabClicked) {
      console.log('❌ Could not find Files tab, checking available elements...');
      const availableElements = await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('button, .tab, [role="tab"]'));
        return tabs.map(el => ({
          text: el.textContent?.trim(),
          id: el.id,
          className: el.className,
          visible: el.offsetParent !== null
        })).filter(el => el.visible);
      });
      console.log('📋 Available clickable elements:', availableElements);
    }
    
    await page.screenshot({ path: 'workflow-2-files-tab.png' });
    
    // Check if we can see saved files
    console.log('🔍 Looking for Excel files, specifically "Druze List"...');
    
    // Check for Excel file listings
    const excelFiles = await page.evaluate(() => {
      // Look for any file-related elements
      const fileElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent?.toLowerCase().includes('druze') ||
        el.textContent?.toLowerCase().includes('excel') ||
        el.textContent?.toLowerCase().includes('file') ||
        el.textContent?.toLowerCase().includes('upload')
      );
      
      return fileElements.map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim().substring(0, 100),
        id: el.id,
        className: el.className,
        clickable: el.tagName === 'BUTTON' || el.onclick || el.style.cursor === 'pointer'
      }));
    });
    
    console.log('📊 Found file-related elements:', excelFiles);
    
    // Look for "Load Addresses" or similar functionality
    console.log('📊 Step 2: Looking for Load Addresses functionality...');
    
    const loadSelectors = [
      '#autoLoadDataBtn',
      '#loadAddressesBtn', 
      '[onclick*="load"]',
      'button[title*="load" i]',
      'button:has-text("Load")',
      'button:has-text("Addresses")'
    ];
    
    let loadButtonFound = false;
    for (const selector of loadSelectors) {
      try {
        if (await page.isVisible(selector)) {
          console.log(`📊 Found load button: ${selector}`);
          await page.click(selector);
          await page.waitForTimeout(2000);
          loadButtonFound = true;
          break;
        }
      } catch (e) {
        // Selector might not be valid, continue
      }
    }
    
    if (!loadButtonFound) {
      console.log('🔍 Searching for any load/address related buttons...');
      const allButtons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map(btn => ({
          text: btn.textContent?.trim(),
          id: btn.id,
          visible: btn.offsetParent !== null,
          onclick: btn.onclick?.toString()
        })).filter(btn => btn.visible);
      });
      console.log('🔘 All visible buttons:', allButtons);
    }
    
    await page.screenshot({ path: 'workflow-3-after-load-attempt.png' });
    
    // Check map for markers/addresses
    console.log('🗺️ Step 3: Checking if addresses loaded on map...');
    
    const mapInfo = await page.evaluate(() => {
      const mapContainer = document.querySelector('#map, #mobileMap, .leaflet-container');
      if (mapContainer) {
        const markers = mapContainer.querySelectorAll('.leaflet-marker-icon, .marker');
        return {
          hasMap: true,
          markerCount: markers.length,
          mapHTML: mapContainer.innerHTML.substring(0, 200) + '...'
        };
      }
      return { hasMap: false };
    });
    
    console.log('🗺️ Map info:', mapInfo);
    
    // Try to find selection tools
    console.log('🔧 Step 4: Looking for selection tools (lasso/box)...');
    
    const selectionTools = await page.evaluate(() => {
      const tools = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent?.toLowerCase().includes('lasso') ||
        el.textContent?.toLowerCase().includes('box') ||
        el.textContent?.toLowerCase().includes('select') ||
        el.className?.toLowerCase().includes('draw') ||
        el.className?.toLowerCase().includes('selection')
      );
      
      return tools.map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim(),
        className: el.className,
        visible: el.offsetParent !== null
      })).filter(t => t.visible);
    });
    
    console.log('🔧 Selection tools found:', selectionTools);
    
    // Look for route creation
    console.log('🗺️ Step 5: Looking for route creation functionality...');
    
    const routeElements = await page.evaluate(() => {
      const routeStuff = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent?.toLowerCase().includes('route') ||
        el.textContent?.toLowerCase().includes('navigate') ||
        el.textContent?.toLowerCase().includes('optimize')
      );
      
      return routeStuff.map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim().substring(0, 50),
        id: el.id,
        clickable: el.tagName === 'BUTTON' || el.onclick,
        visible: el.offsetParent !== null
      })).filter(r => r.visible);
    });
    
    console.log('🗺️ Route-related elements:', routeElements);
    
    // Final assessment
    console.log('\n🎯 WORKFLOW ASSESSMENT:');
    console.log('================================');
    console.log(`📱 Mobile interface: ${mobileInterface ? '✅ Detected' : '❌ Not found'}`);
    console.log(`📁 Files tab access: ${filesTabClicked ? '✅ Accessible' : '❌ Not working'}`);
    console.log(`📊 Load functionality: ${loadButtonFound ? '✅ Found' : '❌ Not working'}`);
    console.log(`🗺️ Map with addresses: ${mapInfo.hasMap ? `✅ Map found (${mapInfo.markerCount} markers)` : '❌ No map'}`);
    console.log(`🔧 Selection tools: ${selectionTools.length > 0 ? `✅ Found ${selectionTools.length} tools` : '❌ Not available'}`);
    console.log(`🗺️ Route creation: ${routeElements.length > 0 ? `✅ Found ${routeElements.length} route elements` : '❌ Not available'}`);
    
    if (mapInfo.markerCount === 0) {
      console.log('\n❌ CRITICAL ISSUE: No addresses loaded on map');
      console.log('   This suggests the Excel file loading is not working');
    }
    
    if (selectionTools.length === 0) {
      console.log('\n❌ CRITICAL ISSUE: No selection tools available');
      console.log('   Users cannot select addresses for route creation');
    }
    
    await page.screenshot({ path: 'workflow-4-final-assessment.png' });
    
  } catch (error) {
    console.error('❌ Workflow test failed:', error);
    await page.screenshot({ path: 'workflow-error.png' });
  } finally {
    console.log('\n⏳ Keeping browser open for manual inspection...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
}

testCompleteWorkflow().catch(console.error);