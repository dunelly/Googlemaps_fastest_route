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
    console.error('[user-preferences] Geolocation not supported');
    if (typeof showMessage === 'function') {
      showMessage('Geolocation is not supported by your browser', 'error');
    }
    return;
  }
  
  // Show loading message
  if (typeof showMessage === 'function') {
    showMessage('Getting your current location...', 'info');
  }
  
  // Disable the button temporarily to prevent multiple clicks
  const useCurrentBtn = document.getElementById('useCurrentLocationBtn');
  if (useCurrentBtn) {
    useCurrentBtn.disabled = true;
    useCurrentBtn.textContent = '📍 Getting Location...';
  }
  
  const enableButton = () => {
    if (useCurrentBtn) {
      useCurrentBtn.disabled = false;
      useCurrentBtn.textContent = '📍 Use Current Location';
    }
  };
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;
      
      console.log('[user-preferences] Current location obtained:', lat, lng, 'accuracy:', accuracy + 'm');
      
      try {
        // Show processing message
        if (typeof showMessage === 'function') {
          showMessage('Converting location to address...', 'info');
        }
        
        // Reverse geocode to get address
        const address = await reverseGeocodeCoordinates(lat, lng);
        
        if (address) {
          console.log('[user-preferences] Reverse geocoded address:', address);
          
          // Update the form field
          const homeAddressField = document.getElementById('presetHomeAddress');
          if (homeAddressField) {
            homeAddressField.value = address;
            console.log('[user-preferences] Updated form field with address');
          } else {
            console.error('[user-preferences] presetHomeAddress field not found!');
          }
          
          // Save as preset home
          const presetHome = {
            address: address,
            lat: lat,
            lng: lng,
            accuracy: accuracy,
            setDate: new Date().toISOString(),
            setFromCurrentLocation: true
          };
          
          localStorage.setItem(PRESET_HOME_KEY, JSON.stringify(presetHome));
          console.log('[user-preferences] Saved preset home to localStorage:', presetHome);
          
          // Display home marker
          if (typeof window.displayHomeMarker === 'function') {
            console.log('[user-preferences] Displaying home marker...');
            window.displayHomeMarker(address, lat, lng);
          } else {
            console.error('[user-preferences] displayHomeMarker function not available!');
          }
          
          // Auto-fill the starting address field on the main page
          const startingAddressField = document.getElementById('manualStartAddress');
          if (startingAddressField) {
            console.log('[user-preferences] Auto-filling starting address field with current location');
            startingAddressField.value = address;
            
            // Trigger input event to update any dependent logic (like displaying home marker)
            const inputEvent = new Event('input', { bubbles: true, cancelable: true });
            startingAddressField.dispatchEvent(inputEvent);
            
            // Also save to recent addresses
            if (typeof window.saveLastStartingAddress === 'function') {
              window.saveLastStartingAddress(address);
            }
          } else {
            console.warn('[user-preferences] manualStartAddress field not found for auto-fill');
          }
          
          // Don't close the modal - let user save preferences manually
          // closePreferencesModal();
          
          // Don't switch tabs automatically - let user control navigation
          // const planRouteTab = document.getElementById('planRouteTab');
          // if (planRouteTab && typeof switchTab === 'function') {
          //   switchTab('planRoute');
          // }
          
          if (typeof showMessage === 'function') {
            showMessage(`Current location set as home and filled as starting address: ${address}. Click Save to apply preferences.`, 'success');
          }
          
          console.log('[user-preferences] Current location set as home successfully and auto-filled starting address:', presetHome);
          
        } else {
          console.error('[user-preferences] Reverse geocoding returned null/empty');
          if (typeof showMessage === 'function') {
            showMessage('Could not determine address from your location. Please try again or enter manually.', 'error');
          }
        }
        
      } catch (error) {
        console.error('[user-preferences] Error reverse geocoding:', error);
        if (typeof showMessage === 'function') {
          showMessage('Error getting address from location: ' + error.message, 'error');
        }
      } finally {
        enableButton();
      }
    },
    (error) => {
      console.error('[user-preferences] Geolocation error:', error);
      let message = 'Could not get your location';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Location access denied. Please enable location permissions in your browser and try again.';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Location information unavailable. Please check your device settings.';
          break;
        case error.TIMEOUT:
          message = 'Location request timed out. Please try again.';
          break;
        default:
          message = `Location error (${error.code}): ${error.message}`;
      }
      
      if (typeof showMessage === 'function') {
        showMessage(message, 'error');
      }
      
      enableButton();
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000
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
  // Display preset home marker if available and auto-show is enabled
  if (preferences.autoShowHomeMarker) {
    displayPresetHomeMarkerOnStartup();
  }
  
  // Also check if there's already a starting address in the field and display it
  checkAndDisplayStartingAddressOnLoad();
  
  // If remember last location is enabled, restore it
  if (preferences.rememberLastLocation) {
    restoreLastStartingAddress();
  }
  
  // Check if this is first time use and offer to set current location as home
  checkFirstTimeUseAndOfferCurrentLocation();
}

