// Address List Renderer Module - Handles complex address list rendering with visit status and notes

function updateMiddleAddresses() {
  const customStartAddressInput = document.getElementById('customStartAddress');
  const customEndAddressInput = document.getElementById('customEndAddress');
  const middleAddressesList = document.getElementById('middleAddressesList');
  
  if (!middleAddressesList) {
    return; // Not on upload tab
  }

  const startAddr = customStartAddressInput ? customStartAddressInput.value.trim() : '';
  const endAddr = customEndAddressInput ? customEndAddressInput.value.trim() : '';

  // Preserve checked state
  const prevChecked = {};
  Array.from(middleAddressesList.querySelectorAll('input[type="checkbox"].address-checkbox')).forEach(cb => {
    prevChecked[cb.value] = cb.checked;
  });

  middleAddressesList.innerHTML = '';

  if (typeof currentlyDisplayedItems !== 'undefined' && currentlyDisplayedItems) {
    currentlyDisplayedItems.forEach(item => {
      if (item.address !== startAddr && item.address !== endAddr) {
        const li = createAddressListItem(item, prevChecked);
        middleAddressesList.appendChild(li);
      }
    });
  }
}

function createAddressListItem(item, prevChecked) {
  const li = document.createElement('li');
  li.style.display = 'flex';
  li.style.alignItems = 'center';
  li.style.gap = '8px';
  li.style.padding = '6px 0';
  li.style.borderBottom = '1px solid #f0f0f0';
  
  // Checkbox
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'address-checkbox';
  cb.value = item.address;
  cb.checked = !!prevChecked[item.address];
  li.appendChild(cb);
  
  // Get visit data for this address
  const visitData = getAddressVisitData(item.address);
  
  // Create address span with visit status
  const span = createAddressSpan(item, visitData);
  li.appendChild(span);
  
  return li;
}

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
  updateMiddleAddresses();
}

// Make functions globally available
window.updateMiddleAddresses = updateMiddleAddresses;
window.populateAddressSelection = populateAddressSelection;
