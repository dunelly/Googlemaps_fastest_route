// Visit Manager Module - Core visit recording and tracking functionality

let userVisits = {};
let visitManagerCurrentUser = null;

// Make userVisits globally available for display modules
window.userVisits = userVisits;

// Generate consistent hash for address
function generateAddressHash(address) {
  return address.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Initialize visit tracking
function initializeVisitTracker() {
  console.log('[visit-manager] Initializing visit tracker');
  
  // Set up visit button event listener
  setupVisitTracking();
  
  // Listen for auth state changes
  firebase.auth().onAuthStateChanged(function(user) {
    visitManagerCurrentUser = user;
    console.log('[visit-manager] Auth state changed, user:', !!user);
    if (user) {
      loadUserVisits(user.uid);
    } else {
      userVisits = {};
      window.userVisits = userVisits;
    }
  });
}

// Set up visit tracking functionality
function setupVisitTracking() {
  console.log('[visit-manager] Setting up visit tracking...');
  
  // Function to attach event listener with retry
  function attachEventListener(buttonId, handler, description) {
    const button = document.getElementById(buttonId);
    if (button) {
      console.log(`[visit-manager] Found ${description} button, attaching listener`);
      button.addEventListener('click', handler);
      return true;
    } else {
      console.warn(`[visit-manager] ${description} button not found: ${buttonId}`);
      return false;
    }
  }
  
  // Handle single address visits (from notes overlay)
  const singleHandler = async function() {
    console.log('[visit-manager] Single address mark visited button clicked');
    
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
    console.log('[visit-manager] Bulk mark visited button clicked');
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
    console.log('[visit-manager] Some buttons not found, setting up observer...');
    
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
  if (!middleAddressesList || !visitManagerCurrentUser) {
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
  
  console.log('[visit-manager] Marking', checkedAddresses.length, 'addresses as visited');
  
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
  if (typeof updateMapMarkers === 'function') {
    updateMapMarkers();
  }
  if (typeof updateMiddleAddresses === 'function') {
    updateMiddleAddresses();
  }
}

// Load user visits data
async function loadUserVisits(userId) {
  try {
    console.log('[visit-manager] Loading user visits for:', userId);
    userVisits = await FirebaseUtils.loadUserData('addressVisits');
    window.userVisits = userVisits; // Sync with global
    console.log('[visit-manager] Loaded', Object.keys(userVisits).length, 'visit records');
    
    // Update displays
    if (typeof updateVisitDisplay === 'function') {
      updateVisitDisplay();
    }
    if (typeof updateMapMarkers === 'function') {
      updateMapMarkers();
    }
    
  } catch (error) {
    console.error('Error loading visits:', error);
    showMessage('Failed to load visit data: ' + error.message, 'error');
  }
}

// Mark address as visited
async function markAddressAsVisited() {
  console.log('[visit-manager] markAddressAsVisited called');
  console.log('[visit-manager] currentUser:', !!visitManagerCurrentUser);
  console.log('[visit-manager] window.currentAddress:', window.currentAddress);
  
  if (!visitManagerCurrentUser) {
    throw new Error('User not signed in');
  }
  
  if (!window.currentAddress) {
    throw new Error('No address specified');
  }
  
  const addressHash = generateAddressHash(window.currentAddress);
  const now = new Date().toISOString();
  
  console.log('[visit-manager] Marking visit for address:', window.currentAddress, 'hash:', addressHash);
  
  try {
    // Get existing visit data or create new
    const existingVisit = userVisits[addressHash] || {
      address: window.currentAddress,
      visitCount: 0,
      visitHistory: []
    };
    
    console.log('[visit-manager] Existing visit data:', existingVisit);
    
    // Add new visit
    const newVisit = {
      date: now
    };
    
    const updatedVisitData = {
      address: window.currentAddress,
      visitCount: existingVisit.visitCount + 1,
      lastVisited: now,
      visitHistory: [...(existingVisit.visitHistory || []), newVisit]
    };
    
    console.log('[visit-manager] Saving visit data:', updatedVisitData);
    
    // Save to Firestore
    await FirebaseUtils.saveUserData('addressVisits', addressHash, updatedVisitData);
    
    // Update local data
    userVisits[addressHash] = updatedVisitData;
    window.userVisits = userVisits; // Sync with global
    
    console.log('[visit-manager] Visit saved successfully, local data updated');
    
    // Update UI
    if (typeof updateVisitDisplay === 'function') {
      updateVisitDisplay();
    }
    if (typeof updateMapMarkers === 'function') {
      updateMapMarkers();
    }
    
    // Refresh address list to show updated visit status
    if (typeof updateMiddleAddresses === 'function') {
      updateMiddleAddresses();
    }
    
    showMessage(`Checked in at ${window.currentAddress}`, 'success');
    
    return updatedVisitData;
    
  } catch (error) {
    console.error('[visit-manager] Error marking visit:', error);
    showMessage('Failed to record visit: ' + error.message, 'error');
    throw error;
  }
}

// Make core tracking functions globally available
window.markAddressAsVisited = markAddressAsVisited;

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeVisitTracker);
} else {
  initializeVisitTracker();
}
