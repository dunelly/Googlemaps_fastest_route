// Visit Tracking Module - Handles visit recording and display
// Note: userVisits is declared in visit-manager.js and made globally available

let visitTrackerCurrentUser = null;

// Initialize visit tracking
function initializeVisitTracker() {
  console.log('[visit-tracker] Initializing visit tracker');
  
  // Set up visit button event listener
  setupVisitTracking();
  
  // Listen for auth state changes
  firebase.auth().onAuthStateChanged(function(user) {
    visitTrackerCurrentUser = user;
    console.log('[visit-tracker] Auth state changed, user:', !!user);
    if (user) {
      loadUserVisits(user.uid);
    } else {
      window.userVisits = {};
    }
  });
}

// Set up visit tracking functionality
function setupVisitTracking() {
  console.log('[visit-tracker] Setting up visit tracking...');
  
  // Function to attach event listener with retry
  function attachEventListener(buttonId, handler, description) {
    const button = document.getElementById(buttonId);
    if (button) {
      console.log(`[visit-tracker] Found ${description} button, attaching listener`);
      button.addEventListener('click', handler);
      return true;
    } else {
      console.warn(`[visit-tracker] ${description} button not found: ${buttonId}`);
      return false;
    }
  }
  
  // Handle single address visits (from notes overlay)
  const singleHandler = async function() {
    console.log('[visit-tracker] Single address mark visited button clicked');
    
    if (window.currentAddress) {
      try {
        await markAddressAsVisited();
      } catch (error) {
        console.error('Error marking single address as visited:', error);
        showMessage('Error recording visit: ' + error.message, 'error');
      }
    } else {
      showMessage('No address selected', 'warning');
    }
  };
  
  // Handle bulk address visits (from address list)
  const bulkHandler = async function() {
    console.log('[visit-tracker] Bulk mark visited button clicked');
    try {
      await markSelectedAddressesAsVisited();
    } catch (error) {
      console.error('Error in bulk visit marking:', error);
      showMessage('Error recording visits: ' + error.message, 'error');
    }
  };
  
  // Try to attach listeners immediately
  const singleAttached = attachEventListener('markVisitedBtn', singleHandler, 'single visit');
  const bulkAttached = attachEventListener('markSelectedVisitedBtn', bulkHandler, 'bulk visit');
  
  // If buttons not found, set up observers to try again later
  if (!singleAttached || !bulkAttached) {
    console.log('[visit-tracker] Some buttons not found, setting up observer...');
    
    // Set up mutation observer to watch for dynamic button creation
    const observer = new MutationObserver(function(mutations) {
      let shouldCheck = false;
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldCheck = true;
        }
      });
      
      if (shouldCheck) {
        if (!singleAttached) {
          attachEventListener('markVisitedBtn', singleHandler, 'single visit (retry)');
        }
        if (!bulkAttached) {
          attachEventListener('markSelectedVisitedBtn', bulkHandler, 'bulk visit (retry)');
        }
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Also try again after a short delay
    setTimeout(() => {
      if (!singleAttached) {
        attachEventListener('markVisitedBtn', singleHandler, 'single visit (delayed)');
      }
      if (!bulkAttached) {
        attachEventListener('markSelectedVisitedBtn', bulkHandler, 'bulk visit (delayed)');
      }
    }, 1000);
  }
}

// Mark selected addresses as visited (bulk mode)
async function markSelectedAddressesAsVisited() {
  const middleAddressesList = document.getElementById('middleAddressesList');
  if (!middleAddressesList || !visitTrackerCurrentUser) {
    showMessage('Please sign in to track visits', 'warning');
    return;
  }
  
  const checkedAddresses = [];
  const listItems = middleAddressesList.getElementsByTagName('li');
  
  for (let item of listItems) {
    const checkbox = item.querySelector('input[type="checkbox"]');
    if (checkbox && checkbox.checked) {
      checkedAddresses.push(checkbox.value);
    }
  }
  
  if (checkedAddresses.length === 0) {
    showMessage('No addresses selected', 'info');
    return;
  }
  
  console.log('[visit-tracker] Marking', checkedAddresses.length, 'addresses as visited');
  
  let successCount = 0;
  for (const address of checkedAddresses) {
    try {
      window.currentAddress = address;
      await markAddressAsVisited();
      successCount++;
    } catch (error) {
      console.error('Error marking address as visited:', address, error);
    }
  }
  
  window.currentAddress = null;
  showMessage(`${successCount} addresses marked as visited today`, 'success');
  
  // Refresh the map and address list
  updateMapMarkers();
  if (typeof updateMiddleAddresses === 'function') {
    updateMiddleAddresses();
  }
}

