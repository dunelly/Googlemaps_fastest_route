// Address Management Module - Simplified and Fixed

function initializeAddressManagement() {
  console.log('[address-manager.js] Starting initialization...');
  
  // Get DOM elements
  const manualAddressesList = document.getElementById('manualAddressesList');
  const addManualAddressBtn = document.getElementById('addManualAddressBtn');
  const middleAddressesList = document.getElementById('middleAddressesList');
  const copyBtn = document.getElementById('copySelectedBtn');
  const markVisitedBtn = document.getElementById('markVisitedBtn');
  
  console.log('[address-manager.js] Elements found:', {
    manualAddressesList: !!manualAddressesList,
    addManualAddressBtn: !!addManualAddressBtn,
    middleAddressesList: !!middleAddressesList,
    copyBtn: !!copyBtn,
    markVisitedBtn: !!markVisitedBtn
  });

  // Address field creation function
  function addManualAddressField(value = "") {
    if (!manualAddressesList) {
      console.error('[address-manager.js] Cannot add address field: manualAddressesList not found');
      return;
    }
    
    console.log('[address-manager.js] Adding address field with value:', value);
    
    const div = document.createElement('div');
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.marginBottom = "8px";
    div.style.gap = "8px";

    // Address input
    const input = document.createElement('input');
    input.type = "text";
    input.placeholder = "Enter address";
    input.value = value;
    input.style.flex = "1";
    input.style.padding = "8px 10px";
    input.style.fontSize = "0.97rem";
    input.style.borderRadius = "6px";
    input.style.border = "1.2px solid #b3c6e6";
    input.required = true;

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = "button";
    removeBtn.textContent = "×";
    removeBtn.title = "Remove address";
    removeBtn.style.background = "#dc3545";
    removeBtn.style.color = "white";
    removeBtn.style.border = "none";
    removeBtn.style.borderRadius = "4px";
    removeBtn.style.width = "24px";
    removeBtn.style.height = "24px";
    removeBtn.style.cursor = "pointer";
    removeBtn.onclick = () => {
      div.remove();
      console.log('[address-manager.js] Address field removed');
    };

    div.appendChild(input);
    div.appendChild(removeBtn);
    manualAddressesList.appendChild(div);
    
    console.log('[address-manager.js] Address field added. Total fields:', manualAddressesList.children.length);
  }

  // Make addManualAddressField globally available
  window.addManualAddressField = addManualAddressField;

  // Attach button click handler
  if (addManualAddressBtn) {
    addManualAddressBtn.onclick = () => {
      console.log('[address-manager.js] Add button clicked');
      addManualAddressField();
    };
    console.log('[address-manager.js] Add button click handler attached');
  } else {
    console.error('[address-manager.js] Add button not found!');
  }
  
  // Add one field by default
  if (manualAddressesList) {
    addManualAddressField();
    console.log('[address-manager.js] Default address field added');
  }

  // Initialize copy and mark visited functionality
  initializeCopyAndMarkVisited();
  
  console.log('[address-manager.js] Initialization complete');
}

function initializeCopyAndMarkVisited() {
  const copyBtn = document.getElementById('copySelectedBtn');
  const markVisitedBtn = document.getElementById('markVisitedBtn');
  const middleAddressesList = document.getElementById('middleAddressesList');
  
  if (markVisitedBtn && middleAddressesList) {
    markVisitedBtn.addEventListener('click', function() {
      const listItems = middleAddressesList.getElementsByTagName('li');
      for (let item of listItems) {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const span = item.querySelector('span');
        if (checkbox && checkbox.checked && span) {
          const address = checkbox.value;
          const matchedItem = allExcelItems.find(i => i.address === address);
          if (matchedItem) {
            matchedItem.visited = true;
            span.style.color = '#888';
            span.style.textDecoration = 'line-through';
          }
        }
      }
      showMessage('Selected addresses marked as visited.', 'success');
    });
  }

  if (copyBtn && middleAddressesList) {
    copyBtn.addEventListener('click', function() {
      const addressesToCopy = [];
      const listItems = middleAddressesList.getElementsByTagName('li');
      for (let item of listItems) {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox && checkbox.checked) {
          addressesToCopy.push(checkbox.value);
        }
      }
      if (addressesToCopy.length > 0) {
        navigator.clipboard.writeText(addressesToCopy.join('\n'))
          .then(() => showMessage('Selected addresses copied to clipboard!', 'success'))
          .catch(err => showMessage('Failed to copy addresses: ' + err, 'error'));
      } else {
        showMessage('No addresses to copy.', 'info');
      }
    });
  }
}

