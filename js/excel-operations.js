// Excel Operations - Address loading and file management operations

// Load Excel addresses to map
async function loadExcelAddresses(excelId) {
  try {
    console.log('[excel-operations] Loading addresses for Excel ID:', excelId);
    const excelData = window.savedExcelFiles ? window.savedExcelFiles[excelId] : null;
    if (!excelData) {
      console.error('[excel-operations] Excel data not found for ID:', excelId);
      return;
    }
    
    console.log('[excel-operations] Excel data found:', excelData.fileName, 'addresses:', excelData.addressCount);
    
    // Use existing global variables and functions
    updateAllExcelItems(excelData.processedData);
    updateCurrentlyDisplayedItems([...excelData.processedData]);
    
    console.log('[excel-operations] Set global variables, total items:', window.currentlyDisplayedItems.length);
    
    // Update address list first
    if (typeof populateAddressSelection === 'function') {
      populateAddressSelection(window.currentlyDisplayedItems);
      console.log('[excel-operations] Address selection populated');
    }
    
    // Check if addresses have coordinates, if not geocode them
    const addressesWithCoords = window.currentlyDisplayedItems.filter(item => 
      item.lat && item.lng && typeof item.lat === 'number' && typeof item.lng === 'number'
    );
    
    console.log('[excel-operations] Addresses with coordinates:', addressesWithCoords.length, 'of', window.currentlyDisplayedItems.length);
    
    if (addressesWithCoords.length > 0) {
      // Display addresses that already have coordinates
      if (typeof displayAddressMarkers === 'function') {
        displayAddressMarkers(addressesWithCoords);
        console.log('[excel-operations] Displayed', addressesWithCoords.length, 'markers on map');
      }
    }
    
    // Geocode addresses that don't have coordinates
    const addressesNeedingGeocode = window.currentlyDisplayedItems.filter(item => 
      !item.lat || !item.lng || typeof item.lat !== 'number' || typeof item.lng !== 'number'
    );
    
    if (addressesNeedingGeocode.length > 0) {
      console.log('[excel-operations] Geocoding', addressesNeedingGeocode.length, 'addresses...');
      if (typeof showMessage === 'function') {
        showMessage(`Geocoding ${addressesNeedingGeocode.length} addresses...`, 'info');
      }
      
      // Geocode missing coordinates with progress
      if (typeof geocodeAddressesWithProgress === 'function') {
        try {
          const geocodedItems = await geocodeAddressesWithProgress(window.currentlyDisplayedItems);
          updateAllExcelItems(geocodedItems);
          updateCurrentlyDisplayedItems([...geocodedItems]);
          
          // Display all markers after geocoding
          if (typeof displayAddressMarkers === 'function') {
            displayAddressMarkers(window.currentlyDisplayedItems);
            console.log('[excel-operations] Displayed all markers after geocoding');
          }
          
          // Update the saved data with new coordinates
          excelData.processedData = geocodedItems;
          if (window.savedExcelFiles) {
            window.savedExcelFiles[excelId] = excelData;
          }
          
          // Save updated data back to Firebase
          if (window.excelHistoryCurrentUser && typeof FirebaseUtils !== 'undefined') {
            try {
              await FirebaseUtils.saveUserData('excelHistory', excelId, excelData);
              console.log('[excel-operations] Updated Excel data with geocoded coordinates');
            } catch (error) {
              console.warn('[excel-operations] Failed to save updated coordinates:', error);
            }
          }
          
        } catch (error) {
          console.error('[excel-operations] Geocoding error:', error);
          if (typeof showMessage === 'function') {
            showMessage('Some addresses could not be geocoded', 'warning');
          }
        }
      }
    }
    
    // Show relevant UI sections
    const filterSection = document.getElementById('filterSection');
    const addressListSection = document.getElementById('addressListSection');
    if (filterSection) filterSection.style.display = '';
    if (addressListSection) addressListSection.style.display = '';
    
    // Close Excel history overlay
    if (typeof closeExcelHistory === 'function') {
      closeExcelHistory();
    }
    
    if (typeof showMessage === 'function') {
      showMessage(`Loaded ${excelData.addressCount} addresses from "${excelData.fileName}"`, 'success');
    }
    
    console.log('[excel-operations] Address loading completed');
    
  } catch (error) {
    console.error('[excel-operations] Error loading addresses:', error);
    if (typeof showMessage === 'function') {
      showMessage('Error loading addresses: ' + error.message, 'error');
    }
  }
}

