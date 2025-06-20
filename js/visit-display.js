// Visit Display Module - UI display and formatting functions

// Update visit display in overlay
function updateVisitDisplay() {
  if (!window.currentAddress) return;
  
  const addressHash = generateAddressHash(window.currentAddress);
  const visitData = window.userVisits ? window.userVisits[addressHash] : null;
  const visitStats = document.getElementById('visitStats');
  const visitHistory = document.getElementById('visitHistory');
  const visitHistoryList = document.getElementById('visitHistoryList');
  
  if (visitStats) {
    if (visitData && visitData.visitCount > 0) {
      const daysSince = Math.floor((new Date() - new Date(visitData.lastVisited)) / (1000 * 60 * 60 * 24));
      const dayText = daysSince === 0 ? 'today' : `${daysSince} day${daysSince === 1 ? '' : 's'} ago`;
      visitStats.textContent = `${visitData.visitCount} visit${visitData.visitCount === 1 ? '' : 's'} • Last: ${dayText}`;
    } else {
      visitStats.textContent = 'Never visited';
    }
  }
  
  // Update visit history
  if (visitHistory && visitHistoryList) {
    if (visitData && visitData.visitHistory && visitData.visitHistory.length > 0) {
      visitHistory.style.display = 'block';
      visitHistoryList.innerHTML = '';
      
      // Show last 5 visits
      const recentVisits = visitData.visitHistory.slice(-5).reverse();
      recentVisits.forEach(visit => {
        const li = document.createElement('li');
        const visitDate = new Date(visit.date);
        li.innerHTML = `<span class="visit-date">${visitDate.toLocaleDateString()}</span> at ${visitDate.toLocaleTimeString()}`;
        visitHistoryList.appendChild(li);
      });
    } else {
      visitHistory.style.display = 'none';
    }
  }
}

// Get days since last visit for color coding
function getDaysSinceLastVisit(address) {
  if (!window.userVisits) return null;
  
  const addressHash = generateAddressHash(address);
  const visitData = window.userVisits[addressHash];
  
  if (!visitData || !visitData.lastVisited) {
    return null; // Never visited
  }
  
  const daysSince = Math.floor((new Date() - new Date(visitData.lastVisited)) / (1000 * 60 * 60 * 24));
  return daysSince;
}

// Get visit count for address
function getVisitCount(address) {
  if (!window.userVisits) return 0;
  
  const addressHash = generateAddressHash(address);
  const visitData = window.userVisits[addressHash];
  return visitData ? visitData.visitCount : 0;
}

// Get last visit date formatted
function getLastVisitFormatted(address) {
  if (!window.userVisits) return 'Never visited';
  
  const addressHash = generateAddressHash(address);
  const visitData = window.userVisits[addressHash];
  
  if (!visitData || !visitData.lastVisited) {
    return 'Never visited';
  }
  
  const daysSince = getDaysSinceLastVisit(address);
  if (daysSince === 0) {
    return 'Visited today';
  } else if (daysSince === 1) {
    return 'Visited yesterday';
  } else {
    return `Visited ${daysSince} days ago`;
  }
}

// Update map markers based on visit data
function updateMapMarkers() {
  console.log('[visit-display] updateMapMarkers called');
  // This will trigger the map to refresh with new colors
  if (typeof displayAddressMarkers === 'function' && typeof currentlyDisplayedItems !== 'undefined') {
    console.log('[visit-display] Refreshing map markers');
    displayAddressMarkers(currentlyDisplayedItems);
  }
}

// Update single marker color without refreshing all markers
function updateSingleMarkerColor(address) {
  console.log(`[visit-display] Updating single marker for: ${address}`);
  
  if (!window.addressMarkersArray) {
    console.log('[visit-display] No markers array found, falling back to full refresh');
    updateMapMarkers();
    return;
  }
  
  // Find the marker for this address
  const marker = window.addressMarkersArray.find(m => {
    return m.address && m.address.toLowerCase().trim() === address.toLowerCase().trim();
  });
  
  if (marker && marker.leafletMarker) {
    // Get updated visit info
    const visitInfo = getVisitInfo(address);
    const daysSince = visitInfo.daysSince;
    
    // Determine new color based on visit status
    let newColor = '#2E86AB'; // Default blue (Never visited)
    if (daysSince === 0) {
      newColor = '#28a745'; // Green (Visited today)
    } else if (daysSince !== null && daysSince <= 3) {
      newColor = '#0096FF'; // Light blue (1-3 days ago)
    } else if (daysSince !== null && daysSince <= 7) {
      newColor = '#6a994e'; // Green-blue (4-7 days ago)
    } else if (daysSince !== null && daysSince <= 14) {
      newColor = '#1B4D72'; // Dark blue (8-14 days ago)
    }
    
    // Update marker color
    marker.leafletMarker.setStyle({ fillColor: newColor, color: newColor });
    console.log(`[visit-display] Updated marker color to ${newColor} for ${address}`);
  } else {
    console.log(`[visit-display] Marker not found for ${address}, falling back to full refresh`);
    updateMapMarkers();
  }
}

// Get complete visit information for an address
function getVisitInfo(address) {
  return {
    visitCount: getVisitCount(address),
    lastVisitFormatted: getLastVisitFormatted(address),
    daysSince: getDaysSinceLastVisit(address)
  };
}

// Make functions globally available
window.getDaysSinceLastVisit = getDaysSinceLastVisit;
window.getVisitCount = getVisitCount;
window.getLastVisitFormatted = getLastVisitFormatted;
window.getVisitInfo = getVisitInfo;
window.updateVisitDisplay = updateVisitDisplay;
window.updateMapMarkers = updateMapMarkers;
window.updateSingleMarkerColor = updateSingleMarkerColor;
