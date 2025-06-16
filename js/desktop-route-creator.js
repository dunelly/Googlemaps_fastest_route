// Refactored DesktopRouteCreator - Clean coordinator for route planning modules
class DesktopRouteCreator {
  constructor() {
    console.log('🚀 DesktopRouteCreator: Initializing with modular architecture');
    
    // Initialize modules
    this.routeManager = new RouteManager();
    this.markerManager = new MarkerManager();
    this.addressCollector = new AddressCollector();
    this.navigationController = new NavigationController(this.routeManager, this.markerManager);
    
    // Make marker manager globally available for popup buttons
    window.markerManager = this.markerManager;
    
    // State management
    this.isProcessing = false;
    this.lastProcessedSignature = null;
    this.optimizedRoute = null;
    
    // Initialize the system
    this.init();
  }

  // Initialize event listeners and UI
  init() {
    console.log('📍 DesktopRouteCreator: Setting up event listeners');
    
    this.setupEventListeners();
    this.setupStartingAddressListener();
    this.setupDestinationFieldListeners();
    
    // Force update button state
    console.log('🔄 DesktopRouteCreator: Updating button state on init');
    this._updateButtonState();
    
    // Also update every 500ms for the first few seconds in case DOM is still loading
    const updateInterval = setInterval(() => {
      this._updateButtonState();
    }, 500);
    
    setTimeout(() => {
      clearInterval(updateInterval);
      console.log('🔄 DesktopRouteCreator: Stopped periodic button updates');
    }, 3000);
    
    console.log('✅ DesktopRouteCreator: Initialization complete');
  }

  // Setup main event listeners
  setupEventListeners() {
    // Create Route button
    const createRouteBtn = document.getElementById('createRouteBtn');
    console.log('🔍 DesktopRouteCreator: Button found?', !!createRouteBtn);
    console.log('🔍 DesktopRouteCreator: Button element:', createRouteBtn);
    
    if (createRouteBtn) {
      console.log('✅ DesktopRouteCreator: Attaching click listener...');
      
      // Prevent double-clicks with debouncing
      let lastClickTime = 0;
      const debounceMs = 1000;
      
      createRouteBtn.addEventListener('click', (event) => {
        console.log('🚀 DesktopRouteCreator: Processing click...');
        
        const now = Date.now();
        if (now - lastClickTime < debounceMs) {
          console.log('📍 DesktopRouteCreator: Click ignored (debouncing)');
          return;
        }
        
        lastClickTime = now;
        event.preventDefault();
        event.stopPropagation();
        this.handleCreateRoute();
      });
      
      console.log('✅ DesktopRouteCreator: Event listeners attached!');
    } else {
      console.error('❌ DesktopRouteCreator: Create route button not found!');
    }

    // Clear Route button
    const clearRouteBtn = document.getElementById('clearRouteBtn');
    if (clearRouteBtn) {
      clearRouteBtn.addEventListener('click', (event) => {
        console.log('🗑️ DesktopRouteCreator: Clear route button clicked');
        event.preventDefault();
        event.stopPropagation();
        this.clearRouteCompletely(); // Only clear routes, preserve all address pins
      });
      console.log('✅ DesktopRouteCreator: Clear route button listener attached');
    }
  }

  // Setup starting address field listener
  setupStartingAddressListener() {
    const startingAddressField = document.getElementById('manualStartAddress');
    if (startingAddressField) {
      console.log('✅ DesktopRouteCreator: Setting up starting address listener');
      startingAddressField.addEventListener('input', () => {
        console.log('🔍 DesktopRouteCreator: Starting address changed:', startingAddressField.value);
        this._updateButtonState();
      });
    } else {
      console.error('❌ DesktopRouteCreator: Starting address field not found');
    }
  }

