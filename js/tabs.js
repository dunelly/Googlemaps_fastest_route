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
  
  // Modal elements
  const pasteModal = document.getElementById('pasteAddressesModal');
  const uploadModal = document.getElementById('uploadFileModal');
  
  // Show paste addresses modal
  if (pasteAddressesBtn && pasteModal) {
    pasteAddressesBtn.addEventListener('click', () => {
      showModal('pasteAddressesModal');
      const textarea = document.getElementById('pasteAddressesModalTextarea');
      if (textarea) {
        setTimeout(() => textarea.focus(), 100); // Focus after modal animation
      }
    });
  }
  
  // Show upload file modal
  if (uploadFileBtn && uploadModal) {
    uploadFileBtn.addEventListener('click', () => {
      showModal('uploadFileModal');
    });
  }
  
  // Set up modal event listeners
  setupModalEventListeners();
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

// Modal utility functions
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    // Restore body scroll
    document.body.style.overflow = 'auto';
  }
}

function hideAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.classList.remove('active');
  });
  document.body.style.overflow = 'auto';
}

// Set up modal event listeners
function setupModalEventListeners() {
  // Paste Addresses Modal
  const closePasteModalBtn = document.getElementById('closePasteModalBtn');
  const cancelPasteModalBtn = document.getElementById('cancelPasteModalBtn');
  const confirmPasteModalBtn = document.getElementById('confirmPasteModalBtn');
  const pasteModal = document.getElementById('pasteAddressesModal');
  
  if (closePasteModalBtn) {
    closePasteModalBtn.addEventListener('click', () => {
      hideModal('pasteAddressesModal');
      clearPasteModal();
    });
  }
  
  if (cancelPasteModalBtn) {
    cancelPasteModalBtn.addEventListener('click', () => {
      hideModal('pasteAddressesModal');
      clearPasteModal();
    });
  }
  
  if (confirmPasteModalBtn) {
    confirmPasteModalBtn.addEventListener('click', handlePasteConfirm);
  }
  
  // Upload File Modal
  const closeUploadModalBtn = document.getElementById('closeUploadModalBtn');
  const cancelUploadModalBtn = document.getElementById('cancelUploadModalBtn');
  const loadGoogleSheetModalBtn = document.getElementById('loadGoogleSheetModalBtn');
  const uploadModal = document.getElementById('uploadFileModal');
  const excelFileModal = document.getElementById('excelFileModal');
  const backToUploadBtn = document.getElementById('backToUploadBtn');
  const confirmColumnMappingBtn = document.getElementById('confirmColumnMappingBtn');
  const clearPresetModalBtn = document.getElementById('clearPresetModalBtn');
  
  if (closeUploadModalBtn) {
    closeUploadModalBtn.addEventListener('click', () => {
      hideModal('uploadFileModal');
      clearUploadModal();
    });
  }
  
  if (cancelUploadModalBtn) {
    cancelUploadModalBtn.addEventListener('click', () => {
      hideModal('uploadFileModal');
      clearUploadModal();
    });
  }
  
  if (loadGoogleSheetModalBtn) {
    loadGoogleSheetModalBtn.addEventListener('click', handleGoogleSheetLoad);
  }
  
  if (excelFileModal) {
    excelFileModal.addEventListener('change', handleFileUpload);
  }
  
  if (backToUploadBtn) {
    backToUploadBtn.addEventListener('click', goBackToUploadStep);
  }
  
  if (confirmColumnMappingBtn) {
    confirmColumnMappingBtn.addEventListener('click', handleColumnMappingConfirm);
  }
  
  if (clearPresetModalBtn) {
    clearPresetModalBtn.addEventListener('click', () => {
      localStorage.removeItem('addressColPreset');
      if (typeof showMessage === 'function') {
        showMessage('Column preset cleared.', 'info');
      }
    });
  }
  
  // Close modals when clicking backdrop
  if (pasteModal) {
    pasteModal.addEventListener('click', (e) => {
      if (e.target === pasteModal) {
        hideModal('pasteAddressesModal');
        clearPasteModal();
      }
    });
  }
  
  if (uploadModal) {
    uploadModal.addEventListener('click', (e) => {
      if (e.target === uploadModal) {
        hideModal('uploadFileModal');
        clearUploadModal();
      }
    });
  }
  
  // Close modals with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideAllModals();
      clearPasteModal();
      clearUploadModal();
    }
  });
}

