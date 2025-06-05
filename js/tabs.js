// Tab Switching Functionality Module

function initializeTabSwitching() {
  const planRouteTab = document.getElementById('planRouteTab');
  const manageFilesTab = document.getElementById('manageFilesTab');
  const planRouteContent = document.getElementById('planRouteContent');
  const manageFilesContent = document.getElementById('manageFilesContent');
  
  if (!planRouteTab || !manageFilesTab) {
    console.error("Tab elements not found");
    return;
  }

  const tabButtons = [planRouteTab, manageFilesTab];
  const tabContents = [planRouteContent, manageFilesContent];

  function setActiveTab(activeIndex) {
    tabButtons.forEach((tab, index) => {
      const isActive = index === activeIndex;
      tab.classList.toggle('active', isActive);
      tab.style.color = isActive ? '#4285F4' : '#999999';
      tab.style.borderBottom = isActive ? '2px solid #4285F4' : '2px solid transparent';
      if (tabContents[index]) {
        tabContents[index].style.display = isActive ? 'block' : 'none';
      }
    });
    
    let addressFieldPrompt = document.getElementById('addressFieldPrompt');
    if (addressFieldPrompt) {
        const excelFileHasData = allExcelItems && allExcelItems.length > 0;
        if (activeIndex === 2 && !excelFileHasData) {
            // addressFieldPrompt.style.display = 'block';
        } else {
            addressFieldPrompt.style.display = 'none';
        }
    }
    updateManualAddressRequired();
  }

  // Event listeners for tab buttons
  planRouteTab.addEventListener('click', () => setActiveTab(0));
  manageFilesTab.addEventListener('click', () => {
    setActiveTab(1);
    // Show Excel history when switching to Manage Files tab with a small delay
    // to ensure tab switch completes first
    setTimeout(() => {
      if (typeof populateExcelHistory === 'function') {
        populateExcelHistory();
      }
    }, 50);
  });
  
  // Button event listeners for Plan Route tab
  initializePlanRouteButtons();
  
  // Moved to initializePlanRouteButtons()

  // Set initial active tab
  setActiveTab(0);

  // Connect clean interface buttons to functionality
  connectAddDestinationButtons(setActiveTab);
}

function connectAddDestinationButtons(setActiveTab) {
  // Connect Google Maps-style destination functionality
  connectGoogleMapsStyleFields();
  
  // Connect clear buttons
  connectClearButtons();
}

function connectGoogleMapsStyleFields() {
  const addBtn = document.getElementById('addDestinationBtn');
  if (!addBtn) return;

  // Add event listener for the main add destination button
  addBtn.addEventListener('click', function() {
    addNewDestinationFieldAboveButton();
  });

  // Event delegation for clear buttons and any future functionality
  const fieldsContainer = document.getElementById('destinationFields');
  if (fieldsContainer) {
    fieldsContainer.addEventListener('click', function(e) {
      // Handle clear buttons if needed
    });
  }
}

function addNewDestinationFieldAboveButton() {
  const fieldsContainer = document.getElementById('destinationFields');
  if (!fieldsContainer) return;

  // Count existing destination fields to get the next number
  const existingFields = fieldsContainer.querySelectorAll('.destination-input-container');
  const nextNumber = existingFields.length + 1;

  // Create new destination input field with numbered placeholder
  const newFieldContainer = document.createElement('div');
  newFieldContainer.className = 'destination-input-container';
  newFieldContainer.style.cssText = 'position: relative; margin-bottom: 12px;';
  newFieldContainer.innerHTML = `
    <input type="text" class="clean-input destination-input destination-field" placeholder="Destination ${nextNumber}" style="width: 100%; padding-right: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.06);">
    <button type="button" class="clear-btn" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); box-shadow: 0 1px 3px rgba(0,0,0,0.1);">×</button>
  `;
  
  // Insert the new field at the end of the fields container
  fieldsContainer.appendChild(newFieldContainer);
  
  // Focus on the new input
  const newInput = newFieldContainer.querySelector('.destination-field');
  if (newInput) {
    newInput.focus();
  }
  
  // Reconnect clear buttons
  connectClearButtons();
  
  // Update all labels to ensure proper numbering
  updateDestinationLabels();
  
  // Set up input monitoring for clear button visibility
  setupClearButtonVisibility();
}

