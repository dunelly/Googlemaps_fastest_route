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
    <div style="margin-bottom: 4px; padding: 3px 6px; background: #f8f9fa; border-radius: 3px; font-size: 0.7rem; border: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <span style="font-weight: 600;">Total: ${currentTableData.length}</span> |
        <span style="color: #dc3545;">Unvisited: ${unvisitedCount}</span> |
        <span style="color: #28a745;">Visited: ${currentTableData.filter(item => item.visitCount > 0).length}</span> |
        <span style="color: #007bff;">Notes: ${currentTableData.filter(item => item.hasNotes).length}</span>
      </div>
      <div style="display: flex; gap: 4px;">
        <button id="showSelectedOnMap" style="padding: 2px 6px; font-size: 0.65rem; background: #007bff; color: white; border: none; border-radius: 2px; cursor: pointer;" onclick="showSelectedAddressesOnMap()" disabled>
          📍 Show Selected (0)
        </button>
        <button id="showAllOnMap" style="padding: 2px 6px; font-size: 0.65rem; background: #28a745; color: white; border: none; border-radius: 2px; cursor: pointer;" onclick="showAllAddressesOnMap()">
          📍 Show All on Map
        </button>
        <button id="deleteSelectedBtn" style="padding: 2px 6px; font-size: 0.65rem; background: #dc3545; color: white; border: none; border-radius: 2px; cursor: pointer;" onclick="deleteSelectedAddresses()" disabled>
          🗑️ Delete (0)
        </button>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 4px; padding: 3px 6px; margin-bottom: 4px; background: #f8f9fa; border-radius: 3px; border: 1px solid #e9ecef; font-size: 0.7rem;">
      <div>
        <label style="display: block; font-weight: 600; margin-bottom: 1px; color: #495057; font-size: 0.65rem;">Notes:</label>
        <select id="notesFilter" style="width: 100%; padding: 2px 4px; font-size: 0.7rem; border: 1px solid #ced4da; border-radius: 2px;" onchange="applyFilters()">
          <option value="">All</option>
          <option value="with">With Notes</option>
          <option value="without">Without Notes</option>
        </select>
      </div>
      
      <div>
        <label style="display: block; font-weight: 600; margin-bottom: 1px; color: #495057; font-size: 0.65rem;">Visits:</label>
        <select id="visitCountFilter" style="width: 100%; padding: 2px 4px; font-size: 0.7rem; border: 1px solid #ced4da; border-radius: 2px;" onchange="applyFilters()">
          <option value="">All</option>
          <option value="0">0 visits</option>
          <option value="1">1 visit</option>
          <option value="2+">2+ visits</option>
        </select>
      </div>
      
      <div style="grid-column: span 2;">
        <label style="display: block; font-weight: 600; margin-bottom: 1px; color: #495057; font-size: 0.65rem;">Search:</label>
        <input type="text" id="addressSearch" style="width: 100%; padding: 2px 4px; font-size: 0.7rem; border: 1px solid #ced4da; border-radius: 2px;" placeholder="Search addresses..." oninput="applyFilters()">
      </div>
      
      <div style="grid-column: span 2;">
        <label style="display: block; font-weight: 600; margin-bottom: 1px; color: #495057; font-size: 0.65rem;">Auction Dates:</label>
        <select id="auctionDateFilter" style="width: 100%; padding: 2px 4px; font-size: 0.7rem; border: 1px solid #ced4da; border-radius: 2px; height: 50px;" multiple onchange="applyFilters()">
          <!-- Options will be populated dynamically -->
        </select>
      </div>
      
      <button onclick="clearAllFiltersAndSelections()" style="padding: 2px 6px; font-size: 0.7rem; background: #6c757d; color: white; border: none; border-radius: 2px; cursor: pointer; height: 24px; align-self: end;">Clear All</button>
    </div>
    
    <div style="max-height: 65vh; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 4px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;" id="dataTable">
        <thead>
          <tr style="background: #f8f9fa; position: sticky; top: 0; z-index: 10;">
            <th style="width: 25px; padding: 4px 2px; text-align: center; border-bottom: 1px solid #dee2e6; font-weight: 600;">
              <input type="checkbox" id="selectAllCheckbox" onchange="toggleSelectAll()" style="width: 12px; height: 12px;">
            </th>
            <th class="sortable" onclick="sortTable('name')" style="width: 16%; padding: 4px 6px; text-align: left; border-bottom: 1px solid #dee2e6; cursor: pointer; font-weight: 600;">Name</th>
            <th class="sortable" onclick="sortTable('address')" style="width: 30%; padding: 4px 6px; text-align: left; border-bottom: 1px solid #dee2e6; cursor: pointer; font-weight: 600;">Address</th>
            <th class="sortable" onclick="sortTable('visitCount')" style="width: 7%; padding: 4px 6px; text-align: center; border-bottom: 1px solid #dee2e6; cursor: pointer; font-weight: 600;">Visits</th>
            <th class="sortable" onclick="sortTable('lastVisitedDate')" style="width: 11%; padding: 4px 6px; text-align: center; border-bottom: 1px solid #dee2e6; cursor: pointer; font-weight: 600;">Last Visit</th>
            <th class="sortable" onclick="sortTable('hasNotes')" style="width: 16%; padding: 4px 6px; text-align: left; border-bottom: 1px solid #dee2e6; cursor: pointer; font-weight: 600;">Notes</th>
            <th class="sortable" onclick="sortTable('auctionDateFormatted')" style="width: 11%; padding: 4px 6px; text-align: center; border-bottom: 1px solid #dee2e6; cursor: pointer; font-weight: 600;">Auction Date</th>
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
    const rowStyle = isUnvisited ? 'background: #fff3cd;' : '';
    const statusIcon = isUnvisited ? '🔴' : '✅';
    const visitClass = item.visitCount > 0 ? 'style="color: #28a745; font-weight: 600;"' : 'style="color: #ffc107; font-weight: 600;"';
    const noteClass = item.hasNotes ? 'style="color: #007bff; font-weight: 600;"' : '';
    const isSelected = window.selectedRows.has(item.rowId);
    const selectedClass = isSelected ? 'selected' : '';
    
    return `
      <tr class="${selectedClass}" style="${rowStyle} border-bottom: 1px solid #f1f3f4;" onclick="toggleRowSelection(${item.rowId})" data-row-id="${item.rowId}">
        <td style="padding: 3px 2px; text-align: center;">
          <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleRowSelection(${item.rowId})" onclick="event.stopPropagation()" style="width: 12px; height: 12px;">
        </td>
        <td style="padding: 3px 6px; max-width: 0; overflow: hidden; text-overflow: ellipsis; font-weight: 500;">${item.name || '-'}</td>
        <td style="padding: 3px 6px; word-wrap: break-word; max-width: 0; overflow: hidden; text-overflow: ellipsis;">${item.address}</td>
        <td ${visitClass} style="padding: 3px 6px; text-align: center;">${item.visitCount}</td>
        <td ${visitClass} style="padding: 3px 6px; text-align: center; font-size: 0.7rem;">${item.lastVisited}</td>
        <td style="padding: 3px 6px; max-width: 0; overflow: hidden; text-overflow: ellipsis; font-size: 0.7rem;">${item.hasNotes ? (item.notes ? item.notes.substring(0, 50) + (item.notes.length > 50 ? '...' : '') : '📝 Note') : '-'}</td>
        <td style="padding: 3px 6px; text-align: center; font-size: 0.7rem;">${item.auctionDateFormatted || '-'}</td>
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
    const columnMap = {
      'address': 0, 'name': 1, 'status': 2, 'visitCount': 3,
      'lastVisitedDate': 4, 'hasNotes': 5, 'auctionDateFormatted': 6
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