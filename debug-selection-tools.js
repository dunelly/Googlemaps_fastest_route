const { chromium } = require('playwright');
const path = require('path');

async function debugSelectionTools() {
  console.log('🔍 Debugging Selection Tools Visibility...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
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
    
    // Add mock data and authentication
    await page.evaluate(() => {
      // Mock authentication
      window.excelHistoryCurrentUser = {
        uid: 'test-user',
        email: 'test@example.com'
      };
      
      // Mock saved files
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
            },
            {
              id: 3,
              address: '9012 Westheimer Rd, Houston, TX 77063',
              lat: 29.7400,
              lng: -95.4827,
              firstName: 'Bob',
              lastName: 'Wilson'
            }
          ]
        }
      };
    });
    
    // Step 1: Check initial state
    console.log('\n🔍 Step 1: Check initial state');
    let selectionToolsVisible = await page.locator('.mobile-selection-tools').isVisible();
    console.log('Selection tools visible initially:', selectionToolsVisible);
    
    // Step 2: Go to Files tab and load a file
    console.log('\n🔍 Step 2: Load addresses from file');
    await page.click('.mobile-tab[data-tab="files"]');
    await page.waitForTimeout(1000);
    
    await page.evaluate(() => {
      if (window.mobileNav) {
        window.mobileNav.loadSavedFiles();
      }
    });
    await page.waitForTimeout(1000);
    
    // Load addresses
    await page.click('.mobile-load-file-btn');
    await page.waitForTimeout(3000);
    
    // Step 3: Check if selection tools are now visible
    console.log('\n🔍 Step 3: Check selection tools after loading');
    selectionToolsVisible = await page.locator('.mobile-selection-tools').isVisible();
    console.log('Selection tools visible after loading:', selectionToolsVisible);
    
    // Check individual button visibility
    const lassoVisible = await page.locator('#mobileLassoBtn').isVisible();
    const clearVisible = await page.locator('#mobileClearBtn').isVisible();
    console.log('Lasso button visible:', lassoVisible);
    console.log('Clear button visible:', clearVisible);
    
    // Check the display style
    const selectionToolsStyle = await page.locator('.mobile-selection-tools').getAttribute('style');
    console.log('Selection tools style:', selectionToolsStyle);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-selection-tools.png', fullPage: true });
    
    if (selectionToolsVisible) {
      console.log('\n✅ Selection tools are visible! Testing lasso functionality...');
      
      // Test clicking the lasso button
      await page.click('#mobileLassoBtn');
      await page.waitForTimeout(1000);
      
      const lassoActive = await page.locator('#mobileLassoBtn.active').isVisible();
      console.log('Lasso tool active after click:', lassoActive);
      
    } else {
      console.log('\n❌ Selection tools not visible. Investigating...');
      
      // Debug the display style
      const computedStyle = await page.evaluate(() => {
        const tools = document.querySelector('.mobile-selection-tools');
        return tools ? window.getComputedStyle(tools).display : 'element not found';
      });
      console.log('Computed display style:', computedStyle);
      
      // Check if addresses were actually loaded
      const addressCount = await page.evaluate(() => window.addresses?.length || 0);
      console.log('Addresses loaded:', addressCount);
      
      // Manually trigger showSelectionTools
      await page.evaluate(() => {
        if (window.mobileNav) {
          console.log('🔧 Manually triggering showSelectionTools...');
          window.mobileNav.showSelectionTools();
        }
      });
      
      await page.waitForTimeout(1000);
      const manuallyVisible = await page.locator('.mobile-selection-tools').isVisible();
      console.log('Selection tools visible after manual trigger:', manuallyVisible);
    }
    
    console.log('\n📸 Screenshot saved: debug-selection-tools.png');
    console.log('🔍 Browser will stay open for 20 seconds for inspection...');
    await page.waitForTimeout(20000);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  debugSelectionTools().catch(console.error);
}