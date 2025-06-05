// Visit Tracking Module - Handles visit recording and display

let userVisits = {};
let currentUser = null;

// Initialize visit tracking
function initializeVisitTracker() {
  // Set up visit button event listener
  setupVisitTracking();
  
  // Listen for auth state changes
  firebase.auth().onAuthStateChanged(function(user) {
    currentUser = user;
    if (user) {
      loadUserVisits(user.uid);
    } else {
      userVisits = {};
    }
  });
}

// Set up visit tracking functionality
function setupVisitTracking() {
  const markVisitedBtn = document.getElementById('markVisitedBtn');
  if (markVisitedBtn) {
    markVisitedBtn.addEventListener('click', markAddressAsVisited);
  }
}

// Load user visits data
async function loadUserVisits(userId) {
  try {
    userVisits = await FirebaseUtils.loadUserData('addressVisits');
    updateVisitDisplay();
    
  } catch (error) {
    console.error('Error loading visits:', error);
    showMessage('Failed to load visit data: ' + error.message, 'error');
  }
}

// Mark address as visited
async function markAddressAsVisited() {
  if (!currentUser || !window.currentAddress) return;
  
  const addressHash = generateAddressHash(window.currentAddress);
  const now = new Date().toISOString();
  
  try {
    // Get existing visit data or create new
    const existingVisit = userVisits[addressHash] || {
      address: window.currentAddress,
      visitCount: 0,
      visitHistory: []
    };
    
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
    
    // Save to Firestore
    await FirebaseUtils.saveUserData('addressVisits', addressHash, updatedVisitData);
    
    // Update local data
    userVisits[addressHash] = updatedVisitData;
    
    // Update UI
    updateVisitDisplay();
    updateMapMarkers();
    
    showMessage('Visit recorded successfully', 'success');
    
  } catch (error) {
    console.error('Error marking visit:', error);
    showMessage('Failed to record visit: ' + error.message, 'error');
  }
}

// Update visit display in overlay
function updateVisitDisplay() {
  if (!window.currentAddress) return;
  
  const addressHash = generateAddressHash(window.currentAddress);
  const visitData = userVisits[addressHash];
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
  const visitData = userVisits[addressHash];
  
  if (!visitData || !visitData.lastVisited) {
    return null; // Never visited
  }
  
  const daysSince = Math.floor((new Date() - new Date(visitData.lastVisited)) / (1000 * 60 * 60 * 24));
  return daysSince;
}

// Get visit count for address
function getVisitCount(address) {
  const addressHash = generateAddressHash(address);
  const visitData = userVisits[addressHash];
  return visitData ? visitData.visitCount : 0;
}

// Update map markers based on visit data
function updateMapMarkers() {
  // This will be called from map-handler.js
  if (typeof displayAddressMarkers === 'function' && typeof currentlyDisplayedItems !== 'undefined') {
    displayAddressMarkers(currentlyDisplayedItems);
  }
}

// Make functions globally available
window.getDaysSinceLastVisit = getDaysSinceLastVisit;
window.getVisitCount = getVisitCount;
window.updateVisitDisplay = updateVisitDisplay;

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeVisitTracker);
} else {
  initializeVisitTracker();
}
