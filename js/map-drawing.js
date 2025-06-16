// Map Drawing Features Module - Shape selection and drawing functionality

function initializeDrawingFeatures() {
  if (!window.map || !window.L) return;

  // Add custom clear button control with improved visual icon
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
      
      // Multiple clear icon options - defaulting to Option 1: Modern Clean
      const clearIconOptions = {
        option1: `
          <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: auto;">
            <!-- Modern clean trash can -->
            <rect x="7" y="9" width="10" height="10" rx="1.5" fill="none" stroke="#6366f1" stroke-width="2"/>
            <path d="M9 6L15 6M11 4L13 4" stroke="#6366f1" stroke-width="2" stroke-linecap="round"/>
            <!-- Clean X overlay -->
            <path d="M10 12L14 16M14 12L10 16" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round"/>
          </svg>
        `,
        option2: `
          <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: auto;">
            <!-- Broom sweeping -->
            <path d="M4 20L8 16L12 20L8 24Z" fill="#f59e0b" stroke="#d97706" stroke-width="1"/>
            <rect x="8" y="4" width="2" height="12" rx="1" fill="#8b5cf6"/>
            <!-- Dust particles -->
            <circle cx="14" cy="18" r="1" fill="#6b7280" opacity="0.6"/>
            <circle cx="16" cy="16" r="0.8" fill="#6b7280" opacity="0.4"/>
            <circle cx="18" cy="19" r="0.6" fill="#6b7280" opacity="0.3"/>
          </svg>
        `,
        option3: `
          <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: auto;">
            <!-- Reset/refresh arrows -->
            <path d="M12 4V2L9 5L12 8V6A6 6 0 1 1 6 12H4A8 8 0 1 0 12 4Z" fill="#10b981" stroke="#059669" stroke-width="0.5"/>
            <path d="M12 20V22L15 19L12 16V18A6 6 0 1 1 18 12H20A8 8 0 1 0 12 20Z" fill="#10b981" stroke="#059669" stroke-width="0.5"/>
          </svg>
        `
      };
      
      // Simple clear icon
      const clearIconSvg = `
        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: auto;">
          <rect x="6" y="8" width="12" height="12" rx="2" fill="none" stroke="#333" stroke-width="2"/>
          <path d="M16 6L18 6M8 6L6 6M10 4L14 4" stroke="#333" stroke-width="2" stroke-linecap="round"/>
          <path d="M9 11L15 17M15 11L9 17" stroke="#d63384" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;
      
      btn.innerHTML = clearIconSvg;
      btn.style.width = '34px';
      btn.style.height = '34px';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.background = '#fff';
      btn.style.borderRadius = '4px';
      btn.style.border = 'none';
      btn.style.cursor = 'pointer';
      btn.style.transition = 'all 0.2s ease';
      btn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      
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
      // Disable drawing mode after drawing
      if (window.drawControl && window.drawControl._toolbars && window.drawControl._toolbars.draw && window.drawControl._toolbars.draw._modes) {
        if (event.layerType === 'rectangle' && window.drawControl._toolbars.draw._modes.rectangle && window.drawControl._toolbars.draw._modes.rectangle.handler) {
          window.drawControl._toolbars.draw._modes.rectangle.handler.disable();
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
