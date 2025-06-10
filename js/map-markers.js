// Map Markers Module - Simplified marker display functionality

// Global variables to track markers
let addressMarkersArray = [];
let homeMarker = null;

// Function to create marker popup content
function createMarkerPopupContent(item, lastVisitFormatted, visitCount) {
  let popupHtml = `<div style="min-width: 220px;">`;
  if (item.name) popupHtml += `<strong>${item.name}</strong><br>`;
  popupHtml += `<strong>${item.address}</strong>`;
  if (item.auctionDateFormatted) popupHtml += `<br><span style="color:#0077b6;">(${item.auctionDateFormatted})</span>`;
  
  // Add detailed visit info
  popupHtml += `<br><div style="margin-top: 8px; padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 0.9rem;">`;
  popupHtml += `<strong>Visit Status:</strong><br>`;
  popupHtml += `${lastVisitFormatted}`;
  if (visitCount > 0) {
    popupHtml += `<br>Total visits: ${visitCount}`;
  }
  popupHtml += `</div>`;

  // Add Visited Today button
  popupHtml += `<div style="margin-top: 10px; display: flex; gap: 8px;">`;
  popupHtml += `<button onclick="markVisitedFromMap('${item.address.replace(/'/g, "\\'")}'); return false;" 
                 style="flex: 1; padding: 8px 12px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: 600;">
                 ✅ Visited Today
               </button>`;

  // Add Notes button
  popupHtml += `<button onclick="openNotesFromMap('${item.address.replace(/'/g, "\\'")}'); return false;" 
                 style="flex: 1; padding: 8px 12px; background: #4285F4; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                 📝 Notes
               </button>`;

  // Add "Add to Route" button
  popupHtml += `<button onclick="addAddressToRoute('${item.address.replace(/'/g, "\\'")}'); return false;" 
                 style="flex: 1; padding: 8px 12px; background: #17a2b8; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                 🚀 Add to Route
               </button>`;
  popupHtml += `</div></div>`;
  
  return popupHtml;
}

// Function to get marker color based on visit data
function getMarkerColor(daysSince, visitCount) {
  // Choose marker color based on visit recency - Blue gradient system
  let markerColor = '#2E86AB'; // Default for never visited (medium blue)
  let description = 'Never visited';
  
  if (daysSince !== null) {
    if (daysSince === 0) {
      markerColor = '#28a745'; // Visited today (green for immediate recognition)
      description = 'Visited today';
    } else if (daysSince <= 3) {
      markerColor = '#0096FF'; // 1-3 days ago (bright sky blue)
      description = '1-3 days ago';
    } else if (daysSince <= 7) {
      markerColor = '#2E86AB'; // 4-7 days ago (standard blue)
      description = '4-7 days ago';
    } else if (daysSince <= 14) {
      markerColor = '#1B4D72'; // 8-14 days ago (darker blue)
      description = '8-14 days ago';
    } else {
      markerColor = '#8B0000'; // 15+ days ago (dark red - needs urgent attention)
      description = '15+ days ago - needs attention';
    }
  }
  
  return { color: markerColor, description: description };
}

// Function to create custom SVG marker icon
function createCustomMarkerIcon(color) {
  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0Z" 
            fill="${color}" stroke="#fff" stroke-width="1"/>
      <circle cx="12.5" cy="12.5" r="6" fill="#fff"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
  });
}

// Function to create custom home icon marker
function createHomeMarkerIcon() {
  const homeIcon = `
    <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
      <!-- Marker drop shape -->
      <path d="M20 5C12.8 5 7 10.8 7 18C7 28.5 20 45 20 45S33 28.5 33 18C33 10.8 27.2 5 20 5Z" 
            fill="#FF6B35" stroke="#fff" stroke-width="2"/>
      <!-- Home icon inside -->
      <g transform="translate(11, 11)">
        <path d="M9 2L1 8v10h4v-6h8v6h4V8L9 2z" fill="#fff" stroke="none"/>
        <rect x="7" y="14" width="4" height="4" fill="#fff"/>
      </g>
    </svg>
  `;
  
  return L.divIcon({
    html: homeIcon,
    className: 'home-marker',
    iconSize: [40, 50],
    iconAnchor: [20, 45],
    popupAnchor: [0, -45]
  });
}

