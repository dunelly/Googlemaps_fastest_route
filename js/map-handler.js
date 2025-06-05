// Map and Drawing Functionality Module  
// Note: map, drawnItems, drawControl are declared in map-core.js
// Note: addressMarkersLayer is declared in map-markers.js

// Map initialization is handled by map-core.js

function initializeDrawingFeatures() {
  if (!map || !window.L) return;

  // Add custom clear button control
  L.Control.ClearButton = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function(map) {
      const container = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');
      const btn = L.DomUtil.create('a', 'leaflet-draw-toolbar-button leaflet-draw-clear-all', container);
      btn.id = 'clearAllMapSelections';
      btn.href = '#';
      btn.title = 'Clear all drawn shapes and selections';
      btn.setAttribute('role', 'button');
      btn.setAttribute('aria-label', 'Clear all drawn shapes and selections');
      btn.innerHTML = '<span style="font-weight:700;font-size:1.08em;letter-spacing:1px;">CLEAR</span>';
      btn.style.width = '48px';
      btn.style.height = '34px';
      btn.style.background = '#fff';
      btn.style.border = 'none';
      btn.style.marginTop = '6px';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.boxShadow = '0 1px 4px rgba(44,62,80,0.08)';
      btn.style.cursor = 'pointer';
      btn.onmouseover = function() { btn.style.background = '#f4f6fa'; };
      btn.onmouseout = function() { btn.style.background = '#fff'; };
      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
      btn.onclick = function(e) {
        e.preventDefault();
        handleClearSelections();
        showMessage('Selections and drawn shapes cleared.', 'info');
      };
      return container;
    },
    onRemove: function(map) {}
  });

  L.control.clearButton = function(opts) {
    return new L.Control.ClearButton(opts);
  };
  L.control.clearButton({ position: 'topleft' }).addTo(map);

  // Drawing event handlers
  map.on(L.Draw.Event.CREATED, function (event) {
    drawnItems.clearLayers();
    const drawnLayer = event.layer;
    drawnItems.addLayer(drawnLayer);

    // Disable drawing mode after drawing
    if (drawControl && drawControl._toolbars && drawControl._toolbars.draw && drawControl._toolbars.draw._modes) {
      if (event.layerType === 'rectangle' && drawControl._toolbars.draw._modes.rectangle && drawControl._toolbars.draw._modes.rectangle.handler) {
        drawControl._toolbars.draw._modes.rectangle.handler.disable();
      }
      if (event.layerType === 'polygon' && drawControl._toolbars.draw._modes.polygon && drawControl._toolbars.draw._modes.polygon.handler) {
        drawControl._toolbars.draw._modes.polygon.handler.disable();
      }
    }

    const selectedItemsInShape = [];

    if (window.addressMarkersArray && window.addressMarkersArray.length > 0) {
      window.addressMarkersArray.forEach(function (marker) {
        if (marker.customData) {
          const markerLatLng = marker.getLatLng();
          let isInside = false;
          if (drawnLayer instanceof L.Circle) isInside = markerLatLng.distanceTo(drawnLayer.getLatLng()) <= drawnLayer.getRadius();
          else if (drawnLayer.getBounds) isInside = drawnLayer.getBounds().contains(markerLatLng);

          if (isInside) {
            selectedItemsInShape.push(marker.customData);
          }
        }
      });
    }

    const middleAddressesListUI = document.getElementById('middleAddressesList');
    if (middleAddressesListUI) {
      middleAddressesListUI.innerHTML = '';
      selectedItemsInShape.forEach(item => {
        const li = document.createElement('li');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'address-checkbox';
        checkbox.value = item.address;
        checkbox.checked = true;
        li.appendChild(checkbox);
        let dText = item.address;
        if (item.name) dText = `<b>${item.name}</b> - ${dText}`;
        if (item.auctionDateFormatted) dText += ` <span style="color:#0077b6;">(Auction: ${item.auctionDateFormatted})</span>`;
        const span = document.createElement('span');
        span.innerHTML = ' ' + dText;
        li.appendChild(span);
        middleAddressesListUI.appendChild(li);
      });
    }
    
    // Also populate Single Entry destinations
    const destinationFields = document.getElementById('destinationFields');
    if (destinationFields && selectedItemsInShape.length > 0) {
      // Clear existing destination fields
      if (typeof clearAllDestinationFields === 'function') {
        clearAllDestinationFields();
      }
      
      // Add each selected address as a destination field
      selectedItemsInShape.forEach((item, index) => {
        if (index === 0) {
          // Fill the first field
          const firstField = destinationFields.querySelector('.destination-field');
          if (firstField) {
            firstField.value = item.address;
          }
        } else {
          // Add new fields for remaining addresses
          if (typeof addNewDestinationFieldAboveButton === 'function') {
            addNewDestinationFieldAboveButton();
            const allFields = destinationFields.querySelectorAll('.destination-field');
            const newField = allFields[allFields.length - 1];
            if (newField) {
              newField.value = item.address;
            }
          }
        }
      });
      
      // Switch to Single Entry tab
      if (typeof switchTab === 'function') {
        switchTab('singleEntry');
      }
    }
    
    if (copyBtn) copyBtn.style.display = selectedItemsInShape.length > 0 ? 'block' : 'none';
    if (markVisitedBtn) markVisitedBtn.style.display = selectedItemsInShape.length > 0 ? 'block' : 'none';
    if (selectedItemsInShape.length > 0) {
      showMessage(`${selectedItemsInShape.length} addresses selected and added to destinations.`, 'success');
    }
  });

  map.on('draw:deleted', function() {
    handleClearSelections();
    if (markVisitedBtn) markVisitedBtn.style.display = 'none';
    showMessage('Drawn shapes deleted and selections cleared.', 'info');
  });

  // Show onboarding tooltip for draw button on first load
  window.addEventListener('DOMContentLoaded', function() {
    try {
      if (!localStorage.getItem('drawButtonTooltipShown')) {
        setTimeout(function() {
          const leafletControls = document.querySelectorAll('.leaflet-draw-toolbar .leaflet-draw-draw-rectangle');
          if (leafletControls.length > 0) {
            leafletControls[0].style.boxShadow = '0 0 0 4px #ffe082, 0 0 12px #7a5d00';
            leafletControls[0].style.transition = 'box-shadow 0.5s';
            leafletControls[0].setAttribute('title', 'Draw a shape to select addresses');
            
            const drawTooltip = document.getElementById('drawTooltip');
            if (drawTooltip) drawTooltip.style.display = 'inline-block';

            const btnRect = leafletControls[0].getBoundingClientRect();
            const mapRect = document.getElementById('map').getBoundingClientRect();
            const overlay = document.getElementById('drawArrowOverlay');
            if (overlay) {
              const arrowStartX = btnRect.right - mapRect.left + 10;
              const arrowStartY = btnRect.top - mapRect.top + btnRect.height / 2;
              overlay.innerHTML = `<svg width="120" height="60" style="overflow:visible;">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#7a5d00"/>
                  </marker>
                </defs>
                <line x1="100" y1="30" x2="10" y2="40" stroke="#7a5d00" stroke-width="4" marker-end="url(#arrowhead)" />
              </svg>`;
              overlay.style.display = 'block';
              overlay.style.left = (btnRect.right - mapRect.left + 10) + 'px';
              overlay.style.top = (btnRect.top - mapRect.top - 10) + 'px';
              overlay.style.width = '120px';
              overlay.style.height = '60px';
            }

            setTimeout(function() {
              leafletControls[0].style.boxShadow = '';
              if (drawTooltip) drawTooltip.style.display = 'none';
              if (overlay) overlay.style.display = 'none';
              localStorage.setItem('drawButtonTooltipShown', '1');
            }, 6000);
          }
        }, 1200);
      }
    } catch (e) {
      console.error('Error showing draw tooltip:', e);
    }
  });
}

