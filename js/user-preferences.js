// User Preferences Module - Handle preset home location and user settings

// User preferences storage keys
const PRESET_HOME_KEY = 'userPresetHomeLocation';
const PREFERENCES_KEY = 'userPreferences';

// Default preferences
const defaultPreferences = {
  autoShowHomeMarker: true,
  rememberLastLocation: true
};

// Initialize user preferences system
function initializeUserPreferences() {
  console.log('[user-preferences] Initializing user preferences system...');
  
  // Setup event listeners
  setupPreferencesEventListeners();
  
  // Load saved preferences
  loadUserPreferences();
  
  console.log('[user-preferences] User preferences system initialized');
}

// Setup event listeners for preferences modal
function setupPreferencesEventListeners() {
  // Preferences button click
  const preferencesBtn = document.getElementById('user-preferences-btn');
  if (preferencesBtn) {
    preferencesBtn.addEventListener('click', openPreferencesModal);
  }
  
  // Modal controls
  const closeBtn = document.getElementById('closePreferencesModalBtn');
  const cancelBtn = document.getElementById('cancelPreferencesBtn');
  const saveBtn = document.getElementById('savePreferencesBtn');
  
  if (closeBtn) closeBtn.addEventListener('click', closePreferencesModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closePreferencesModal);
  if (saveBtn) saveBtn.addEventListener('click', saveUserPreferences);
  
  // Home location actions
  const setHomeBtn = document.getElementById('setHomeLocationBtn');
  const useCurrentBtn = document.getElementById('useCurrentLocationBtn');
  const clearHomeBtn = document.getElementById('clearHomeLocationBtn');
  const fillStartingBtn = document.getElementById('fillStartingAddressBtn');
  
  if (setHomeBtn) setHomeBtn.addEventListener('click', setPresetHomeLocation);
  if (useCurrentBtn) useCurrentBtn.addEventListener('click', useCurrentLocationAsHome);
  if (clearHomeBtn) clearHomeBtn.addEventListener('click', clearPresetHomeLocation);
  if (fillStartingBtn) fillStartingBtn.addEventListener('click', fillStartingAddressWithHome);
  
  // Close modal when clicking outside
  const modal = document.getElementById('userPreferencesModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closePreferencesModal();
      }
    });
  }
}

// Open preferences modal
function openPreferencesModal() {
  console.log('[user-preferences] Opening preferences modal...');
  
  const modal = document.getElementById('userPreferencesModal');
  if (modal) {
    // Load current preferences into the form
    loadPreferencesIntoForm();
    modal.style.display = 'flex';
  }
}