// Global function to open notes from map markers
function openNotesFromMap(address) {
  // Set the global currentAddress first
  window.currentAddress = address;
  
  // Check if notes overlay is already open and switch to this address
  const overlay = document.getElementById('notesOverlay');
  if (overlay && overlay.classList.contains('open') && typeof switchNotesToAddress === 'function') {
    switchNotesToAddress(address);
    return;
  }
  
  // Check if notes manager is available
  if (typeof openNotesOverlay === 'function') {
    openNotesOverlay(address);
  } else {
    if (typeof showMessage === 'function') {
      showMessage('Please sign in to add notes', 'warning');
    }
  }
}

// Global function to add address to route destination fields
function addAddressToRoute(address) {
  console.log('[map-markers] addAddressToRoute called with address:', address);
  
  // Find the destination fields container
  const fieldsContainer = document.getElementById('destinationFields');
  if (!fieldsContainer) {
    if (typeof showMessage === 'function') {
      showMessage('Destination fields not found', 'error');
    }
    return;
  }
  
  // Get all existing destination input fields
  const destinationFields = fieldsContainer.querySelectorAll('.destination-field');
  
  // Look for an empty field to fill first
  let emptyFieldFound = false;
  for (let field of destinationFields) {
    if (!field.value.trim()) {
      field.value = address;
      field.focus();
      emptyFieldFound = true;
      break;
    }
  }
  
  // If no empty field found, add a new one
  if (!emptyFieldFound) {
    if (typeof addNewDestinationFieldAboveButton === 'function') {
      addNewDestinationFieldAboveButton();
      // Get the newly created field and fill it
      const newFields = fieldsContainer.querySelectorAll('.destination-field');
      const lastField = newFields[newFields.length - 1];
      if (lastField) {
        lastField.value = address;
        lastField.focus();
      }
    } else {
      if (typeof showMessage === 'function') {
        showMessage('Unable to add new destination field', 'error');
      }
      return;
    }
  }
  
  // Switch to Plan Route tab to show the addition
  const planRouteTab = document.getElementById('planRouteTab');
  if (planRouteTab && typeof switchTab === 'function') {
    switchTab('planRoute');
  } else if (planRouteTab) {
    // Fallback: trigger click on Plan Route tab
    planRouteTab.click();
  }
  
  // Show success message
  if (typeof showMessage === 'function') {
    showMessage(`Address added to route: ${address}`, 'success');
  }
  
  console.log('[map-markers] Address successfully added to route');
}

// Global function to mark visited from map popup
function markVisitedFromMap(address) {
  console.log('[map-markers] markVisitedFromMap called with address:', address);
  
  // Set the global currentAddress for visit tracking
  window.currentAddress = address;
  
  // Check if user is signed in
  if (!firebase.auth().currentUser) {
    if (typeof showMessage === 'function') {
      showMessage('Please sign in to track visits', 'warning');
    }
    return;
  }
  
  // Call the visit tracker directly
  if (typeof markAddressAsVisited === 'function') {
    markAddressAsVisited().then(() => {
      console.log('[map-markers] Visit recorded, refreshing markers');
      // Clear the global address after successful recording
      window.currentAddress = null;
      // The map will refresh automatically via updateMapMarkers in visit-tracker.js
    }).catch(error => {
      console.error('[map-markers] Error marking visit:', error);
      if (typeof showMessage === 'function') {
        showMessage('Failed to record visit: ' + error.message, 'error');
      }
      window.currentAddress = null;
    });
  } else {
    if (typeof showMessage === 'function') {
      showMessage('Visit tracking not available', 'warning');
    }
    window.currentAddress = null;
  }
}