// Check if starting address field has value and display marker
async function checkAndDisplayStartingAddressOnLoad() {
  // Wait a bit for DOM to be fully ready
  setTimeout(async () => {
    const startingAddressField = document.getElementById('manualStartAddress');
    if (startingAddressField && startingAddressField.value.trim()) {
      console.log('[user-preferences] Found existing starting address on load:', startingAddressField.value);
      
      // Use the desktop route creator's method to handle this
      if (window.desktopRouteCreator && typeof window.desktopRouteCreator.handleStartingAddressInputChange === 'function') {
        await window.desktopRouteCreator.handleStartingAddressInputChange(startingAddressField.value);
      }
    }
  }, 200);
}

// Restore last starting address if remember option is enabled
function restoreLastStartingAddress() {
  const lastStartingAddress = localStorage.getItem('lastStartingAddress');
  if (lastStartingAddress) {
    const startingAddressField = document.getElementById('manualStartAddress');
    if (startingAddressField && !startingAddressField.value.trim()) {
      console.log('[user-preferences] Restoring last starting address:', lastStartingAddress);
      startingAddressField.value = lastStartingAddress;
      
      // Trigger the input event to show home marker
      setTimeout(() => {
        const event = new Event('input', { bubbles: true, cancelable: true });
        startingAddressField.dispatchEvent(event);
      }, 300);
    }
  }
}

// Save starting address for remember feature
function saveLastStartingAddress(address) {
  const preferences = getUserPreferences();
  if (preferences.rememberLastLocation && address && address.trim()) {
    localStorage.setItem('lastStartingAddress', address.trim());
    console.log('[user-preferences] Saved last starting address:', address);
  }
}

// Check if this is first time use and offer to set current location as home
function checkFirstTimeUseAndOfferCurrentLocation() {
  const presetHome = getPresetHomeLocation();
  const hasSeenLocationPrompt = localStorage.getItem('hasSeenLocationPrompt');
  
  // If no preset home and haven't shown location prompt before
  if (!presetHome && !hasSeenLocationPrompt) {
    console.log('[user-preferences] First time use detected, offering to set current location as home');
    
    // Wait for map to be ready, then offer location
    setTimeout(() => {
      offerCurrentLocationAsHome();
    }, 2000); // Give time for map to load and user to see the interface
  }
}

// Offer to use current location as home for first-time users
function offerCurrentLocationAsHome() {
  if (!navigator.geolocation) {
    console.log('[user-preferences] Geolocation not available, skipping first-time location offer');
    localStorage.setItem('hasSeenLocationPrompt', 'true');
    return;
  }
  
  // Mark that we've shown the prompt
  localStorage.setItem('hasSeenLocationPrompt', 'true');
  
  // Create a friendly prompt
  const useLocation = confirm(
    '🏠 Welcome to SmashRoutes!\n\n' +
    'Would you like to set your current location as your home address?\n' +
    'This will help with route planning and can be changed later in Settings.'
  );
  
  if (useLocation) {
    console.log('[user-preferences] User agreed to use current location as home');
    setCurrentLocationAsHomeQuietly();
  } else {
    console.log('[user-preferences] User declined to use current location as home');
    if (typeof showMessage === 'function') {
      showMessage('You can set a home location later in Settings (⚙️ button)', 'info');
    }
  }
}

// Set current location as home without showing the preferences modal
function setCurrentLocationAsHomeQuietly() {
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      console.log('[user-preferences] Got current location for home setup:', lat, lng);
      
      try {
        // Reverse geocode to get address
        const address = await reverseGeocodeCoordinates(lat, lng);
        
        if (address) {
          // Save as preset home
          const presetHome = {
            address: address,
            lat: lat,
            lng: lng,
            setDate: new Date().toISOString(),
            setFromCurrentLocation: true
          };
          
          localStorage.setItem(PRESET_HOME_KEY, JSON.stringify(presetHome));
          
          // Display home marker
          if (window.map && typeof window.displayHomeMarker === 'function') {
            window.displayHomeMarker(address, lat, lng);
          }
          
          // Auto-fill the starting address field on the main page
          const startingAddressField = document.getElementById('manualStartAddress');
          if (startingAddressField && !startingAddressField.value.trim()) {
            console.log('[user-preferences] Auto-filling starting address field with current location (first-time setup)');
            startingAddressField.value = address;
            
            // Trigger input event to update any dependent logic
            const inputEvent = new Event('input', { bubbles: true, cancelable: true });
            startingAddressField.dispatchEvent(inputEvent);
            
            // Also save to recent addresses
            if (typeof window.saveLastStartingAddress === 'function') {
              window.saveLastStartingAddress(address);
            }
          }
          
          if (typeof showMessage === 'function') {
            showMessage(`🏠 Home location set to: ${address}`, 'success');
          }
          
          console.log('[user-preferences] Current location set as home automatically:', presetHome);
          
        } else {
          console.warn('[user-preferences] Could not get address from current location');
          if (typeof showMessage === 'function') {
            showMessage('Could not determine your address. You can set it manually in Settings.', 'warning');
          }
        }
        
      } catch (error) {
        console.error('[user-preferences] Error setting current location as home:', error);
        if (typeof showMessage === 'function') {
          showMessage('Error setting up home location. You can set it manually in Settings.', 'error');
        }
      }
    },
    (error) => {
      console.warn('[user-preferences] Could not get current location for home setup:', error.message);
      
      let message = 'Could not access your location for home setup.';
      if (error.code === error.PERMISSION_DENIED) {
        message = 'Location access denied. You can set a home address manually in Settings.';
      }
      
      if (typeof showMessage === 'function') {
        showMessage(message, 'warning');
      }
    },
    {
      timeout: 10000, // 10 second timeout
      enableHighAccuracy: false // Don't need high accuracy for this
    }
  );
}

