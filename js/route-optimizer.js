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

      // Determine active tab
      const singleEntryActive = singleEntryContent && singleEntryContent.style.display === 'block';
      const uploadFileActive = uploadFileContent && uploadFileContent.style.display === 'block';

      if (singleEntryActive) {
        console.log("Optimizing with Single Entry data");
        startAddressForRoute = document.getElementById('manualStartAddress').value.trim();
        
        // Get waypoints from the dynamic destination fields
        const destinationFields = document.querySelectorAll('.destination-field');
        waypointsForRoute = Array.from(destinationFields).map(field => field.value.trim()).filter(addr => addr);

        if (startAddressForRoute) {
            addresses.push(startAddressForRoute); // Origin
            addresses = addresses.concat(waypointsForRoute); // Waypoints
            addresses.push(startAddressForRoute); // Destination (round trip)
        }
      } else if (uploadFileActive) {
        console.log("Optimizing with Upload File data");
        startAddressForRoute = document.getElementById('customStartAddress').value.trim();
        let endAddrFromFile = document.getElementById('customEndAddress').value.trim();
        const middleCheckboxes = document.querySelectorAll('#middleAddressesList input[type="checkbox"]:checked');
        waypointsForRoute = Array.from(middleCheckboxes).map(cb => cb.value);

        if (startAddressForRoute) {
            addresses.push(startAddressForRoute); // Origin
            addresses = addresses.concat(waypointsForRoute); // Waypoints
            if (endAddrFromFile && endAddrFromFile !== startAddressForRoute) {
                addresses.push(endAddrFromFile); // Explicit destination
            } else {
                addresses.push(startAddressForRoute); // Destination (round trip)
            }
        }
      }

      // Validate addresses collected
      if (!startAddressForRoute) {
        let specificMessage = 'Please enter a Start Address.';
        if (singleEntryActive) specificMessage = 'Please enter a Start Address in the Single Entry tab.';
        else if (uploadFileActive) specificMessage = 'Please enter a Start Address in the Upload File tab (after loading a file and selecting columns).';
        showMessage(specificMessage, 'error');
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
