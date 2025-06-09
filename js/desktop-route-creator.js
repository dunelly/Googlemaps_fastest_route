/**
 * Desktop Route Creator - SmashRoutes
 * Handles route creation, display, and numbered markers on desktop map
 */

class DesktopRouteCreator {
  constructor() {
    this.optimizedRoute = null;
    this.routeMarkers = [];
    this.routePolyline = null;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateButtonState();
    
    // Listen for address changes to update button state
    document.addEventListener('addressesLoaded', (e) => {
      this.updateButtonState();
    });
    document.addEventListener('addressesCleared', () => {
      this.clearRoute();
    });
    
    // Listen for starting address changes
    const startingAddressField = document.getElementById('manualStartAddress');
    if (startingAddressField) {
      startingAddressField.addEventListener('input', (event) => {
        this.handleStartingAddressInputChange(event.target.value);
        this.updateButtonState(); // Keep this for button text updates
      });
      startingAddressField.addEventListener('change', (event) => { // For paste or autofill
        this.handleStartingAddressInputChange(event.target.value);
        this.updateButtonState();
      });
    }
    
    console.log('📍 Desktop Route Creator initialized');
  }

  async handleStartingAddressInputChange(addressValue) {
    const address = addressValue.trim();
    if (address) {
      console.log('[desktop-route-creator] Manual Start Address input changed to:', address);
      // Geocode and display marker.
      // We need to create a temporary address object similar to what displayHomeMarkerForRoute expects.
      const tempStartAddress = {
        address: address,
        isStartingAddress: true, // Mark it as a starting address
        lat: null, // Needs geocoding
        lng: null
      };

      // Geocode this temporary address
      if (typeof window.geocodeAddresses === 'function') {
        // geocodeAddresses expects an array
        await window.geocodeAddresses([tempStartAddress]);
      }

      // Now display the home marker if geocoding was successful
      if (tempStartAddress.lat && tempStartAddress.lng) {
        this.displayHomeMarkerForRoute([tempStartAddress]); // displayHomeMarkerForRoute expects an array
      } else {
        // If geocoding failed, ensure any existing home marker is removed
        if (typeof window.removeHomeMarker === 'function') {
          window.removeHomeMarker();
        }
      }
    } else {
      console.log('[desktop-route-creator] Manual Start Address cleared.');
      if (typeof window.removeHomeMarker === 'function') {
        window.removeHomeMarker();
      }
    }
  }

  setupEventListeners() {
    const createRouteBtn = document.getElementById('createRouteBtn');
    if (createRouteBtn) {
      createRouteBtn.addEventListener('click', () => this.handleCreateRoute());
    }
  }


  updateButtonState() {
    const createRouteBtn = document.getElementById('createRouteBtn');
    if (!createRouteBtn) return;

    // Check starting address
    const startingAddressField = document.getElementById('manualStartAddress');
    const hasStartingAddress = startingAddressField && startingAddressField.value.trim();
    
    // Check if we have loaded addresses  
    const loadedAddresses = this.getLoadedAddresses();
    const hasAddresses = loadedAddresses.length > 0;
    
    if (hasAddresses) {
      createRouteBtn.disabled = false;
      const isLassoSelected = window.selectedItemsInShape && window.selectedItemsInShape.length > 0;
      const selectedCount = isLassoSelected ? window.selectedItemsInShape.length : (loadedAddresses.length - (hasStartingAddress ? 1 : 0));
      
      let buttonText = '🚀 Create Route';
      if (hasStartingAddress && selectedCount > 0) {
        buttonText = `🚀 Create Route (Start + ${selectedCount} stops)`;
      } else if (hasStartingAddress) {
        buttonText = `🚀 Create Route (Start only)`;
      } else if (selectedCount > 0) {
        const routeType = isLassoSelected ? 'Selected' : 'All';
        buttonText = `🚀 Create Route (${selectedCount} ${routeType} stops)`;
      }
      
      createRouteBtn.textContent = buttonText;
    } else {
      createRouteBtn.disabled = hasStartingAddress ? false : true;
      createRouteBtn.textContent = hasStartingAddress ? '🚀 Create Route (Start only)' : '🚀 Create Route';
    }
  }

