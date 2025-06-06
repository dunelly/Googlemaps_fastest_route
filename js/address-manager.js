// Address Management Module - Simplified and Fixed

function initializeAddressManagement() {
  console.log('[address-manager.js] Starting initialization...');
  
  // Skip legacy address field management - handled by tabs.js
  // Focus only on start address functionality and utilities
  console.log('[address-manager.js] Legacy address field management skipped - handled by tabs.js');
  
  console.log('[address-manager.js] Initialization complete');
}

function initializeCopyAndMarkVisited() {
  // Legacy functionality - elements no longer exist in current interface
  console.log('[address-manager.js] Legacy copy/mark visited functionality skipped');
}

// Note: Address selection UI functions removed - Excel data now loads directly into Plan Route tab
function populateAddressSelection(itemsToDisplay) {
  console.log('[address-manager.js] populateAddressSelection called - Excel data loaded for route optimization');
  // No longer needed - addresses are automatically available for route optimization
}

// Initialize event listeners for start address changes
function initializeAddressFieldListeners() {
  const manualStartAddress = document.getElementById('manualStartAddress');
  
  if (manualStartAddress) {
    manualStartAddress.addEventListener('input', function(e) {
      const address = e.target.value.trim();
      localStorage.setItem('savedStartAddress', address);
      
      // Save to recent addresses list
      if (address) {
        saveToRecentAddresses(address);
      }
    });

    // Restore start address from localStorage if available
    const saved = localStorage.getItem('savedStartAddress');
    if (saved) {
      manualStartAddress.value = saved;
    }
  }
}

// Save address to recent addresses list
function saveToRecentAddresses(address) {
  if (!address || address.length < 5) return; // Only save meaningful addresses
  
  let recentAddresses = JSON.parse(localStorage.getItem('recentStartAddresses') || '[]');
  
  // Remove if already exists (to move to top)
  recentAddresses = recentAddresses.filter(addr => addr.toLowerCase() !== address.toLowerCase());
  
  // Add to beginning
  recentAddresses.unshift(address);
  
  // Keep only last 5 addresses
  recentAddresses = recentAddresses.slice(0, 5);
  
  localStorage.setItem('recentStartAddresses', JSON.stringify(recentAddresses));
  
  // Update autocomplete dropdown
  updateAddressAutocomplete();
}

// Get recent addresses
function getRecentAddresses() {
  return JSON.parse(localStorage.getItem('recentStartAddresses') || '[]');
}

// Add datalist for autocomplete to start address fields
function addAddressAutocomplete() {
  const manualStartAddress = document.getElementById('manualStartAddress');
  const customStartAddress = document.getElementById('customStartAddress');
  
  // Create datalist element
  const datalist = document.createElement('datalist');
  datalist.id = 'recentAddresses';
  document.body.appendChild(datalist);
  
  // Add datalist to input fields
  if (manualStartAddress) {
    manualStartAddress.setAttribute('list', 'recentAddresses');
  }
  if (customStartAddress) {
    customStartAddress.setAttribute('list', 'recentAddresses');
  }
  
  // Update datalist options
  updateAddressAutocomplete();
}

// Update datalist with recent addresses
function updateAddressAutocomplete() {
  const datalist = document.getElementById('recentAddresses');
  if (!datalist) return;
  
  const recentAddresses = getRecentAddresses();
  datalist.innerHTML = '';
  
  recentAddresses.forEach(address => {
    const option = document.createElement('option');
    option.value = address;
    datalist.appendChild(option);
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeAddressFieldListeners();
  addAddressAutocomplete();
});