// Handle paste addresses confirmation
function handlePasteConfirm() {
  const textarea = document.getElementById('pasteAddressesModalTextarea');
  if (!textarea) return;
  
  const addressesToPaste = textarea.value.trim().split('\n').filter(addr => addr.trim() !== '');
  if (addressesToPaste.length > 0) {
    // Clear existing destination fields except the first one
    clearAllDestinationFields();
    
    // Add pasted addresses to destination fields
    addressesToPaste.forEach((addr, index) => {
      if (index === 0) {
        // Fill the first field
        const firstField = document.querySelector('.destination-field');
        if (firstField) {
          firstField.value = addr.trim();
        }
      } else {
        // Add new fields for remaining addresses
        addNewDestinationFieldAboveButton();
        const allFields = document.querySelectorAll('.destination-field');
        const newField = allFields[allFields.length - 1]; // Get the last field (newly created)
        if (newField) {
          newField.value = addr.trim();
        }
      }
    });
    
    // Update placeholders to reflect the current state
    updateDestinationLabels();
    
    // Set up clear button visibility for new fields
    setupClearButtonVisibility();
    
    hideModal('pasteAddressesModal');
    clearPasteModal();
    
    if (typeof showMessage === 'function') {
      showMessage(`${addressesToPaste.length} addresses added to destinations.`, 'success');
    }
  } else {
    if (typeof showMessage === 'function') {
      showMessage('No addresses to paste.', 'warning');
    }
  }
}

// Prevent multiple simultaneous Google Sheets requests
let isLoadingGoogleSheets = false;