// Function to highlight address on map when clicked in list
function highlightAddressOnMap(address) {
  if (!addressMarkersArray || addressMarkersArray.length === 0) return;
  
  addressMarkersArray.forEach(function(marker) {
    if (marker.customData && marker.customData.address === address) {
      // Pan to marker and open popup
      window.map.setView(marker.getLatLng(), 15);
      marker.openPopup();
    }
  });
}

// Function to update map markers with current visit data
function updateMapMarkers() {
  console.log('[map-markers] updateMapMarkers called');
  if (typeof currentlyDisplayedItems !== 'undefined' && currentlyDisplayedItems && typeof displayAddressMarkers === 'function') {
    displayAddressMarkers(currentlyDisplayedItems);
  }
}

// Function to display home marker for starting address
function displayHomeMarker(address, lat, lng) {
  console.log('[map-markers] displayHomeMarker called with:', address, lat, lng);
  
  if (!window.map) {
    console.warn('[map-markers] Map not available for displayHomeMarker');
    return;
  }
  
  console.log('[map-markers] Map is available, proceeding...');
  
  // Always remove existing home marker if it exists, to prevent duplicates
  // This is now the central place for removing the old home marker before adding a new one.
  if (homeMarker) {
    console.log('[map-markers] Removing existing home marker before adding new one.');
    homeMarker.remove();
    homeMarker = null;
  }
  
  // Create home marker
  console.log('[map-markers] Creating home marker icon...');
  const homeIcon = createHomeMarkerIcon();
  console.log('[map-markers] Home icon created:', homeIcon);
  
  console.log('[map-markers] Adding marker to map at coordinates [', lat, ',', lng, ']');
  homeMarker = L.marker([lat, lng], { icon: homeIcon }).addTo(window.map);
  console.log('[map-markers] Marker added to map:', homeMarker);
  
  // Create popup content for home marker
  const popupHtml = `
    <div style="min-width: 200px;">
      <strong>🏠 Starting Location</strong><br>
      <strong>${address}</strong>
      <div style="margin-top: 8px; padding: 8px; background: #fff3cd; border-radius: 4px; font-size: 0.9rem;">
        <strong>Route Start Point</strong><br>
        This is where your route begins and ends.
      </div>
    </div>
  `;
  
  homeMarker.bindPopup(popupHtml);
  homeMarker.customData = { address: address, isHome: true };
  
  console.log('[map-markers] Home marker display completed successfully at:', address, lat, lng);
}

// Function to remove home marker
function removeHomeMarker() {
  if (homeMarker) {
    homeMarker.remove();
    homeMarker = null;
    console.log('[map-markers] Home marker removed');
  }
}

// Function to clear all markers including home marker
function clearAllMarkers(preserveHomeMarker = false) {
  // Clear address markers
  if (addressMarkersArray && addressMarkersArray.length > 0) {
    addressMarkersArray.forEach(marker => {
      if (marker && typeof marker.remove === 'function') {
        marker.remove();
      }
    });
    addressMarkersArray = [];
  }
  
  // Clear home marker only if not preserving it
  if (!preserveHomeMarker) {
    removeHomeMarker();
  }
  
  console.log('[map-markers] All markers cleared', preserveHomeMarker ? '(home marker preserved)' : '');
}

// Make functions and variables globally available
window.addressMarkersArray = addressMarkersArray;
window.homeMarker = homeMarker;
window.updateMapMarkers = updateMapMarkers;
window.openNotesFromMap = openNotesFromMap;
window.markVisitedFromMap = markVisitedFromMap;
window.addAddressToRoute = addAddressToRoute;
window.highlightAddressOnMap = highlightAddressOnMap;
window.createMarkerPopupContent = createMarkerPopupContent;
window.getMarkerColor = getMarkerColor;
window.createCustomMarkerIcon = createCustomMarkerIcon;
window.createHomeMarkerIcon = createHomeMarkerIcon;
window.displayHomeMarker = displayHomeMarker;
window.removeHomeMarker = removeHomeMarker;
window.clearAllMarkers = clearAllMarkers;