  // Setup destination field listeners
  setupDestinationFieldListeners() {
    const destinationFields = document.querySelectorAll('.destination-field');
    console.log('✅ DesktopRouteCreator: Setting up destination field listeners, found', destinationFields.length, 'fields');
    
    destinationFields.forEach((field, index) => {
      if (!field.hasAttribute('data-route-listener')) {
        field.addEventListener('input', () => {
          console.log('🔍 DesktopRouteCreator: Destination field', index, 'changed:', field.value);
          this._updateButtonState();
        });
        field.setAttribute('data-route-listener', 'true');
      }
    });
  }

  // Update button state based on available addresses
  _updateButtonState() {
    const createRouteBtn = document.getElementById('createRouteBtn');
    if (!createRouteBtn) {
      console.log('🔍 DesktopRouteCreator: Create route button not found in DOM');
      return;
    }

    // Prevent updates during processing
    if (this.isProcessing) {
      createRouteBtn.disabled = true;
      createRouteBtn.textContent = '⏳ Processing...';
      return;
    }

    try {
      // Simple check: enable if user has typed anything in start address or destination fields
      const startingAddressField = document.getElementById('manualStartAddress');
      const destinationFields = document.querySelectorAll('.destination-field');
      
      const hasStartingAddress = startingAddressField && startingAddressField.value.trim().length > 0;
      const hasDestinations = Array.from(destinationFields).some(field => field.value.trim().length > 0);
      
      console.log('🔍 DesktopRouteCreator: Simple validation:', {
        hasStartingAddress,
        hasDestinations,
        startingValue: startingAddressField ? startingAddressField.value : 'none',
        destinationCount: destinationFields.length
      });

      // Enable button if user has entered at least a starting address
      if (hasStartingAddress) {
        createRouteBtn.disabled = false;
        createRouteBtn.textContent = '🗺️ Create Route';
        console.log('✅ DesktopRouteCreator: Button enabled - has starting address');
      } else {
        createRouteBtn.disabled = true;
        createRouteBtn.textContent = 'Create Route';
        console.log('⚠️ DesktopRouteCreator: Button disabled - no starting address');
      }

    } catch (error) {
      console.error('❌ DesktopRouteCreator: Error updating button state:', error);
      createRouteBtn.disabled = true;
      createRouteBtn.textContent = 'Error - Check Console';
    }
  }

  // Collect addresses directly from form fields (bypassing AddressCollector)
  collectFormAddresses() {
    const addresses = [];
    
    // Get starting address
    const startingAddressField = document.getElementById('manualStartAddress');
    if (startingAddressField && startingAddressField.value.trim()) {
      addresses.push({
        address: startingAddressField.value.trim(),
        isStartingAddress: true,
        source: 'manual_start',
        lat: null,
        lng: null
      });
    }

    // Get destination addresses
    const destinationFields = document.querySelectorAll('.destination-field');
    destinationFields.forEach((field, index) => {
      const address = field.value.trim();
      if (address) {
        addresses.push({
          address: address,
          isStartingAddress: false,
          source: 'manual_destination',
          fieldIndex: index,
          lat: null,
          lng: null
        });
      }
    });

    console.log('📍 DesktopRouteCreator: Collected', addresses.length, 'addresses from form');
    return addresses;
  }

