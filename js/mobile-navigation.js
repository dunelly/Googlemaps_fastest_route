/**
 * Mobile Navigation System
 * Handles responsive interface switching and mobile-optimized navigation workflow
 */

// Global mobile navigation state
window.mobileNavigation = {
  isActive: false,
  currentRoute: null,
  currentPosition: 0,
  mobileMap: null,
  gpsWatchId: null,
  isNavigating: false
};

/**
 * Mobile Interface Controller
 */
class MobileNavigationController {
  constructor() {
    this.isMobile = false;
    this.route = null;
    this.currentPosition = 0;
    this.mobileMap = null;
    this.gpsWatchId = null;
    this.lastKnownLocation = null;
    
    this.init();
  }

  /**
   * Initialize mobile navigation system
   */
  init() {
    console.log('🔧 Initializing Mobile Navigation Controller');
    
    // Detect mobile device and screen size
    this.detectMobile();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Apply initial interface mode
    this.applyInterfaceMode();
    
    // Initialize mobile map if in mobile mode
    if (this.isMobile) {
      this.initializeMobileMap();
    }
    
    // Set up responsive detection
    this.setupResponsiveDetection();
  }

  /**
   * Detect if device is mobile
   */
  detectMobile() {
    const userAgent = navigator.userAgent;
    const screenWidth = window.innerWidth;
    
    this.isMobile = screenWidth <= 768 || 
                    /iPhone|iPad|Android|Mobile/i.test(userAgent);
    
    console.log(`📱 Mobile detection: ${this.isMobile ? 'Mobile' : 'Desktop'} (${screenWidth}px)`);
    
    // Update global state
    window.mobileNavigation.isActive = this.isMobile;
  }

  /**
   * Apply appropriate interface mode
   */
  applyInterfaceMode() {
    const desktopMode = document.querySelector('.desktop-planning-mode');
    const mobileMode = document.querySelector('.mobile-navigation-mode');
    
    if (this.isMobile) {
      if (desktopMode) desktopMode.style.display = 'none';
      if (mobileMode) mobileMode.style.display = 'block';
      document.body.classList.add('mobile-navigation-active');
      console.log('📱 Activated mobile navigation interface');
    } else {
      if (desktopMode) desktopMode.style.display = 'flex';
      if (mobileMode) mobileMode.style.display = 'none';
      document.body.classList.remove('mobile-navigation-active');
      console.log('🖥️ Activated desktop planning interface');
    }
  }

  /**
   * Set up responsive detection for window resize
   */
  setupResponsiveDetection() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const wasMobile = this.isMobile;
        this.detectMobile();
        