// Handle Google Sheets URL loading
async function handleGoogleSheetLoad() {
  // Prevent multiple simultaneous requests
  if (isLoadingGoogleSheets) {
    console.log('[google-sheets] Request already in progress, ignoring...');
    return;
  }
  
  const urlInput = document.getElementById('googleSheetUrlModal');
  const errorDiv = document.getElementById('googleSheetModalError');
  
  if (!urlInput) return;
  
  const url = urlInput.value.trim();
  if (!url) {
    if (typeof showMessage === 'function') {
      showMessage('Please enter a Google Sheets URL.', 'warning');
    }
    return;
  }
  
  // Clear previous errors
  if (errorDiv) {
    errorDiv.style.display = 'none';
  }
  
  isLoadingGoogleSheets = true;
  
  try {
    // Validate Google Sheets URL format
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      throw new Error('Invalid Google Sheets URL. Please use a valid Google Sheets link.');
    }
    
    const sheetId = match[1];
    
    // Try direct Google Sheets CSV export first (faster, no proxy needed)
    const directCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
    const proxyCsvUrl = `https://googlemaps-fastest-route-1.onrender.com/fetch-google-sheet-csv?sheetId=${sheetId}`;
    
    console.log('[google-sheets] Trying direct CSV export first:', directCsvUrl);
    
    // Show loading message
    if (typeof showMessage === 'function') {
      showMessage('Loading Google Sheets data...', 'info');
    }
    
    // Disable the load button while processing
    const loadBtn = document.getElementById('loadGoogleSheetModalBtn');
    if (loadBtn) {
      loadBtn.disabled = true;
      loadBtn.textContent = 'Loading...';
    }
    
    let csvText = '';
    let fetchSuccess = false;
    
    // Try direct Google Sheets CSV export first
    try {
      console.log('[google-sheets] Attempting direct CSV export...');
      const controller1 = new AbortController();
      const timeoutId1 = setTimeout(() => controller1.abort(), 15000); // 15 second timeout for direct
      
      const directResp = await fetch(directCsvUrl, { 
        signal: controller1.signal,
        mode: 'cors',
        headers: {
          'Accept': 'text/csv,text/plain,*/*'
        }
      });
      
      clearTimeout(timeoutId1);
      
      if (directResp.ok) {
        csvText = await directResp.text();
        console.log('[google-sheets] Direct CSV successful, length:', csvText.length);
        fetchSuccess = true;
      } else {
        console.log('[google-sheets] Direct CSV failed with status:', directResp.status);
      }
    } catch (directError) {
      console.log('[google-sheets] Direct CSV failed:', directError.message);
    }
    
    // If direct failed, try proxy server
    if (!fetchSuccess) {
      console.log('[google-sheets] Trying proxy server:', proxyCsvUrl);
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 30000); // 30 second timeout for proxy
      
      const proxyResp = await fetch(proxyCsvUrl, { 
        signal: controller2.signal,
        headers: {
          'Accept': 'text/csv,text/plain,*/*'
        }
      });
      
      clearTimeout(timeoutId2);
      
      if (!proxyResp.ok) {
        const errorText = await proxyResp.text().catch(() => '');
        throw new Error(`Could not fetch Google Sheet (${proxyResp.status}). Make sure it is shared as "Anyone with the link can view". ${errorText}`);
      }
      
      csvText = await proxyResp.text();
      console.log('[google-sheets] Proxy fetch successful, length:', csvText.length);
    }
    
    // Parse CSV using XLSX
    const workbook = XLSX.read(csvText, { type: "string" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'MM/DD/YYYY' });
    
    if (!rows.length) {
      throw new Error('No data found in Google Sheet.');
    }
    
    // Find first data row (skip empty rows)
    let firstDataRow = 0;
    while (firstDataRow < rows.length && rows[firstDataRow].every(cell => !cell || String(cell).trim() === "")) {
      firstDataRow++;
    }
    
    if (firstDataRow >= rows.length) {
      throw new Error('No header row found in Google Sheet.');
    }
    
    const headers = rows[firstDataRow].map(h => String(h || "EmptyHeader").trim());
    const dataRows = rows.slice(firstDataRow + 1).filter(row => 
      row.some(cell => cell && String(cell).trim() !== "")
    );
    
    if (dataRows.length === 0) {
      throw new Error('No data rows found in Google Sheet.');
    }
    
    console.log('[google-sheets] Processed data - Headers:', headers.length, 'Data rows:', dataRows.length);
    
    // Store data for later processing
    window.currentUploadData = { 
      headers, 
      dataRows, 
      fileName: `Google Sheets (${new Date().toLocaleDateString()})` 
    };
    
    // Show column mapping step
    showColumnMappingStep(headers);
    
  } catch (error) {
    console.error('[google-sheets] Error:', error);
    
    let errorMessage = error.message;
    if (error.name === 'AbortError') {
      errorMessage = 'Request timed out. The Google Sheets proxy server may be slow or unavailable.';
    }
    
    if (errorDiv) {
      errorDiv.textContent = errorMessage;
      errorDiv.style.display = 'block';
    } else if (typeof showMessage === 'function') {
      showMessage('Google Sheets error: ' + errorMessage, 'error');
    }
  } finally {
    // Reset loading state
    isLoadingGoogleSheets = false;
    
    // Re-enable the load button
    const loadBtn = document.getElementById('loadGoogleSheetModalBtn');
    if (loadBtn) {
      loadBtn.disabled = false;
      loadBtn.textContent = 'Load from URL';
    }
  }
}

// Handle file upload
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Process the file and prepare for column mapping
  processExcelFileForModal(file);
}

// Process Excel file for modal column mapping
function processExcelFileForModal(file) {
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        throw new Error('File must contain at least a header row and one data row.');
      }
      
      const headers = jsonData[0];
      const dataRows = jsonData.slice(1);
      
      // Store data for later processing
      window.currentUploadData = { headers, dataRows, fileName: file.name };
      
      // Show column mapping step
      showColumnMappingStep(headers);
      
    } catch (error) {
      console.error('Excel processing error:', error);
      if (typeof showMessage === 'function') {
        showMessage('Error processing Excel file: ' + error.message, 'error');
      }
    }
  };
  reader.readAsArrayBuffer(file);
}

// Show column mapping step in upload modal
function showColumnMappingStep(headers) {
  // Hide step 1, show step 2
  document.getElementById('uploadStep1').style.display = 'none';
  document.getElementById('uploadStep2').style.display = 'block';
  
  // Update modal title
  const modalTitle = document.getElementById('uploadModalTitle');
  if (modalTitle) {
    modalTitle.textContent = '📋 Map Columns';
  }
  
  // Generate column mapping UI
  const mappingContent = document.getElementById('columnMappingContent');
  if (mappingContent) {
    mappingContent.innerHTML = generateColumnMappingHTML(headers);
    
    // Apply saved preset if available
    applySavedColumnPreset();
  }
}

