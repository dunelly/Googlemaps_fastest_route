// Excel History Manager - Lightweight data management system

let excelHistoryCurrentUser = null;
let savedExcelFiles = {};

// Make variables globally accessible immediately
window.savedExcelFiles = savedExcelFiles;
window.excelHistoryCurrentUser = excelHistoryCurrentUser;

// Initialize Excel history system
function initializeExcelHistory() {
  console.log('[excel-history] Initializing Excel history system');
  
  // Check if Firebase is available
  if (typeof firebase === 'undefined' || !firebase.auth) {
    console.warn('[excel-history] Firebase not available, delaying initialization');
    setTimeout(initializeExcelHistory, 1000);
    return;
  }
  
  try {
    // Check if user is already authenticated
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
      console.log('[excel-history] User already authenticated:', currentUser.email);
      excelHistoryCurrentUser = currentUser;
      loadExcelHistory(currentUser.uid);
    }
    
    // Listen for auth state changes
    firebase.auth().onAuthStateChanged(function(user) {
      console.log('[excel-history] Auth state changed:', user?.email || 'signed out');
      excelHistoryCurrentUser = user;
      window.excelHistoryCurrentUser = user;
      if (user) {
        loadExcelHistory(user.uid).then(() => {
          console.log('[excel-history] Excel history loaded after auth change');
          // If we're currently on the Manage Files tab, refresh the display
          const manageFilesTab = document.getElementById('manageFilesTab');
          const manageFilesContent = document.getElementById('manageFilesContent');
          if (manageFilesTab && manageFilesContent && 
              manageFilesTab.classList.contains('active') && 
              manageFilesContent.style.display !== 'none') {
            populateExcelHistory();
          }
        });
      } else {
        savedExcelFiles = {};
        window.savedExcelFiles = savedExcelFiles;
        // Clear the display if showing
        const listContainer = document.getElementById('excelHistoryList');
        if (listContainer) {
          listContainer.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">Please sign in to view Excel history</p>';
        }
      }
    });
    
    // Set up event listeners
    setupExcelHistoryEvents();
    console.log('[excel-history] Initialization complete');
    
  } catch (error) {
    console.error('[excel-history] Error during initialization:', error);
  }
}

// Set up event listeners
function setupExcelHistoryEvents() {
  try {
    const excelHistoryBtn = document.getElementById('excel-history-btn');
    const closeHistoryBtn = document.getElementById('closeExcelHistoryBtn');
    const closeDataBtn = document.getElementById('closeExcelDataBtn');
    const deleteAllBtn = document.getElementById('deleteAllExcelBtn');
    const overlay = document.getElementById('excelHistoryOverlay');
    
    console.log('[excel-history] Setting up event listeners...');
    console.log('[excel-history] Excel history button found:', !!excelHistoryBtn);
    console.log('[excel-history] Overlay found:', !!overlay);
    
    if (excelHistoryBtn) {
      excelHistoryBtn.addEventListener('click', function(e) {
        console.log('[excel-history] Button clicked!');
        openExcelHistory();
      });
      console.log('[excel-history] Event listener added to button');
    } else {
      console.warn('[excel-history] Excel history button not found!');
    }
    
    if (closeHistoryBtn) {
      closeHistoryBtn.addEventListener('click', closeExcelHistory);
    }
    
    if (closeDataBtn) {
      closeDataBtn.addEventListener('click', closeExcelDataPanel);
    }
    
    if (deleteAllBtn) {
      deleteAllBtn.addEventListener('click', deleteAllExcelFiles);
    }
    
    if (overlay) {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          closeExcelHistory();
        }
      });
    }
  } catch (error) {
    console.error('[excel-history] Error setting up event listeners:', error);
  }
}

// Open Excel history panel (now switches to Manage Files tab)
function openExcelHistory() {
  console.log('[excel-history] openExcelHistory called');
  console.log('[excel-history] Current user:', excelHistoryCurrentUser);
  console.log('[excel-history] Saved files count:', Object.keys(savedExcelFiles).length);
  
  if (!excelHistoryCurrentUser) {
    console.warn('[excel-history] No user signed in');
    if (typeof showMessage === 'function') {
      showMessage('Please sign in to view Excel history.', 'warning');
    }
    return;
  }
  
  try {
    // Switch to Manage Files tab
    if (typeof switchTab === 'function') {
      switchTab('manageFiles');
    }
    
    // Render the Excel history list
    setTimeout(() => {
      renderExcelHistoryList();
    }, 100);
    
  } catch (error) {
    console.error('[excel-history] Error opening history:', error);
  }
}

// Close Excel history (switch back to Plan Route tab)
function closeExcelHistory() {
  try {
    // Switch back to Plan Route tab
    if (typeof switchTab === 'function') {
      switchTab('planRoute');
    }
    
    // Also close any open data panels
    closeExcelDataPanel();
    
  } catch (error) {
    console.error('[excel-history] Error closing history:', error);
  }
}

