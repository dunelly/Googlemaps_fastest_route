// Map Drawing Features Module - Shape selection and drawing functionality

function initializeDrawingFeatures() {
  if (!window.map || !window.L) return;

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
      btn.textContent = 'CLEAR';
      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
      btn.onclick = function(e) {
        e.preventDefault();
        if (typeof handleClearSelections === 'function') {
          handleClearSelections();
        }
        if (typeof showMessage === 'function') {
          showMessage('Selections and drawn shapes cleared.', 'info');
        }
      };
      return container;
    },
    onRemove: function(map) {}
  });

  L.control.clearButton = function(opts) {
    return new L.Control.ClearButton(opts);
  };
  L.control.clearButton({ position: 'topleft' }).addTo(window.map);

  setupDrawingEventHandlers();
  setupDrawingTooltip();
}

function setupDrawingEventHandlers() {
  // Enhanced rectangle drawing variables
  let isEnhancedRectangleMode = false;
  let rectangleStartPoint = null;
  let rectanglePreview = null;
  let isDragging = false;
  let dragStartTime = null;
  
  // Drawing event handlers
  window.map.on(L.Draw.Event.CREATED, function (event) {
    if (window.drawnItems) {
      window.drawnItems.clearLayers();
    }
    const drawnLayer = event.layer;
    if (window.drawnItems) {
      window.drawnItems.addLayer(drawnLayer);
    }

    // For enhanced rectangle mode, don't disable the tool
    if (event.layerType === 'rectangle' && isEnhancedRectangleMode) {
      // Keep rectangle tool active for enhanced mode
      console.log('[map-drawing] Enhanced rectangle created, keeping tool active');
    } else {
      // Disable drawing mode after drawing (original behavior for lasso)
      if (window.drawControl && window.drawControl._toolbars && window.drawControl._toolbars.draw && window.drawControl._toolbars.draw._modes) {
        if (event.layerType === 'rectangle' && window.drawControl._toolbars.draw._modes.rectangle && window.drawControl._toolbars.draw._modes.rectangle.handler) {
          window.drawControl._toolbars.draw._modes.rectangle.handler.disable();
        }
        if (event.layerType === 'polygon' && window.drawControl._toolbars.draw._modes.polygon && window.drawControl._toolbars.draw._modes.polygon.handler) {
          window.drawControl._toolbars.draw._modes.polygon.handler.disable();
        }
      }
    }

    const selectedItemsInShape = getAddressesInShape(drawnLayer);
    populateSelectedAddresses(selectedItemsInShape);
    updateActionButtons(selectedItemsInShape.length > 0);
    
    if (selectedItemsInShape.length > 0 && typeof showMessage === 'function') {
      showMessage(`${selectedItemsInShape.length} addresses selected.`, 'success');
    }
  });

  window.map.on('draw:deleted', function() {
    if (typeof handleClearSelections === 'function') {
      handleClearSelections();
    }
    updateActionButtons(false);
    if (typeof showMessage === 'function') {
      showMessage('Drawn shapes deleted and selections cleared.', 'info');
    }
  });
  
  // Enhanced rectangle tool event handlers
  window.map.on('draw:drawstart', function(event) {
    if (event.layerType === 'rectangle') {
      isEnhancedRectangleMode = true;
      console.log('[map-drawing] Enhanced rectangle mode activated');
    }
  });
  
  window.map.on('draw:drawstop', function(event) {
    if (event.layerType === 'rectangle') {
      isEnhancedRectangleMode = false;
      rectangleStartPoint = null;
      if (rectanglePreview) {
        window.map.removeLayer(rectanglePreview);
        rectanglePreview = null;
      }
      console.log('[map-drawing] Enhanced rectangle mode deactivated');
    }
  });
  
  // Enhanced rectangle click-to-start, click-to-end behavior with clearing
  window.map.on('click', function(e) {
    if (!isEnhancedRectangleMode) return;
    
    // If we're dragging, ignore this click
    if (isDragging) {
      isDragging = false;
      return;
    }
    
    if (!rectangleStartPoint) {
      // Check if we have an existing selection and this is a clear click
      if (window.drawnItems && window.drawnItems.getLayers().length > 0) {
        console.log('[map-drawing] Clearing existing selection on empty area click');
        if (typeof handleClearSelections === 'function') {
          handleClearSelections();
        }
        if (typeof showMessage === 'function') {
          showMessage('Selection cleared.', 'info');
        }
        return; // Don't start a new rectangle on this click
      }
      
      // First click - start rectangle
      rectangleStartPoint = e.latlng;
      console.log('[map-drawing] Rectangle started at:', rectangleStartPoint);
      
      // Create preview rectangle
      rectanglePreview = L.rectangle([rectangleStartPoint, rectangleStartPoint], {
        color: '#3388ff',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.2,
        dashArray: '5, 5'
      }).addTo(window.map);
      
    } else {
      // Second click - finish rectangle
      const bounds = L.latLngBounds(rectangleStartPoint, e.latlng);
      
      // Remove preview
      if (rectanglePreview) {
        window.map.removeLayer(rectanglePreview);
        rectanglePreview = null;
      }
      
      // Clear existing selections
      if (window.drawnItems) {
        window.drawnItems.clearLayers();
      }
      
      // Create final rectangle
      const finalRectangle = L.rectangle(bounds, {
        color: '#3388ff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.3
      });
      
      if (window.drawnItems) {
        window.drawnItems.addLayer(finalRectangle);
      }
      
      // Select addresses
      const selectedItemsInShape = getAddressesInShape(finalRectangle);
      populateSelectedAddresses(selectedItemsInShape);
      updateActionButtons(selectedItemsInShape.length > 0);
      
      if (selectedItemsInShape.length > 0 && typeof showMessage === 'function') {
        showMessage(`${selectedItemsInShape.length} addresses selected.`, 'success');
      }
      
      // Reset for next rectangle
      rectangleStartPoint = null;
      console.log('[map-drawing] Rectangle completed');
    }
  });
  
  // Update preview rectangle on mouse move
  window.map.on('mousemove', function(e) {
    if (!isEnhancedRectangleMode || !rectangleStartPoint || !rectanglePreview) return;
    
    const bounds = L.latLngBounds(rectangleStartPoint, e.latlng);
    rectanglePreview.setBounds(bounds);
  });
  
  // Handle click-and-hold to drag map
  window.map.on('mousedown', function(e) {
    if (!isEnhancedRectangleMode) return;
    
    dragStartTime = Date.now();
    isDragging = false;
    
    // Start drag detection timer
    setTimeout(() => {
      if (dragStartTime && Date.now() - dragStartTime >= 150) {
        isDragging = true;
        // Enable dragging temporarily
        window.map.dragging.enable();
      }
    }, 150);
  });
  
  window.map.on('mouseup', function(e) {
    if (!isEnhancedRectangleMode) return;
    
    dragStartTime = null;
    // Small delay to prevent click event if we were dragging
    if (isDragging) {
      setTimeout(() => {
        isDragging = false;
      }, 50);
    }
  });
}