// Load user visits data
async function loadUserVisits(userId) {
  try {
    console.log('[visit-tracker] Loading user visits for:', userId);
    window.userVisits = await FirebaseUtils.loadUserData('addressVisits');
    console.log('[visit-tracker] Loaded', Object.keys(window.userVisits || {}).length, 'visit records');
    updateVisitDisplay();
    updateMapMarkers();
    
  } catch (error) {
    console.error('Error loading visits:', error);
    showMessage('Failed to load visit data: ' + error.message, 'error');
  }
}

// Mark address as visited
async function markAddressAsVisited() {
  console.log('[visit-tracker] markAddressAsVisited called');
  console.log('[visit-tracker] currentUser:', !!visitTrackerCurrentUser);
  console.log('[visit-tracker] window.currentAddress:', window.currentAddress);
  
  if (!visitTrackerCurrentUser) {
    throw new Error('User not signed in');
  }
  
  if (!window.currentAddress) {
    throw new Error('No address specified');
  }
  
  const addressHash = generateAddressHash(window.currentAddress);
  const now = new Date().toISOString();
  
  console.log('[visit-tracker] Marking visit for address:', window.currentAddress, 'hash:', addressHash);
  
  try {
    // Get existing visit data or create new
    const existingVisit = window.userVisits[addressHash] || {
      address: window.currentAddress,
      visitCount: 0,
      visitHistory: []
    };
    
    console.log('[visit-tracker] Existing visit data:', existingVisit);
    
    // Add new visit
    const newVisit = {
      date: now,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    const updatedVisitData = {
      address: window.currentAddress,
      visitCount: existingVisit.visitCount + 1,
      lastVisited: now,
      visitHistory: [...(existingVisit.visitHistory || []), newVisit]
    };
    
    console.log('[visit-tracker] Saving visit data:', updatedVisitData);
    
    // Save to Firestore
    await FirebaseUtils.saveUserData('addressVisits', addressHash, updatedVisitData);
    
    // Update local data
    window.userVisits[addressHash] = updatedVisitData;
    
    console.log('[visit-tracker] Visit saved successfully, local data updated');
    
    // Update UI
    updateVisitDisplay();
    updateMapMarkers();
    
    showMessage(`Checked in at ${window.currentAddress}`, 'success');
    
    return updatedVisitData;
    
  } catch (error) {
    console.error('[visit-tracker] Error marking visit:', error);
    showMessage('Failed to record visit: ' + error.message, 'error');
    throw error;
  }
}

// Update visit display in overlay
function updateVisitDisplay() {
  if (!window.currentAddress) return;
  
  const addressHash = generateAddressHash(window.currentAddress);
  const visitData = window.userVisits[addressHash];
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
  const addressHash = generateAddressHash(address);
  const visitData = window.userVisits[addressHash];
  return visitData ? visitData.visitCount : 0;
}

// Get last visit date formatted
function getLastVisitFormatted(address) {
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
  console.log('[visit-tracker] updateMapMarkers called');
  console.log('[visit-tracker] window.currentlyDisplayedItems:', window.currentlyDisplayedItems);
  console.log('[visit-tracker] window.currentlyDisplayedItems length:', window.currentlyDisplayedItems ? window.currentlyDisplayedItems.length : 'undefined');
  
  // This will trigger the map to refresh with new colors
  if (typeof displayAddressMarkers === 'function' && window.currentlyDisplayedItems && window.currentlyDisplayedItems.length > 0) {
    console.log('[visit-tracker] Refreshing map markers with', window.currentlyDisplayedItems.length, 'items');
    displayAddressMarkers(window.currentlyDisplayedItems);
  } else {
    console.warn('[visit-tracker] Cannot refresh markers - missing displayAddressMarkers function or no items to display');
    console.log('[visit-tracker] displayAddressMarkers function available:', typeof displayAddressMarkers === 'function');
    console.log('[visit-tracker] currentlyDisplayedItems available:', !!window.currentlyDisplayedItems);
    console.log('[visit-tracker] currentlyDisplayedItems length:', window.currentlyDisplayedItems ? window.currentlyDisplayedItems.length : 'N/A');
  }
}

// Make functions globally available
window.getDaysSinceLastVisit = getDaysSinceLastVisit;
window.getVisitCount = getVisitCount;
window.getLastVisitFormatted = getLastVisitFormatted;
window.updateVisitDisplay = updateVisitDisplay;
window.markAddressAsVisited = markAddressAsVisited;

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeVisitTracker);
} else {
  initializeVisitTracker();
}
