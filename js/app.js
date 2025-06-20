// Main Application Initialization and Global Variables
console.log("Main app.js script started");

// Global state variables
let allExcelItems = []; // Holds all successfully parsed items from Excel
let currentlyDisplayedItems = []; // Holds items after filtering, used for UI population

// Helper functions to update global variables properly
function updateAllExcelItems(newItems) {
  allExcelItems = newItems;
  window.allExcelItems = allExcelItems;
}

function updateCurrentlyDisplayedItems(newItems) {
  currentlyDisplayedItems = newItems;
  window.currentlyDisplayedItems = currentlyDisplayedItems;
}

// Make global variables accessible
window.allExcelItems = allExcelItems;
window.currentlyDisplayedItems = currentlyDisplayedItems;
window.updateAllExcelItems = updateAllExcelItems;
window.updateCurrentlyDisplayedItems = updateCurrentlyDisplayedItems;

// DOM element references (initialized in DOM ready handler)
let singleEntryTab, pasteListTab, uploadFileTab;
let singleEntryContent, pasteListContent, uploadFileContent;
let pasteAddressesTextarea, confirmPasteBtn;
let excelFileInput, messageArea, debugArea;
let manualAddressesList, addManualAddressBtn;

// Utility Functions
function formatDate(rawDateValue) {
  if (rawDateValue === null || rawDateValue === undefined || String(rawDateValue).trim() === "") return null;
  let date;
  if (typeof rawDateValue === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    date = new Date(excelEpoch.getTime() + rawDateValue * 24 * 60 * 60 * 1000);
    if (rawDateValue < 60) date.setDate(date.getDate() - 1);
  } else if (rawDateValue instanceof Date) {
    date = rawDateValue;
  } else if (typeof rawDateValue === 'string') {
    date = new Date(rawDateValue);
    if (isNaN(date.getTime())) {
      const parts = rawDateValue.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (parts) {
        let year = parseInt(parts[3], 10);
        if (year < 100) year += (year < 50 ? 2000 : 1900);
        let d1 = new Date(year, parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        let d2 = new Date(year, parseInt(parts[2], 10) - 1, parseInt(parts[1], 10));
        if (!isNaN(d1.getTime()) && d1.getMonth() === (parseInt(parts[1], 10) - 1)) date = d1;
        else if (!isNaN(d2.getTime()) && d2.getMonth() === (parseInt(parts[2], 10) - 1)) date = d2;
        else date = null;
      } else date = null;
    }
  }
  if (date && !isNaN(date.getTime())) {
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
  }
  return typeof rawDateValue === 'string' ? rawDateValue : null;
}

function showMessage(msg, type = "info") {
  // Try to show message in clean interface first
  let messageContainer = document.getElementById('cleanMessageArea');
  if (!messageContainer) {
    // Create clean message area if it doesn't exist
    messageContainer = document.createElement('div');
    messageContainer.id = 'cleanMessageArea';
    messageContainer.style.cssText = `
      position: fixed;
      top: ${window.innerWidth <= 768 ? '80px' : '20px'};
      right: 20px;
      left: ${window.innerWidth <= 768 ? '20px' : 'auto'};
      z-index: 10000;
      max-width: ${window.innerWidth <= 768 ? 'none' : '400px'};
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
    `;
    document.body.appendChild(messageContainer);
  }
  
  messageContainer.innerHTML = msg;
  messageContainer.style.display = 'block';
  messageContainer.style.background = type === 'success'
    ? '#e6f9ec'
    : type === 'error'
    ? '#ffeaea'
    : type === 'warning'
    ? '#fffbe7'
    : '#eaf1fb';
  messageContainer.style.color = type === 'success'
    ? '#217a3c'
    : type === 'error'
    ? '#b30000'
    : type === 'warning'
    ? '#7a5d00'
    : '#1a355b';
  messageContainer.style.border = type === 'success'
    ? '1.5px solid #6ee7b7'
    : type === 'error'
    ? '1.5px solid #ffb3b3'
    : type === 'warning'
    ? '1.5px solid #ffe082'
    : '1.5px solid #b3c6e6';
    
  // Auto-hide success messages after 1.5 seconds
  if (type === 'success') {
    setTimeout(() => {
      if (messageContainer) {
        messageContainer.style.display = 'none';
      }
    }, 1500);
  }
  
  // Also update hidden message area for compatibility
  if (messageArea) {
    messageArea.innerHTML = msg;
    messageArea.style.display = 'block';
  }
}

function hideMessage() {
  const messageContainer = document.getElementById('cleanMessageArea');
  if (messageContainer) {
    messageContainer.style.display = 'none';
  }
  if (messageArea) {
    messageArea.style.display = 'none';
  }
}

function showDebug(headers, rows) {
  if (!debugArea) return;
  debugArea.innerHTML = '<h3>Debug Info:</h3><pre>' + 
    'Headers: ' + JSON.stringify(headers, null, 2) + 
    '\nFirst 3 rows: ' + JSON.stringify(rows.slice(0, 3), null, 2) + '</pre>';
  debugArea.style.display = 'block';
}

function hideDebug() {
  if (debugArea) {
    debugArea.style.display = 'none';
  }
}

// Helper to set required only if manual entry section is visible
function updateManualAddressRequired() {
  const planRouteContentVisible = planRouteContent && planRouteContent.style.display !== 'none';
  const manualInputs = document.querySelectorAll('#manualAddressesList input[type="text"]');
  manualInputs.forEach(i => i.required = !!planRouteContentVisible);
}

// Main initialization when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM Content Loaded - initializing elements");
  
  // Initialize DOM element references
  initializeDOMReferences();
  
  // Initialize all modules
  initializeTabSwitching();
  initializeAddressManagement();
  initializeExcelHandling();
  initializeRouteForm();
  initializeMapSystem();
  
  console.log("All modules initialized successfully");
});

function initializeDOMReferences() {
  // Tab elements
  planRouteTab = document.getElementById('planRouteTab');
  manageFilesTab = document.getElementById('manageFilesTab');

  planRouteContent = document.getElementById('planRouteContent');
  manageFilesContent = document.getElementById('manageFilesContent');
  pasteAddressesTextarea = document.getElementById('pasteAddressesTextarea');
  confirmPasteBtn = document.getElementById('confirmPasteBtn');

  // Essential elements
  excelFileInput = document.getElementById('excelFile');
  messageArea = document.getElementById('messageArea');
  debugArea = document.getElementById('debugArea');
  manualAddressesList = document.getElementById('manualAddressesList');
  addManualAddressBtn = document.getElementById('addManualAddressBtn');
}

// Make essential functions globally available
window.showMessage = showMessage;
window.hideMessage = hideMessage;