// Generate column mapping HTML
function generateColumnMappingHTML(headers) {
  const fields = [
    { id: 'addressColSelect', label: 'Address', required: true },
    { id: 'cityColSelect', label: 'City (Optional)', required: false },
    { id: 'stateColSelect', label: 'State (Optional)', required: false },
    { id: 'firstNameColSelect', label: 'First Name (Optional)', required: false },
    { id: 'lastNameColSelect', label: 'Last Name (Optional)', required: false },
    { id: 'auctionDateColSelect', label: 'Auction Date (Optional)', required: false }
  ];
  
  return fields.map(field => {
    const options = field.required 
      ? headers.map((h, i) => `<option value="${i}">${h}</option>`).join('')
      : `<option value="">(none)</option>${headers.map((h, i) => `<option value="${i}">${h}</option>`).join('')}`;
    
    return `
      <div class="column-mapping-row">
        <label class="column-mapping-label">${field.label}${field.required ? ' *' : ''}</label>
        <select id="${field.id}" class="column-mapping-select">
          ${options}
        </select>
      </div>
    `;
  }).join('');
}

// Apply saved column preset
function applySavedColumnPreset() {
  try {
    const preset = JSON.parse(localStorage.getItem('addressColPreset') || 'null');
    if (preset && Array.isArray(preset) && preset.length === 6) {
      const selects = ['addressColSelect', 'cityColSelect', 'stateColSelect', 'firstNameColSelect', 'lastNameColSelect', 'auctionDateColSelect'];
      selects.forEach((id, index) => {
        const select = document.getElementById(id);
        if (select && preset[index] !== null) {
          select.value = preset[index];
        }
      });
    }
  } catch (error) {
    console.warn('Error applying column preset:', error);
  }
}

// Go back to upload step
function goBackToUploadStep() {
  document.getElementById('uploadStep2').style.display = 'none';
  document.getElementById('uploadStep1').style.display = 'block';
  
  // Update modal title
  const modalTitle = document.getElementById('uploadModalTitle');
  if (modalTitle) {
    modalTitle.textContent = '📁 Upload Excel/CSV File';
  }
  
  // Clear stored data
  window.currentUploadData = null;
}

// Handle column mapping confirmation
function handleColumnMappingConfirm() {
  if (!window.currentUploadData) {
    if (typeof showMessage === 'function') {
      showMessage('No file data available. Please upload a file first.', 'error');
    }
    return;
  }
  
  try {
    const selects = {
      address: document.getElementById('addressColSelect'),
      city: document.getElementById('cityColSelect'),
      state: document.getElementById('stateColSelect'),
      firstName: document.getElementById('firstNameColSelect'),
      lastName: document.getElementById('lastNameColSelect'),
      auctionDate: document.getElementById('auctionDateColSelect')
    };

    if (!selects.address) {
      throw new Error("Address column select not found.");
    }

    const addressCol = parseInt(selects.address.value);
    if (isNaN(addressCol)) {
      throw new Error("Please select an address column.");
    }

    // Save column preferences
    const colPreferences = [
      addressCol,
      selects.city.value === '' ? null : parseInt(selects.city.value),
      selects.state.value === '' ? null : parseInt(selects.state.value),
      selects.firstName.value === '' ? null : parseInt(selects.firstName.value),
      selects.lastName.value === '' ? null : parseInt(selects.lastName.value),
      selects.auctionDate.value === '' ? null : parseInt(selects.auctionDate.value)
    ];
    localStorage.setItem('addressColPreset', JSON.stringify(colPreferences));

    // Process the data using the existing processColumnMapping logic
    processModalColumnMapping(window.currentUploadData.headers, window.currentUploadData.dataRows, selects);
    
  } catch (error) {
    console.error('Column mapping error:', error);
    if (typeof showMessage === 'function') {
      showMessage('Error processing column mapping: ' + error.message, 'error');
    }
  }
}