  // Handle route creation
  async handleCreateRoute() {
    if (this.isProcessing) {
      console.warn('📍 DesktopRouteCreator: Already processing a route');
      return;
    }

    console.log('🚀 DesktopRouteCreator: Starting route creation');
    
    this.isProcessing = true;
    this._updateButtonState();

    try {
      // Collect addresses directly from form fields
      const addresses = this.collectFormAddresses();

      if (addresses.length === 0) {
        throw new Error('No addresses found');
      }

      console.log('📍 DesktopRouteCreator: Collected addresses:', addresses);

      // Show progress
      if (typeof showMessage === 'function') {
        showMessage('Creating optimized route...', 'info');
      }

      // Clear any existing route thoroughly
      await this.clearRouteCompletely();

      // Create the route
      const optimizedRoute = await this.routeManager.createRoute(addresses);
      
      if (!optimizedRoute || optimizedRoute.length === 0) {
        throw new Error('Failed to create route');
      }

      // Store the optimized route for external access
      this.optimizedRoute = optimizedRoute;
      
      // Display the route
      await this.markerManager.displayRoute(optimizedRoute);
      
      // Start navigation
      this.navigationController.startNavigation(optimizedRoute);
      
      // Store the signature for comparison
      this.lastProcessedSignature = this.routeManager.generateRouteSignature(addresses);
      
      // Success feedback
      if (typeof showMessage === 'function') {
        showMessage(`✅ Route created with ${optimizedRoute.length} stops`, 'success');
      }

      // Dispatch event for other modules
      const event = new CustomEvent('routeCreatedAndDisplayed', { 
        detail: { addresses: optimizedRoute } 
      });
      window.dispatchEvent(event);

      console.log('✅ DesktopRouteCreator: Route creation completed successfully');

    } catch (error) {
      console.error('❌ DesktopRouteCreator: Route creation failed:', error);
      
      if (typeof showMessage === 'function') {
        showMessage(`❌ Failed to create route: ${error.message}`, 'error');
      }
    } finally {
      this.isProcessing = false;
      this._updateButtonState();
    }
  }

  // Clear current route
  clearRoute() {
    console.log('🗑️ DesktopRouteCreator: Clearing route');
    
    try {
      // Stop navigation
      this.navigationController.stopNavigation();
      
      // Clear route visuals
      this.markerManager.clearRouteDisplay();
      
      // Clear route data
      this.routeManager.clearRoute();
      
      // Reset state
      this.lastProcessedSignature = null;
      
      // Update button
      this._updateButtonState();
      
      console.log('✅ DesktopRouteCreator: Route cleared successfully');
      
    } catch (error) {
      console.error('❌ DesktopRouteCreator: Error clearing route:', error);
    }
  }

  // Thoroughly clear all route data and visuals while preserving loaded addresses
  async clearRouteCompletely() {
    console.log('🧹 DesktopRouteCreator: Performing selective route clearing (preserving loaded addresses)');
    
    try {
      // Clear navigation first
      this.navigationController.stopNavigation();
      
      // Clear route-specific visuals only (preserve Excel/uploaded address markers)
      this.markerManager.clearRouteDisplay();
      
      // Clear route data
      this.routeManager.clearRoute();
      
      // Reset route-specific state
      this.lastProcessedSignature = null;
      
      // Clear any drawing selections but preserve loaded addresses
      if (window.selectedItemsInShape) {
        window.selectedItemsInShape = [];
      }
      
      // Clear drawing layers (selection boxes) but keep address data
      if (window.drawnItems) {
        window.drawnItems.clearLayers();
      }
      
      // Reset only route-specific marker manager state
      this.markerManager.routeMarkers = [];
      this.markerManager.routePolyline = null;
      this.markerManager.currentActiveMarker = null;
      // NOTE: Keeping homeMarker and preserving window.currentlyDisplayedItems for Excel data
      
      // Add a small delay to ensure clearing is complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Update button state
      this._updateButtonState();
      
      console.log('✅ DesktopRouteCreator: Selective route clearing finished (addresses preserved)');
      
    } catch (error) {
      console.error('❌ DesktopRouteCreator: Error in selective route clearing:', error);
    }
  }