function getAddressesInShape(drawnLayer) {
  const selectedItemsInShape = [];

  if (window.addressMarkersLayer) {
    window.addressMarkersLayer.eachLayer(function (marker) {
      if (marker.customData) {
        const markerLatLng = marker.getLatLng();
        let isInside = false;
        if (drawnLayer instanceof L.Circle) {
          isInside = markerLatLng.distanceTo(drawnLayer.getLatLng()) <= drawnLayer.getRadius();
        } else if (drawnLayer.getBounds) {
          isInside = drawnLayer.getBounds().contains(markerLatLng);
        }

        if (isInside) {
          selectedItemsInShape.push(marker.customData);
        }
      }
    });
  }

  return selectedItemsInShape;
}

function populateSelectedAddresses(selectedItems) {
  const middleAddressesListUI = document.getElementById('middleAddressesList');
  if (!middleAddressesListUI) return;

  middleAddressesListUI.innerHTML = '';
  selectedItems.forEach(item => {
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

function updateActionButtons(hasSelection) {
  const copyBtn = document.getElementById('copySelectedBtn');
  const markVisitedBtn = document.getElementById('markSelectedVisitedBtn');
  
  if (copyBtn) {
    copyBtn.style.display = hasSelection ? 'block' : 'none';
  }
  if (markVisitedBtn) {
    markVisitedBtn.style.display = hasSelection ? 'block' : 'none';
  }
  
  // Also update global references for backward compatibility
  window.copyBtn = copyBtn;
  window.markVisitedBtn = markVisitedBtn;
}

function setupDrawingTooltip() {
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

// Make drawing functions globally available
window.initializeDrawingFeatures = initializeDrawingFeatures;