// Display preset home marker on application startup
async function displayPresetHomeMarkerOnStartup() {
  console.log('[user-preferences] Checking for preset home location to display on startup...');
  
  const presetHome = getPresetHomeLocation();
  if (!presetHome) {
    console.log('[user-preferences] No preset home location found');
    return;
  }
  
  console.log('[user-preferences] Found preset home location:', presetHome);
  
  // If we have coordinates, display immediately
  if (presetHome.lat && presetHome.lng && typeof presetHome.lat === 'number' && typeof presetHome.lng === 'number') {
    console.log('[user-preferences] Displaying preset home marker with saved coordinates');
    
    // Wait for map to be ready
    const waitForMap = () => {
      if (window.map && typeof window.displayHomeMarker === 'function') {
        window.displayHomeMarker(presetHome.address, presetHome.lat, presetHome.lng);
        console.log('[user-preferences] Preset home marker displayed on startup');
      } else {
        // Wait a bit longer for map initialization
        setTimeout(waitForMap, 100);
      }
    };
    
    waitForMap();
    
  } else if (presetHome.needsGeocoding || (!presetHome.lat || !presetHome.lng)) {
    // Need to geocode the address first
    console.log('[user-preferences] Preset home needs geocoding, attempting...');
    
    try {
      const coords = await geocodeAddress(presetHome.address);
      if (coords) {
        // Update the stored preset with coordinates
        const updatedPresetHome = {
          ...presetHome,
          lat: coords.lat,
          lng: coords.lng,
          needsGeocoding: false
        };
        
        localStorage.setItem(PRESET_HOME_KEY, JSON.stringify(updatedPresetHome));
        
        // Wait for map to be ready
        const waitForMap = () => {
          if (window.map && typeof window.displayHomeMarker === 'function') {
            window.displayHomeMarker(presetHome.address, coords.lat, coords.lng);
            console.log('[user-preferences] Preset home marker displayed after geocoding');
          } else {
            setTimeout(waitForMap, 100);
          }
        };
        
        waitForMap();
        
      } else {
        console.warn('[user-preferences] Failed to geocode preset home address on startup');
      }
    } catch (error) {
      console.error('[user-preferences] Error geocoding preset home on startup:', error);
    }
  }
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
    console.log('[user-preferences] Starting reverse geocoding for:', lat, lng);
    
    const apiKey = 'AIzaSyAq-_o7JolKDWy943Q-dejkoqzPvJKIV2k';
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    
    console.log('[user-preferences] Making reverse geocoding request to:', geocodeUrl);
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    
    console.log('[user-preferences] Reverse geocoding response:', data);
    
    if (data.status === 'OK' && data.results.length > 0) {
      // Get the most specific address (usually the first result)
      const address = data.results[0].formatted_address;
      console.log('[user-preferences] Reverse geocoding successful:', address);
      return address;
    } else if (data.status === 'ZERO_RESULTS') {
      console.warn('[user-preferences] No address found for coordinates:', lat, lng);
      return null;
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      console.error('[user-preferences] Google API quota exceeded');
      throw new Error('Location service quota exceeded. Please try again later.');
    } else if (data.status === 'REQUEST_DENIED') {
      console.error('[user-preferences] Google API request denied');
      throw new Error('Location service access denied. Please check API configuration.');
    } else {
      console.warn('[user-preferences] Reverse geocoding failed:', data.status, data.error_message);
      throw new Error(`Location service error: ${data.status}`);
    }
  } catch (error) {
    console.error('[user-preferences] Reverse geocoding error:', error);
    if (error.message.includes('quota') || error.message.includes('denied') || error.message.includes('service')) {
      throw error; // Re-throw API-specific errors
    }
    throw new Error('Network error while getting address. Please check your internet connection.');
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
window.saveLastStartingAddress = saveLastStartingAddress;
