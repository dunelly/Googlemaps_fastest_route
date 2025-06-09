const { chromium } = require('playwright');

async function debugMobileView() {
  console.log('🔍 Debugging actual mobile view...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE size
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    permissions: ['geolocation'],
    geolocation: { latitude: 40.7128, longitude: -74.0060 }
  });
  
  const page = await context.newPage();
  
  try {
    await page.goto(`file://${__dirname}/index.html`);
    await page.waitForTimeout(3000);
    
    console.log('📸 Taking full page screenshot...');
    await page.screenshot({ path: 'debug-mobile-full.png', fullPage: true });
    
    // Check what's actually visible and overlapping
    const overlappingElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return (
          style.position === 'fixed' || 
          style.position === 'absolute' ||
          style.zIndex !== 'auto'
        ) && rect.width > 0 && rect.height > 0;
      });
      
      return elements.map(el => ({
        tag: el.tagName.toLowerCase(),
        id: el.id,
        classes: el.className,
        position: window.getComputedStyle(el).position,
        zIndex: window.getComputedStyle(el).zIndex,
        display: window.getComputedStyle(el).display,
        width: el.getBoundingClientRect().width,
        height: el.getBoundingClientRect().height,
        top: el.getBoundingClientRect().top,
        left: el.getBoundingClientRect().left,
        visible: el.offsetParent !== null
      }));
    });
    
    console.log('🔍 Elements with positioning/z-index:');
    overlappingElements.forEach((el, i) => {
      if (el.visible) {
        console.log(`${i+1}. ${el.tag}#${el.id} - z:${el.zIndex} pos:${el.position} ${el.width}x${el.height} at (${el.left},${el.top})`);
      }
    });
    
    // Check for specific problem areas
    const problemElements = await page.evaluate(() => {
      const elements = [
        '#subtle-login-bar',
        '#user-info', 
        '#excel-history-btn',
        '#logout-btn',
        '.modal-overlay',
        '.excel-history-overlay',
        '.mobile-navigation-mode'
      ];
      
      return elements.map(selector => {
        const el = document.querySelector(selector);
        if (el) {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return {
            selector,
            display: style.display,
            visibility: style.visibility,
            position: style.position,
            zIndex: style.zIndex,
            top: style.top,
            left: style.left,
            width: rect.width,
            height: rect.height,
            visible: el.offsetParent !== null
          };
        }
        return { selector, found: false };
      });
    });
    
    console.log('\n🎯 Specific problem elements:');
    problemElements.forEach(el => {
      if (el.found !== false) {
        console.log(`${el.selector}: ${el.display} ${el.visibility} z:${el.zIndex} ${el.width}x${el.height}`);
      }
    });
    
    // Try to interact with the page to see what happens
    console.log('\n🖱️ Testing interactions...');
    
    // Try clicking on different areas
    await page.click('body', { position: { x: 100, y: 100 } });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'debug-mobile-after-click.png', fullPage: true });
    
    console.log('✅ Debug complete. Check the screenshots!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await page.waitForTimeout(10000); // Keep open longer to inspect
    await browser.close();
  }
}

debugMobileView().catch(console.error);