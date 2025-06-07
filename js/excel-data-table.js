// Excel Data Table - Advanced table functionality for Excel data viewing
// Handles sorting, filtering, selection, and map integration

// Global variables for data table functionality
window.currentTableData = [];
window.selectedRows = new Set();
let currentSortColumn = null;
let currentSortDirection = 'asc';

// Drag selection variables
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let selectionBox = null;
let startRowIndex = -1;

// Render the data table with filters and sorting
function renderDataTable() {
  const dataContent = document.getElementById('excelDataContent');
  if (!dataContent) return;
  
  const unvisitedCount = currentTableData.filter(item => item.visitCount === 0).length;
  
  dataContent.innerHTML = `
    <div class="excel-table-header">
      <div class="excel-table-stats">
        <span class="stat-total">Total: ${currentTableData.length}</span>
        <span class="stat-unvisited">Unvisited: ${unvisitedCount}</span>
        <span class="stat-visited">Visited: ${currentTableData.filter(item => item.visitCount > 0).length}</span>
        <span class="stat-notes">Notes: ${currentTableData.filter(item => item.hasNotes).length}</span>
      </div>
      <div class="excel-table-actions">
        <button id="showSelectedOnMap" onclick="showSelectedAddressesOnMap()" disabled>
          📍 Show Selected (0)
        </button>
        <button id="showAllOnMap" onclick="showAllAddressesOnMap()">
          📍 Show All on Map
        </button>
        <button id="deleteSelectedBtn" onclick="deleteSelectedAddresses()" disabled>
          🗑️ Delete (0)
        </button>
      </div>
    </div>
    
    <div class="excel-filter-controls">
      <div class="excel-filter-group">
        <label for="notesFilter" class="excel-filter-label">Notes</label>
        <select id="notesFilter" class="excel-filter-select" onchange="applyFilters()">
          <option value="">All</option>
          <option value="with">With Notes</option>
          <option value="without">Without Notes</option>
        </select>
      </div>
      
      <div class="excel-filter-group">
        <label for="visitCountFilter" class="excel-filter-label">Visits</label>
        <select id="visitCountFilter" class="excel-filter-select" onchange="applyFilters()">
          <option value="">All</option>
          <option value="0">0 visits</option>
          <option value="1">1 visit</option>
          <option value="2+">2+ visits</option>
        </select>
      </div>
      
      <div class="excel-filter-group search-filter">
        <label for="addressSearch" class="excel-filter-label">Search</label>
        <input type="text" id="addressSearch" class="excel-filter-input" placeholder="Search addresses or names..." oninput="applyFilters()">
      </div>
      
      <div class="excel-filter-group">
        <label for="auctionDateFilter" class="excel-filter-label">Auction Dates</label>
        <select id="auctionDateFilter" class="excel-filter-select" multiple onchange="applyFilters()">
          <!-- Options will be populated dynamically -->
        </select>
      </div>
      
      <button onclick="clearAllFiltersAndSelections()" class="excel-clear-filters-btn">Clear All</button>
    </div>
    
    <div class="table-container">
      <table class="data-table" id="dataTable">
        <thead>
          <tr style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); position: sticky; top: 0; z-index: 10; border-bottom: 2px solid #dee2e6;">
            <th style="width: 20px;" class="text-center"> <!-- Checkbox column further reduced -->
              <input type="checkbox" id="selectAllCheckbox" onchange="toggleSelectAll()">
            </th>
            <th class="sortable" onclick="sortTable('name')" style="width: 16%;">Name</th> <!-- Name slightly reduced -->
            <th class="sortable" onclick="sortTable('address')" style="width: 28%;">Address</th> <!-- Address slightly reduced -->
            <th class="sortable text-center" onclick="sortTable('auctionDateFormatted')" style="width: 10%;">Auction Date</th> <!-- Auction Date slightly reduced -->
            <th class="sortable text-center" onclick="sortTable('visitCount')" style="width: 5%;">Visits</th> <!-- Visits significantly reduced -->
            <th class="sortable text-center" onclick="sortTable('lastVisitedDate')" style="width: 8%;">Last Visit</th> <!-- Last Visit reduced -->
            <th class="sortable" onclick="sortTable('hasNotes')" style="width: 28%;">Notes</th> <!-- Notes significantly increased -->
          </tr>
        </thead>
        <tbody id="dataTableBody">
        </tbody>
      </table>
    </div>
  `;
  
  updateTableRows();
  updateSortIndicators();
  setupDragSelection();
  populateAuctionDateFilter();
}

