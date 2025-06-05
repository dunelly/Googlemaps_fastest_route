// Map and Drawing Functionality Module

let map;
let drawnItems;
let drawControl;
let addressMarkersLayer = null;

function initializeMapSystem() {
  initializeBasicMap();
  initializeDrawingFeatures();
  initializeGeocoding();
}

function initializeBasicMap() {
  console.log("initializeBasicMap: Starting");
  try {
    map = L.map('map').setView([29.7604, -95.3698], 10);
    console.log("initializeBasicMap: L.map created");

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    console.log("initializeBasicMap: TileLayer added");

    drawnItems = new L.FeatureGroup();
    console.log("initializeBasicMap: FeatureGroup created");
    map.addLayer(drawnItems);
    console.log("initializeBasicMap: FeatureGroup added to map");

    drawControl = new L.Control.Draw({
      edit: false,
      draw: {
        polygon: true,
        polyline: false,
        rectangle: true,
        circle: false,
        marker: false,
        circlemarker: false
      }
    });
    console.log("initializeBasicMap: DrawControl options defined");
    map.addControl(drawControl);
    console.log("initializeBasicMap: DrawControl added to map");
  } catch (error) {
    console.error("initializeBasicMap: ERROR during initialization!", error);
  }
  console.log("initializeBasicMap: Finished (or error caught)");
}

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

    if (addressMarkersLayer) {
      addressMarkersLayer.eachLayer(function (marker) {
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
    
    if (copyBtn) copyBtn.style.display = selectedItemsInShape.length > 0 ? 'block' : 'none';
    if (markVisitedBtn) markVisitedBtn.style.display = selectedItemsInShape.length > 0 ? 'block' : 'none';
    if (selectedItemsInShape.length > 0) {
      showMessage(`${selectedItemsInShape.length} addresses selected.`, 'success');
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

function handleClearSelections() {
  if (drawnItems) {
    drawnItems.clearLayers();
  }
  if (copyBtn) copyBtn.style.display = 'none';
  populateAddressSelection(currentlyDisplayedItems);
  console.log("handleClearSelections: Selections cleared and address list repopulated.");
}

function initializeGeocoding() {
  // Geocoding functionality is already implemented in the excel-handler
  // This function is here for completeness and future geocoding features
}

async function geocodeAddresses(itemsArray) {
  const apiKey = "AIzaSyAq-_o7JolKDWy943Q-dejkoqzPvJKIV2k"; 
  const cache = JSON.parse(localStorage.getItem("geocodeCache") || "{}");
  
  for (const item of itemsArray) {
    if (typeof item.lat === 'number' && typeof item.lng === 'number' && item.lat !== null && item.lng !== null) continue;
    
    const addressToGeocode = item.address;
    if (cache[addressToGeocode]) {
      item.lat = cache[addressToGeocode].lat;
      item.lng = cache[addressToGeocode].lng;
      continue;
    }
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressToGeocode)}&key=${apiKey}`;
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.status === "OK" && data.results && data.results[0]) {
        const loc = data.results[0].geometry.location;
        item.lat = loc.lat;
        item.lng = loc.lng;
        cache[addressToGeocode] = { lat: loc.lat, lng: loc.lng };
      } else {
        item.lat = null;
        item.lng = null;
        console.warn('Failed geocode:', addressToGeocode, data.status);
      }
    } catch (err) {
      item.lat = null;
      item.lng = null;
      console.error('Fetch error geocoding:', addressToGeocode, err);
    }
    await new Promise(res => setTimeout(res, 60));
  }
  
  localStorage.setItem("geocodeCache", JSON.stringify(cache));
  return itemsArray; 
}

function displayAddressMarkers(itemsToDisplayOnMap) {
  if (!map) return;
  if (addressMarkersLayer) map.removeLayer(addressMarkersLayer);
  
  const markers = [];
  let plottedCount = 0;
  
  itemsToDisplayOnMap.forEach(item => {
    if (item && typeof item.lat === 'number' && typeof item.lng === 'number') {
      const marker = L.marker([item.lat, item.lng]);
      let popupHtml = `<strong>${item.address}</strong>`;
      if (item.name) popupHtml = `<strong>${item.name}</strong><br>${item.address}`;
      if (item.auctionDateFormatted) popupHtml += `<br><span style="color:#0077b6;">Auction: ${item.auctionDateFormatted}</span>`;
      marker.bindPopup(popupHtml);
      marker.customData = item; 
      markers.push(marker);
      plottedCount++;
    }
  });
  
  if (plottedCount > 0) {
    addressMarkersLayer = L.layerGroup(markers).addTo(map);
    const notPlotted = itemsToDisplayOnMap.length - plottedCount;
    showMessage(`${plottedCount} plotted. ${notPlotted > 0 ? notPlotted + ' not geocoded.' : ''}`, notPlotted > 0 ? 'warning' : 'success');
  } else {
    showMessage('No coordinates to plot.', 'warning');
  }
}
