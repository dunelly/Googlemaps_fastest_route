const { chromium } = require('playwright');

async function testRouteBug() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Navigate to the app
  await page.goto('http://localhost:8080');
  
  // Wait for the app to load
  await page.waitForTimeout(3000);
  
  console.log('Setting up test addresses...');
  
  // Fill in starting address
  await page.fill('#manualStartAddress', '7519 Alcomita Dr, Houston, TX 77083, USA');
  await page.waitForTimeout(1000);
  
  // Add first destination
  const destinationFields = await page.locator('.destination-field');
  await destinationFields.first().fill('3333 Weslayan St, Houston, TX 77027');
  await page.waitForTimeout(1000);
  
  console.log('Creating first route...');
  
  // Listen for console logs to capture debugging info
  page.on('console', msg => {
    if (msg.text().includes('[DEBUG]') || msg.text().includes('📍') || msg.text().includes('🗺️')) {
      console.log('BROWSER:', msg.text());
    }
  });
  
  // Create first route
  await page.click('#createRouteBtn');
  await page.waitForTimeout(5000); // Wait for route creation
  
  console.log('First route created. Now creating second route...');
  
  // Create second route (this should trigger the bug)
  await page.click('#createRouteBtn');
  await page.waitForTimeout(5000);
  
  console.log('Second route created. Check for giant route issue...');
  
  // Keep browser open to inspect
  await page.waitForTimeout(10000);
  
  await browser.close();
}

testRouteBug().catch(console.error);