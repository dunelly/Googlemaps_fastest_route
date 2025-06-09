// Route Optimization Module

let debounceTimerStartAddress; // For debouncing start address input

function initializeRouteForm() {
  const routeForm = document.getElementById('routeForm');
  const manualStartAddressField = document.getElementById('manualStartAddress');

  if (manualStartAddressField) {
    manualStartAddressField.addEventListener('input', handleManualStartAddressChange);
    manualStartAddressField.addEventListener('change', handleManualStartAddressChange);
  }

  if (routeForm) {
    routeForm.onsubmit = async function(e) {
      console.log('ROUTE FORM SUBMITTED');
      e.preventDefault();
      showMessage('Optimizing route...', 'info');
      let addresses = [];
      let startAddressForRoute = '';
      let waypointsForRoute = [];

      // All route optimization now happens from the Plan Route tab
      console.log("Optimizing route from Plan Route tab");
      startAddressForRoute = document.getElementById('manualStartAddress').value.trim();
      
      // Get waypoints from destination fields (manual entry)
      const destinationFields = document.querySelectorAll('.destination-field');
      const manualWaypoints = Array.from(destinationFields).map(field => field.value.trim()).filter(addr => addr);
      
      // If we have loaded Excel data and no manual waypoints, use Excel data
      if (manualWaypoints.length === 0 && window.currentlyDisplayedItems && window.currentlyDisplayedItems.length > 0) {
        console.log("Using loaded Excel data for waypoints");
        
        // Check if Excel data has too many addresses
        if (window.currentlyDisplayedItems.length > 25) {
          showMessage(`Too many addresses for route optimization (${window.currentlyDisplayedItems.length}). Please use manual destination fields or select fewer than 25 addresses. Google Maps API supports maximum 25 waypoints.`, 'error');
          return;
        }
        
        waypointsForRoute = window.currentlyDisplayedItems.map(item => item.address).filter(addr => addr);
      } else {
        console.log("Using manual destination fields for waypoints");
        waypointsForRoute = manualWaypoints;
      }

      // Check total waypoint limit
      if (waypointsForRoute.length > 25) {
        showMessage(`Too many waypoints (${waypointsForRoute.length}). Google Maps API supports maximum 25 waypoints. Please reduce the number of destinations.`, 'error');
        return;
      }

      if (startAddressForRoute) {
          addresses.push(startAddressForRoute); // Origin
          addresses = addresses.concat(waypointsForRoute); // Waypoints
          addresses.push(startAddressForRoute); // Destination (round trip)
      }

      // Validate addresses collected
      if (!startAddressForRoute) {
        showMessage('Please enter a Start Address in the Plan Route tab.', 'error');
        return;
      }
      
      if (addresses.length < 2 && startAddressForRoute) {
        showMessage('Please add at least one destination address, or ensure a round trip is formed.', 'error');
        return;
      }
      if (addresses.length === 0) {
        showMessage('No addresses were provided for optimization.', 'error');
        return;
      }

      console.log('Addresses for optimization:', JSON.stringify(addresses));

      // Geocode and display home marker for starting address
      if (startAddressForRoute) {
        console.log('[route-optimizer] About to geocode home marker for:', startAddressForRoute);
        geocodeAndDisplayHomeMarker(startAddressForRoute);
      } else {
        console.log('[route-optimizer] No starting address provided for home marker');
      }

      try {
        const response = await fetch('https://googlemaps-fastest-route-1.onrender.com/optimize-route', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ addresses: addresses }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error', details: response.statusText }));
          throw new Error(`HTTP error ${response.status}: ${errorData.error} - ${JSON.stringify(errorData.details)}`);
        }

        const result = await response.json();
        console.log('Backend response received:', result);
        console.log('Original addresses sent to backend:', addresses);

        let optimizedFullRoute;
        let optimizedCoordinates = [];
        if (result.order && Array.isArray(result.order)) {
          const waypoints = addresses.slice(1, -1);
          optimizedFullRoute = [addresses[0]];
          result.order.forEach(idx => optimizedFullRoute.push(waypoints[idx]));
          optimizedFullRoute.push(addresses[addresses.length - 1]);

          console.log('Constructed optimizedFullRoute:', optimizedFullRoute);
        }
        
        const waypoints = addresses.slice(1, -1);
        console.log('Waypoints extracted:', waypoints);
        console.log('Order from backend (result.order):', result.order);

        optimizedFullRoute = [addresses[0]];
        if (result.order && Array.isArray(result.order)) {
          result.order.forEach(idx => {
            console.log('Processing waypoint index from backend:', idx, 'Corresponding waypoint:', waypoints[idx]);
            optimizedFullRoute.push(waypoints[idx]);
          });
          optimizedFullRoute.push(addresses[addresses.length - 1]);
          console.log('Constructed optimizedFullRoute:', optimizedFullRoute);
          
          // Build Google Maps directions URL and open in new tab
          if (optimizedFullRoute.length >= 2) {
            const origin = encodeURIComponent(optimizedFullRoute[0]);
            const destination = encodeURIComponent(optimizedFullRoute[optimizedFullRoute.length - 1]);
            let waypointsString = "";
            if (optimizedFullRoute.length > 2) {
              waypointsString = optimizedFullRoute.slice(1, -1).map(addr => encodeURIComponent(addr)).join('|');
            }
            let googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
            if (waypointsString) {
              googleMapsUrl += `&waypoints=${waypointsString}`;
            }
            googleMapsUrl += `&travelmode=driving`;
            window.open(googleMapsUrl, '_blank');
            showMessage('Optimized route opened in Google Maps.<br>Order:<br>' + optimizedFullRoute.join('<br>'), 'success');
          } else {
            showMessage('Not enough addresses to generate a Google Maps link.', 'error');
          }
        } else {
          console.error('Error: result.order is not a valid array!', result.order);
          showMessage('Error processing backend response: Invalid route order.', 'error');
        }
      } catch (error) {
        console.error('Optimization error:', error);
        showMessage('Failed to optimize route: ' + error.message, 'error');
      }
    };
  }
}

