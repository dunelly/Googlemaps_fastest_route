// MarkerManager - Handles all map markers and visual route display
class MarkerManager {
  constructor() {
    this.routeMarkers = [];
    this.homeMarker = null;
    this.routePolyline = null;
    this.currentActiveMarker = null;
  }

  // Display route markers and polyline
  displayRoute(route) {
    console.log('📍 MarkerManager: Displaying route with', route.length, 'stops');
    
    try {
      // Clear existing route visuals
      this.clearRouteDisplay();
      
      // Hide original address markers to prevent overlap
      this.hideOriginalAddressMarkers();
      
      // Create numbered markers for the route
      this.createRouteMarkers(route);
      
      // Draw the route line
      this.drawRouteLine(route);
      
      // Display home marker
      this.displayHomeMarker(route);
      
      // Fit map to show the entire route
      this.fitMapToRoute();
      
      console.log('✅ MarkerManager: Route display completed');
      
    } catch (error) {
      console.error('❌ MarkerManager: Failed to display route:', error);
      throw error;
    }
  }

  // Create numbered markers for route stops
  createRouteMarkers(route) {
    this.routeMarkers = [];
    
    route.forEach((stop, index) => {
      if (typeof stop.lat !== 'number' || typeof stop.lng !== 'number') {
        console.warn('MarkerManager: Skipping stop with invalid coordinates:', stop.address);
        return;
      }

      const isStart = stop.isStartingAddress || index === 0;
      const routeNumber = index + 1;
      
      // Create the marker icon
      const icon = this.createRouteNumberIcon(routeNumber, isStart);
      
      // Create the marker
      const marker = L.marker([stop.lat, stop.lng], { icon })
        .addTo(window.map);
      
      // Store route information on the marker
      marker.routeInfo = {
        order: routeNumber,
        isStart: isStart,
        address: stop.address,
        originalData: stop
      };
      
      // Enhanced popup with visit information
      this.enhanceMarkerPopup(marker, stop);
      
      this.routeMarkers.push(marker);
    });
    
    console.log(`📍 MarkerManager: Created ${this.routeMarkers.length} route markers`);
  }

  // Create numbered icon for route markers
  createRouteNumberIcon(routeNumber, isStart = false) {
    const size = 32;
    const backgroundColor = isStart ? '#28a745' : '#007bff';
    const textColor = 'white';
    const borderColor = '#fff';

    const svgIcon = `
      <svg width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}" xmlns="http://www.w3.org/2000/svg">
        <path d="M${size/2} 4C${size/4} 4 4 ${size/4} 4 ${size/2}C4 ${size*0.75} ${size/2} ${size + 4} ${size/2} ${size + 4}S${size-4} ${size*0.75} ${size-4} ${size/2}C${size-4} ${size/4} ${size*0.75} 4 ${size/2} 4Z" 
              fill="#2E86AB" stroke="${borderColor}" stroke-width="2"/>
        <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="${backgroundColor}" stroke="white" stroke-width="1.5"/>
        ${isStart ? 
          `<g transform="translate(${size/2 - 7}, ${size/2 - 7}) scale(0.9)"> 
            <path d="M8 2L2 7v7h3v-4h6v4h3V7L8 2z" fill="${textColor}" stroke="none"/>
            <rect x="7" y="10" width="2" height="4" fill="${textColor}"/>
          </g>` :
          `<text x="${size/2}" y="${size/2}" text-anchor="middle" dy="0.35em" 
                 fill="${textColor}" font-size="${size/3}" font-weight="bold" font-family="Arial, sans-serif">
             ${routeNumber}
           </text>`
        }
      </svg>
    `;
    
    return L.divIcon({
      html: svgIcon,
      className: 'route-marker',
      iconSize: [size, size + 8],
      iconAnchor: [size/2, size + 4],
      popupAnchor: [0, -(size + 4)]
    });
  }