// Process column mapping (adapted from excel-handler.js)
function processModalColumnMapping(headers, dataRows, selects) {
  try {
    const addressCol = parseInt(selects.address.value);
    const cityCol = selects.city.value === '' ? null : parseInt(selects.city.value);
    const stateCol = selects.state.value === '' ? null : parseInt(selects.state.value);
    const firstNameCol = selects.firstName.value === '' ? null : parseInt(selects.firstName.value);
    const lastNameCol = selects.lastName.value === '' ? null : parseInt(selects.lastName.value);
    const auctionDateCol = selects.auctionDate.value === '' ? null : parseInt(selects.auctionDate.value);

    const processedData = [];
    let validCount = 0;

    dataRows.forEach((row, index) => {
      const address = row[addressCol];
      if (!address || address.toString().trim() === '') {
        console.warn(`Row ${index + 1}: No address found, skipping.`);
        return;
      }

      let name = '';
      if (firstNameCol !== null || lastNameCol !== null) {
        const firstName = firstNameCol !== null ? (row[firstNameCol] || '').toString().trim() : '';
        const lastName = lastNameCol !== null ? (row[lastNameCol] || '').toString().trim() : '';
        name = [firstName, lastName].filter(n => n).join(' ');
      }

      let fullAddress = address.toString().trim();
      if (cityCol !== null || stateCol !== null) {
        const city = cityCol !== null ? (row[cityCol] || '').toString().trim() : '';
        const state = stateCol !== null ? (row[stateCol] || '').toString().trim() : '';
        
        const addressParts = [fullAddress];
        if (city) addressParts.push(city);
        if (state) addressParts.push(state);
        fullAddress = addressParts.join(', ');
      }

      const item = {
        address: fullAddress,
        name: name || 'Unknown',
        lat: null,
        lng: null
      };

      if (auctionDateCol !== null) {
        const auctionDateValue = row[auctionDateCol];
        if (auctionDateValue) {
          item.auctionDate = auctionDateValue.toString();
        }
      }

      processedData.push(item);
      validCount++;
    });

    if (validCount === 0) {
      throw new Error('No valid addresses found in the selected column.');
    }

    // Use existing global functions to update the data
    if (typeof updateAllExcelItems === 'function') {
      updateAllExcelItems(processedData);
    }
    if (typeof updateCurrentlyDisplayedItems === 'function') {
      updateCurrentlyDisplayedItems([...processedData]);
    }

    // Auto-load addresses on map for immediate visual feedback
    console.log('[modal-upload] Auto-loading addresses on map for new users');
    autoLoadAddressesOnMap(processedData);

    // Save to Excel history if user is signed in
    if (window.currentUploadData && typeof saveExcelData === 'function') {
      saveExcelData(window.currentUploadData.fileName, processedData);
    }

    // Switch back to Plan Route tab and close modal
    if (typeof switchTab === 'function') {
      switchTab('planRoute');
    }
    
    hideModal('uploadFileModal');
    clearUploadModal();
    
    if (typeof showMessage === 'function') {
      showMessage(`Successfully processed ${validCount} addresses from "${window.currentUploadData.fileName}". All addresses loaded on map.`, 'success');
    }

    // Clear stored data
    window.currentUploadData = null;

  } catch (error) {
    console.error('Error processing column mapping:', error);
    if (typeof showMessage === 'function') {
      showMessage('Error processing file: ' + error.message, 'error');
    }
  }
}

