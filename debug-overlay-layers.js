const { chromium } = require('playwright');
const path = require('path');

async function debugOverlayLayers() {
  console.log('🔍 Debugging Overlay Layer Issues...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
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
          fileName: 'Test File.xlsx',
          addressCount: 3,
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
            }
          ]
        }
      };
    });
    
    // Load addresses to trigger selection tools
    console.log('📁 Loading addresses...');
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
    
    // Debug z-index layers
    console.log('\n🔍 Analyzing Z-Index Layers...');
    const layerInfo = await page.evaluate(() => {
      const elements = [
        { name: 'Mobile Interface', selector: '.mobile-interface' },
        { name: 'Mobile Map', selector: '#mobileMap' },
        { name: 'Map Controls', selector: '.mobile-map-controls' },
        { name: 'Selection Tools', selector: '.mobile-selection-tools' },
        { name: 'Load Button', selector: '.mobile-load-btn' },
        { name: 'Lasso Button', selector: '#mobileLassoBtn' },
        { name: 'Clear Button', selector: '#mobileClearBtn' }
      ];
      
      return elements.map(el => {
        const element = document.querySelector(el.selector);
        if (element) {
          const style = window.getComputedStyle(element);
          return {
            name: el.name,
            zIndex: style.zIndex,
            position: style.position,
            display: style.display,
            visibility: style.visibility,
            exists: true
          };
        } else {
          return {
            name: el.name,
            exists: false
          };
        }
      });
    });
    
    layerInfo.forEach(info => {
      if (info.exists) {
        console.log(`${info.name}: z-index=${info.zIndex}, position=${info.position}, display=${info.display}`);
      } else {
        console.log(`${info.name}: NOT FOUND`);
      }
    });
    
    // Check selection tools visibility
    console.log('\n🎯 Checking Selection Tools...');
    const selectionToolsVisible = await page.locator('.mobile-selection-tools').isVisible();
    const lassoVisible = await page.locator('#mobileLassoBtn').isVisible();
    const clearVisible = await page.locator('#mobileClearBtn').isVisible();
    
    console.log('Selection tools container visible:', selectionToolsVisible);
    console.log('Lasso button visible:', lassoVisible);
    console.log('Clear button visible:', clearVisible);
    
    // Force show selection tools and fix z-index
    console.log('\n🔧 Fixing overlay layers...');
    await page.evaluate(() => {
      // Force show selection tools
      const selectionTools = document.querySelector('.mobile-selection-tools');
      if (selectionTools) {
        selectionTools.style.display = 'flex';
        selectionTools.style.zIndex = '1000';
        console.log('🔧 Forced selection tools visible');
      }
      
      // Adjust map controls z-index
      const mapControls = document.querySelector('.mobile-map-controls');
      if (mapControls) {
        mapControls.style.zIndex = '999';
        console.log('🔧 Adjusted map controls z-index');
      }
      
      // Ensure map doesn't cover controls
      const mobileMap = document.querySelector('#mobileMap');
      if (mobileMap) {
        mobileMap.style.zIndex = '1';
        console.log('🔧 Set map z-index to 1');
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Check again after fixes
    console.log('\n✅ Checking after fixes...');
    const selectionToolsVisibleAfter = await page.locator('.mobile-selection-tools').isVisible();
    const lassoVisibleAfter = await page.locator('#mobileLassoBtn').isVisible();
    const clearVisibleAfter = await page.locator('#mobileClearBtn').isVisible();
    
    console.log('Selection tools visible after fix:', selectionToolsVisibleAfter);
    console.log('Lasso button visible after fix:', lassoVisibleAfter);
    console.log('Clear button visible after fix:', clearVisibleAfter);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-overlay-fixed.png', fullPage: true });
    console.log('📸 Screenshot saved: debug-overlay-fixed.png');
    
    // Test lasso functionality if visible
    if (lassoVisibleAfter) {
      console.log('\n🎯 Testing lasso functionality...');
      await page.click('#mobileLassoBtn');
      await page.waitForTimeout(1000);
      
      const lassoActive = await page.locator('#mobileLassoBtn.active').isVisible();
      console.log('Lasso active after click:', lassoActive);
    }
    
    console.log('\n🔍 Browser will stay open for 20 seconds for inspection...');
    await page.waitForTimeout(20000);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  debugOverlayLayers().catch(console.error);
}