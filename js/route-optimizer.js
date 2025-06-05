// Route Optimization Module

function initializeRouteForm() {
  const routeForm = document.getElementById('routeForm');
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
        waypointsForRoute = window.currentlyDisplayedItems.map(item => item.address).filter(addr => addr);
      } else {
        console.log("Using manual destination fields for waypoints");
        waypointsForRoute = manualWaypoints;
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
