const { chromium } = require('playwright');
const path = require('path');

async function debugMobileFiles() {
  console.log('🔍 Debugging Mobile Files Tab...');
  
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
    
    console.log('📱 Page loaded, waiting for initialization...');
    await page.waitForTimeout(3000);
    
    // Check authentication status
    const authStatus = await page.evaluate(() => {
      return {
        firebaseAuth: firebase?.auth()?.currentUser?.email || 'Not signed in',
        excelHistoryUser: window.excelHistoryCurrentUser?.email || 'Not set',
        savedFilesCount: window.savedExcelFiles ? Object.keys(window.savedExcelFiles).length : 0,
        loadExcelHistoryExists: typeof window.loadExcelHistory === 'function',
        loadExcelDataExists: typeof window.loadExcelData === 'function'
      };
    });
    
    console.log('🔐 Auth Status:', authStatus);
    
    // Switch to Files tab
    console.log('📁 Switching to Files tab...');
    await page.click('.mobile-tab[data-tab="files"]');
    await page.waitForTimeout(2000);
    
    // Take screenshot of Files tab
    await page.screenshot({ path: 'debug-files-tab.png' });
    
    // Check files tab content
    const filesContent = await page.locator('#mobileFilesList').textContent();
    console.log('📋 Files tab content:', filesContent);
    
    // If not authenticated, try to get sign in button
    if (!authStatus.firebaseAuth.includes('@')) {
      console.log('🔑 User not authenticated, looking for sign in...');
      
      // Check if sign in button exists
      const signInExists = await page.locator('#show-login-btn').isVisible();
      console.log('🔑 Sign in button visible:', signInExists);
      
      if (signInExists) {
        console.log('🔑 Note: User needs to sign in to see files');
      }
    }
    
    // Add mock files for testing if no real files exist
    if (authStatus.savedFilesCount === 0) {
      console.log('📊 Adding mock files for testing...');
      
      await page.evaluate(() => {
        // Mock authentication
        window.excelHistoryCurrentUser = {
          uid: 'test-user',
          email: 'test@example.com'
        };
        
        // Mock saved files
        window.savedExcelFiles = {
          'test-file-1': {
            fileId: 'test-file-1',
            fileName: 'Drew Main list - PRE-FORECLOSURE FEB-MARCH 2025 PT.2.xlsx',
            addressCount: 23,
            uploadDate: '2025-06-08T10:00:00Z'
          },
          'test-file-2': {
            fileId: 'test-file-2', 
            fileName: 'Houston Properties - March 2025.xlsx',
            addressCount: 15,
            uploadDate: '2025-06-07T15:30:00Z'
          }
        };
        
        console.log('📊 Mock data added');
      });
      
      // Trigger mobile files reload
      await page.evaluate(() => {
        if (window.mobileNav) {
          window.mobileNav.loadSavedFiles();
        }
      });
      
      await page.waitForTimeout(2000);
      
      // Check if files now appear
      const updatedFilesContent = await page.locator('#mobileFilesList').textContent();
      console.log('📋 Updated files content:', updatedFilesContent);
      
      await page.screenshot({ path: 'debug-files-with-mock.png' });
    }
    
    console.log('📸 Screenshots saved:');
    console.log('  - debug-files-tab.png');
    console.log('  - debug-files-with-mock.png');
    
    // Keep browser open for inspection
    console.log('🔍 Browser will stay open for 30 seconds...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  debugMobileFiles().catch(console.error);
}