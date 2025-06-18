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
    const endBtn = document.getElementById('endRouteBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.navigateToPreviousStop());
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.navigateToNextStop());
    }

    if (endBtn) {
      endBtn.addEventListener('click', () => this.endRoute());
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
    
    // Fit map to show entire route first
    this.fitMapToRoute(route);
    
    // Set first stop as active without zooming (just highlight the marker)
    this.setActiveStop(0, { setView: false });
    
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
    this.setActiveStop(this.currentStopIndex, { setView: true, panOnly: true });
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
    this.setActiveStop(this.currentStopIndex, { setView: true, panOnly: true });
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
        if (options.panOnly) {
          // Pan to address without changing zoom level - keeps entire route visible
          window.map.panTo(latLng, {
            animate: true,
            duration: 0.8,
            easeLinearity: 0.1
          });
        } else {
          // Use zoom for initial navigation start or when specifically requested
          window.map.flyTo(latLng, options.zoomLevel || 14, {
            duration: 1.0,
            easeLinearity: 0.1
          });
        }
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
      // Debug: Log the current stop data
      console.log('🔍 NavigationController: Current stop data:', currentStop);
      console.log('🔍 NavigationController: Available properties:', Object.keys(currentStop));
      
      // Get name using same logic as desktop markers
      let displayName = null;
      if (currentStop.name) {
        displayName = currentStop.name;
      } else if (currentStop['Borrower Name']) {
        displayName = currentStop['Borrower Name'];
      } else if (currentStop.borrowerName) {
        displayName = currentStop.borrowerName;
      } else if (currentStop['Property Owner']) {
        displayName = currentStop['Property Owner'];
      } else if (currentStop.propertyOwner) {
        displayName = currentStop.propertyOwner;
      } else if (currentStop.owner) {
        displayName = currentStop.owner;
      } else if (currentStop.firstName && currentStop.lastName) {
        displayName = `${currentStop.firstName} ${currentStop.lastName}`;
      } else if (currentStop.firstName) {
        displayName = currentStop.firstName;
      } else if (currentStop.lastName) {
        displayName = currentStop.lastName;
      }
      
      // If no name found in route data, look up from currently loaded Excel data
      if (!displayName && typeof window.currentlyDisplayedItems !== 'undefined' && 
          window.currentlyDisplayedItems && Array.isArray(window.currentlyDisplayedItems)) {
        
        console.log('🔍 NavigationController: No name in route data, looking up from Excel data');
        
        // Find matching address in Excel data
        const matchingItem = window.currentlyDisplayedItems.find(item => {
          if (!item || !item.address) return false;
          const itemAddr = item.address.toLowerCase().trim();
          const currentAddr = currentStop.address.toLowerCase().trim();
          
          // Try exact match first
          if (itemAddr === currentAddr) return true;
          
          // Try partial match (remove common suffixes)
          const cleanItem = itemAddr.replace(/, usa$|, tx$|, texas$/i, '').trim();
          const cleanCurrent = currentAddr.replace(/, usa$|, tx$|, texas$/i, '').trim();
          
          return cleanItem === cleanCurrent;
        });
        
        if (matchingItem) {
          // Use same name detection logic
          if (matchingItem.name) {
            displayName = matchingItem.name;
          } else if (matchingItem['Borrower Name']) {
            displayName = matchingItem['Borrower Name'];
          } else if (matchingItem.borrowerName) {
            displayName = matchingItem.borrowerName;
          } else if (matchingItem['Property Owner']) {
            displayName = matchingItem['Property Owner'];
          } else if (matchingItem.propertyOwner) {
            displayName = matchingItem.propertyOwner;
          } else if (matchingItem.owner) {
            displayName = matchingItem.owner;
          } else if (matchingItem.firstName && matchingItem.lastName) {
            displayName = `${matchingItem.firstName} ${matchingItem.lastName}`;
          } else if (matchingItem.firstName) {
            displayName = matchingItem.firstName;
          } else if (matchingItem.lastName) {
            displayName = matchingItem.lastName;
          }
          
          console.log('🔍 NavigationController: Found name from Excel lookup:', displayName);
        } else {
          console.log('🔍 NavigationController: No matching address found in Excel data');
        }
      }
      
      console.log('🔍 NavigationController: Final display name:', displayName);
      
      const addressText = currentStop.address.length > 25 
        ? currentStop.address.substring(0, 22) + '...' 
        : currentStop.address;
      
      let displayHTML = `Stop ${this.currentStopIndex + 1} of ${route.length}<br>`;
      
      if (displayName) {
        const nameText = displayName.length > 20 
          ? displayName.substring(0, 17) + '...' 
          : displayName;
        displayHTML += `<small><strong>${nameText}</strong><br>${addressText}</small>`;
      } else {
        displayHTML += `<small>${addressText}</small>`;
      }
      
      currentStopDisplay.innerHTML = displayHTML;
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

  // End route and return to normal map view
  endRoute() {
    console.log('🏁 NavigationController: Ending route');
    
    // Stop navigation
    this.stopNavigation();
    
    // Clear route display
    if (this.markerManager && typeof this.markerManager.clearRoute === 'function') {
      this.markerManager.clearRoute();
    }
    
    // Clear route data from route manager
    if (this.routeManager && typeof this.routeManager.clearRoute === 'function') {
      this.routeManager.clearRoute();
    }
    
    // Show all addresses again
    if (typeof window.updateMapMarkers === 'function') {
      window.updateMapMarkers();
    }
    
    // Fit map to show all addresses if they exist
    if (window.addresses && window.addresses.length > 0 && typeof window.fitMapToAddresses === 'function') {
      setTimeout(() => {
        window.fitMapToAddresses();
      }, 100);
    }
    
    // Clear optimized route from desktop route creator
    if (window.desktopRouteCreator) {
      window.desktopRouteCreator.optimizedRoute = null;
      window.desktopRouteCreator.isProcessing = false;
      
      // Update button state to enable create route button - with delay to ensure all cleanup is complete
      const updateButtonState = () => {
        if (typeof window.desktopRouteCreator._updateButtonState === 'function') {
          console.log('🔄 NavigationController: Updating button state after route end');
          window.desktopRouteCreator._updateButtonState();
        }
      };
      
      // Update immediately and with delays to handle any timing issues
      updateButtonState();
      setTimeout(updateButtonState, 50);
      setTimeout(updateButtonState, 200);
    }
    
    // Show success message
    if (typeof showMessage === 'function') {
      showMessage('Route ended - showing all addresses', 'info');
    }
    
    console.log('✅ NavigationController: Route ended successfully');
  }

  // Jump to specific stop index
  jumpToStop(index) {
    const route = this.routeManager.getCurrentRoute();
    if (!route || index < 0 || index >= route.length) {
      console.warn('NavigationController: Invalid jump index:', index);
      return;
    }

    this.currentStopIndex = index;
    this.setActiveStop(index, { setView: true, panOnly: true });
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

  // Fit map to show entire route
  fitMapToRoute(route) {
    if (!route || route.length === 0 || !window.map) {
      return;
    }

    // Collect all valid coordinates from the route
    const coordinates = route
      .filter(stop => typeof stop.lat === 'number' && typeof stop.lng === 'number')
      .map(stop => [stop.lat, stop.lng]);

    if (coordinates.length === 0) {
      console.warn('NavigationController: No valid coordinates in route for fitting');
      return;
    }

    if (coordinates.length === 1) {
      // Single point - center on it with reasonable zoom
      window.map.setView(coordinates[0], 12);
    } else {
      // Multiple points - fit bounds to show all stops
      const group = new L.featureGroup(coordinates.map(coord => L.marker(coord)));
      window.map.fitBounds(group.getBounds(), {
        padding: [20, 20], // Add some padding around the route
        maxZoom: 12 // Don't zoom in too close even for small routes
      });
    }

    console.log('📍 NavigationController: Map fitted to show entire route');
  }
}

// Export for use in other modules
window.NavigationController = NavigationController;