  getLoadedAddresses() {
    const startingAddressField = document.getElementById('manualStartAddress');
    const startingAddressValue = startingAddressField ? startingAddressField.value.trim() : '';
    
    let addresses = [];
    
    // Add starting address if provided
    if (startingAddressValue) {
      addresses.push({
        address: startingAddressValue,
        isStartingAddress: true,
        lat: null, // Will need geocoding
        lng: null
      });
      console.log('📍 Added starting address:', startingAddressValue);
    }
    
    // Add selected or all loaded addresses
    if (window.selectedItemsInShape && window.selectedItemsInShape.length > 0) {
      console.log('📍 Adding lasso-selected addresses:', window.selectedItemsInShape.length);
      addresses = addresses.concat(window.selectedItemsInShape);
    } else {
      // Fallback to all loaded addresses
      const loadedAddresses = window.addresses || window.currentlyDisplayedItems || [];
      addresses = addresses.concat(loadedAddresses);
    }
    
    return addresses;
  }

  async handleCreateRoute() {
    console.log('🚀 Creating optimized route...');
    
    const loadedAddresses = this.getLoadedAddresses();
    console.log('📍 Loaded addresses:', loadedAddresses);
    
    if (loadedAddresses.length < 1) {
      alert('Please add at least one address to create a route.');
      return;
    }

    // Show loading state
    const createRouteBtn = document.getElementById('createRouteBtn');
    const originalText = createRouteBtn.textContent;
    createRouteBtn.disabled = true;
    createRouteBtn.textContent = '⏳ Processing Route...';

    try {
      // Geocode any addresses that don't have coordinates (like the starting address)
      const addressesToGeocode = loadedAddresses.filter(addr => 
        !addr.lat || !addr.lng || typeof addr.lat !== 'number' || typeof addr.lng !== 'number'
      );
      
      if (addressesToGeocode.length > 0) {
        console.log('🌍 Geocoding', addressesToGeocode.length, 'addresses...');
        createRouteBtn.textContent = '🌍 Geocoding Addresses...';
        
        if (typeof window.geocodeAddresses === 'function') {
          await window.geocodeAddresses(loadedAddresses);
        }
      }
      
      // Filter out addresses that still don't have coordinates
      const validAddresses = loadedAddresses.filter(addr => 
        (addr.lat || addr.latitude) && (addr.lng || addr.longitude) &&
        typeof (addr.lat || addr.latitude) === 'number' && 
        typeof (addr.lng || addr.longitude) === 'number'
      );
      
      console.log('📍 Valid addresses with coordinates:', validAddresses.length, 'of', loadedAddresses.length);
      
      if (validAddresses.length === 0) {
        alert('No addresses could be geocoded. Please check your addresses and try again.');
        return;
      }
      
      // Optimize the route if we have multiple addresses
      let optimizedRoute = validAddresses;
      if (validAddresses.length > 1) {
        console.log('🔄 Optimizing route order...');
        createRouteBtn.textContent = '🔄 Optimizing Route Order...';
        optimizedRoute = await this.optimizeRouteOrder(validAddresses);
      }
      
      // Display the optimized route
      console.log('📍 Displaying optimized route with', optimizedRoute.length, 'addresses...');
      this.displayOptimizedRoute(optimizedRoute);
      createRouteBtn.textContent = '✅ Route Created!';
      
      // Hide any progress overlays that might still be visible
      this.hideProgressOverlays();
      
      // Reset button after 2 seconds
      setTimeout(() => {
        createRouteBtn.textContent = originalText;
        createRouteBtn.disabled = false;
      }, 2000);
      
    } catch (error) {
      console.error('❌ Route creation failed:', error);
      alert('Failed to create route. Please try again.');
      
      // Hide any progress overlays in error case too
      this.hideProgressOverlays();
      
      createRouteBtn.textContent = originalText;
      createRouteBtn.disabled = false;
    }
  }