// Close preferences modal
function closePreferencesModal() {
  const modal = document.getElementById('userPreferencesModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Load current preferences into the form
function loadPreferencesIntoForm() {
  // Load preset home location
  const presetHome = getPresetHomeLocation();
  const homeAddressField = document.getElementById('presetHomeAddress');
  if (homeAddressField && presetHome) {
    homeAddressField.value = presetHome.address || '';
  }
  
  // Load other preferences
  const preferences = getUserPreferences();
  const autoShowCheckbox = document.getElementById('autoShowHomeMarker');
  const rememberLocationCheckbox = document.getElementById('rememberLastLocation');
  
  if (autoShowCheckbox) {
    autoShowCheckbox.checked = preferences.autoShowHomeMarker;
  }
  if (rememberLocationCheckbox) {
    rememberLocationCheckbox.checked = preferences.rememberLastLocation;
  }
}

// Save user preferences
async function saveUserPreferences() {
  console.log('[user-preferences] Saving user preferences...');
  
  try {
    // Get form values
    const autoShowHomeMarker = document.getElementById('autoShowHomeMarker')?.checked ?? true;
    const rememberLastLocation = document.getElementById('rememberLastLocation')?.checked ?? true;
    
    // Save preferences
    const preferences = {
      autoShowHomeMarker,
      rememberLastLocation
    };
    
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    
    // Show success message
    if (typeof showMessage === 'function') {
      showMessage('Preferences saved successfully!', 'success');
    }
    
    // Close modal
    closePreferencesModal();
    
    console.log('[user-preferences] Preferences saved:', preferences);
    
  } catch (error) {
    console.error('[user-preferences] Error saving preferences:', error);
    if (typeof showMessage === 'function') {
      showMessage('Error saving preferences: ' + error.message, 'error');
    }
  }
}

// Set preset home location
async function setPresetHomeLocation() {
  const homeAddressField = document.getElementById('presetHomeAddress');
  const address = homeAddressField?.value?.trim();
  
  if (!address) {
    if (typeof showMessage === 'function') {
      showMessage('Please enter a home address', 'warning');
    }
    return;
  }
  
  console.log('[user-preferences] Setting preset home location:', address);
  
  try {
    // Geocode the address to validate it
    const coords = await geocodeAddress(address);
    
    if (coords) {
      // Save the preset home location
      const presetHome = {
        address: address,
        lat: coords.lat,
        lng: coords.lng,
        setDate: new Date().toISOString()
      };
      
      localStorage.setItem(PRESET_HOME_KEY, JSON.stringify(presetHome));
      
      // Display home marker
      if (typeof window.displayHomeMarker === 'function') {
        window.displayHomeMarker(address, coords.lat, coords.lng);
      }
      
      if (typeof showMessage === 'function') {
        showMessage('Home location set successfully!', 'success');
      }
      
      console.log('[user-preferences] Preset home location saved:', presetHome);
      
    } else {
      // Fallback: Save address without coordinates for geocoding API issues
      console.warn('[user-preferences] Geocoding failed, saving address without coordinates');
      
      const presetHome = {
        address: address,
        lat: null,
        lng: null,
        setDate: new Date().toISOString(),
        needsGeocoding: true
      };
      
      localStorage.setItem(PRESET_HOME_KEY, JSON.stringify(presetHome));
      
      if (typeof showMessage === 'function') {
        showMessage('Home address saved (geocoding will happen when creating routes)', 'warning');
      }
      
      console.log('[user-preferences] Preset home location saved without coordinates:', presetHome);
    }
    
  } catch (error) {
    console.error('[user-preferences] Error setting home location:', error);
    if (typeof showMessage === 'function') {
      showMessage('Error setting home location: ' + error.message, 'error');
    }
  }
}

// Use current location as home
function useCurrentLocationAsHome() {
  console.log('[user-preferences] Getting current location for home...');
  
  if (!navigator.geolocation) {
    if (typeof showMessage === 'function') {
      showMessage('Geolocation is not supported by your browser', 'error');
    }
    return;
  }
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      console.log('[user-preferences] Current location obtained:', lat, lng);
      
      try {
        // Reverse geocode to get address
        const address = await reverseGeocodeCoordinates(lat, lng);
        
        if (address) {
          // Update the form field
          const homeAddressField = document.getElementById('presetHomeAddress');
          if (homeAddressField) {
            homeAddressField.value = address;
          }
          
          // Save as preset home
          const presetHome = {
            address: address,
            lat: lat,
            lng: lng,
            setDate: new Date().toISOString()
          };
          
          localStorage.setItem(PRESET_HOME_KEY, JSON.stringify(presetHome));
          
          // Display home marker
          if (typeof window.displayHomeMarker === 'function') {
            window.displayHomeMarker(address, lat, lng);
          }
          
          if (typeof showMessage === 'function') {
            showMessage('Current location set as home!', 'success');
          }
          
          console.log('[user-preferences] Current location set as home:', presetHome);
          
        } else {
          if (typeof showMessage === 'function') {
            showMessage('Could not determine address from your location', 'error');
          }
        }
        
      } catch (error) {
        console.error('[user-preferences] Error reverse geocoding:', error);
        if (typeof showMessage === 'function') {
          showMessage('Error getting address from location', 'error');
        }
      }
    },
    (error) => {
      console.error('[user-preferences] Geolocation error:', error);
      let message = 'Could not get your location';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Location access denied. Please enable location permissions.';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Location information unavailable.';
          break;
        case error.TIMEOUT:
          message = 'Location request timed out.';
          break;
      }
      
      if (typeof showMessage === 'function') {
        showMessage(message, 'error');
      }
    }
  );
}