// Delete individual Excel file
async function deleteExcelFile(excelId) {
  if (!window.excelHistoryCurrentUser) {
    if (typeof showMessage === 'function') {
      showMessage('Please sign in to delete Excel files', 'warning');
    }
    return;
  }
  
  const excelFile = window.savedExcelFiles ? window.savedExcelFiles[excelId] : null;
  if (!excelFile) {
    console.error('[excel-operations] File not found for deletion:', excelId);
    return;
  }
  
  const confirmDelete = confirm(`Are you sure you want to delete "${excelFile.fileName}"?\n\nThis action cannot be undone.`);
  if (!confirmDelete) return;
  
  try {
    // Delete from Firebase
    if (typeof FirebaseUtils !== 'undefined') {
      await FirebaseUtils.deleteUserData('excelHistory', excelId);
    }
    
    // Remove from local data
    if (window.savedExcelFiles) {
      delete window.savedExcelFiles[excelId];
    }
    
    // Re-render the list
    if (typeof renderExcelHistoryList === 'function') {
      renderExcelHistoryList();
    }
    
    if (typeof showMessage === 'function') {
      showMessage(`Excel file "${excelFile.fileName}" deleted successfully`, 'success');
    }
    console.log('[excel-operations] File deleted:', excelFile.fileName);
    
  } catch (error) {
    console.error('[excel-operations] Error deleting file:', error);
    if (typeof showMessage === 'function') {
      showMessage('Failed to delete Excel file: ' + error.message, 'error');
    }
  }
}

// Delete all Excel files
async function deleteAllExcelFiles() {
  if (!window.excelHistoryCurrentUser) {
    if (typeof showMessage === 'function') {
      showMessage('Please sign in to delete Excel files', 'warning');
    }
    return;
  }
  
  const fileCount = window.savedExcelFiles ? Object.keys(window.savedExcelFiles).length : 0;
  if (fileCount === 0) {
    if (typeof showMessage === 'function') {
      showMessage('No Excel files to delete', 'info');
    }
    return;
  }
  
  const confirmDelete = confirm(`Are you sure you want to delete ALL ${fileCount} Excel files?\n\nThis action cannot be undone.`);
  if (!confirmDelete) return;
  
  try {
    // Delete all files from Firebase
    if (typeof FirebaseUtils !== 'undefined' && window.savedExcelFiles) {
      const deletePromises = Object.keys(window.savedExcelFiles).map(excelId => 
        FirebaseUtils.deleteUserData('excelHistory', excelId)
      );
      
      await Promise.all(deletePromises);
    }
    
    // Clear local data
    if (window.savedExcelFiles) {
      window.savedExcelFiles = {};
    }
    
    // Re-render the list
    if (typeof renderExcelHistoryList === 'function') {
      renderExcelHistoryList();
    }
    
    if (typeof showMessage === 'function') {
      showMessage(`All ${fileCount} Excel files deleted successfully`, 'success');
    }
    console.log('[excel-operations] All files deleted');
    
  } catch (error) {
    console.error('[excel-operations] Error deleting all files:', error);
    if (typeof showMessage === 'function') {
      showMessage('Failed to delete all Excel files: ' + error.message, 'error');
    }
  }
}

