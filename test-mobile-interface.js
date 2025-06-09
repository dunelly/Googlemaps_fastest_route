/**
 * Mobile Interface Testing Script
 * Tests the mobile navigation functionality
 */

// Test mobile detection
function testMobileDetection() {
  console.log('🧪 Testing Mobile Detection...');
  
  // Simulate mobile viewport
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375
  });
  
  // Check if mobile interface initializes
  const mobileInterface = document.querySelector('.mobile-interface');
  if (mobileInterface) {
    console.log('✅ Mobile interface element found');
    
    // Check if mobile CSS is loaded
    const computedStyle = window.getComputedStyle(mobileInterface);
    if (computedStyle.display === 'flex') {
      console.log('✅ Mobile interface is visible');
    } else {
      console.log('❌ Mobile interface not visible');
    }
  } else {
    console.log('❌ Mobile interface element not found');
  }
  
  // Check if desktop interface is hidden
  const desktopElements = document.querySelectorAll('.desktop-planning-mode, .tab-content');
  let desktopHidden = true;
  desktopElements.forEach(el => {
    if (el && window.getComputedStyle(el).display !== 'none') {
      desktopHidden = false;
    }
  });
  
  if (desktopHidden) {
    console.log('✅ Desktop interface properly hidden');
  } else {
    console.log('❌ Desktop interface still visible');
  }
}

// Test tab switching
function testTabSwitching() {
  console.log('🧪 Testing Tab Switching...');
  
  const routeTab = document.querySelector('[data-tab="route"]');
  const filesTab = document.querySelector('[data-tab="files"]');
  const routeContent = document.getElementById('mobileRouteTab');
  const filesContent = document.getElementById('mobileFilesTab');
  
  if (routeTab && filesTab && routeContent && filesContent) {
    console.log('✅ Tab elements found');
    
    // Test files tab click
    filesTab.click();
    
    setTimeout(() => {
      if (filesTab.classList.contains('active') && filesContent.classList.contains('active')) {
        console.log('✅ Files tab switch working');
      } else {
        console.log('❌ Files tab switch failed');
      }
      
      // Test route tab click
      routeTab.click();
      
      setTimeout(() => {
        if (routeTab.classList.contains('active') && routeContent.classList.contains('active')) {
          console.log('✅ Route tab switch working');
        } else {
          console.log('❌ Route tab switch failed');
        }
      }, 100);
    }, 100);
  } else {
    console.log('❌ Tab elements missing');
  }
}

// Test map initialization
function testMapInitialization() {
  console.log('🧪 Testing Map Initialization...');
  
  const mapContainer = document.getElementById('mobileMap');
  if (mapContainer) {
    console.log('✅ Map container found');
    
    // Check if MobileNavigation class is available
    if (window.mobileNav) {
      console.log('✅ MobileNavigation instance found');
      
      // Check if map is initialized
      if (window.mobileNav.mobileMap) {
        console.log('✅ Mobile map initialized');
      } else {
        console.log('⚠️ Mobile map not yet initialized (may be loading)');
      }
    } else {
      console.log('❌ MobileNavigation instance not found');
    }
  } else {
    console.log('❌ Map container not found');
  }
}

// Test button functionality
function testButtonFunctionality() {
  console.log('🧪 Testing Button Functionality...');
  
  const buttons = [
    { id: 'mobileLoadAddressesBtn', name: 'Load Addresses' },
    { id: 'mobileLassoBtn', name: 'Lasso Selection' },
    { id: 'mobileClearBtn', name: 'Clear Selection' },
    { id: 'mobileCreateRouteBtn', name: 'Create Route' },
    { id: 'mobileRefreshBtn', name: 'Refresh Files' }
  ];
  
  buttons.forEach(button => {
    const element = document.getElementById(button.id);
    if (element) {
      console.log(`✅ ${button.name} button found`);
      
      // Check if button is properly styled for mobile
      const style = window.getComputedStyle(element);
      const minHeight = parseInt(style.minHeight);
      
      if (minHeight >= 44) {
        console.log(`✅ ${button.name} button is touch-friendly (${minHeight}px)`);
      } else {
        console.log(`⚠️ ${button.name} button may be too small for touch (${minHeight}px)`);
      }
    } else {
      console.log(`❌ ${button.name} button not found`);
    }
  });
}

// Test responsive design
function testResponsiveDesign() {
  console.log('🧪 Testing Responsive Design...');
  
  // Test different viewport sizes
  const viewports = [
    { width: 375, height: 667, name: 'iPhone SE' },
    { width: 414, height: 896, name: 'iPhone 11' },
    { width: 768, height: 1024, name: 'iPad Portrait' },
    { width: 1024, height: 768, name: 'Desktop' }
  ];
  
  viewports.forEach(viewport => {
    // Simulate viewport change
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: viewport.width
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: viewport.height
    });
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
    
    const mobileInterface = document.querySelector('.mobile-interface');
    const shouldBeMobile = viewport.width <= 768;
    const isMobileVisible = mobileInterface && window.getComputedStyle(mobileInterface).display === 'flex';
    
    if (shouldBeMobile === isMobileVisible) {
      console.log(`✅ ${viewport.name} (${viewport.width}x${viewport.height}): Correct interface shown`);
    } else {
      console.log(`❌ ${viewport.name} (${viewport.width}x${viewport.height}): Wrong interface shown`);
    }
  });
}

// Run comprehensive test
function runComprehensiveTest() {
  console.log('🚀 Starting Mobile Interface Comprehensive Test...');
  console.log('================================================');
  
  // Wait for DOM and scripts to load
  setTimeout(() => {
    testMobileDetection();
    testTabSwitching();
    testMapInitialization();
    testButtonFunctionality();
    testResponsiveDesign();
    
    console.log('================================================');
    console.log('✅ Mobile Interface Testing Complete');
  }, 1000);
}

// Auto-run test when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runComprehensiveTest);
} else {
  runComprehensiveTest();
}

// Export for manual testing
window.mobileInterfaceTest = {
  runComprehensiveTest,
  testMobileDetection,
  testTabSwitching,
  testMapInitialization,
  testButtonFunctionality,
  testResponsiveDesign
};