function populateAddressSelection(itemsToDisplay) {
  console.log('[address-manager.js] populateAddressSelection called. itemsToDisplay.length:', itemsToDisplay.length);
  updateMiddleAddresses();
}

function updateMiddleAddresses() {
  const customStartAddressInput = document.getElementById('customStartAddress');
  const customEndAddressInput = document.getElementById('customEndAddress');
  const middleAddressesList = document.getElementById('middleAddressesList');
  
  if (!middleAddressesList) {
    return; // Not on upload tab
  }

  const startAddr = customStartAddressInput ? customStartAddressInput.value.trim() : '';
  const endAddr = customEndAddressInput ? customEndAddressInput.value.trim() : '';

  // Preserve checked state
  const prevChecked = {};
  Array.from(middleAddressesList.querySelectorAll('input[type="checkbox"].address-checkbox')).forEach(cb => {
    prevChecked[cb.value] = cb.checked;
  });

  middleAddressesList.innerHTML = '';

  if (typeof currentlyDisplayedItems !== 'undefined' && currentlyDisplayedItems) {
    currentlyDisplayedItems.forEach(item => {
      const isVisited = item.visited === true;
      if (item.address !== startAddr && item.address !== endAddr) {
        const li = document.createElement('li');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'address-checkbox';
        cb.value = item.address;
        cb.checked = !!prevChecked[item.address];
        li.appendChild(cb);
        
        let dText = item.address;
        if (item.name) dText = `<b>${item.name}</b> - ${dText}`;
        if (item.auctionDateFormatted) dText += ` <span style="color:#0077b6;">(${item.auctionDateFormatted})</span>`;
        
        const span = document.createElement('span');
        span.innerHTML = ' ' + dText;
        if (isVisited) {
          span.style.color = '#888';
          span.style.textDecoration = 'line-through';
        }
        
        // Add click handler to highlight address on map AND open notes
        span.addEventListener('click', function(e) {
          e.stopPropagation(); // Prevent checkbox toggle
          
          // Highlight on map
          if (typeof highlightAddressOnMap === 'function') {
            highlightAddressOnMap(item.address);
          }
          
          // Open notes overlay
          if (typeof openNotesOverlay === 'function') {
            openNotesOverlay(item.address);
          }
        });
        span.style.cursor = 'pointer';
        span.title = 'Click to view on map and manage notes';
        
        li.appendChild(span);
        
        middleAddressesList.appendChild(li);
      }
    });
  }
}

// Initialize event listeners for start/end address changes
function initializeAddressFieldListeners() {
  const customStartAddress = document.getElementById('customStartAddress');
  const customEndAddress = document.getElementById('customEndAddress');
  
  if (customStartAddress) {
    customStartAddress.addEventListener('input', function(e) {
      localStorage.setItem('savedStartAddress', e.target.value.trim());
      updateMiddleAddresses();
    });

    // Restore start address from localStorage if available
    const saved = localStorage.getItem('savedStartAddress');
    if (saved) {
      customStartAddress.value = saved;
    }
  }

  if (customEndAddress) {
    customEndAddress.addEventListener('input', updateMiddleAddresses);
  }

  updateMiddleAddresses();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeAddressFieldListeners);
