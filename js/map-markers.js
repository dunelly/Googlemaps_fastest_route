// Map Markers Module - Simplified marker display functionality

// Global variable to track markers
let addressMarkersArray = [];

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

  // Add Mark as Visited button
  popupHtml += `<div style="margin-top: 10px; display: flex; gap: 8px;">`;
  popupHtml += `<button onclick="markVisitedFromMap('${item.address.replace(/'/g, "\\'")}'); return false;" 
                 style="flex: 1; padding: 8px 12px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: 600;">
                 ✅ Mark Visited
               </button>`;

  // Add Notes button
  popupHtml += `<button onclick="openNotesFromMap('${item.address.replace(/'/g, "\\'")}'); return false;" 
                 style="flex: 1; padding: 8px 12px; background: #4285F4; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                 📝 Notes
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

// Make functions and variables globally available
window.addressMarkersArray = addressMarkersArray;
window.updateMapMarkers = updateMapMarkers;
window.openNotesFromMap = openNotesFromMap;
window.markVisitedFromMap = markVisitedFromMap;
window.highlightAddressOnMap = highlightAddressOnMap;
window.createMarkerPopupContent = createMarkerPopupContent;
window.getMarkerColor = getMarkerColor;
window.createCustomMarkerIcon = createCustomMarkerIcon;