// Auto-load addresses on map for immediate visual feedback
async function autoLoadAddressesOnMap(processedData) {
  try {
    console.log('[auto-load] Loading', processedData.length, 'addresses on map...');
    
    // Update address list first
    if (typeof populateAddressSelection === 'function') {
      populateAddressSelection(processedData);
      console.log('[auto-load] Address selection populated');
    }
    
    // Check if addresses already have coordinates
    const addressesWithCoords = processedData.filter(item => 
      item.lat && item.lng && typeof item.lat === 'number' && typeof item.lng === 'number'
    );
    
    console.log('[auto-load] Addresses with coordinates:', addressesWithCoords.length, 'of', processedData.length);
    
    if (addressesWithCoords.length > 0) {
      // Display addresses that already have coordinates immediately
      if (typeof displayAddressMarkers === 'function') {
        displayAddressMarkers(addressesWithCoords);
        console.log('[auto-load] Displayed', addressesWithCoords.length, 'markers with existing coordinates');
      }
    }
    
    // Geocode addresses that don't have coordinates
    const addressesNeedingGeocode = processedData.filter(item => 
      !item.lat || !item.lng || typeof item.lat !== 'number' || typeof item.lng !== 'number'
    );
    
    if (addressesNeedingGeocode.length > 0) {
      console.log('[auto-load] Geocoding', addressesNeedingGeocode.length, 'addresses...');
      
      if (typeof showMessage === 'function') {
        showMessage(`Geocoding ${addressesNeedingGeocode.length} addresses for map display...`, 'info');
      }
      
      // Geocode missing coordinates
      if (typeof geocodeAddresses === 'function') {
        try {
          const geocodedItems = await geocodeAddresses(processedData);
          
          // Update the global data with geocoded coordinates
          if (typeof updateAllExcelItems === 'function') {
            updateAllExcelItems(geocodedItems);
          }
          if (typeof updateCurrentlyDisplayedItems === 'function') {
            updateCurrentlyDisplayedItems([...geocodedItems]);
          }
          
          // Display all markers after geocoding
          if (typeof displayAddressMarkers === 'function') {
            displayAddressMarkers(geocodedItems);
            console.log('[auto-load] Displayed all', geocodedItems.length, 'markers after geocoding');
          }
          
          // Update the saved Excel data with new coordinates if user is signed in
          if (window.currentUploadData && window.excelHistoryCurrentUser && typeof FirebaseUtils !== 'undefined') {
            try {
              // Find the most recently saved Excel file and update it
              const savedFiles = window.savedExcelFiles || {};
              const recentFileId = Object.keys(savedFiles).pop(); // Get most recent
              if (recentFileId && savedFiles[recentFileId]) {
                savedFiles[recentFileId].processedData = geocodedItems;
                await FirebaseUtils.saveUserData('excelHistory', recentFileId, savedFiles[recentFileId]);
                console.log('[auto-load] Updated Excel data with geocoded coordinates');
              }
            } catch (error) {
              console.warn('[auto-load] Failed to save updated coordinates:', error);
            }
          }
          
          if (typeof showMessage === 'function') {
            showMessage(`Successfully loaded ${geocodedItems.length} addresses on the map!`, 'success');
          }
          
        } catch (error) {
          console.error('[auto-load] Geocoding error:', error);
          if (typeof showMessage === 'function') {
            showMessage('Some addresses could not be geocoded, but those with valid coordinates are shown on the map.', 'warning');
          }
        }
      } else {
        console.warn('[auto-load] geocodeAddresses function not available');
        if (typeof showMessage === 'function') {
          showMessage('Geocoding not available. Addresses with coordinates are shown on the map.', 'warning');
        }
      }
    }
    
    console.log('[auto-load] Address auto-loading completed');
    
  } catch (error) {
    console.error('[auto-load] Error auto-loading addresses:', error);
    if (typeof showMessage === 'function') {
      showMessage('Error loading addresses on map: ' + error.message, 'error');
    }
  }
}

// Clear modal data
function clearPasteModal() {
  const textarea = document.getElementById('pasteAddressesModalTextarea');
  if (textarea) {
    textarea.value = '';
  }
}

function clearUploadModal() {
  const fileInput = document.getElementById('excelFileModal');
  const urlInput = document.getElementById('googleSheetUrlModal');
  const errorDiv = document.getElementById('googleSheetModalError');
  
  if (fileInput) fileInput.value = '';
  if (urlInput) urlInput.value = '';
  if (errorDiv) errorDiv.style.display = 'none';
  
  // Reset to step 1
  const step1 = document.getElementById('uploadStep1');
  const step2 = document.getElementById('uploadStep2');
  const modalTitle = document.getElementById('uploadModalTitle');
  
  if (step1) step1.style.display = 'block';
  if (step2) step2.style.display = 'none';
  if (modalTitle) modalTitle.textContent = '📁 Upload Excel/CSV File';
  
  // Clear stored data
  window.currentUploadData = null;
}

// Make functions globally available
window.switchTab = switchTab;
window.addNewDestinationFieldAboveButton = addNewDestinationFieldAboveButton;
window.clearAllDestinationFields = clearAllDestinationFields;
window.updateDestinationLabels = updateDestinationLabels;
window.setupClearButtonVisibility = setupClearButtonVisibility;
window.initializePlanRouteButtons = initializePlanRouteButtons;
window.showModal = showModal;
window.hideModal = hideModal;
window.hideAllModals = hideAllModals;