  // Complete clearing for manual clear button (clears everything including loaded addresses)
  async clearEverything() {
    console.log('🧹 DesktopRouteCreator: Performing complete clearing (including loaded addresses)');
    
    try {
      // Clear the regular way first
      this.clearRoute();
      
      // Clear all global variables
      if (window.selectedItemsInShape) {
        window.selectedItemsInShape = [];
      }
      
      if (window.currentlyDisplayedItems) {
        window.currentlyDisplayedItems = [];
      }
      
      // Clear any drawing layers on the map
      if (window.drawnItems) {
        window.drawnItems.clearLayers();
      }
      
      // Force clear all map layers except base tile layer
      if (window.map) {
        window.map.eachLayer((layer) => {
          // Keep the base tile layer, remove everything else
          if (!layer._url || !layer._url.includes('openstreetmap')) {
            // Skip base map tiles
            if (layer.options && !layer.options.attribution) {
              // This is likely a custom layer (marker, polyline, etc.)
              try {
                window.map.removeLayer(layer);
              } catch (e) {
                // Layer might already be removed, ignore
              }
            }
          }
        });
      }
      
      // Reset marker manager state completely
      this.markerManager.routeMarkers = [];
      this.markerManager.homeMarker = null;
      this.markerManager.routePolyline = null;
      this.markerManager.currentActiveMarker = null;
      
      // Add a small delay to ensure clearing is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('✅ DesktopRouteCreator: Complete clearing finished');
      
    } catch (error) {
      console.error('❌ DesktopRouteCreator: Error in complete clearing:', error);
    }
  }

  // Public API methods
  
  // Get current route
  getOptimizedRoute() {
    return this.routeManager.getCurrentRoute();
  }

  // Check if route is active
  hasActiveRoute() {
    return this.routeManager.hasActiveRoute();
  }

  // Get route statistics
  getRouteStats() {
    return this.routeManager.getRouteStats();
  }

  // Get navigation state
  getNavigationState() {
    return this.navigationController.getNavigationState();
  }

  // Get address collection summary
  getAddressSummary() {
    return this.addressCollector.getSourceSummary();
  }

  // Navigation shortcuts
  navigateToNextStop() {
    this.navigationController.navigateToNextStop();
  }

  navigateToPreviousStop() {
    this.navigationController.navigateToPreviousStop();
  }

  jumpToStop(index) {
    this.navigationController.jumpToStop(index);
  }

  // Force refresh of destination field listeners (for dynamic content)
  refreshDestinationListeners() {
    this.setupDestinationFieldListeners();
    this._updateButtonState();
  }

  // Public method to update button state (called by other modules)
  updateButtonState() {
    this._updateButtonState();
  }

  // Get module references (for advanced usage)
  getModules() {
    return {
      routeManager: this.routeManager,
      markerManager: this.markerManager,
      addressCollector: this.addressCollector,
      navigationController: this.navigationController
    };
  }

  // Cleanup method
  destroy() {
    console.log('🗑️ DesktopRouteCreator: Destroying instance');
    
    this.clearRoute();
    this.isProcessing = false;
    this.lastProcessedSignature = null;
    
    console.log('✅ DesktopRouteCreator: Cleanup completed');
  }
}

// Initialize when DOM is ready and modules are loaded
function initializeDesktopRouteCreator() {
  console.log('🚀 Initializing refactored DesktopRouteCreator');
  
  // Make sure modules are available
  if (typeof RouteManager === 'undefined' || 
      typeof MarkerManager === 'undefined' || 
      typeof NavigationController === 'undefined' || 
      typeof AddressCollector === 'undefined') {
    console.error('❌ Required modules not loaded. Retrying in 100ms...');
    setTimeout(initializeDesktopRouteCreator, 100);
    return;
  }
  
  // Create global instance
  window.desktopRouteCreator = new DesktopRouteCreator();
  console.log('✅ Refactored DesktopRouteCreator ready');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeDesktopRouteCreator);

// Fallback initialization in case DOMContentLoaded already fired
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDesktopRouteCreator);
} else {
  // DOM is already ready
  setTimeout(initializeDesktopRouteCreator, 0);
}

// Additional fallback - try again after a short delay
setTimeout(() => {
  if (!window.desktopRouteCreator) {
    console.log('🔄 DesktopRouteCreator: Fallback initialization...');
    initializeDesktopRouteCreator();
  }
}, 1000);