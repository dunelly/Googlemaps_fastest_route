// NavigationController - Handles route navigation and stop management
class NavigationController {
  constructor(routeManager, markerManager) {
    this.routeManager = routeManager;
    this.markerManager = markerManager;
    this.currentStopIndex = -1;
    this.isNavigationActive = false;
    
    this.initializeControls();
  }

  // Initialize navigation control event listeners
  initializeControls() {
    const prevBtn = document.getElementById('prevStopBtn');
    const nextBtn = document.getElementById('nextStopBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.navigateToPreviousStop());
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.navigateToNextStop());
    }

    console.log('📍 NavigationController: Controls initialized');
  }

  // Start navigation for a route
  startNavigation(route) {
    if (!route || route.length === 0) {
      console.warn('NavigationController: Cannot start navigation - no route provided');
      return;
    }

    console.log('🧭 NavigationController: Starting navigation for', route.length, 'stops');
    
    this.isNavigationActive = true;
    this.currentStopIndex = 0; // Start at first stop
    
    // Show navigation controls
    this.showNavigationControls();
    
    // Set first stop as active
    this.setActiveStop(0, { setView: true, zoomLevel: 14 });
    
    // Update navigation controls
    this.updateNavigationControls();
    
    console.log('✅ NavigationController: Navigation started');
  }

  // Navigate to previous stop
  navigateToPreviousStop() {
    if (!this.isNavigationActive) {
      console.warn('NavigationController: Navigation not active');
      return;
    }

    const route = this.routeManager.getCurrentRoute();
    if (!route || this.currentStopIndex <= 0) {
      console.log('NavigationController: Already at first stop');
      return;
    }

    this.currentStopIndex--;
    this.setActiveStop(this.currentStopIndex, { setView: true, zoomLevel: 14 });
    this.updateNavigationControls();
    
    // Show notification
    this.showNavigationFeedback('⏪ Previous', route[this.currentStopIndex]);
    
    console.log('⏪ NavigationController: Moved to previous stop:', this.currentStopIndex);
  }

  // Navigate to next stop
  navigateToNextStop() {
    if (!this.isNavigationActive) {
      console.warn('NavigationController: Navigation not active');
      return;
    }

    const route = this.routeManager.getCurrentRoute();
    if (!route || this.currentStopIndex >= route.length - 1) {
      console.log('NavigationController: Already at last stop');
      return;
    }

    this.currentStopIndex++;
    this.setActiveStop(this.currentStopIndex, { setView: true, zoomLevel: 14 });
    this.updateNavigationControls();
    
    // Show notification
    this.showNavigationFeedback('⏩ Next', route[this.currentStopIndex]);
    
    console.log('⏩ NavigationController: Moved to next stop:', this.currentStopIndex);
  }

  // Set active stop and handle map movement
  setActiveStop(index, options = {}) {
    const route = this.routeManager.getCurrentRoute();
    if (!route || index < 0 || index >= route.length) {
      console.warn('NavigationController: Invalid stop index:', index);
      return;
    }

    const targetStop = route[index];
    this.currentStopIndex = index;

    // Update marker visuals
    this.markerManager.setActiveMarker(index);

    // Handle map movement
    if (options.setView && typeof targetStop.lat === 'number' && typeof targetStop.lng === 'number') {
      const latLng = [targetStop.lat, targetStop.lng];
      
      if (window.map) {
        // Use smooth animation to move to the address
        window.map.flyTo(latLng, options.zoomLevel || 14, {
          duration: 1.0,
          easeLinearity: 0.1
        });
      }
    }

    console.log(`📍 NavigationController: Active stop set to ${index}: ${targetStop.address}`);
  }

  // Show navigation feedback message
  showNavigationFeedback(direction, stopData) {
    if (typeof showMessage === 'function' && stopData) {
      const address = stopData.address.length > 40 
        ? stopData.address.substring(0, 37) + '...' 
        : stopData.address;
      showMessage(`${direction}: ${address}`, 'info', 2000);
    }
  }

  // Update navigation control UI
  updateNavigationControls() {
    const prevBtn = document.getElementById('prevStopBtn');
    const nextBtn = document.getElementById('nextStopBtn');
    const currentStopDisplay = document.getElementById('currentStopDisplay');
    const navigationContainer = document.getElementById('routeNavigationControls');

    if (!prevBtn || !nextBtn || !currentStopDisplay || !navigationContainer) {
      console.warn('NavigationController: Navigation UI elements not found');
      return;
    }

    const route = this.routeManager.getCurrentRoute();
    
    if (!this.isNavigationActive || !route || route.length === 0) {
      // Hide navigation controls (only affects mobile due to CSS media query)
      navigationContainer.style.display = 'none';
      currentStopDisplay.textContent = 'No active route';
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }

    // Show navigation controls with proper styling (only visible on mobile due to CSS)
    navigationContainer.style.display = 'flex';
    navigationContainer.style.alignItems = 'center';
    navigationContainer.style.justifyContent = 'space-between';
    navigationContainer.style.width = '100%';
    navigationContainer.style.marginTop = '10px';
    navigationContainer.style.gap = '8px';
    
    // Update current stop display
    const currentStop = route[this.currentStopIndex];
    if (currentStop) {
      const addressText = currentStop.address.length > 30 
        ? currentStop.address.substring(0, 27) + '...' 
        : currentStop.address;
      
      currentStopDisplay.innerHTML = `
        Stop ${this.currentStopIndex + 1} of ${route.length}<br>
        <small>${addressText}</small>
      `;
    }
    
    // Update button states
    prevBtn.disabled = this.currentStopIndex <= 0;
    nextBtn.disabled = this.currentStopIndex >= route.length - 1;
    
    console.log('📍 NavigationController: Controls updated');
  }

  // Stop navigation
  stopNavigation() {
    console.log('🛑 NavigationController: Stopping navigation');
    
    this.isNavigationActive = false;
    this.currentStopIndex = -1;
    
    // Hide navigation controls
    this.hideNavigationControls();
    
    // Update controls to hide navigation
    this.updateNavigationControls();
    
    console.log('✅ NavigationController: Navigation stopped');
  }

  // Jump to specific stop index
  jumpToStop(index) {
    const route = this.routeManager.getCurrentRoute();
    if (!route || index < 0 || index >= route.length) {
      console.warn('NavigationController: Invalid jump index:', index);
      return;
    }

    this.currentStopIndex = index;
    this.setActiveStop(index, { setView: true, zoomLevel: 14 });
    this.updateNavigationControls();
    
    console.log('🎯 NavigationController: Jumped to stop:', index);
  }

  // Get current navigation state
  getNavigationState() {
    return {
      isActive: this.isNavigationActive,
      currentStopIndex: this.currentStopIndex,
      totalStops: this.routeManager.getCurrentRoute()?.length || 0
    };
  }

  // Get current stop data
  getCurrentStop() {
    const route = this.routeManager.getCurrentRoute();
    if (!route || this.currentStopIndex < 0 || this.currentStopIndex >= route.length) {
      return null;
    }
    return route[this.currentStopIndex];
  }

  // Check if navigation is active
  isActive() {
    return this.isNavigationActive;
  }

  // Get current stop index
  getCurrentStopIndex() {
    return this.currentStopIndex;
  }

  // Show navigation controls
  showNavigationControls() {
    const navigationContainer = document.getElementById('routeNavigationControls');
    if (navigationContainer) {
      navigationContainer.classList.add('active');
      console.log('📍 NavigationController: Navigation controls shown');
    } else {
      console.error('❌ NavigationController: #routeNavigationControls element not found in DOM!');
    }
  }

  // Hide navigation controls
  hideNavigationControls() {
    const navigationContainer = document.getElementById('routeNavigationControls');
    if (navigationContainer) {
      navigationContainer.classList.remove('active');
      console.log('📍 NavigationController: Navigation controls hidden');
    }
  }
}

// Export for use in other modules
window.NavigationController = NavigationController;