// Close data panel only
function closeExcelDataPanel() {
  try {
    const dataPanel = document.getElementById('excelDataPanel');
    if (dataPanel) dataPanel.classList.remove('active');
    
    // Hide the overlay when data panel is closed
    const overlay = document.getElementById('excelHistoryOverlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  } catch (error) {
    console.error('[excel-history] Error closing data panel:', error);
  }
}

// Save Excel data after successful processing
async function saveExcelData(fileName, processedData) {
  console.log('[excel-history] saveExcelData called with:', { fileName, dataLength: processedData?.length });
  
  if (!excelHistoryCurrentUser) {
    console.warn('[excel-history] No user signed in, cannot save Excel data');
    if (typeof showMessage === 'function') {
      showMessage('Please sign in to save Excel history', 'warning');
    }
    return;
  }
  
  if (!processedData || processedData.length === 0) {
    console.warn('[excel-history] No data to save');
    return;
  }
  
  try {
    if (typeof FirebaseUtils === 'undefined') {
      console.error('[excel-history] FirebaseUtils not available');
      return;
    }
    
    const excelId = 'excel_' + Date.now();
    const excelData = {
      id: excelId,
      fileName: fileName,
      uploadDate: new Date().toISOString(),
      addressCount: processedData.length,
      processedData: processedData
    };
    
    console.log('[excel-history] Saving to Firebase:', excelData);
    await FirebaseUtils.saveUserData('excelHistory', excelId, excelData);
    savedExcelFiles[excelId] = excelData;
    window.savedExcelFiles = savedExcelFiles;
    
    console.log('[excel-history] Successfully saved Excel data:', fileName);
    
    if (typeof showMessage === 'function') {
      showMessage(`Excel file "${fileName}" saved to history`, 'success');
    }
    
  } catch (error) {
    console.error('[excel-history] Error saving Excel data:', error);
    if (typeof showMessage === 'function') {
      showMessage('Failed to save Excel to history: ' + error.message, 'error');
    }
  }
}

// Load Excel history from Firebase
async function loadExcelHistory(userId) {
  try {
    console.log('[excel-history] Loading Excel history for user:', userId);
    
    if (typeof FirebaseUtils === 'undefined') {
      console.error('[excel-history] FirebaseUtils not available for loading');
      return;
    }
    
    savedExcelFiles = await FirebaseUtils.loadUserData('excelHistory') || {};
    window.savedExcelFiles = savedExcelFiles;
    console.log('[excel-history] Loaded', Object.keys(savedExcelFiles).length, 'Excel files');
    
  } catch (error) {
    console.error('[excel-history] Error loading Excel history:', error);
  }
}

// Render Excel history list
function renderExcelHistoryList() {
  try {
    console.log('[excel-history] renderExcelHistoryList called');
    const listContainer = document.getElementById('excelHistoryList');
    console.log('[excel-history] List container found:', !!listContainer);
    
    if (!listContainer) {
      console.error('[excel-history] excelHistoryList element not found!');
      return;
    }
    
    const files = Object.values(savedExcelFiles);
    console.log('[excel-history] Files to render:', files.length);
    
    if (files.length === 0) {
      console.log('[excel-history] No files to show, displaying empty message');
      listContainer.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">No Excel files saved yet</p>';
      return;
    }
    
    const htmlContent = files.map(file => `
      <div class="excel-file-item">
        <div class="excel-file-name">${file.fileName}</div>
        <div class="excel-file-meta">
          Uploaded: ${new Date(file.uploadDate).toLocaleDateString()}<br>
          Addresses: ${file.addressCount}
        </div>
        <div class="excel-file-actions">
          <button type="button" class="excel-action-btn" onclick="loadExcelAddresses('${file.id}')">
            📍 Load Addresses
          </button>
          <button type="button" class="excel-action-btn" onclick="viewExcelData('${file.id}')">
            📊 View Data
          </button>
          <button type="button" class="excel-delete-btn" onclick="deleteExcelFile('${file.id}')" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 5px; border: 1px solid #dc3545; background: #fff; color: #dc3545; cursor: pointer; margin: 0; width: auto; transition: all 0.2s;" title="Delete this Excel file">
            🗑️ Delete
          </button>
        </div>
      </div>
    `).join('');
    
    console.log('[excel-history] Generated HTML content length:', htmlContent.length);
    console.log('[excel-history] First 200 chars of HTML:', htmlContent.substring(0, 200));
    
    listContainer.innerHTML = htmlContent;
    
    console.log('[excel-history] HTML set, container innerHTML length:', listContainer.innerHTML.length);
    console.log('[excel-history] Container style display:', listContainer.style.display);
    console.log('[excel-history] Container computed styles:', window.getComputedStyle(listContainer).display);
  } catch (error) {
    console.error('[excel-history] Error rendering history list:', error);
  }
}


// Populate Excel history for the Manage Files tab
function populateExcelHistory() {
  console.log('[excel-history] populateExcelHistory called for tab');
  
  const listContainer = document.getElementById('excelHistoryList');
  if (!listContainer) {
    console.error('[excel-history] excelHistoryList container not found');
    return;
  }
  
  if (!excelHistoryCurrentUser) {
    listContainer.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">Please sign in to view Excel history</p>';
    return;
  }
  
  // Check if we have data already, if not try to load it
  if (!savedExcelFiles || Object.keys(savedExcelFiles).length === 0) {
    console.log('[excel-history] No data found, loading from Firebase...');
    listContainer.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">Loading Excel files...</p>';
    
    // Try to load the data and then render
    loadExcelHistory(excelHistoryCurrentUser.uid).then(() => {
      renderExcelHistoryList();
    }).catch(error => {
      console.error('[excel-history] Error loading history:', error);
      listContainer.innerHTML = '<p style="text-align:center;color:#dc3545;padding:20px;">Error loading Excel files</p>';
    });
  } else {
    // We have data, render immediately
    renderExcelHistoryList();
  }
}

// Make functions globally available
window.saveExcelData = saveExcelData;
window.openExcelHistory = openExcelHistory;
window.closeExcelDataPanel = closeExcelDataPanel;
window.renderExcelHistoryList = renderExcelHistoryList;
window.populateExcelHistory = populateExcelHistory;
window.closeExcelHistory = closeExcelHistory;

// Initialize when DOM is ready
function safeInitialize() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initializeExcelHistory, 500);
    });
  } else {
    setTimeout(initializeExcelHistory, 500);
  }
}

