// Address List Renderer Module - Handles complex address list rendering with visit status and notes

function updateMiddleAddresses() {
  // This function is now deprecated since we removed the checkbox selection
  // Address list functionality is handled by other modules
  console.log('[address-list-renderer] updateMiddleAddresses called - checkbox functionality removed');
}

// createAddressListItem function removed - no longer needed without checkboxes

function getAddressVisitData(address) {
  let daysSince = null;
  let visitCount = 0;
  let lastVisitFormatted = 'Never visited';
  
  if (typeof getDaysSinceLastVisit === 'function') {
    daysSince = getDaysSinceLastVisit(address);
  }
  if (typeof getVisitCount === 'function') {
    visitCount = getVisitCount(address);
  }
  if (typeof getLastVisitFormatted === 'function') {
    lastVisitFormatted = getLastVisitFormatted(address);
  }
  
  return { daysSince, visitCount, lastVisitFormatted };
}

function createAddressSpan(item, visitData) {
  const { daysSince, visitCount, lastVisitFormatted } = visitData;
  
  // Create address text with visit status
  let dText = item.address;
  if (item.name) dText = `<b>${item.name}</b> - ${dText}`;
  if (item.auctionDateFormatted) dText += ` <span style="color:#0077b6;">(${item.auctionDateFormatted})</span>`;
  
  // Add visit status info
  if (visitCount > 0) {
    let visitColor = getVisitStatusColor(daysSince);
    dText += ` <span style="color:${visitColor}; font-size: 0.9rem; font-weight: 600;">● ${lastVisitFormatted}</span>`;
  }
  
  // Address span (clickable)
  const span = document.createElement('span');
  span.innerHTML = dText;
  span.style.flex = '1';
  span.style.cursor = 'pointer';
  span.style.padding = '4px';
  span.style.borderRadius = '4px';
  span.title = 'Click to view on map and manage notes';
  
  // Apply visit-based styling
  applyVisitBasedStyling(span, daysSince);
  
  // Add click handler to highlight address on map AND open notes
  span.addEventListener('click', function(e) {
    e.stopPropagation(); // Prevent checkbox toggle
    
    // Set global current address first
    window.currentAddress = item.address;
    
    // Highlight on map
    if (typeof highlightAddressOnMap === 'function') {
      highlightAddressOnMap(item.address);
    }
    
    // Check if notes overlay is already open and switch smoothly
    const overlay = document.getElementById('notesOverlay');
    if (overlay && overlay.classList.contains('open') && typeof switchNotesToAddress === 'function') {
      switchNotesToAddress(item.address);
    } else if (typeof openNotesOverlay === 'function') {
      // Open notes overlay if not already open
      openNotesOverlay(item.address);
    }
  });
  
  return span;
}

function getVisitStatusColor(daysSince) {
  if (daysSince === 0) {
    return '#28a745'; // Green for today
  } else if (daysSince <= 3) {
    return '#ffc107'; // Yellow for 1-3 days
  } else if (daysSince <= 7) {
    return '#17a2b8'; // Blue for 4-7 days
  } else if (daysSince <= 14) {
    return '#6610f2'; // Purple for 8-14 days
  } else {
    return '#dc3545'; // Red for 15+ days
  }
}

function applyVisitBasedStyling(span, daysSince) {
  if (daysSince !== null) {
    if (daysSince === 0) {
      span.style.backgroundColor = '#d4edda';
      span.style.color = '#155724';
    } else if (daysSince <= 3) {
      span.style.backgroundColor = '#fff3cd';
      span.style.color = '#856404';
    }
  }
}


function populateAddressSelection(itemsToDisplay) {
  console.log('[address-list-renderer] populateAddressSelection called. itemsToDisplay.length:', itemsToDisplay.length);
  
  // Trigger event for desktop route creator
  document.dispatchEvent(new CustomEvent('addressesLoaded', { 
    detail: { count: itemsToDisplay.length } 
  }));
  
  // Also manually update button state as backup
  setTimeout(() => {
    if (window.desktopRouteCreator) {
      window.desktopRouteCreator.updateButtonState();
      console.log('[address-list-renderer] Manually updated Create Route button state');
    }
  }, 100);
}

// Make functions globally available
window.updateMiddleAddresses = updateMiddleAddresses;
window.populateAddressSelection = populateAddressSelection;
