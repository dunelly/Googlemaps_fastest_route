// Icon Style Switcher Utility
// This utility allows easy switching between different icon design options

class IconStyleSwitcher {
  constructor() {
    this.currentBoxStyle = 'default';
    this.currentLassoStyle = 'default';
    this.currentClearStyle = 'option1';
    this.initializeControls();
  }

  initializeControls() {
    // Create a floating control panel for testing different icon styles
    this.createStyleSwitcherPanel();
  }

  createStyleSwitcherPanel() {
    const panel = document.createElement('div');
    panel.id = 'icon-style-switcher';
    panel.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: 'Inter', sans-serif;
      min-width: 200px;
      display: none;
    `;

    panel.innerHTML = `
      <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Simple Icon Tools</h4>
      
      <div style="margin-bottom: 12px;">
        <p style="margin: 0; font-size: 12px; color: #666;">Box Selection: Simple rectangle icon</p>
        <p style="margin: 4px 0; font-size: 12px; color: #666;">Clear Button: Trash can with X overlay</p>
      </div>
      
      <div style="margin-bottom: 12px; padding: 8px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 4px;">
        <p style="margin: 0; font-size: 11px; color: #0369a1;">✓ Simplified to essential tools only</p>
        <p style="margin: 2px 0 0 0; font-size: 11px; color: #0369a1;">✓ Clean, universal icons</p>
      </div>
      
      <button id="toggle-style-panel" style="width: 100%; padding: 6px; font-size: 12px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer;">Hide Panel</button>
    `;

    document.body.appendChild(panel);

    // Add event listeners

    document.getElementById('toggle-style-panel').addEventListener('click', () => {
      panel.style.display = 'none';
      this.showToggleButton();
    });

    this.panel = panel;
  }

  showToggleButton() {
    if (document.getElementById('show-style-panel')) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'show-style-panel';
    toggleBtn.innerHTML = '🎨';
    toggleBtn.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      width: 40px;
      height: 40px;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 50%;
      cursor: pointer;
      z-index: 10000;
      font-size: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;

    toggleBtn.addEventListener('click', () => {
      this.panel.style.display = 'block';
      toggleBtn.remove();
    });

    document.body.appendChild(toggleBtn);
  }

  // Simple info display - no switching functionality needed

  // Public method to enable the style switcher (call this to show the panel)
  enable() {
    this.panel.style.display = 'block';
    const showBtn = document.getElementById('show-style-panel');
    if (showBtn) showBtn.remove();
  }

  // Public method to disable the style switcher
  disable() {
    this.panel.style.display = 'none';
    this.showToggleButton();
  }
}

// Initialize the icon style switcher
let iconStyleSwitcher;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      iconStyleSwitcher = new IconStyleSwitcher();
    }, 1000); // Wait a bit for Leaflet to initialize
  });
} else {
  setTimeout(() => {
    iconStyleSwitcher = new IconStyleSwitcher();
  }, 1000);
}

// Make it globally available for testing
window.iconStyleSwitcher = iconStyleSwitcher;

// Developer console shortcuts
window.showIconInfo = () => {
  if (window.iconStyleSwitcher) {
    window.iconStyleSwitcher.enable();
    console.log('Icon info panel displayed. Simple box selection and clear tools are active.');
  }
};

window.hideIconInfo = () => {
  if (window.iconStyleSwitcher) {
    window.iconStyleSwitcher.disable();
  }
};

console.log('🎨 Simple Icon Tools loaded! Type showIconInfo() in console to see icon details.');