safeInitialize();

// Debug function to test Excel history
window.testExcelHistoryNow = function() {
  console.log('=== EXCEL HISTORY DEBUG ===');
  console.log('Current user:', window.excelHistoryCurrentUser);
  console.log('Saved files:', window.savedExcelFiles);
  console.log('Saved files count:', Object.keys(window.savedExcelFiles || {}).length);
  
  // Check if overlay elements exist
  const overlay = document.getElementById('excelHistoryOverlay');
  const panel = document.getElementById('excelHistoryPanel');
  const listContainer = document.getElementById('excelHistoryList');
  
  console.log('Elements check:');
  console.log('- Overlay:', !!overlay);
  console.log('- Panel:', !!panel);
  console.log('- List container:', !!listContainer);
  
  if (overlay) {
    console.log('- Overlay display:', overlay.style.display);
    console.log('- Overlay computed display:', window.getComputedStyle(overlay).display);
  }
  
  if (panel) {
    console.log('- Panel classes:', panel.className);
    console.log('- Panel transform:', window.getComputedStyle(panel).transform);
  }
  
  if (listContainer) {
    console.log('- List container innerHTML length:', listContainer.innerHTML.length);
    console.log('- List container first child:', listContainer.firstElementChild);
  }
  
  // Add test data if no files exist
  if (!window.savedExcelFiles || Object.keys(window.savedExcelFiles).length === 0) {
    console.log('Adding test data...');
    const testData = {
      'excel_test_1': {
        id: 'excel_test_1',
        fileName: 'Test Excel 1.xlsx',
        uploadDate: new Date().toISOString(),
        addressCount: 3,
        processedData: [
          { address: '123 Main St, New York, NY', name: 'John Doe', lat: 40.7128, lng: -74.0060 },
          { address: '456 Oak Ave, Los Angeles, CA', name: 'Jane Smith', lat: 34.0522, lng: -118.2437 },
          { address: '789 Pine Rd, Chicago, IL', name: 'Bob Johnson', lat: 41.8781, lng: -87.6298 }
        ]
      }
    };
    
    window.savedExcelFiles = testData;
    savedExcelFiles = testData;
    console.log('Test data added');
  }
  
  // Force open the overlay
  openExcelHistory();
  
  // Check status after opening
  setTimeout(() => {
    console.log('=== POST-OPEN STATUS ===');
    if (overlay) {
      console.log('- Overlay display after open:', overlay.style.display);
      console.log('- Overlay computed display after open:', window.getComputedStyle(overlay).display);
    }
    if (panel) {
      console.log('- Panel classes after open:', panel.className);
      console.log('- Panel transform after open:', window.getComputedStyle(panel).transform);
    }
    if (listContainer) {
      console.log('- List container innerHTML after open:', listContainer.innerHTML.length);
      console.log('- List container children count:', listContainer.children.length);
    }
  }, 500);
};