// Note: handleClearSelections, initializeGeocoding, and geocodeAddresses are handled by map-core.js

// Display address markers on map - restored to original functionality
function displayAddressMarkers(itemsToDisplayOnMap) {
  if (!window.map) return;
  
  // Clear existing markers
  if (window.addressMarkersArray && window.addressMarkersArray.length > 0) {
    window.addressMarkersArray.forEach(marker => {
      if (marker && typeof marker.remove === 'function') {
        marker.remove();
      }
    });
    window.addressMarkersArray = [];
  }
  
  let plottedCount = 0;
  
  itemsToDisplayOnMap.forEach(item => {
    if (item && typeof item.lat === 'number' && typeof item.lng === 'number') {
      // Get visit data for color coding
      let daysSince = null;
      let visitCount = 0;
      let lastVisitFormatted = 'Never visited';
      
      if (typeof getDaysSinceLastVisit === 'function') {
        daysSince = getDaysSinceLastVisit(item.address);
      }
      if (typeof getVisitCount === 'function') {
        visitCount = getVisitCount(item.address);
      }
      if (typeof getLastVisitFormatted === 'function') {
        lastVisitFormatted = getLastVisitFormatted(item.address);
      }
      
      // Get marker color and description
      const colorData = window.getMarkerColor ? window.getMarkerColor(daysSince, visitCount) : 
        { color: '#2E86AB', description: 'Never visited' };
      
      console.log(`[map-markers] Address: ${item.address}, daysSince: ${daysSince}, visitCount: ${visitCount}, color: ${colorData.color} (${colorData.description})`);
      
      // Create custom icon
      const customIcon = window.createCustomMarkerIcon ? window.createCustomMarkerIcon(colorData.color) :
        L.divIcon({
          html: `<div style="background-color: ${colorData.color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
          className: 'custom-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
      
      // Create marker
      const marker = L.marker([item.lat, item.lng], { icon: customIcon }).addTo(window.map);
      
      // Create popup content
      const popupHtml = window.createMarkerPopupContent ? 
        window.createMarkerPopupContent(item, lastVisitFormatted, visitCount) :
        `<strong>${item.address}</strong><br>Visit Status: ${lastVisitFormatted}`;
      
      marker.bindPopup(popupHtml);
      marker.customData = item;
      
      // Add to tracking array
      if (!window.addressMarkersArray) {
        window.addressMarkersArray = [];
      }
      window.addressMarkersArray.push(marker);
      plottedCount++;
    }
  });
  
  if (plottedCount > 0) {
    const notPlotted = itemsToDisplayOnMap.length - plottedCount;
    if (typeof showMessage === 'function') {
      showMessage(`${plottedCount} plotted. ${notPlotted > 0 ? notPlotted + ' not geocoded.' : ''}`, notPlotted > 0 ? 'warning' : 'success');
    }
  } else {
    if (typeof showMessage === 'function') {
      showMessage('No coordinates to plot.', 'warning');
    }
  }
}

// Function to highlight address on map when clicked in list
function highlightAddressOnMap(address) {
  if (!window.addressMarkersArray || window.addressMarkersArray.length === 0) return;
  
  window.addressMarkersArray.forEach(function(marker) {
    if (marker.customData && marker.customData.address === address) {
      // Pan to marker and open popup
      window.map.setView(marker.getLatLng(), 15);
      marker.openPopup();
    }
  });
}

// Make functions globally available
window.displayAddressMarkers = displayAddressMarkers;
window.highlightAddressOnMap = highlightAddressOnMap;