// Debounced function to handle start address input changes
async function handleManualStartAddressChange(event) {
  clearTimeout(debounceTimerStartAddress);
  const address = event.target.value.trim(); // Get the latest value directly

  debounceTimerStartAddress = setTimeout(async () => {
    if (address) {
      console.log('[route-optimizer] Manual Start Address input changed to:', address);
      // geocodeAndDisplayHomeMarker calls displayHomeMarker, which should handle clearing previous one
      await geocodeAndDisplayHomeMarker(address);
    } else {
      console.log('[route-optimizer] Manual Start Address cleared.');
      if (typeof window.removeHomeMarker === 'function') {
        // Only remove if the address is truly empty
        window.removeHomeMarker();
      }
    }
  }, 500); // 500ms debounce time
}

// Function to geocode starting address and display home marker
async function geocodeAndDisplayHomeMarker(address) {
  console.log('[route-optimizer] Geocoding home address:', address);
  console.log('[route-optimizer] Checking if window.displayHomeMarker exists:', typeof window.displayHomeMarker);
  
  try {
    // Check localStorage cache first
    const cachedResult = localStorage.getItem(`geocode_${address}`);
    if (cachedResult) {
      const coords = JSON.parse(cachedResult);
      if (coords.lat && coords.lng && typeof window.displayHomeMarker === 'function') {
        window.displayHomeMarker(address, coords.lat, coords.lng);
        console.log('[route-optimizer] Used cached coordinates for home marker');
        return;
      }
    }
    
    // Use Google Geocoding API
    const apiKey = 'AIzaSyDQqCkBqmHRiX04Xtydb2v0IjxpssxzpQQ';
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const coords = { lat: location.lat, lng: location.lng };
      
      // Cache the result
      localStorage.setItem(`geocode_${address}`, JSON.stringify(coords));
      
      // Display home marker
      if (typeof window.displayHomeMarker === 'function') {
        window.displayHomeMarker(address, coords.lat, coords.lng);
        console.log('[route-optimizer] Home marker displayed for:', address);
      }
    } else {
      console.warn('[route-optimizer] Failed to geocode home address:', data.status);
      if (typeof showMessage === 'function') {
        showMessage('Could not locate starting address on map', 'warning');
      }
    }
  } catch (error) {
    console.error('[route-optimizer] Error geocoding home address:', error);
  }
}