  async optimizeRouteOrder(addresses) {
    try {
      // Separate starting address from the rest
      const startingAddress = addresses.find(addr => addr.isStartingAddress);
      const otherAddresses = addresses.filter(addr => !addr.isStartingAddress);
      
      // If we only have a starting address or one other address, no optimization needed
      if (otherAddresses.length <= 1) {
        console.log('⚠️ Not enough addresses to optimize, returning original order');
        return addresses;
      }
      
      // Prepare addresses for the optimization API
      const addressStrings = [];
      
      if (startingAddress) {
        addressStrings.push(startingAddress.address); // Origin
      }
      
      // Add other addresses as waypoints
      otherAddresses.forEach(addr => {
        addressStrings.push(addr.address);
      });
      
      // Add starting address as destination for round trip (if we have one)
      if (startingAddress) {
        addressStrings.push(startingAddress.address);
      }
      
      console.log('🚀 Calling optimization API with addresses:', addressStrings);
      
      // Call the route optimization API
      const response = await fetch('https://googlemaps-fastest-route-1.onrender.com/optimize-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addresses: addressStrings }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error', details: response.statusText }));
        throw new Error(`HTTP error ${response.status}: ${errorData.error}`);
      }

      const result = await response.json();
      console.log('✅ Optimization API response:', result);
      
      if (result.order && Array.isArray(result.order)) {
        // Reconstruct optimized route using the order from API
        const optimizedRoute = [];
        
        // Add starting address first (if we have one)
        if (startingAddress) {
          optimizedRoute.push(startingAddress);
        }
        
        // Add other addresses in optimized order
        result.order.forEach(orderIndex => {
          if (orderIndex < otherAddresses.length) {
            optimizedRoute.push(otherAddresses[orderIndex]);
          }
        });
        
        console.log(`✅ Route optimized: ${optimizedRoute.length} stops in optimal order`);
        return optimizedRoute;
      } else {
        console.warn('⚠️ API returned invalid order, using original order');
        return addresses;
      }
      
    } catch (error) {
      console.error('❌ Route optimization failed:', error);
      console.log('⚠️ Falling back to original order');
      return addresses; // Fallback to original order
    }
  }

  async optimizeRoute(startAddress, waypoints) {
    try {
      // Use the existing route optimizer
      if (window.routeOptimizer) {
        const start = startAddress.address;
        const waypointAddresses = waypoints.map(wp => wp.address);
        
        console.log(`📍 Optimizing route: ${start} → ${waypointAddresses.length} waypoints`);
        
        const result = await window.routeOptimizer.optimizeRoute(start, waypointAddresses);
        
        if (result && result.success) {
          // Reconstruct the optimized route with full address data
          const optimizedRoute = [startAddress]; // Start with the first address
          
          // Add waypoints in optimized order
          result.optimizedOrder.forEach(waypointAddress => {
            const waypoint = waypoints.find(wp => wp.address === waypointAddress);
            if (waypoint) {
              optimizedRoute.push(waypoint);
            }
          });
          
          console.log(`✅ Route optimized: ${optimizedRoute.length} stops`);
          return optimizedRoute;
        }
      }
      
      // Fallback: return addresses in original order
      console.log('⚠️ Using fallback route order');
      return [startAddress, ...waypoints];
      
    } catch (error) {
      console.error('❌ Route optimization error:', error);
      return [startAddress, ...waypoints]; // Fallback to original order
    }
  }

  displayOptimizedRoute(optimizedRoute) {
    console.log('🗺️ Displaying optimized route on map...');
    console.log('📍 Route data:', optimizedRoute);
    console.log('🗺️ Map available:', !!window.map);
    
    // Clear any existing route
    this.clearRoute();
    
    this.optimizedRoute = optimizedRoute;
    
    // Display home marker for starting address if it exists
    this.displayHomeMarkerForRoute(optimizedRoute);
    
    // Enhance existing markers with route information instead of creating new ones
    this.enhanceExistingMarkersWithRoute(optimizedRoute);
    
    // Draw route line connecting all stops
    this.drawRouteLine(optimizedRoute);
    
    // Fit map to show entire route
    this.fitMapToRoute(optimizedRoute);
    
    console.log(`✅ Route displayed with ${optimizedRoute.length} enhanced markers`);
  }

  displayHomeMarkerForRoute(optimizedRoute) {
    // Find the starting address in the route
    const startingAddress = optimizedRoute.find(addr => addr.isStartingAddress) || optimizedRoute[0];
    
    if (!startingAddress) {
      console.warn('🏠 No starting address found for home marker');
      return;
    }
    
    // Get coordinates (handle both lat/lng and latitude/longitude formats)
    const lat = startingAddress.lat || startingAddress.latitude;
    const lng = startingAddress.lng || startingAddress.longitude;
    
    if (!lat || !lng || typeof lat !== 'number' || typeof lng !== 'number') {
      console.warn('🏠 Starting address has no valid coordinates for home marker:', startingAddress);
      return;
    }
    
    // Display home marker using the global function
    if (typeof window.displayHomeMarker === 'function') {
      console.log('🏠 Displaying home marker for starting address:', startingAddress.address);
      window.displayHomeMarker(startingAddress.address, lat, lng);
    } else {
      console.warn('🏠 displayHomeMarker function not available');
    }
  }

  enhanceExistingMarkersWithRoute(route) {
    console.log('🎯 Enhancing existing markers with route information...');
    
    // Get existing markers from the addressMarkersArray
    if (!window.addressMarkersArray || window.addressMarkersArray.length === 0) {
      console.warn('⚠️ No existing address markers found, falling back to creating new markers');
      this.createNumberedMarkers(route);
      return;
    }
    
    // Create route order map for easy lookup
    const routeOrderMap = new Map();
    route.forEach((address, index) => {
      const addressKey = address.address.toLowerCase().trim();
      routeOrderMap.set(addressKey, {
        order: index + 1,
        isStart: address.isStartingAddress || index === 0,
        address: address
      });
    });
    
    console.log('📍 Route order map created with', routeOrderMap.size, 'entries');
    
    // Enhance each existing marker that's part of the route
    window.addressMarkersArray.forEach(marker => {
      if (marker.customData && marker.customData.address) {
        const markerAddressKey = marker.customData.address.toLowerCase().trim();
        const routeInfo = routeOrderMap.get(markerAddressKey);
        
        if (routeInfo) {
          console.log(`✅ Enhancing marker for ${marker.customData.address} - Route position ${routeInfo.order}`);
          
          // Update marker icon to show route number
          const numberedIcon = this.createRouteNumberIcon(routeInfo.order, routeInfo.isStart);
          marker.setIcon(numberedIcon);
          
          // Enhance popup content with route information
          this.enhanceMarkerPopup(marker, routeInfo);
          
          // Store route info in marker
          marker.routeInfo = routeInfo;
          
          // Add to route markers for cleanup
          this.routeMarkers.push(marker);
        }
      }
    });
    
    console.log(`✅ Enhanced ${this.routeMarkers.length} existing markers with route information`);
  }
  
  createRouteNumberIcon(routeNumber, isStart = false) {
    const size = 35;
    const backgroundColor = isStart ? '#dc3545' : '#28a745'; // Red for start, green for route stops
    const textColor = 'white';
    
    // Create SVG with route number overlay on the standard marker
    const svgIcon = `
      <svg width="${size}" height="${size + 10}" viewBox="0 0 ${size} ${size + 10}" xmlns="http://www.w3.org/2000/svg">
        <!-- Standard marker shape -->
        <path d="M${size/2} 5C${size/4} 5 5 ${size/4} 5 ${size/2}C5 ${size*0.75} ${size/2} ${size + 5} ${size/2} ${size + 5}S${size-5} ${size*0.75} ${size-5} ${size/2}C${size-5} ${size/4} ${size*0.75} 5 ${size/2} 5Z" 
              fill="#2E86AB" stroke="white" stroke-width="2"/>
        <!-- Route number circle -->
        <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="${backgroundColor}" stroke="white" stroke-width="2"/>
        <!-- Route number text or home icon -->
        ${isStart ? 
          // Home icon for starting address - simple house icon
          `<g transform="translate(${size/2 - 7}, ${size/2 - 7})">
            <path d="M7 1L1 7v6h3v-3h6v3h3V7L7 1z" fill="${textColor}" stroke="none"/>
            <rect x="6" y="10" width="2" height="3" fill="${textColor}"/>
          </g>` :
          // Route number for stops
          `<text x="${size/2}" y="${size/2}" text-anchor="middle" dy="0.35em" 
                 fill="${textColor}" font-size="${size/3.5}" font-weight="bold" font-family="Arial, sans-serif">
             ${routeNumber}
           </text>`
        }
      </svg>
    `;
    
    return L.divIcon({
      html: svgIcon,
      className: 'route-enhanced-marker',
      iconSize: [size, size + 10],
      iconAnchor: [size/2, size + 5],
      popupAnchor: [0, -(size + 5)]
    });
  }
  
  enhanceMarkerPopup(marker, routeInfo) {
    // Get the original popup content structure but enhance it
    const address = marker.customData.address;
    const item = marker.customData;
    
    // Get visit information
    const visitData = this.getVisitInfo(address);
    
    // Create enhanced popup content with route information
    let popupHtml = `<div style="min-width: 250px;">`;
    
    // Route information header
    popupHtml += `<div style="background: ${routeInfo.isStart ? '#dc3545' : '#28a745'}; color: white; padding: 8px; margin: -10px -10px 10px -10px; border-radius: 4px 4px 0 0; text-align: center; font-weight: bold;">`;
    popupHtml += routeInfo.isStart ? '🏠 HOME (START)' : `📍 STOP #${routeInfo.order}`;
    popupHtml += `</div>`;
    
    // Address information
    if (item.name) popupHtml += `<strong>${item.name}</strong><br>`;
    popupHtml += `<strong>${address}</strong>`;
    if (item.auctionDateFormatted) popupHtml += `<br><span style="color:#0077b6;">(${item.auctionDateFormatted})</span>`;
    
    // Visit status
    popupHtml += `<br><div style="margin-top: 8px; padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 0.9rem;">`;
    popupHtml += `<strong>Visit Status:</strong><br>${visitData.lastVisitFormatted}`;
    if (visitData.visitCount > 0) {
      popupHtml += `<br>Total visits: ${visitData.visitCount}`;
    }
    popupHtml += `</div>`;

    // Action buttons with navigation
    popupHtml += `<div style="margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">`;
    
    // Navigate button (prominent)
    popupHtml += `<button onclick="window.desktopRouteCreator.openGoogleMapsNavigation('${address.replace(/'/g, "\\'")}'); return false;" 
                   style="grid-column: 1 / -1; padding: 10px 12px; background: #4285f4; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.95rem; font-weight: 600;">
                   🧭 Navigate Here
                 </button>`;
    
    // Visit and Notes buttons
    popupHtml += `<button onclick="markVisitedFromMap('${address.replace(/'/g, "\\'")}'); return false;" 
                   style="padding: 8px 10px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                   ✅ Visited
                 </button>`;

    popupHtml += `<button onclick="openNotesFromMap('${address.replace(/'/g, "\\'")}'); return false;" 
                   style="padding: 8px 10px; background: #6f42c1; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                   📝 Notes
                 </button>`;
    
    popupHtml += `</div></div>`;
    
    // Update the marker's popup
    marker.bindPopup(popupHtml);
  }
  
  getVisitInfo(address) {
    try {
      if (typeof window.userVisits === 'undefined') return { lastVisitFormatted: 'Never visited', visitCount: 0 };
      
      const addressHash = window.generateAddressHash ? window.generateAddressHash(address) : address.toLowerCase().replace(/[^a-z0-9]/g, '');
      const visitData = window.userVisits[addressHash];
      
      if (!visitData) return { lastVisitFormatted: 'Never visited', visitCount: 0 };
      
      return {
        visitCount: visitData.visitCount || 0,
        lastVisitFormatted: visitData.lastVisited ? new Date(visitData.lastVisited).toLocaleDateString() : 'Never visited'
      };
    } catch (error) {
      console.error('Error getting visit info:', error);
      return { lastVisitFormatted: 'Never visited', visitCount: 0 };
    }
  }

  createNumberedMarkers(route) {
    this.routeMarkers = [];
    console.log('🎯 Creating numbered markers for route:', route.length, 'addresses');
    
    route.forEach((address, index) => {
      console.log(`📍 Processing address ${index + 1}:`, address);
      
      // Check for coordinates in multiple formats (latitude/longitude OR lat/lng)
      const latitude = address.latitude || address.lat;
      const longitude = address.longitude || address.lng;
      
      if (latitude && longitude && typeof latitude === 'number' && typeof longitude === 'number') {
        console.log(`✅ Address ${index + 1} has coordinates:`, latitude, longitude);
        const markerNumber = index + 1;
        
        // Create custom numbered marker icon
        const numberedIcon = this.createNumberedIcon(markerNumber, index === 0);
        
        const marker = L.marker([latitude, longitude], {
          icon: numberedIcon,
          zIndexOffset: 1000 // Ensure route markers appear above regular markers
        });
        
        // Create popup with route information
        const popupContent = `
          <div style="text-align: center; min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: #333;">
              ${index === 0 ? '🏁 START' : `Stop #${markerNumber}`}
            </h4>
            <p style="margin: 0 0 8px 0; font-weight: 500;">
              ${address.address}
            </p>
            ${address.firstName || address.lastName ? 
              `<p style="margin: 0 0 8px 0; color: #666;">
                ${address.firstName || ''} ${address.lastName || ''}
              </p>` : ''
            }
            <button onclick="window.desktopRouteCreator.openGoogleMapsNavigation('${address.address}')" 
                    style="background: #4285f4; color: white; border: none; padding: 8px 16px; 
                           border-radius: 4px; cursor: pointer; font-size: 14px; margin-top: 4px;">
              🧭 Navigate Here
            </button>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        marker.addTo(window.map);
        
        this.routeMarkers.push(marker);
      }
    });
  }

  createNumberedIcon(number, isStart = false) {
    const size = 32;
    const color = isStart ? '#dc3545' : '#28a745'; // Red for start, green for stops
    const textColor = 'white';
    
    // Create SVG icon with number
    const svgIcon = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="${size/2}" y="${size/2}" text-anchor="middle" dy="0.35em" 
              fill="${textColor}" font-size="${size/2.2}" font-weight="bold" font-family="Arial, sans-serif">
          ${isStart ? '★' : number}
        </text>
      </svg>
    `;
    
    return L.divIcon({
      html: svgIcon,
      className: 'numbered-route-marker',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
      popupAnchor: [0, -size/2]
    });
  }

  drawRouteLine(route) {
    const routePoints = route
      .filter(address => (address.latitude || address.lat) && (address.longitude || address.lng))
      .map(address => [address.latitude || address.lat, address.longitude || address.lng]);
    
    if (routePoints.length > 1) {
      this.routePolyline = L.polyline(routePoints, {
        color: '#007bff',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 5'
      }).addTo(window.map);
    }
  }

  fitMapToRoute(route) {
    const routePoints = route
      .filter(address => (address.latitude || address.lat) && (address.longitude || address.lng))
      .map(address => [address.latitude || address.lat, address.longitude || address.lng]);
    
    if (routePoints.length > 0) {
      const group = new L.featureGroup(this.routeMarkers);
      window.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  clearRoute() {
    console.log('🗑️ Clearing route display...');
    
    // Don't clear home marker - it should persist since it represents the starting address
    
    // Restore original marker icons and popups for enhanced markers
    this.routeMarkers.forEach(marker => {
      if (marker.routeInfo) {
        // This is an enhanced existing marker, restore it
        console.log('🔄 Restoring original marker for', marker.customData.address);
        
        // Restore original icon
        const originalColor = this.getOriginalMarkerColor(marker.customData);
        const originalIcon = window.createCustomMarkerIcon ? window.createCustomMarkerIcon(originalColor) : null;
        if (originalIcon) {
          marker.setIcon(originalIcon);
        }
        
        // Restore original popup
        if (typeof window.createMarkerPopupContent === 'function') {
          const visitData = this.getVisitInfo(marker.customData.address);
          const popupContent = window.createMarkerPopupContent(
            marker.customData, 
            visitData.lastVisitFormatted, 
            visitData.visitCount
          );
          marker.bindPopup(popupContent);
        }
        
        // Remove route info
        delete marker.routeInfo;
      } else {
        // This is a new route marker, remove it completely
        if (window.map) {
          window.map.removeLayer(marker);
        }
      }
    });
    
    this.routeMarkers = [];
    
    // Remove route line
    if (this.routePolyline && window.map) {
      window.map.removeLayer(this.routePolyline);
      this.routePolyline = null;
    }
    
    this.optimizedRoute = null;
    
    // Update button state
    this.updateButtonState();
  }
  
  getOriginalMarkerColor(markerData) {
    // Get the original marker color based on visit status
    if (typeof window.getMarkerColor === 'function') {
      const visitData = this.getVisitInfo(markerData.address);
      
      // Calculate days since last visit
      let daysSince = null;
      if (visitData.visitCount > 0 && visitData.lastVisitFormatted !== 'Never visited') {
        const lastVisitDate = new Date(visitData.lastVisitFormatted);
        const today = new Date();
        daysSince = Math.floor((today - lastVisitDate) / (1000 * 60 * 60 * 24));
      }
      
      const colorInfo = window.getMarkerColor(daysSince, visitData.visitCount);
      return colorInfo.color;
    }
    
    // Fallback to default blue
    return '#2E86AB';
  }

  hideProgressOverlays() {
    // Hide the global geocoding progress overlay
    const globalProgressContainer = document.getElementById('globalGeocodingProgress');
    if (globalProgressContainer) {
      globalProgressContainer.classList.remove('active');
      console.log('✅ Hidden global geocoding progress overlay');
    }
    
    // Also hide any modal progress indicators
    const modalProgressContainer = document.getElementById('geocodingProgress');
    if (modalProgressContainer) {
      modalProgressContainer.classList.remove('active');
    }
    
    // Call the global function if available
    if (typeof window.hideGeocodingProgress === 'function') {
      window.hideGeocodingProgress();
    }
  }

  openGoogleMapsNavigation(address) {
    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    
    console.log(`🧭 Opening navigation to: ${address}`);
    window.open(googleMapsUrl, '_blank');
  }

  // Public API for other modules
  getOptimizedRoute() {
    return this.optimizedRoute;
  }

  hasActiveRoute() {
    return this.optimizedRoute !== null;
  }
}

// Initialize when DOM is ready
// Initialize desktop route creator and make it globally available
document.addEventListener('DOMContentLoaded', () => {
  window.desktopRouteCreator = new DesktopRouteCreator();
});

// Also initialize if DOM is already loaded
if (document.readyState !== 'loading') {
  window.desktopRouteCreator = new DesktopRouteCreator();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DesktopRouteCreator;
}