// Clear preset home location
function clearPresetHomeLocation() {
  console.log('[user-preferences] Clearing preset home location...');
  
  localStorage.removeItem(PRESET_HOME_KEY);
  
  // Clear the form field
  const homeAddressField = document.getElementById('presetHomeAddress');
  if (homeAddressField) {
    homeAddressField.value = '';
  }
  
  // Remove home marker
  // Check if the current homeMarker corresponds to the preset one before removing
  const presetHome = getPresetHomeLocation(); // Get it again to be sure, though it's being cleared
  if (window.homeMarker && window.homeMarker.customData && presetHome && window.homeMarker.customData.address === presetHome.address) {
    if (typeof window.removeHomeMarker === 'function') {
      window.removeHomeMarker();
      console.log('[user-preferences] Preset home marker removed.');
    }
  } else {
    console.log('[user-preferences] Home marker not removed, it might be a route start address or already gone.');
  }
  
  if (typeof showMessage === 'function') {
    showMessage('Home location cleared', 'info');
  }
  
  console.log('[user-preferences] Preset home location cleared');
}

// Fill starting address with preset home
function fillStartingAddressWithHome() {
  const presetHome = getPresetHomeLocation();
  
  if (!presetHome) {
    if (typeof showMessage === 'function') {
      showMessage('No preset home location found. Please set one first.', 'warning');
    }
    return;
  }
  
  console.log('[user-preferences] Filling starting address with preset home:', presetHome.address);
  
  // Fill the starting address field
  const startingAddressField = document.getElementById('manualStartAddress');
  if (startingAddressField) {
    startingAddressField.value = presetHome.address;
    
    // Trigger input event to update home marker and other dependent logic
    console.log('[user-preferences] Dispatching input event on manualStartAddress');
    const event = new Event('input', { bubbles: true, cancelable: true });
    startingAddressField.dispatchEvent(event);
    
    // Close the preferences modal
    closePreferencesModal();
    
    // Switch to Plan Route tab if not already there
    const planRouteTab = document.getElementById('planRouteTab');
    if (planRouteTab && typeof switchTab === 'function') {
      switchTab('planRoute');
    }
    
    if (typeof showMessage === 'function') {
      showMessage('Starting address filled with home location!', 'success');
    }
    
    console.log('[user-preferences] Starting address filled with home location');
  }
}

// Get preset home location
function getPresetHomeLocation() {
  try {
    const saved = localStorage.getItem(PRESET_HOME_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('[user-preferences] Error getting preset home location:', error);
    return null;
  }
}

// Get user preferences
function getUserPreferences() {
  try {
    const saved = localStorage.getItem(PREFERENCES_KEY);
    return saved ? { ...defaultPreferences, ...JSON.parse(saved) } : defaultPreferences;
  } catch (error) {
    console.error('[user-preferences] Error getting user preferences:', error);
    return defaultPreferences;
  }
}

// Load user preferences on startup
function loadUserPreferences() {
  const preferences = getUserPreferences();
  console.log('[user-preferences] Loaded preferences:', preferences);
  
  // Apply preferences
  // (Currently these are just storage, but could be used to control behavior)
}

// Geocode address utility function
async function geocodeAddress(address) {
  try {
    // Check cache first
    const cachedResult = localStorage.getItem(`geocode_${address}`);
    if (cachedResult) {
      const coords = JSON.parse(cachedResult);
      if (coords.lat && coords.lng) {
        return coords;
      }
    }
    
    // Use Google Geocoding API (same key as Excel geocoding)
    const apiKey = 'AIzaSyAq-_o7JolKDWy943Q-dejkoqzPvJKIV2k';
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const coords = { lat: location.lat, lng: location.lng };
      
      // Cache the result
      localStorage.setItem(`geocode_${address}`, JSON.stringify(coords));
      
      return coords;
    } else {
      console.warn('[user-preferences] Geocoding failed:', data.status);
      return null;
    }
  } catch (error) {
    console.error('[user-preferences] Geocoding error:', error);
    return null;
  }
}

// Reverse geocode coordinates to address
async function reverseGeocodeCoordinates(lat, lng) {
  try {
    const apiKey = 'AIzaSyAq-_o7JolKDWy943Q-dejkoqzPvJKIV2k';
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      // Get the most specific address (usually the first result)
      return data.results[0].formatted_address;
    } else {
      console.warn('[user-preferences] Reverse geocoding failed:', data.status);
      return null;
    }
  } catch (error) {
    console.error('[user-preferences] Reverse geocoding error:', error);
    return null;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeUserPreferences();
});

// Make functions globally available
window.openPreferencesModal = openPreferencesModal;
window.getPresetHomeLocation = getPresetHomeLocation;
window.getUserPreferences = getUserPreferences;
