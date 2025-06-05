// Main Application Initialization and Global Variables
console.log("Main app.js script started");

// Global state variables
let allExcelItems = []; // Holds all successfully parsed items from Excel
let currentlyDisplayedItems = []; // Holds items after filtering, used for UI population

// DOM element references (initialized in DOM ready handler)
let singleEntryTab, pasteListTab, uploadFileTab;
let singleEntryContent, pasteListContent, uploadFileContent;
let pasteAddressesTextarea, confirmPasteBtn;
let excelFileInput, messageArea, addressListSection, debugArea;
let middleAddressesList, manualAddressesList, addManualAddressBtn;
let filterSection, auctionDateFilterSelect;
let copyBtn = null;
let markVisitedBtn = null;

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
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
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
    
  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      if (messageContainer) {
        messageContainer.style.display = 'none';
      }
    }, 3000);
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
  const singleEntryContentVisible = singleEntryContent && singleEntryContent.style.display !== 'none';
  const manualInputs = document.querySelectorAll('#manualAddressesList input[type="text"]');
  manualInputs.forEach(i => i.required = !!singleEntryContentVisible);

  // Also handle required for customStartAddress in the Upload File tab
  const uploadFileContentVisible = uploadFileContent && uploadFileContent.style.display !== 'none';
  const customStartAddressInput = document.getElementById('customStartAddress');
  if (customStartAddressInput) {
    customStartAddressInput.required = !!uploadFileContentVisible && excelFileInput && excelFileInput.files.length > 0;
  }
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
  singleEntryTab = document.getElementById('singleEntryTab');
  pasteListTab = document.getElementById('pasteListTab');
  uploadFileTab = document.getElementById('uploadFileTab');

  singleEntryContent = document.getElementById('singleEntryContent');
  pasteListContent = document.getElementById('pasteListContent');
  uploadFileContent = document.getElementById('uploadFileContent');
  pasteAddressesTextarea = document.getElementById('pasteAddressesTextarea');
  confirmPasteBtn = document.getElementById('confirmPasteBtn');

  // Essential elements
  excelFileInput = document.getElementById('excelFile');
  messageArea = document.getElementById('messageArea');
  addressListSection = document.getElementById('addressListSection');
  debugArea = document.getElementById('debugArea');
  middleAddressesList = document.getElementById('middleAddressesList');
  manualAddressesList = document.getElementById('manualAddressesList');
  addManualAddressBtn = document.getElementById('addManualAddressBtn');
  filterSection = document.getElementById('filterSection');
  auctionDateFilterSelect = document.getElementById('auctionDateFilter');
  copyBtn = document.getElementById('copySelectedBtn');
  markVisitedBtn = document.getElementById('markVisitedBtn');
}
