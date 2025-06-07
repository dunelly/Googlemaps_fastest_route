// Excel File Handling Module

function initializeExcelHandling() {
  if (!excelFileInput) return;

  excelFileInput.addEventListener('change', function (e) {
    console.log('File input CHANGED');
    hideMessage(); 
    hideDebug();
    const file = e.target.files[0]; 
    if (!file) return;
    updateManualAddressRequired();
    
    const reader = new FileReader();
    reader.onload = function (evt) {
      handleExcelFileLoad(evt);
    };
    reader.readAsArrayBuffer(file);
  });

  excelFileInput.addEventListener('click', function(e) {
    excelFileInput.value = null;
    console.log(`File input CLICKED (${new Date().toISOString()}) - resetting UI and data.`);
    allExcelItems = [];
    currentlyDisplayedItems = [];
    if (addressListSection) addressListSection.style.display = 'none';
    if (filterSection) filterSection.style.display = 'none';
    if (auctionDateFilterSelect) auctionDateFilterSelect.innerHTML = '<option value="all">All Dates</option>';
    
    // Hide column mapping prompt if it exists
    const addressFieldPrompt = document.getElementById('addressFieldPrompt');
    if (addressFieldPrompt) addressFieldPrompt.style.display = 'none';
    
    // Clear Google Sheets error
    const googleSheetError = document.getElementById('googleSheetError');
    if (googleSheetError) googleSheetError.style.display = 'none';
    
    updateManualAddressRequired();
    hideMessage();
    hideDebug();
  });

  // Initialize Google Sheets handling
  initializeGoogleSheetsHandling();
}

// Handle Excel file loading
function handleExcelFileLoad(evt) {
  console.log('File reader ONLOAD');
  try {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: "array", cellDates: true });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) { 
      showMessage('No sheets found.', 'error'); 
      return; 
    }
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'MM/DD/YYYY' });
    
    if (!rows.length) { 
      showMessage('No data in sheet.', 'error'); 
      return; 
    }
    
    let firstDataRow = 0;
    while (firstDataRow < rows.length && rows[firstDataRow].every(cell => !cell || String(cell).trim() === "")) firstDataRow++;
    if (firstDataRow >= rows.length) { 
      showMessage('No header row.', 'error'); 
      return; 
    }
    
    const headers = rows[firstDataRow].map(h => String(h || "EmptyHeader").trim());
    const dataRows = rows.slice(firstDataRow + 1).filter(row => row.some(cell => cell && String(cell).trim() !== ""));

    createColumnMappingPrompt(headers, dataRows);
  } catch (err) { 
    showMessage('Error parsing file: ' + err, 'error'); 
  }
}

function createColumnMappingPrompt(headers, dataRows) {
  let addressFieldPrompt = document.getElementById('addressFieldPrompt');
  if (!addressFieldPrompt) {
    addressFieldPrompt = document.createElement('div');
    addressFieldPrompt.id = 'addressFieldPrompt';
    addressFieldPrompt.style = 'margin:16px 0;padding:12px;background:#fffbe7;border:1.5px solid #ffe082;border-radius:8px;';
    addressFieldPrompt.style.display = 'block';
    
    // Insert the prompt after the upload file section in the Plan Route tab
    const uploadFileSection = document.getElementById('uploadFileSection');
    if (uploadFileSection && uploadFileSection.parentNode) {
      uploadFileSection.parentNode.insertBefore(addressFieldPrompt, uploadFileSection.nextSibling);
    } else {
      // Fallback: insert at the end of the Plan Route content
      const planRouteContent = document.getElementById('planRouteContent');
      if (planRouteContent) {
        planRouteContent.appendChild(addressFieldPrompt);
      }
    }
  } else {
    addressFieldPrompt.style.display = 'block';
  }
  
  let preset = null; 
  try { 
    preset = JSON.parse(localStorage.getItem('addressColPreset') || 'null'); 
  } catch {}
  
  addressFieldPrompt.innerHTML = `
    <b>Select columns:</b><br>
    <label>Address: <select id="addressColSelect">${headers.map((h,i)=>`<option value="${i}">${h}</option>`).join('')}</select></label>
    <label>City (opt): <select id="cityColSelect"><option value="">(none)</option>${headers.map((h,i)=>`<option value="${i}">${h}</option>`).join('')}</select></label>
    <label>State (opt): <select id="stateColSelect"><option value="">(none)</option>${headers.map((h,i)=>`<option value="${i}">${h}</option>`).join('')}</select></label><br>
    <label>First Name (opt): <select id="firstNameColSelect"><option value="">(none)</option>${headers.map((h,i)=>`<option value="${i}">${h}</option>`).join('')}</select></label>
    <label>Last Name (opt): <select id="lastNameColSelect"><option value="">(none)</option>${headers.map((h,i)=>`<option value="${i}">${h}</option>`).join('')}</select></label><br>
    <label>Auction Date (opt): <select id="auctionDateColSelect"><option value="">(none)</option>${headers.map((h,i)=>`<option value="${i}">${h}</option>`).join('')}</select></label>
    <div style="margin-top: 16px;">
      <button type="button" id="confirmAddressCols" class="add-destination-btn">Confirm</button> 
      <button type="button" id="clearPreset" class="secondary-btn" style="margin-left: 8px;">Clear Preset</button>
    </div>
  `;

  if (preset && Array.isArray(preset) && preset.length === 6) {
    const selects = ['addressColSelect', 'cityColSelect', 'stateColSelect', 'firstNameColSelect', 'lastNameColSelect', 'auctionDateColSelect'];
    selects.forEach((id, index) => {
      const select = document.getElementById(id);
      if (select && preset[index] !== null) {
        select.value = preset[index];
      }
    });
  }

  const confirmBtn = document.getElementById('confirmAddressCols');
  if (confirmBtn) {
    confirmBtn.onclick = () => processColumnMapping(headers, dataRows, addressFieldPrompt);
  }

  const clearBtn = document.getElementById('clearPreset');
  if (clearBtn) {
    clearBtn.onclick = () => {
      localStorage.removeItem('addressColPreset');
      showMessage('Preset cleared.', 'info');
    };
  }
}