// Update table rows based on current data and filters
function updateTableRows() {
  const tbody = document.getElementById('dataTableBody');
  if (!tbody) return;
  
  const filteredData = getFilteredData();
  
  tbody.innerHTML = filteredData.map(item => {
    const isUnvisited = item.visitCount === 0;
    const rowStyle = isUnvisited ? 'background: #fff3cd;' : ''; // Keep unvisited highlight
    const visitClass = item.visitCount > 0 ? 'style="color: #28a745; font-weight: 600;"' : 'style="color: #dc3545; font-weight: 600;"'; // Adjusted unvisited color
    const isSelected = window.selectedRows.has(item.rowId);
    const selectedClass = isSelected ? 'selected' : '';
    
    return `
      <tr class="${selectedClass}" style="${rowStyle}" onclick="toggleRowSelection(${item.rowId})" data-row-id="${item.rowId}">
        <td class="text-center">
          <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleRowSelection(${item.rowId})" onclick="event.stopPropagation()">
        </td>
        <td>${item.name || '-'}</td>
        <td>${item.address}</td>
        <td class="text-center">${item.auctionDateFormatted || '-'}</td>
        <td class="text-center" ${visitClass}>${item.visitCount}</td>
        <td class="text-center" ${visitClass}>${item.lastVisited}</td>
        <td>
          ${item.hasNotes 
            ? `<span class="note-text" onclick="event.stopPropagation(); openNotesForAddress('${item.address.replace(/'/g, "\\'")}', ${item.rowId})" title="Click to edit note">${item.notes ? (item.notes.length > 30 ? item.notes.substring(0, 30) + '...' : item.notes) : '📝 View/Edit Note'}</span>` // Shortened preview
            : `<span class="add-note-placeholder" onclick="event.stopPropagation(); openNotesForAddress('${item.address.replace(/'/g, "\\'")}', ${item.rowId})" title="Click to add note">- Add Note -</span>`
          }
        </td>
      </tr>
    `;
  }).join('');
  
  updateSelectedCount();
}

// Get filtered data based on current filter settings
function getFilteredData() {
  let filtered = [...window.currentTableData];
  
  // No status filter needed - removed
  
  // Notes filter
  const notesFilter = document.getElementById('notesFilter')?.value;
  if (notesFilter === 'with') {
    filtered = filtered.filter(item => item.hasNotes);
  } else if (notesFilter === 'without') {
    filtered = filtered.filter(item => !item.hasNotes);
  }
  
  // Address search
  const addressSearch = document.getElementById('addressSearch')?.value.toLowerCase();
  if (addressSearch) {
    filtered = filtered.filter(item => 
      item.address.toLowerCase().includes(addressSearch) ||
      (item.name && item.name.toLowerCase().includes(addressSearch))
    );
  }
  
  // Visit count filter
  const visitCountFilter = document.getElementById('visitCountFilter')?.value;
  if (visitCountFilter === '0') {
    filtered = filtered.filter(item => item.visitCount === 0);
  } else if (visitCountFilter === '1') {
    filtered = filtered.filter(item => item.visitCount === 1);
  } else if (visitCountFilter === '2+') {
    filtered = filtered.filter(item => item.visitCount >= 2);
  }
  
  // Auction date filter (multiple selection)
  const auctionDateFilter = document.getElementById('auctionDateFilter');
  if (auctionDateFilter) {
    const selectedDates = Array.from(auctionDateFilter.selectedOptions).map(option => option.value);
    if (selectedDates.length > 0) {
      filtered = filtered.filter(item => {
        if (!item.auctionDateFormatted || item.auctionDateFormatted === '-') return false;
        return selectedDates.includes(item.auctionDateFormatted);
      });
    }
  }
  
  return filtered;
}

// Sort table data
function sortTableData(column, direction) {
  currentSortColumn = column;
  currentSortDirection = direction;
  
  window.currentTableData.sort((a, b) => {
    let aVal = a[column];
    let bVal = b[column];
    
    // Handle different data types
    if (column === 'visitCount') {
      aVal = parseInt(aVal) || 0;
      bVal = parseInt(bVal) || 0;
    } else if (column === 'lastVisitedDate') {
      aVal = aVal.getTime();
      bVal = bVal.getTime();
    } else if (column === 'hasNotes') {
      aVal = aVal ? 1 : 0;
      bVal = bVal ? 1 : 0;
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (direction === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });
}

// Sort table by column
function sortTable(column) {
  const newDirection = (currentSortColumn === column && currentSortDirection === 'asc') ? 'desc' : 'asc';
  sortTableData(column, newDirection);
  updateTableRows();
  updateSortIndicators();
}

// Update sort indicators
function updateSortIndicators() {
  const headers = document.querySelectorAll('.data-table th.sortable');
  headers.forEach(header => {
    header.classList.remove('sort-asc', 'sort-desc');
  });
  
  if (currentSortColumn) {
    // Order of keys here must match the visual order of th elements for correct index lookup
    // Checkbox (index 0, not sortable), Name (1), Address (2), Auction Date (3), Visits (4), Last Visit (5), Notes (6)
    const columnMap = {
      'name': 1, 
      'address': 2, 
      'auctionDateFormatted': 3, 
      'visitCount': 4, 
      'lastVisitedDate': 5, 
      'hasNotes': 6 
    };
    
    const columnIndex = columnMap[currentSortColumn];
    if (columnIndex !== undefined) {
      const header = headers[columnIndex];
      if (header) {
        header.classList.add(currentSortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
      }
    }
  }
}

// Toggle row selection
function toggleRowSelection(rowId) {
  if (window.selectedRows.has(rowId)) {
    window.selectedRows.delete(rowId);
  } else {
    window.selectedRows.add(rowId);
  }
  
  updateTableRows();
  updateSelectAllCheckbox();
}

// Toggle select all
function toggleSelectAll() {
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const filteredData = getFilteredData();
  
  if (selectAllCheckbox.checked) {
    filteredData.forEach(item => window.selectedRows.add(item.rowId));
  } else {
    filteredData.forEach(item => window.selectedRows.delete(item.rowId));
  }
  
  updateTableRows();
}

// Update select all checkbox state
function updateSelectAllCheckbox() {
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  if (!selectAllCheckbox) return;
  
  const filteredData = getFilteredData();
  const filteredRowIds = filteredData.map(item => item.rowId);
  const selectedFiltered = filteredRowIds.filter(id => window.selectedRows.has(id));
  
  if (selectedFiltered.length === 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  } else if (selectedFiltered.length === filteredRowIds.length) {
    selectAllCheckbox.checked = true;
    selectAllCheckbox.indeterminate = false;
  } else {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = true;
  }
}

// Update selected count display
function updateSelectedCount() {
  const showSelectedBtn = document.getElementById('showSelectedOnMap');
  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
  const selectionInfo = document.getElementById('selectionInfo');
  
  const count = window.selectedRows.size;
  
  if (showSelectedBtn) {
    showSelectedBtn.textContent = `📍 Show Selected (${count})`;
    showSelectedBtn.disabled = count === 0;
  }
  
  if (deleteSelectedBtn) {
    deleteSelectedBtn.textContent = `🗑️ Delete (${count})`;
    deleteSelectedBtn.disabled = count === 0;
  }
  
  // Selection info removed for cleaner interface
  
  updateSelectAllCheckbox();
}

// Apply filters
function applyFilters() {
  updateTableRows();
}

// Clear all filters
function clearAllFilters() {
  document.getElementById('notesFilter').value = '';
  document.getElementById('addressSearch').value = '';
  document.getElementById('visitCountFilter').value = '';
  
  // Clear multiple selection for auction date filter
  const auctionDateFilter = document.getElementById('auctionDateFilter');
  if (auctionDateFilter) {
    Array.from(auctionDateFilter.options).forEach(option => option.selected = false);
  }
  
  updateTableRows();
}

// Clear all filters AND selections
function clearAllFiltersAndSelections() {
  // Clear filters
  clearAllFilters();
  
  // Clear selections
  if (window.selectedRows) {
    window.selectedRows.clear();
  }
  
  // Update display
  updateTableRows();
  
  if (typeof showMessage === 'function') {
    showMessage('Filters and selections cleared', 'success');
  }
}

// Populate auction date filter with available dates
function populateAuctionDateFilter() {
  const auctionDateFilter = document.getElementById('auctionDateFilter');
  if (!auctionDateFilter || !window.currentTableData) return;
  
  // Get unique auction dates from the data
  const uniqueDates = new Set();
  window.currentTableData.forEach(item => {
    if (item.auctionDateFormatted && item.auctionDateFormatted !== '-') {
      uniqueDates.add(item.auctionDateFormatted);
    }
  });
  
  // Sort dates
  const sortedDates = Array.from(uniqueDates).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA - dateB;
  });
  
  // Clear existing options
  auctionDateFilter.innerHTML = '';
  
  // Add "All Dates" option
  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = 'All Dates';
  auctionDateFilter.appendChild(allOption);
  
  // Add each unique date as an option
  sortedDates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = date;
    auctionDateFilter.appendChild(option);
  });
  
  console.log('[excel-data-table] Populated auction date filter with', sortedDates.length, 'dates');
}

// Show selected addresses on map
function showSelectedAddressesOnMap() {
  if (window.selectedRows.size === 0) {
    if (typeof showMessage === 'function') {
      showMessage('No addresses selected', 'warning');
    }
    return;
  }
  
  const selectedData = window.currentTableData.filter(item => window.selectedRows.has(item.rowId));
  
  // Set global variables for map display
  updateAllExcelItems(selectedData);
  updateCurrentlyDisplayedItems([...selectedData]);
  
  // Update address list
  if (typeof populateAddressSelection === 'function') {
    populateAddressSelection(selectedData);
  }
  
  // Display markers on map
  if (typeof displayAddressMarkers === 'function') {
    displayAddressMarkers(selectedData);
  }
  
  // Show relevant UI sections
  const filterSection = document.getElementById('filterSection');
  const addressListSection = document.getElementById('addressListSection');
  if (filterSection) filterSection.style.display = '';
  if (addressListSection) addressListSection.style.display = '';
  
  // Close both data panel and Excel history overlay
  if (typeof closeExcelDataPanel === 'function') {
    closeExcelDataPanel();
  }
  if (typeof closeExcelHistory === 'function') {
    closeExcelHistory();
  }
  
  if (typeof showMessage === 'function') {
    showMessage(`Displaying ${selectedData.length} selected addresses on map`, 'success');
  }
  
  console.log('[excel-data-table] Showing', selectedData.length, 'selected addresses on map');
}

// Show all addresses on map (no filtering by selection)
function showAllAddressesOnMap() {
  if (!window.currentTableData || window.currentTableData.length === 0) {
    if (typeof showMessage === 'function') {
      showMessage('No addresses to display', 'warning');
    }
    return;
  }
  
  // Get all currently filtered data (respects filters but ignores selection)
  const filteredData = getFilteredData();
  
  // Set global variables for map display
  updateAllExcelItems(filteredData);
  updateCurrentlyDisplayedItems([...filteredData]);
  
  // Update address list
  if (typeof populateAddressSelection === 'function') {
    populateAddressSelection(filteredData);
  }
  
  // Display markers on map
  if (typeof displayAddressMarkers === 'function') {
    displayAddressMarkers(filteredData);
  }
  
  // Show relevant UI sections
  const filterSection = document.getElementById('filterSection');
  const addressListSection = document.getElementById('addressListSection');
  if (filterSection) filterSection.style.display = '';
  if (addressListSection) addressListSection.style.display = '';
  
  // Close both data panel and Excel history overlay
  if (typeof closeExcelDataPanel === 'function') {
    closeExcelDataPanel();
  }
  if (typeof closeExcelHistory === 'function') {
    closeExcelHistory();
  }
  
  if (typeof showMessage === 'function') {
    showMessage(`Displaying all ${filteredData.length} addresses on map`, 'success');
  }
  
  console.log('[excel-data-table] Showing all', filteredData.length, 'addresses on map');
}

// Setup drag selection functionality
function setupDragSelection() {
  const tableContainer = document.querySelector('#dataTable');
  if (!tableContainer) return;
  
  // Remove existing listeners if any
  tableContainer.removeEventListener('mousedown', handleMouseDown);
  tableContainer.removeEventListener('mousemove', handleMouseMove);
  tableContainer.removeEventListener('mouseup', handleMouseUp);
  
  // Add new listeners
  tableContainer.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

// Handle mouse down for drag selection
function handleMouseDown(e) {
  // Only start drag selection if clicking on table body (not headers or checkboxes)
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.closest('th')) {
    return;
  }
  
  const row = e.target.closest('tr');
  if (!row || !row.dataset.rowId) return;
  
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  startRowIndex = Array.from(row.parentNode.children).indexOf(row);
  
  e.preventDefault(); // Prevent text selection
}

// Handle mouse move for drag selection
function handleMouseMove(e) {
  if (!isDragging) return;
  
  const table = document.getElementById('dataTable');
  if (!table) return;
  
  const rows = table.querySelectorAll('tbody tr');
  const tableRect = table.getBoundingClientRect();
  
  // Calculate which rows are being dragged over
  const currentY = e.clientY;
  let currentRowIndex = -1;
  
  rows.forEach((row, index) => {
    const rowRect = row.getBoundingClientRect();
    if (currentY >= rowRect.top && currentY <= rowRect.bottom) {
      currentRowIndex = index;
    }
  });
  
  if (currentRowIndex >= 0 && startRowIndex >= 0) {
    const startIndex = Math.min(startRowIndex, currentRowIndex);
    const endIndex = Math.max(startRowIndex, currentRowIndex);
    
    // Clear previous selections if not holding Ctrl/Cmd
    if (!e.ctrlKey && !e.metaKey) {
      window.selectedRows.clear();
    }
    
    // Select rows in range
    for (let i = startIndex; i <= endIndex; i++) {
      const row = rows[i];
      if (row && row.dataset.rowId) {
        window.selectedRows.add(parseInt(row.dataset.rowId));
      }
    }
    
    updateTableRows();
  }
}

// Handle mouse up for drag selection
function handleMouseUp(e) {
  if (isDragging) {
    isDragging = false;
    startRowIndex = -1;
  }
}

// Delete selected addresses
async function deleteSelectedAddresses() {
  if (window.selectedRows.size === 0) {
    if (typeof showMessage === 'function') {
      showMessage('No addresses selected for deletion', 'warning');
    }
    return;
  }
  
  const selectedCount = window.selectedRows.size;
  if (!confirm(`Are you sure you want to delete ${selectedCount} selected address${selectedCount === 1 ? '' : 'es'} from the Excel data?\n\nThis action cannot be undone.`)) {
    return;
  }
  
  try {
    const selectedRowIds = Array.from(window.selectedRows);
    const deletedAddresses = [];
    
    // Find items to delete
    const itemsToDelete = window.currentTableData.filter(item => selectedRowIds.includes(item.rowId));
    
    console.log('[excel-data-table] Deleting', itemsToDelete.length, 'addresses');
    
    // Remove from current table data
    window.currentTableData = window.currentTableData.filter(item => !selectedRowIds.includes(item.rowId));
    
    // Update the saved Excel file data
    if (window.savedExcelFiles && window.currentExcelFileId) {
      const excelFile = window.savedExcelFiles[window.currentExcelFileId];
      if (excelFile && excelFile.processedData) {
        const addressesToDelete = itemsToDelete.map(item => item.address);
        excelFile.processedData = excelFile.processedData.filter(item => !addressesToDelete.includes(item.address));
        excelFile.addressCount = excelFile.processedData.length;
        
        // Save updated data to Firebase if user is signed in
        if (window.excelHistoryCurrentUser && typeof FirebaseUtils !== 'undefined') {
          await FirebaseUtils.saveUserData('excelHistory', window.currentExcelFileId, excelFile);
          console.log('[excel-data-table] Updated Excel file in Firebase');
        }
      }
    }
    
    // Clear selection
    window.selectedRows.clear();
    
    // Re-render the table
    updateTableRows();
    
    if (typeof showMessage === 'function') {
      showMessage(`${itemsToDelete.length} address${itemsToDelete.length === 1 ? '' : 'es'} deleted successfully`, 'success');
    }
    
  } catch (error) {
    console.error('[excel-data-table] Error deleting addresses:', error);
    if (typeof showMessage === 'function') {
      showMessage('Failed to delete addresses: ' + error.message, 'error');
    }
  }
}

// Open notes for a specific address from the table
function openNotesForAddress(address, rowId) {
  console.log('[excel-data-table] Opening notes for address:', address);
  
  // Set the global currentAddress for the notes system
  window.currentAddress = address;
  
  // Check if notes overlay is already open and switch to this address
  const overlay = document.getElementById('notesOverlay');
  if (overlay && overlay.classList.contains('open') && typeof switchNotesToAddress === 'function') {
    switchNotesToAddress(address);
    return;
  }
  
  // Open the notes overlay
  if (typeof openNotesOverlay === 'function') {
    openNotesOverlay(address);
  } else {
    // Fallback: check if notes manager is available
    if (typeof showMessage === 'function') {
      showMessage('Please sign in to add notes', 'warning');
    }
  }
}

// Make functions globally available
window.sortTable = sortTable;
window.sortTableData = sortTableData;
window.toggleRowSelection = toggleRowSelection;
window.toggleSelectAll = toggleSelectAll;
window.applyFilters = applyFilters;
window.clearAllFilters = clearAllFilters;
window.showSelectedAddressesOnMap = showSelectedAddressesOnMap;
window.renderDataTable = renderDataTable;
window.deleteSelectedAddresses = deleteSelectedAddresses;
window.setupDragSelection = setupDragSelection;
window.showAllAddressesOnMap = showAllAddressesOnMap;
window.clearAllFiltersAndSelections = clearAllFiltersAndSelections;
window.openNotesForAddress = openNotesForAddress;