  // Create active/highlighted marker icon
  createActiveRouteNumberIcon(routeNumber, isStart = false) {
    const size = 38; // Slightly larger for active
    const backgroundColor = isStart ? '#ffc107' : '#17a2b8';
    const textColor = 'white';
    const borderColor = '#343a40';

    const svgIcon = `
      <svg width="${size}" height="${size + 10}" viewBox="0 0 ${size} ${size + 10}" xmlns="http://www.w3.org/2000/svg">
        <path d="M${size/2} 5C${size/4} 5 5 ${size/4} 5 ${size/2}C5 ${size*0.75} ${size/2} ${size + 5} ${size/2} ${size + 5}S${size-5} ${size*0.75} ${size-5} ${size/2}C${size-5} ${size/4} ${size*0.75} 5 ${size/2} 5Z" 
              fill="#2E86AB" stroke="${borderColor}" stroke-width="2.5"/>
        <circle cx="${size/2}" cy="${size/2}" r="${size/3 + 2}" fill="${backgroundColor}" stroke="white" stroke-width="2.5"/>
        ${isStart ? 
          `<g transform="translate(${size/2 - 9}, ${size/2 - 9}) scale(1.1)"> 
            <path d="M8 2L2 7v7h3v-4h6v4h3V7L8 2z" fill="${textColor}" stroke="none"/>
            <rect x="7" y="10" width="2" height="4" fill="${textColor}"/>
          </g>` :
          `<text x="${size/2}" y="${size/2}" text-anchor="middle" dy="0.35em" 
                 fill="${textColor}" font-size="${size/3.2}" font-weight="bold" font-family="Arial, sans-serif">
             ${routeNumber}
           </text>`
        }
      </svg>
    `;
    
    return L.divIcon({
      html: svgIcon,
      className: 'route-marker active-route-marker',
      iconSize: [size, size + 10],
      iconAnchor: [size/2, size + 5],
      popupAnchor: [0, -(size + 5)]
    });
  }