function clearAllDestinationFields() {
  const fieldsContainer = document.getElementById('destinationFields');
  if (!fieldsContainer) return;
  
  // Get all destination input containers
  const containers = fieldsContainer.querySelectorAll('.destination-input-container');
  
  // Remove all except the first one
  for (let i = 1; i < containers.length; i++) {
    containers[i].remove();
  }
  
  // Clear the first field
  const firstField = fieldsContainer.querySelector('.destination-field');
  if (firstField) {
    firstField.value = '';
  }
  
  // Update labels to ensure proper numbering
  updateDestinationLabels();
  
  // Set up input monitoring for clear button visibility
  setupClearButtonVisibility();
}

// Update destination placeholders to ensure proper numbering
function updateDestinationLabels() {
  const fieldsContainer = document.getElementById('destinationFields');
  if (!fieldsContainer) return;
  
  const containers = fieldsContainer.querySelectorAll('.destination-input-container');
  containers.forEach((container, index) => {
    const input = container.querySelector('input.destination-field');
    if (input) {
      input.placeholder = `Destination ${index + 1}`;
    }
  });
}

function connectClearButtons() {
  // Clear buttons for destination inputs
  document.querySelectorAll('.clear-btn').forEach(btn => {
    // Remove existing listeners to prevent duplicates
    btn.replaceWith(btn.cloneNode(true));
  });
  
  // Re-attach listeners
  document.querySelectorAll('.clear-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const container = btn.parentElement;
      const input = container.querySelector('input');
      
      // If this is the first container, just clear the input
      const fieldsContainer = document.getElementById('destinationFields');
      const allContainers = fieldsContainer.querySelectorAll('.destination-input-container');
      
      if (allContainers[0] === container && allContainers.length === 1) {
        // First and only field - just clear it
        if (input) {
          input.value = '';
          input.focus();
        }
      } else {
        // Remove the entire container
        container.remove();
        updateDestinationLabels();
      }
    });
  });
}