function processColumnMapping(headers, dataRows, addressFieldPrompt) {
  try {
    const selects = {
      address: document.getElementById('addressColSelect'),
      city: document.getElementById('cityColSelect'),
      state: document.getElementById('stateColSelect'),
      firstName: document.getElementById('firstNameColSelect'),
      lastName: document.getElementById('lastNameColSelect'),
      auctionDate: document.getElementById('auctionDateColSelect')
    };

    if (!selects.address) throw new Error("Address column select not found.");

    const indices = {
      address: parseInt(selects.address.value, 10),
      city: selects.city && selects.city.value !== "" ? parseInt(selects.city.value, 10) : null,
      state: selects.state && selects.state.value !== "" ? parseInt(selects.state.value, 10) : null,
      firstName: selects.firstName && selects.firstName.value !== "" ? parseInt(selects.firstName.value, 10) : null,
      lastName: selects.lastName && selects.lastName.value !== "" ? parseInt(selects.lastName.value, 10) : null,
      auctionDate: selects.auctionDate && selects.auctionDate.value !== "" ? parseInt(selects.auctionDate.value, 10) : null
    };

    if (addressFieldPrompt && addressFieldPrompt.parentNode) {
      addressFieldPrompt.remove();
    }

    localStorage.setItem('addressColPreset', JSON.stringify([
      indices.address, indices.city, indices.state, 
      indices.firstName, indices.lastName, indices.auctionDate
    ]));

    const filteredRows = dataRows.filter(row => row[indices.address] && String(row[indices.address]).trim() !== "");
    const mappedItems = filteredRows.map(row => {
      let fullAddress = String(row[indices.address] || "").trim();
      if (indices.city !== null && row[indices.city]) fullAddress += ', ' + String(row[indices.city]).trim();
      if (indices.state !== null && row[indices.state]) fullAddress += ', ' + String(row[indices.state]).trim();
      
      let fullName = null;
      const firstName = indices.firstName !== null && row[indices.firstName] ? String(row[indices.firstName]).trim() : null;
      const lastName = indices.lastName !== null && row[indices.lastName] ? String(row[indices.lastName]).trim() : null;
      if (firstName && lastName) fullName = `${firstName} ${lastName}`;
      else if (firstName) fullName = firstName;
      else if (lastName) fullName = lastName;

      const rawDate = indices.auctionDate !== null && row[indices.auctionDate] ? row[indices.auctionDate] : null;
      return {
        address: fullAddress, 
        name: fullName,
        auctionDateRaw: rawDate, 
        auctionDateFormatted: formatDate(rawDate),
        lat: null, 
        lng: null
      };
    });

    const filteredItems = mappedItems.filter(item => item.address.length > 0);
    updateAllExcelItems(filteredItems);
    updateCurrentlyDisplayedItems([...filteredItems]);

    if (currentlyDisplayedItems.length < 1) { 
      showMessage('No valid addresses found.', 'error'); 
      return;
    }
    
    setTimeout(function() {
      hideDebug();
      
      // Hide the upload file section and column mapping prompt
      const uploadFileSection = document.getElementById('uploadFileSection');
      const addressFieldPrompt = document.getElementById('addressFieldPrompt');
      if (uploadFileSection) uploadFileSection.style.display = 'none';
      if (addressFieldPrompt) addressFieldPrompt.style.display = 'none';
      
      // Switch back to Plan Route tab - addresses are automatically available
      if (typeof switchTab === 'function') {
        switchTab('planRoute');
      }
      
      showMessage('Addresses loaded successfully! You can now optimize your route.', 'success');
      
      // Save Excel data to history
      const fileInput = document.getElementById('excelFile');
      const fileName = (fileInput && fileInput.files[0] && fileInput.files[0].name) || 'Excel Import';
      console.log('[excel-handler] Attempting to save Excel data:', { fileName, itemCount: currentlyDisplayedItems.length });
      
      if (typeof saveExcelData === 'function') {
        console.log('[excel-handler] saveExcelData function found, calling it...');
        saveExcelData(fileName, currentlyDisplayedItems);
      } else {
        console.error('[excel-handler] saveExcelData function not found!');
      }

      if (currentlyDisplayedItems.length > 0) {
        showMessage('Geocoding addresses...', 'info');
        
        // Use global progress function if available
        const geocodeFunction = typeof geocodeAddressesWithProgress === 'function' 
          ? geocodeAddressesWithProgress 
          : geocodeAddresses;
          
        geocodeFunction(currentlyDisplayedItems)
          .then(geocodedItems => {
            allExcelItems = geocodedItems;
            currentlyDisplayedItems = [...allExcelItems];
            showMessage('Addresses geocoded and ready for route optimization!', 'success');
          })
          .catch(err => showMessage('Geocoding error: ' + err, 'error'));
      }
    }, 0);
  } catch (err) { 
    showMessage('Error processing columns: ' + err, 'error'); 
  }
}