        if (wasMobile !== this.isMobile) {
          console.log(`🔄 Interface mode changed: ${this.isMobile ? 'Mobile' : 'Desktop'}`);
          this.applyInterfaceMode();
          
          if (this.isMobile && !this.mobileMap) {
            this.initializeMobileMap();
          }
        }
      }, 250);
    });
  }

  /**
   * Initialize mobile-specific map
   */
  initializeMobileMap() {
    const mobileMapContainer = document.getElementById('mobileMap');
    if (!mobileMapContainer) {
      console.error('❌ Mobile map container not found');
      return;
    }

    try {
      // Initialize Leaflet map for mobile
      this.mobileMap = L.map('mobileMap', {
        center: [29.7604, -95.3698], // Houston default
        zoom: 11,
        zoomControl: false, // We'll add custom controls
        attributionControl: false
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.mobileMap);

      // Add zoom control in better position for mobile
      L.control.zoom({
        position: 'bottomright'
      }).addTo(this.mobileMap);

      console.log('🗺️ Mobile map initialized successfully');
      
      // Update global reference
      window.mobileNavigation.mobileMap = this.mobileMap;
      
    } catch (error) {
      console.error('❌ Error initializing mobile map:', error);
    }
  }

  /**
   * Set up event listeners for mobile navigation controls
   */
  setupEventListeners() {
    // Navigation control buttons
    this.setupNavigationControls();
    
    // Route overview panel
    this.setupRouteOverview();
    
    // Map controls
    this.setupMapControls();
    
    // GPS controls
    this.setupGPSControls();
  }

  /**
   * Set up navigation control buttons
   */
  setupNavigationControls() {
    // Previous button
    const previousBtn = document.getElementById('mobilePreviousBtn');
    if (previousBtn) {
      previousBtn.addEventListener('click', () => this.navigateToPrevious());
    }

    // Next button
    const nextBtn = document.getElementById('mobileNextBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.navigateToNext());
    }

    // Check-in button
    const checkInBtn = document.getElementById('mobileCheckInBtn');
    if (checkInBtn) {
      checkInBtn.addEventListener('click', () => this.checkInAtCurrentLocation());
    }

    // Navigate button
    const navigateBtn = document.getElementById('mobileNavigateBtn');
    if (navigateBtn) {
      navigateBtn.addEventListener('click', () => this.openGoogleMapsNavigation());
    }

    // Notes button
    const notesBtn = document.getElementById('mobileNotesBtn');
    if (notesBtn) {
      notesBtn.addEventListener('click', () => this.openNotesForCurrentDestination());
    }

    // Skip button
    const skipBtn = document.getElementById('mobileSkipBtn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.skipCurrentDestination());
    }

    // Menu button
    const menuBtn = document.getElementById('mobileMenuBtn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => this.openMobileMenu());
    }
  }

  /**
   * Set up route overview panel controls
   */
  setupRouteOverview() {
    const routeToggle = document.getElementById('mobileRouteToggle');
    const routeOverview = document.getElementById('mobileRouteOverview');
    const routeClose = document.getElementById('mobileRouteClose');

    if (routeToggle && routeOverview) {
      // Open route overview
      routeToggle.addEventListener('click', () => {
        routeOverview.classList.add('active');
      });

      // Close route overview
      const closeOverview = () => {
        routeOverview.classList.remove('active');
      };

      if (routeClose) {
        routeClose.addEventListener('click', closeOverview);
      }

      // Close on background click
      routeOverview.addEventListener('click', (e) => {
        if (e.target === routeOverview) {
          closeOverview();
        }
      });
    }
  }

  /**
   * Set up map control buttons
   */
  setupMapControls() {
    // Current location button
    const currentLocationBtn = document.getElementById('mobileCurrentLocationBtn');
    if (currentLocationBtn) {
      currentLocationBtn.addEventListener('click', () => this.centerOnCurrentLocation());
    }

    // Fit route button
    const fitRouteBtn = document.getElementById('mobileFitRouteBtn');
    if (fitRouteBtn) {
      fitRouteBtn.addEventListener('click', () => this.fitRouteToView());
    }
  }

  /**
   * Set up GPS-related controls
   */
  setupGPSControls() {
    // Initialize GPS tracking if supported
    if ('geolocation' in navigator) {
      this.startGPSTracking();
    } else {
      this.updateGPSStatus('GPS not supported', 'error');
    }
  }

  /**
   * Start GPS tracking for arrival detection
   */
  startGPSTracking() {
    if (!navigator.geolocation) {
      console.warn('⚠️ GPS not available');
      return;
    }

    const options = {
      enableHighAccuracy: false, // Start with low power mode
      timeout: 30000,
      maximumAge: 60000
    };

    this.gpsWatchId = navigator.geolocation.watchPosition(
      (position) => this.handleLocationUpdate(position),
      (error) => this.handleLocationError(error),
      options
    );

    this.updateGPSStatus('GPS Active', 'active');
    console.log('📍 GPS tracking started');
  }

  /**
   * Handle GPS location updates
   */
  handleLocationUpdate(position) {
    this.lastKnownLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: Date.now()
    };

    // Update GPS status
    this.updateGPSStatus(`GPS Active (±${Math.round(position.coords.accuracy)}m)`, 'active');

    // Check for arrival if we have a current destination
    if (this.route && this.currentPosition < this.route.length) {
      this.checkArrivalAtDestination();
    }

    console.log('📍 Location updated:', this.lastKnownLocation);
  }

  /**
   * Handle GPS errors
   */
  handleLocationError(error) {
    let message = 'GPS Error';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'GPS Permission Denied';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'GPS Unavailable';
        break;
      case error.TIMEOUT:
        message = 'GPS Timeout';
        break;
    }

    this.updateGPSStatus(message, 'error');
    console.warn('⚠️ GPS Error:', error);
  }

  /**
   * Update GPS status indicator
   */
  updateGPSStatus(message, status = 'active') {
    const gpsStatus = document.getElementById('mobileGpsStatus');
    if (gpsStatus) {
      gpsStatus.textContent = `📍 ${message}`;
      gpsStatus.className = `mobile-gps-status ${status}`;
    }
  }

  /**
   * Check if user has arrived at current destination
   */
  checkArrivalAtDestination() {
    if (!this.lastKnownLocation || !this.route || this.currentPosition >= this.route.length) {
      return;
    }

    const currentDestination = this.route[this.currentPosition];
    if (!currentDestination || !currentDestination.latitude || !currentDestination.longitude) {
      return;
    }

    const distance = this.calculateDistance(
      this.lastKnownLocation.lat,
      this.lastKnownLocation.lng,
      currentDestination.latitude,
      currentDestination.longitude
    );

    const arrivalThreshold = 100; // 100 meters
    
    if (distance <= arrivalThreshold) {
      this.showArrivalNotification();
    }
  }

  /**
   * Calculate distance between two points in meters
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Show arrival notification
   */
  showArrivalNotification() {
    if (Notification.permission === 'granted') {
      new Notification('You\'ve arrived!', {
        body: 'Tap to check in at your destination',
        icon: '/favicon.ico'
      });
    }

    // Also highlight the check-in button
    const checkInBtn = document.getElementById('mobileCheckInBtn');
    if (checkInBtn) {
      checkInBtn.style.animation = 'pulse 1s infinite';
      setTimeout(() => {
        checkInBtn.style.animation = '';
      }, 5000);
    }
  }

  /**
   * Navigation control methods
   */
  navigateToPrevious() {
    if (this.currentPosition > 0) {
      this.currentPosition--;
      this.updateCurrentDestination();
      console.log('◀ Navigated to previous destination');
    }
  }

  navigateToNext() {
    if (this.route && this.currentPosition < this.route.length - 1) {
      this.currentPosition++;
      this.updateCurrentDestination();
      console.log('▶ Navigated to next destination');
    }
  }

  checkInAtCurrentLocation() {
    if (!this.route || this.currentPosition >= this.route.length) {
      return;
    }

    const currentDestination = this.route[this.currentPosition];
    
    // Mark as visited with timestamp
    currentDestination.visited = true;
    currentDestination.visitedAt = new Date();

    // Update UI
    this.updateCurrentDestination();
    this.updateRouteProgress();

    console.log('✅ Checked in at:', currentDestination.address);

    // Auto-advance to next destination
    setTimeout(() => {
      this.navigateToNext();
    }, 1000);
  }

  openGoogleMapsNavigation() {
    if (!this.route || this.currentPosition >= this.route.length) {
      return;
    }

    const destination = this.route[this.currentPosition];
    const query = encodeURIComponent(destination.address);
    const googleMapsUrl = `https://maps.google.com/maps?daddr=${query}&navigate=yes`;
    
    // Open Google Maps
    window.open(googleMapsUrl, '_blank');
    
    // Mark as navigating
    this.isNavigating = true;
    document.body.classList.add('navigation-active');
    
    console.log('🗺️ Opened Google Maps navigation to:', destination.address);
  }

  openNotesForCurrentDestination() {
    if (!this.route || this.currentPosition >= this.route.length) {
      return;
    }

    const destination = this.route[this.currentPosition];
    
    // Trigger existing notes system
    if (window.notesManager && window.notesManager.openNotes) {
      window.notesManager.openNotes(destination);
    } else {
      console.log('📝 Notes for:', destination.address);
      // Fallback - could open a simple prompt
      const note = prompt('Add note for ' + destination.address + ':');
      if (note) {
        destination.notes = note;
      }
    }
  }

  skipCurrentDestination() {
    if (!this.route || this.currentPosition >= this.route.length) {
      return;
    }

    const destination = this.route[this.currentPosition];
    destination.skipped = true;
    destination.skippedAt = new Date();

    console.log('⏭️ Skipped destination:', destination.address);

    // Move to next destination
    this.navigateToNext();
  }

  openMobileMenu() {
    // Could open settings, switch to desktop mode, etc.
    console.log('⚙️ Mobile menu opened');
    
    // Simple menu for now
    const options = [
      'Switch to Desktop Mode',
      'Settings',
      'Help',
      'Cancel'
    ];
    
    // Use native mobile menu or create custom modal
    // For now, just log
    console.log('Menu options:', options);
  }

  /**
   * Map control methods
   */
  centerOnCurrentLocation() {
    if (this.mobileMap && this.lastKnownLocation) {
      this.mobileMap.setView([this.lastKnownLocation.lat, this.lastKnownLocation.lng], 16);
      console.log('📍 Centered map on current location');
    }
  }

  fitRouteToView() {
    if (this.mobileMap && this.route && this.route.length > 0) {
      const bounds = L.latLngBounds();
      
      this.route.forEach(destination => {
        if (destination.latitude && destination.longitude) {
          bounds.extend([destination.latitude, destination.longitude]);
        }
      });
      
      if (bounds.isValid()) {
        this.mobileMap.fitBounds(bounds, { padding: [20, 20] });
        console.log('🗺️ Fitted route to map view');
      }
    }
  }

  /**
   * Update methods
   */
  updateCurrentDestination() {
    if (!this.route || this.currentPosition >= this.route.length) {
      return;
    }

    const destination = this.route[this.currentPosition];
    
    // Update destination card
    const addressEl = document.getElementById('mobileDestinationAddress');
    const ownerEl = document.getElementById('mobileDestinationOwner');
    const dateEl = document.getElementById('mobileDestinationDate');
    const distanceEl = document.getElementById('mobileDestinationDistance');

    if (addressEl) addressEl.textContent = destination.address || 'Unknown Address';
    if (ownerEl) ownerEl.textContent = `👤 ${destination.ownerName || 'Unknown Owner'}`;
    if (dateEl && destination.auctionDate) {
      dateEl.textContent = `📅 Auction: ${new Date(destination.auctionDate).toLocaleDateString()}`;
    }
    if (distanceEl) distanceEl.textContent = '🗺️ Calculating distance...';

    // Update navigation buttons
    this.updateNavigationButtons();
    
    // Update progress
    this.updateRouteProgress();
  }

  updateNavigationButtons() {
    const previousBtn = document.getElementById('mobilePreviousBtn');
    const nextBtn = document.getElementById('mobileNextBtn');

    if (previousBtn) {
      previousBtn.disabled = this.currentPosition <= 0;
      if (this.currentPosition <= 0) {
        previousBtn.classList.add('mobile-nav-btn-disabled');
      } else {
        previousBtn.classList.remove('mobile-nav-btn-disabled');
      }
    }

    if (nextBtn) {
      nextBtn.disabled = !this.route || this.currentPosition >= this.route.length - 1;
      if (!this.route || this.currentPosition >= this.route.length - 1) {
        nextBtn.classList.add('mobile-nav-btn-disabled');
      } else {
        nextBtn.classList.remove('mobile-nav-btn-disabled');
      }
    }
  }

  updateRouteProgress() {
    if (!this.route || this.route.length === 0) {
      return;
    }

    const completedCount = this.route.filter(dest => dest.visited).length;
    const progressPercent = Math.round((completedCount / this.route.length) * 100);

    // Update progress text
    const progressText = document.getElementById('mobileProgressText');
    if (progressText) {
      progressText.textContent = `Stop ${this.currentPosition + 1} of ${this.route.length} • ${progressPercent}% Complete`;
    }

    // Update progress bar
    const progressFill = document.getElementById('mobileProgressFill');
    if (progressFill) {
      progressFill.style.width = `${progressPercent}%`;
    }

    // Update route overview list
    this.updateRouteOverviewList();
  }

  updateRouteOverviewList() {
    const routeList = document.getElementById('mobileRouteList');
    if (!routeList || !this.route) {
      return;
    }

    // Clear existing items
    routeList.innerHTML = '';

    this.route.forEach((destination, index) => {
      const item = document.createElement('div');
      item.className = 'mobile-route-item';

      const number = document.createElement('div');
      number.className = 'mobile-route-number';
      
      let status = 'pending';
      let numberText = (index + 1).toString();
      
      if (destination.visited) {
        status = 'completed';
        numberText = '✓';
      } else if (index === this.currentPosition) {
        status = 'current';
      } else if (index === this.currentPosition + 1) {
        status = 'next';
      }
      
      number.className += ` ${status}`;
      number.textContent = numberText;

      const address = document.createElement('div');
      address.className = 'mobile-route-address';
      
      let statusText = '';
      if (destination.visited) {
        statusText = `<small>Completed ${new Date(destination.visitedAt).toLocaleTimeString()}</small>`;
      } else if (index === this.currentPosition) {
        statusText = '<small>Current destination</small>';
      } else if (index === this.currentPosition + 1) {
        statusText = '<small>Next stop</small>';
      } else {
        statusText = '<small>Pending</small>';
      }
      
      address.innerHTML = `${destination.address}<br>${statusText}`;

      item.appendChild(number);
      item.appendChild(address);
      routeList.appendChild(item);
    });
  }

  /**
   * Public methods for integration with existing system
   */
  loadRoute(route) {
    this.route = route;
    this.currentPosition = 0;
    
    // Update global state
    window.mobileNavigation.currentRoute = route;
    window.mobileNavigation.currentPosition = 0;
    
    console.log('📍 Route loaded with', route.length, 'destinations');
    
    // Update UI
    this.updateCurrentDestination();
    
    // Add markers to mobile map
    if (this.mobileMap && this.route) {
      this.addRouteMarkersToMap();
    }
  }

  addRouteMarkersToMap() {
    if (!this.mobileMap || !this.route) {
      return;
    }

    // Clear existing markers
    this.mobileMap.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.mobileMap.removeLayer(layer);
      }
    });

    // Add markers for each destination
    this.route.forEach((destination, index) => {
      if (destination.latitude && destination.longitude) {
        let markerColor = '#6c757d'; // pending
        
        if (destination.visited) {
          markerColor = '#28a745'; // completed
        } else if (index === this.currentPosition) {
          markerColor = '#007bff'; // current
        } else if (index === this.currentPosition + 1) {
          markerColor = '#ffc107'; // next
        }

        const marker = L.circleMarker([destination.latitude, destination.longitude], {
          radius: 8,
          fillColor: markerColor,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(this.mobileMap);

        // Add popup
        marker.bindPopup(`
          <strong>${destination.address}</strong><br>
          Stop ${index + 1} of ${this.route.length}
        `);
      }
    });

    // Fit map to show all markers
    this.fitRouteToView();
  }

  /**
   * Cleanup method
   */
  destroy() {
    if (this.gpsWatchId) {
      navigator.geolocation.clearWatch(this.gpsWatchId);
    }
    
    if (this.mobileMap) {
      this.mobileMap.remove();
    }
  }
}

// Initialize mobile navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.mobileNavigationController = new MobileNavigationController();
  console.log('✅ Mobile Navigation Controller initialized');
});

// Make controller available globally for integration
window.MobileNavigationController = MobileNavigationController;