// Initialize Plan Route tab button functionality
function initializePlanRouteButtons() {
  const pasteAddressesBtn = document.getElementById('pasteAddressesBtn');
  const uploadFileBtn = document.getElementById('uploadFileBtn');
  const pasteAddressesSection = document.getElementById('pasteAddressesSection');
  const uploadFileSection = document.getElementById('uploadFileSection');
  const confirmPasteBtn = document.getElementById('confirmPasteBtn');
  const cancelPasteBtn = document.getElementById('cancelPasteBtn');
  const cancelUploadBtn = document.getElementById('cancelUploadBtn');
  const pasteAddressesTextarea = document.getElementById('pasteAddressesTextarea');
  
  // Show/hide paste addresses section
  if (pasteAddressesBtn && pasteAddressesSection) {
    pasteAddressesBtn.addEventListener('click', () => {
      pasteAddressesSection.style.display = 'block';
      uploadFileSection.style.display = 'none';
      pasteAddressesTextarea.focus();
    });
  }
  
  // Show/hide upload file section
  if (uploadFileBtn && uploadFileSection) {
    uploadFileBtn.addEventListener('click', () => {
      uploadFileSection.style.display = 'block';
      pasteAddressesSection.style.display = 'none';
    });
  }
  
  // Cancel paste addresses
  if (cancelPasteBtn && pasteAddressesSection) {
    cancelPasteBtn.addEventListener('click', () => {
      pasteAddressesSection.style.display = 'none';
      pasteAddressesTextarea.value = '';
    });
  }
  
  // Cancel upload file
  if (cancelUploadBtn && uploadFileSection) {
    cancelUploadBtn.addEventListener('click', () => {
      uploadFileSection.style.display = 'none';
      const fileInput = document.getElementById('excelFile');
      const googleSheetUrl = document.getElementById('googleSheetUrl');
      const addressFieldPrompt = document.getElementById('addressFieldPrompt');
      const googleSheetError = document.getElementById('googleSheetError');
      
      if (fileInput) fileInput.value = '';
      if (googleSheetUrl) googleSheetUrl.value = '';
      if (addressFieldPrompt) addressFieldPrompt.style.display = 'none';
      if (googleSheetError) googleSheetError.style.display = 'none';
    });
  }
  
  // Paste confirmation handler
  if (confirmPasteBtn && pasteAddressesTextarea) {
    confirmPasteBtn.addEventListener('click', () => {
      const addressesToPaste = pasteAddressesTextarea.value.trim().split('\n').filter(addr => addr.trim() !== '');
      if (addressesToPaste.length > 0) {
        // Clear existing destination fields except the first one
        clearAllDestinationFields();
        
        // Add pasted addresses to destination fields
        addressesToPaste.forEach((addr, index) => {
          if (index === 0) {
            // Fill the first field
            const firstField = document.querySelector('.destination-field');
            if (firstField) {
              firstField.value = addr;
            }
          } else {
            // Add new fields for remaining addresses
            addNewDestinationFieldAboveButton();
            const allFields = document.querySelectorAll('.destination-field');
            const newField = allFields[allFields.length - 1]; // Get the last field (newly created)
            if (newField) {
              newField.value = addr;
            }
          }
        });
        
        // Update placeholders to reflect the current state
        updateDestinationLabels();
        
        // Set up clear button visibility for new fields
        setupClearButtonVisibility();
        
        pasteAddressesTextarea.value = '';
        pasteAddressesSection.style.display = 'none';
        if (typeof showMessage === 'function') {
          showMessage(`${addressesToPaste.length} addresses added to destinations.`, 'success');
        }
      } else {
        if (typeof showMessage === 'function') {
          showMessage('No addresses to paste.', 'warning');
        }
      }
    });
  }
}

// Global function to switch tabs programmatically
function switchTab(tabName) {
  if (tabName === 'planRoute' || tabName === 0) {
    const tab = document.getElementById('planRouteTab');
    if (tab) tab.click();
  } else if (tabName === 'manageFiles' || tabName === 1) {
    const tab = document.getElementById('manageFilesTab');
    if (tab) tab.click();
  }
}

// Set up clear button visibility based on input content
function setupClearButtonVisibility() {
  const containers = document.querySelectorAll('.destination-input-container');
  containers.forEach(container => {
    const input = container.querySelector('.destination-field');
    const clearBtn = container.querySelector('.clear-btn');
    
    if (input && clearBtn) {
      // Initial state
      clearBtn.style.opacity = input.value.trim() ? '1' : '0.4';
      clearBtn.style.pointerEvents = input.value.trim() ? 'auto' : 'none';
      
      // Monitor input changes
      input.addEventListener('input', function() {
        const hasContent = this.value.trim().length > 0;
        clearBtn.style.opacity = hasContent ? '1' : '0.4';
        clearBtn.style.pointerEvents = hasContent ? 'auto' : 'none';
        clearBtn.style.transform = hasContent ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(0.8)';
      });
    }
  });
}

// Make functions globally available
window.switchTab = switchTab;
window.addNewDestinationFieldAboveButton = addNewDestinationFieldAboveButton;
window.clearAllDestinationFields = clearAllDestinationFields;
window.updateDestinationLabels = updateDestinationLabels;
window.setupClearButtonVisibility = setupClearButtonVisibility;
window.initializePlanRouteButtons = initializePlanRouteButtons;