// Google Sheets Integration
function initializeGoogleSheetsHandling() {
  const loadBtn = document.getElementById('loadGoogleSheetBtn');
  const urlInput = document.getElementById('googleSheetUrl');
  const errorDiv = document.getElementById('googleSheetError');
  
  if (loadBtn && urlInput) {
    loadBtn.addEventListener('click', async function() {
      if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
      }
      
      const url = urlInput.value.trim();
      const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        if (errorDiv) {
          errorDiv.textContent = 'Invalid Google Sheets URL.';
          errorDiv.style.display = 'block';
        }
        return;
      }
      
      const sheetId = match[1];
      const csvUrl = `https://googlemaps-fastest-route-1.onrender.com/fetch-google-sheet-csv?sheetId=${sheetId}`;
      
      try {
        const resp = await fetch(csvUrl);
        if (!resp.ok) throw new Error('Could not fetch Google Sheet. Make sure it is shared as "Anyone with the link can view".');
        const csvText = await resp.text();
        
        // Parse CSV using XLSX
        const workbook = XLSX.read(csvText, { type: "string" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'MM/DD/YYYY' });
        if (!rows.length) throw new Error('No data found in Google Sheet.');
        
        // Process like Excel file
        let firstDataRow = 0;
        while (firstDataRow < rows.length && rows[firstDataRow].every(cell => !cell || String(cell).trim() === "")) firstDataRow++;
        if (firstDataRow >= rows.length) throw new Error('No header row found.');
        
        const headers = rows[firstDataRow].map(h => String(h || "EmptyHeader").trim());
        const dataRows = rows.slice(firstDataRow + 1).filter(row => row.some(cell => cell && String(cell).trim() !== ""));
        
        createColumnMappingPrompt(headers, dataRows);
        
      } catch (err) {
        if (errorDiv) {
          errorDiv.textContent = err.message;
          errorDiv.style.display = 'block';
        }
      }
    });
  }
}

// Note: Filtering functionality removed - addresses are loaded directly for route optimization

// Open View Data interface for the most recently uploaded Excel file
function openViewDataAfterUpload() {
  // Find the most recent Excel file (should be the one we just uploaded)
  if (window.savedExcelFiles && Object.keys(window.savedExcelFiles).length > 0) {
    const excelFiles = Object.values(window.savedExcelFiles);
    // Sort by upload date to get the most recent
    const mostRecent = excelFiles.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))[0];
    
    if (mostRecent && typeof viewExcelData === 'function') {
      console.log('[excel-handler] Opening View Data for uploaded file:', mostRecent.fileName);
      viewExcelData(mostRecent.id);
    } else {
      console.warn('[excel-handler] No recent Excel file found or viewExcelData function not available');
      // Fallback to showing on map
      if (typeof displayAddressMarkers === 'function') {
        displayAddressMarkers(currentlyDisplayedItems);
      }
    }
  } else {
    console.warn('[excel-handler] No saved Excel files found');
    // Fallback to showing on map
    if (typeof displayAddressMarkers === 'function') {
      displayAddressMarkers(currentlyDisplayedItems);
    }
  }
}

// Note: Filter event listeners removed - no longer needed