// View Excel data with visits and notes
function viewExcelData(excelId) {
  try {
    console.log('[excel-operations] viewExcelData called for ID:', excelId);
    
    const excelData = window.savedExcelFiles ? window.savedExcelFiles[excelId] : null;
    if (!excelData) {
      console.error('[excel-operations] Excel data not found for ID:', excelId);
      return;
    }
    
    const dataPanel = document.getElementById('excelDataPanel');
    const dataTitle = document.getElementById('excelDataTitle');
    
    if (!dataPanel) {
      console.error('[excel-operations] excelDataPanel element not found!');
      return;
    }
    
    console.log('[excel-operations] Found data panel, preparing data...');
    
    // Store current Excel file ID for deletion functionality
    window.currentExcelFileId = excelId;
    
    // Update title
    if (dataTitle) {
      dataTitle.textContent = `📋 ${excelData.fileName}`;
    }
    
    // Prepare data with visit info
    window.currentTableData = excelData.processedData.map((item, index) => {
      const visitData = getAddressVisitInfo(item.address);
      const noteData = getAddressNoteInfo(item.address);
      
      return {
        ...item,
        rowId: index,
        visitCount: visitData.visitCount || 0,
        lastVisited: visitData.lastVisited || 'Never',
        lastVisitedDate: visitData.lastVisited ? new Date(visitData.lastVisited) : new Date(0),
        notes: noteData || '',
        hasNotes: !!noteData,
        status: (visitData.visitCount || 0) === 0 ? 'Unvisited' : 'Visited'
      };
    });
    
    console.log('[excel-operations] Prepared data with', window.currentTableData.length, 'items');
    
    // Reset selection and sorting
    if (window.selectedRows) {
      window.selectedRows.clear();
      console.log('[excel-operations] Cleared selected rows');
    }
    
    // Show the overlay first, then activate the data panel
    const overlay = document.getElementById('excelHistoryOverlay');
    if (overlay) {
      overlay.style.display = 'block';
      console.log('[excel-operations] Overlay shown');
    }
    
    dataPanel.classList.add('active');
    console.log('[excel-operations] Data panel activated');
    
    // Wait a brief moment for the panel to be visible before rendering
    setTimeout(() => {
      // Initial sort: unvisited first
      if (typeof window.sortTableData === 'function') {
        console.log('[excel-operations] Calling sortTableData');
        window.sortTableData('status', 'desc');
      } else {
        console.warn('[excel-operations] sortTableData function not available');
      }
      
      // Render the table
      if (typeof window.renderDataTable === 'function') {
        console.log('[excel-operations] Calling renderDataTable');
        window.renderDataTable();
      } else {
        console.error('[excel-operations] renderDataTable function not available!');
        // Provide a more robust fallback that actually shows the data
        const dataContent = document.getElementById('excelDataContent');
        if (dataContent) {
          const tableHTML = `
            <div style="padding: 20px;">
              <h3>${excelData.fileName}</h3>
              <p><strong>Total Addresses:</strong> ${window.currentTableData.length}</p>
              <p><strong>Unvisited:</strong> ${window.currentTableData.filter(item => item.visitCount === 0).length}</p>
              <p><strong>Visited:</strong> ${window.currentTableData.filter(item => item.visitCount > 0).length}</p>
              
              <div style="margin-top: 20px;">
                <button onclick="displayExcelDataOnMapOnly('${excelId}')" style="padding: 10px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                  📍 Show All on Map
                </button>
                <button onclick="closeExcelDataPanel()" style="padding: 10px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                  Close
                </button>
              </div>
              
              <div style="max-height: 400px; overflow-y: auto; margin-top: 20px; border: 1px solid #ddd; border-radius: 4px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                  <thead style="background: #f8f9fa; position: sticky; top: 0;">
                    <tr>
                      <th style="padding: 8px; border-bottom: 1px solid #dee2e6; text-align: left;">Name</th>
                      <th style="padding: 8px; border-bottom: 1px solid #dee2e6; text-align: left;">Address</th>
                      <th style="padding: 8px; border-bottom: 1px solid #dee2e6; text-align: center;">Status</th>
                      <th style="padding: 8px; border-bottom: 1px solid #dee2e6; text-align: center;">Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${window.currentTableData.map(item => `
                      <tr style="border-bottom: 1px solid #f1f3f4; ${item.visitCount === 0 ? 'background: #fff3cd;' : ''}">
                        <td style="padding: 8px;">${item.name || '-'}</td>
                        <td style="padding: 8px;">${item.address}</td>
                        <td style="padding: 8px; text-align: center; ${item.visitCount === 0 ? 'color: #ffc107; font-weight: 600;' : 'color: #28a745; font-weight: 600;'}">${item.status}</td>
                        <td style="padding: 8px; text-align: center;">${item.visitCount}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `;
          dataContent.innerHTML = tableHTML;
        }
      }
    }, 100);
    
  } catch (error) {
    console.error('[excel-operations] Error viewing data:', error);
    if (typeof showMessage === 'function') {
      showMessage('Error loading Excel data: ' + error.message, 'error');
    }
  }
}

// New function to display Excel data on map without triggering route optimization
function displayExcelDataOnMapOnly(excelId) {
  try {
    console.log('[excel-operations] displayExcelDataOnMapOnly called for ID:', excelId);
    
    const excelData = window.savedExcelFiles ? window.savedExcelFiles[excelId] : null;
    if (!excelData) {
      console.error('[excel-operations] Excel data not found for ID:', excelId);
      return;
    }
    
    // Simply display the markers on the map without setting up route optimization
    if (typeof displayAddressMarkers === 'function') {
      displayAddressMarkers(excelData.processedData);
      console.log('[excel-operations] Displayed', excelData.processedData.length, 'markers on map');
    }
    
    // Close the data panel
    if (typeof closeExcelDataPanel === 'function') {
      closeExcelDataPanel();
    }
    
    if (typeof showMessage === 'function') {
      showMessage(`Displaying ${excelData.processedData.length} addresses on map`, 'success');
    }
    
  } catch (error) {
    console.error('[excel-operations] Error displaying data on map:', error);
    if (typeof showMessage === 'function') {
      showMessage('Error displaying addresses on map: ' + error.message, 'error');
    }
  }
}

// Helper functions to get visit and note info
function getAddressVisitInfo(address) {
  try {
    if (typeof window.userVisits === 'undefined') return {};
    
    const addressHash = window.generateAddressHash ? window.generateAddressHash(address) : address.toLowerCase().replace(/[^a-z0-9]/g, '');
    const visitData = window.userVisits[addressHash];
    
    if (!visitData) return {};
    
    return {
      visitCount: visitData.visitCount || 0,
      lastVisited: visitData.lastVisited ? new Date(visitData.lastVisited).toLocaleDateString() : 'Never'
    };
  } catch (error) {
    console.error('[excel-operations] Error getting visit info:', error);
    return {};
  }
}

function getAddressNoteInfo(address) {
  try {
    if (typeof window.userNotes === 'undefined') return '';
    
    const addressHash = window.generateAddressHash ? window.generateAddressHash(address) : address.toLowerCase().replace(/[^a-z0-9]/g, '');
    const noteData = window.userNotes[addressHash];
    
    return noteData ? noteData.content : '';
  } catch (error) {
    console.error('[excel-operations] Error getting note info:', error);
    return '';
  }
}

// Make functions globally available
window.loadExcelAddresses = loadExcelAddresses;
window.deleteExcelFile = deleteExcelFile;
window.deleteAllExcelFiles = deleteAllExcelFiles;
window.viewExcelData = viewExcelData;