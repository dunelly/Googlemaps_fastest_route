// RouteManager - Handles route creation, optimization, and storage
class RouteManager {
  constructor() {
    this.currentRoute = null;
    this.routeSignature = null;
    this.coordinateCache = new Map();
    this.isProcessing = false;
  }

  // Create and optimize a route from addresses
  async createRoute(addresses) {
    if (this.isProcessing) {
      console.warn('RouteManager: Already processing a route');
      return null;
    }

    this.isProcessing = true;
    
    try {
      console.log('📍 RouteManager: Creating route for', addresses.length, 'addresses');
      
      // Validate addresses
      const validAddresses = this.validateAddresses(addresses);
      if (validAddresses.length === 0) {
        throw new Error('No valid addresses provided');
      }

      // Separate starting address from waypoints
      const startingAddress = validAddresses.find(addr => addr.isStartingAddress) || validAddresses[0];
      const waypoints = validAddresses.filter(addr => !addr.isStartingAddress);

      console.log('📍 RouteManager: Start:', startingAddress.address);
      console.log('📍 RouteManager: Waypoints:', waypoints.length);

      // Geocode addresses that need it
      await this.ensureAddressesGeocoded([startingAddress, ...waypoints]);

      // Optimize route order
      const optimizedRoute = await this.optimizeRoute(startingAddress, waypoints);
      
      // Store the route
      this.currentRoute = optimizedRoute;
      this.routeSignature = this.generateRouteSignature(optimizedRoute);
      
      console.log('✅ RouteManager: Route created successfully');
      return optimizedRoute;
      
    } catch (error) {
      console.error('❌ RouteManager: Failed to create route:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  // Validate and clean up addresses
  validateAddresses(addresses) {
    return addresses.filter(addr => {
      if (!addr || !addr.address || typeof addr.address !== 'string') {
        console.warn('RouteManager: Invalid address object:', addr);
        return false;
      }
      
      const cleanAddress = addr.address.trim();
      if (cleanAddress.length === 0) {
        console.warn('RouteManager: Empty address string');
        return false;
      }
      
      return true;
    }).map(addr => ({
      ...addr,
      address: addr.address.trim()
    }));
  }

  // Ensure all addresses have coordinates
  async ensureAddressesGeocoded(addresses) {
    const addressesToGeocode = addresses.filter(addr => 
      typeof addr.lat !== 'number' || typeof addr.lng !== 'number' ||
      addr.lat === null || addr.lng === null
    );

    if (addressesToGeocode.length === 0) {
      console.log('📍 RouteManager: All addresses already have coordinates');
      return;
    }

    console.log('📍 RouteManager: Geocoding', addressesToGeocode.length, 'addresses');
    
    // Use existing geocoding function
    if (typeof window.geocodeAddresses === 'function') {
      try {
        await window.geocodeAddresses(addressesToGeocode);
        console.log('✅ RouteManager: Geocoding completed successfully');
        
        // Verify all addresses now have coordinates
        const stillMissing = addressesToGeocode.filter(addr => 
          typeof addr.lat !== 'number' || typeof addr.lng !== 'number'
        );
        
        if (stillMissing.length > 0) {
          console.warn('⚠️ RouteManager: Some addresses still missing coordinates:', stillMissing.map(a => a.address));
        }
      } catch (error) {
        console.error('❌ RouteManager: Geocoding failed:', error);
        throw new Error(`Geocoding failed: ${error.message}`);
      }
    } else {
      throw new Error('Geocoding function not available');
    }
  }

  // Optimize route order using external service
  async optimizeRoute(startAddress, waypoints) {
    if (waypoints.length === 0) {
      return [startAddress];
    }

    console.log('🔄 RouteManager: Optimizing route order');

    // Try Google's optimization service first (the one that actually works)
    try {
      const allAddresses = [startAddress.address, ...waypoints.map(wp => wp.address), startAddress.address];
      console.log('🔄 RouteManager: Sending to Google optimization service:', allAddresses);

      const response = await fetch('https://googlemaps-fastest-route-1.onrender.com/optimize-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addresses: allAddresses }),
      });

      if (!response.ok) {
        throw new Error(`Google optimization failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ RouteManager: Google optimization result:', result);
      
      if (result.order && Array.isArray(result.order)) {
        // Map the optimized order back to original address objects
        const optimizedOrder = [startAddress]; // Always start with starting address
        
        // Add waypoints in optimized order
        result.order.forEach(idx => {
          if (idx >= 0 && idx < waypoints.length) {
            optimizedOrder.push(waypoints[idx]);
          }
        });

        console.log('✅ RouteManager: Route optimized successfully');
        return optimizedOrder;
      }

    } catch (error) {
      console.warn('⚠️ RouteManager: Google optimization failed, trying OSRM fallback:', error.message);
    }

    // Fallback to OSRM optimization
    try {
      console.log('🔄 RouteManager: Trying OSRM optimization fallback');
      
      // Create coordinates string for API
      const coordinates = waypoints
        .filter(wp => typeof wp.lat === 'number' && typeof wp.lng === 'number')
        .map(wp => `${wp.lng},${wp.lat}`)
        .join(';');

      if (coordinates.length === 0) {
        console.warn('RouteManager: No valid coordinates for OSRM optimization');
        return [startAddress, ...waypoints];
      }

      const startCoord = `${startAddress.lng},${startAddress.lat}`;
      const url = `https://router.project-osrm.org/trip/v1/driving/${startCoord};${coordinates}?source=first&destination=first&roundtrip=false`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OSRM API failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== 'Ok' || !data.trips || data.trips.length === 0) {
        throw new Error('Invalid OSRM response');
      }

      // Map the optimized order back to original addresses
      const trip = data.trips[0];
      const optimizedOrder = [startAddress]; // Always start with starting address
      
      if (trip.legs && trip.legs.length > 0) {
        // The API returns waypoint indices in optimized order
        const waypointOrder = trip.waypoint_order || [];
        for (const index of waypointOrder) {
          if (index > 0 && index <= waypoints.length) {
            optimizedOrder.push(waypoints[index - 1]);
          }
        }
      }

      // Add any waypoints that weren't included in optimization
      waypoints.forEach(wp => {
        if (!optimizedOrder.includes(wp)) {
          optimizedOrder.push(wp);
        }
      });

      console.log('✅ RouteManager: OSRM optimization completed');
      return optimizedOrder;

    } catch (error) {
      console.warn('⚠️ RouteManager: All optimization failed, using original order:', error.message);
      return [startAddress, ...waypoints];
    }
  }

  // Generate a signature for route comparison
  generateRouteSignature(addresses) {
    if (!addresses || addresses.length === 0) {
      return null;
    }
    return addresses
      .map(addr => (addr.address || '').toLowerCase().trim())
      .sort()
      .join('|');
  }

  // Check if current route matches given addresses
  isCurrentRoute(addresses) {
    const newSignature = this.generateRouteSignature(addresses);
    return newSignature === this.routeSignature;
  }

  // Get current route
  getCurrentRoute() {
    return this.currentRoute;
  }

  // Check if we have an active route
  hasActiveRoute() {
    return this.currentRoute !== null && this.currentRoute.length > 0;
  }

  // Clear current route
  clearRoute() {
    console.log('🗑️ RouteManager: Clearing route');
    this.currentRoute = null;
    this.routeSignature = null;
  }

  // Get route statistics
  getRouteStats() {
    if (!this.hasActiveRoute()) {
      return null;
    }

    return {
      totalStops: this.currentRoute.length,
      startingAddress: this.currentRoute[0]?.address || 'Unknown',
      waypointCount: this.currentRoute.length - 1,
      hasCoordinates: this.currentRoute.every(addr => 
        typeof addr.lat === 'number' && typeof addr.lng === 'number'
      )
    };
  }
}

// Export for use in other modules
window.RouteManager = RouteManager;