  // Enhanced popup with visit information and full functionality
  enhanceMarkerPopup(marker, stopData) {
    const visitInfo = this.getVisitInfo(stopData.address);
    
    
    let popupContent = `<div style="min-width: 220px;">`;
    
    // Try to get name from stopData first, then look up in Excel data
    let displayName = null;
    if (stopData.name) {
      displayName = stopData.name;
    } else if (stopData['Borrower Name']) {
      displayName = stopData['Borrower Name'];
    } else if (stopData.borrowerName) {
      displayName = stopData.borrowerName;
    } else if (stopData['Property Owner']) {
      displayName = stopData['Property Owner'];
    } else if (stopData.propertyOwner) {
      displayName = stopData.propertyOwner;
    } else if (stopData.owner) {
      displayName = stopData.owner;
    } else if (stopData.firstName && stopData.lastName) {
      displayName = `${stopData.firstName} ${stopData.lastName}`;
    } else if (stopData.firstName) {
      displayName = stopData.firstName;
    } else if (stopData.lastName) {
      displayName = stopData.lastName;
    } else {
      // If no name in stopData, look up in the currently displayed Excel data
      displayName = this.lookupNameFromExcelData(stopData.address);
    }
    
    // Display name prominently like original markers
    if (displayName) {
      popupContent += `<strong>${displayName}</strong><br>`;
    }
    
    // Display address
    popupContent += `<strong>${stopData.address}</strong>`;
    
    // Display auction date if available
    if (stopData.auctionDateFormatted) {
      popupContent += `<br><span style="color:#0077b6;">(${stopData.auctionDateFormatted})</span>`;
    }
    
    // Add detailed visit info
    popupContent += `<div style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 0.9rem;">`;
    popupContent += `<strong>Visit Status:</strong><br>`;
    popupContent += `${visitInfo.lastVisitFormatted}`;
    if (visitInfo.visitCount > 0) {
      popupContent += `<br>Total visits: ${visitInfo.visitCount}`;
    }
    popupContent += `</div>`;

    // Add inline notes section
    const currentNote = window.getNoteForAddress ? window.getNoteForAddress(stopData.address) : '';
    const isAuthenticated = firebase.auth().currentUser;
    
    popupContent += `<div style="margin: 10px 0;">`;
    popupContent += `<div style="display: flex; align-items: center; margin-bottom: 4px;">`;
    popupContent += `<strong style="font-size: 0.9rem; color: #2c3e50;">📝 Notes:</strong>`;
    popupContent += `</div>`;
    
    if (isAuthenticated) {
      const uniqueId = 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const placeholder = 'Click to add notes...';
      const displayText = currentNote || placeholder;
      
      popupContent += `<div id="${uniqueId}_container" style="position: relative;">`;
      popupContent += `<textarea id="${uniqueId}" 
                        style="width: 100%; min-height: 60px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem; resize: vertical; background: ${currentNote ? '#fff' : '#f8f9fa'}; color: ${currentNote ? '#333' : '#999'};"
                        placeholder="${placeholder}"
                        onfocus="this.style.background='#fff'; this.style.color='#333'; if(!this.value.trim()) this.placeholder='';"
                        onblur="window.handleNoteBlur('${stopData.address.replace(/'/g, "\\'")}', '${uniqueId}');"
                        >${currentNote}</textarea>`;
      popupContent += `<div id="${uniqueId}_status" style="font-size: 0.8rem; color: #666; margin-top: 2px; min-height: 16px;"></div>`;
      popupContent += `</div>`;
    } else {
      popupContent += `<div style="padding: 8px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem; color: #666; text-align: center;">`;
      if (currentNote) {
        popupContent += `"${currentNote}"<br><small style="color: #999;">Sign in to edit notes</small>`;
      } else {
        popupContent += `<small>Sign in to add notes</small>`;
      }
      popupContent += `</div>`;
    }
    
    popupContent += `</div>`;

    // Add action buttons (removed Notes button since it's now inline)
    popupContent += `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
    
    // First row: Visit button only
    popupContent += `<div style="display: flex; gap: 8px;">`;
    popupContent += `<button onclick="markVisitedFromMap('${stopData.address.replace(/'/g, "\\'")}'); return false;" 
                     style="flex: 1; padding: 8px 12px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: 600;">
                     ✅ Check In
                   </button>`;
    popupContent += `</div>`;
    
    // Second row: Navigation button
    popupContent += `<button onclick="window.markerManager.openGoogleMapsNavigation('${stopData.address.replace(/'/g, "\\'")}')" 
                     style="width: 100%; padding: 8px 12px; background: #4285f4; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                     🗺️ Navigate with Google Maps
                   </button>`;
    
    popupContent += `</div></div>`;
    
    marker.bindPopup(popupContent);
  }

  // Get visit information for an address
  getVisitInfo(address) {
    const defaultInfo = {
      visitCount: 0,
      lastVisitFormatted: 'Never visited'
    };

    try {
      if (typeof window.getVisitInfo === 'function') {
        return window.getVisitInfo(address) || defaultInfo;
      }
    } catch (error) {
      console.warn('MarkerManager: Failed to get visit info:', error);
    }

    return defaultInfo;
  }

  // Display home marker for the starting address
  displayHomeMarker(route) {
    if (!route || route.length === 0) return;
    
    const startingAddress = route.find(addr => addr.isStartingAddress) || route[0];
    
    if (typeof startingAddress.lat !== 'number' || typeof startingAddress.lng !== 'number') {
      console.warn('MarkerManager: Cannot display home marker - invalid coordinates');
      return;
    }

    // Remove existing home marker
    if (this.homeMarker) {
      window.map.removeLayer(this.homeMarker);
    }

    // Create home icon
    const homeIcon = L.divIcon({
      html: `
        <div style="background: #28a745; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          <span style="color: white; font-size: 12px;">🏠</span>
        </div>
      `,
      className: 'home-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    this.homeMarker = L.marker([startingAddress.lat, startingAddress.lng], { icon: homeIcon })
      .addTo(window.map)
      .bindPopup(`<strong>Starting Point:</strong><br>${startingAddress.address}`);

    console.log('🏠 MarkerManager: Home marker displayed');
  }

  // Draw route line connecting all stops
  drawRouteLine(route) {
    const validCoordinates = route
      .filter(stop => typeof stop.lat === 'number' && typeof stop.lng === 'number')
      .map(stop => [stop.lat, stop.lng]);

    if (validCoordinates.length < 2) {
      console.warn('MarkerManager: Not enough valid coordinates to draw route line');
      return;
    }

    this.routePolyline = L.polyline(validCoordinates, {
      color: '#007bff',
      weight: 4,
      opacity: 0.8,
      smoothFactor: 1.5
    }).addTo(window.map);

    console.log(`📍 MarkerManager: Route line drawn with ${validCoordinates.length} points`);
  }

  // Fit map view to show entire route
  fitMapToRoute() {
    if (this.routeMarkers.length === 0) return;

    const group = new L.featureGroup(this.routeMarkers);
    window.map.fitBounds(group.getBounds().pad(0.1), {
      maxZoom: 14 // Prevent zooming too deep on clustered addresses
    });
    
    console.log('📍 MarkerManager: Map fitted to route bounds with max zoom 14');
  }

  // Set a specific marker as active
  setActiveMarker(index) {
    if (index < 0 || index >= this.routeMarkers.length) {
      console.warn('MarkerManager: Invalid marker index:', index);
      return;
    }

    // Revert previous active marker
    if (this.currentActiveMarker && this.currentActiveMarker.routeInfo) {
      const routeInfo = this.currentActiveMarker.routeInfo;
      this.currentActiveMarker.setIcon(this.createRouteNumberIcon(routeInfo.order, routeInfo.isStart));
    }

    // Set new active marker
    const targetMarker = this.routeMarkers[index];
    if (targetMarker && targetMarker.routeInfo) {
      const routeInfo = targetMarker.routeInfo;
      targetMarker.setIcon(this.createActiveRouteNumberIcon(routeInfo.order, routeInfo.isStart));
      this.currentActiveMarker = targetMarker;
      
      console.log(`📍 MarkerManager: Set marker ${index} as active`);
    }
  }

  // Clear all route visuals
  clearRouteDisplay() {
    console.log('🗑️ MarkerManager: Clearing route display');
    
    // Remove route markers
    this.routeMarkers.forEach(marker => {
      if (window.map.hasLayer(marker)) {
        window.map.removeLayer(marker);
      }
    });
    this.routeMarkers = [];

    // Remove route polyline
    if (this.routePolyline && window.map.hasLayer(this.routePolyline)) {
      window.map.removeLayer(this.routePolyline);
      this.routePolyline = null;
    }

    // Remove home marker
    if (this.homeMarker && window.map.hasLayer(this.homeMarker)) {
      window.map.removeLayer(this.homeMarker);
      this.homeMarker = null;
    }

    this.currentActiveMarker = null;
    
    // Show original address markers again when route is cleared
    this.showOriginalAddressMarkers();
  }

  // Hide original address markers to prevent overlap with route markers
  hideOriginalAddressMarkers() {
    if (window.addressMarkersArray && window.addressMarkersArray.length > 0) {
      console.log('📍 MarkerManager: Hiding', window.addressMarkersArray.length, 'original address markers');
      window.addressMarkersArray.forEach(marker => {
        if (marker && window.map.hasLayer(marker)) {
          window.map.removeLayer(marker);
        }
      });
    }
  }

  // Show original address markers when route is cleared
  showOriginalAddressMarkers() {
    if (window.addressMarkersArray && window.addressMarkersArray.length > 0) {
      console.log('📍 MarkerManager: Showing', window.addressMarkersArray.length, 'original address markers');
      window.addressMarkersArray.forEach(marker => {
        if (marker && !window.map.hasLayer(marker)) {
          marker.addTo(window.map);
        }
      });
    }
  }

  // Open Google Maps navigation
  openGoogleMapsNavigation(address) {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    window.open(url, '_blank');
  }

  // Get route markers
  getRouteMarkers() {
    return this.routeMarkers;
  }

  // Get active marker index
  getActiveMarkerIndex() {
    if (!this.currentActiveMarker) return -1;
    return this.routeMarkers.indexOf(this.currentActiveMarker);
  }

  // Look up name from currently displayed Excel data
  lookupNameFromExcelData(address) {
    // Check if there's currently displayed Excel data
    if (typeof window.currentlyDisplayedItems !== 'undefined' && 
        window.currentlyDisplayedItems && 
        Array.isArray(window.currentlyDisplayedItems)) {
      
      // Normalize the address for comparison
      const normalizedAddress = address.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
      
      // Find matching item in Excel data
      const matchingItem = window.currentlyDisplayedItems.find(item => {
        if (!item.address) return false;
        const itemAddress = item.address.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
        return itemAddress === normalizedAddress || 
               normalizedAddress.includes(itemAddress) || 
               itemAddress.includes(normalizedAddress);
      });
      
      if (matchingItem) {
        console.log('📍 MarkerManager: Found name in Excel data for', address, ':', matchingItem.name);
        // Try multiple name field variations
        if (matchingItem.name) return matchingItem.name;
        if (matchingItem['Borrower Name']) return matchingItem['Borrower Name'];
        if (matchingItem.borrowerName) return matchingItem.borrowerName;
        if (matchingItem['Property Owner']) return matchingItem['Property Owner'];
        if (matchingItem.propertyOwner) return matchingItem.propertyOwner;
        if (matchingItem.owner) return matchingItem.owner;
        if (matchingItem.firstName && matchingItem.lastName) {
          return `${matchingItem.firstName} ${matchingItem.lastName}`;
        }
        if (matchingItem.firstName) return matchingItem.firstName;
        if (matchingItem.lastName) return matchingItem.lastName;
      }
    }
    
    return null;
  }

  // Refresh route markers with updated visit data and notes
  refreshRouteMarkers() {
    if (this.routeMarkers.length === 0) return;
    
    console.log('📍 MarkerManager: Refreshing route markers with updated visit and note data');
    
    this.routeMarkers.forEach(marker => {
      if (marker.routeInfo && marker.routeInfo.originalData) {
        this.enhanceMarkerPopup(marker, marker.routeInfo.originalData);
      }
    });
  }
}

// Export for use in other modules
window.MarkerManager = MarkerManager;

// Make marker manager globally available for popup buttons
window.markerManager = null;