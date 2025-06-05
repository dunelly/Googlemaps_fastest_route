// Excel Data Table - Advanced table functionality for Excel data viewing
// Handles sorting, filtering, selection, and map integration

// Global variables for data table functionality
window.currentTableData = [];
window.selectedRows = new Set();
let currentSortColumn = null;
let currentSortDirection = 'asc';

// Render the data table with filters and sorting
function renderDataTable() {
  const dataContent = document.getElementById('excelDataContent');
  if (!dataContent) return;
  
  const unvisitedCount = currentTableData.filter(item => item.visitCount === 0).length;
  
  dataContent.innerHTML = `
    <div style="margin-bottom: 15px; padding: 12px; background: #f8f9fa; border-radius: 6px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div>
          <strong>📊 Summary</strong><br>
          <strong>Total:</strong> ${currentTableData.length} |
          <strong>🔴 Unvisited:</strong> ${unvisitedCount} |
          <strong>✅ Visited:</strong> ${currentTableData.filter(item => item.visitCount > 0).length} |
          <strong>📝 With Notes:</strong> ${currentTableData.filter(item => item.hasNotes).length}
        </div>
        <button id="showSelectedOnMap" class="show-selected-btn" onclick="showSelectedAddressesOnMap()" disabled>
          📍 Show Selected on Map (0)
        </button>
      </div>
      <div class="selection-info" id="selectionInfo">
        Click rows to select addresses, then use "Show Selected on Map" to display them.
      </div>
    </div>
    
    <div class="filter-controls">
      <div class="filter-group">
        <label class="filter-label">Status:</label>
        <select id="statusFilter" class="filter-select" onchange="applyFilters()">
          <option value="">All</option>
          <option value="Unvisited">Unvisited</option>
          <option value="Visited">Visited</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label class="filter-label">Notes:</label>
        <select id="notesFilter" class="filter-select" onchange="applyFilters()">
          <option value="">All</option>
          <option value="with">With Notes</option>
          <option value="without">Without Notes</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label class="filter-label">Search Address:</label>
        <input type="text" id="addressSearch" class="filter-input" placeholder="Search addresses..." oninput="applyFilters()">
      </div>
      
      <div class="filter-group">
        <label class="filter-label">Visit Count:</label>
        <select id="visitCountFilter" class="filter-select" onchange="applyFilters()">
          <option value="">All</option>
          <option value="0">0 visits</option>
          <option value="1">1 visit</option>
          <option value="2+">2+ visits</option>
        </select>
      </div>
      
      <button class="clear-filters-btn" onclick="clearAllFilters()">Clear Filters</button>
    </div>
    
    <div style="max-height: 60vh; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 4px;">
      <table class="data-table" id="dataTable">
        <thead>
          <tr>
            <th style="width: 40px;">
              <input type="checkbox" id="selectAllCheckbox" onchange="toggleSelectAll()" class="row-checkbox">
            </th>
            <th class="sortable" onclick="sortTable('address')" style="width: 25%;">Address</th>
            <th class="sortable" onclick="sortTable('name')" style="width: 15%;">Name</th>
            <th class="sortable" onclick="sortTable('status')" style="width: 10%;">Status</th>
            <th class="sortable" onclick="sortTable('visitCount')" style="width: 8%;">Visits</th>
            <th class="sortable" onclick="sortTable('lastVisitedDate')" style="width: 12%;">Last Visit</th>
            <th class="sortable" onclick="sortTable('hasNotes')" style="width: 8%;">Notes</th>
            <th class="sortable" onclick="sortTable('auctionDateFormatted')" style="width: 12%;">Auction Date</th>
          </tr>
        </thead>
        <tbody id="dataTableBody">
        </tbody>
      </table>
    </div>
  `;
  
  updateTableRows();
  updateSortIndicators();
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
      <tr class="${selectedClass}" style="${rowStyle}" onclick="toggleRowSelection(${item.rowId})" data-row-id="${item.rowId}">
        <td>
          <input type="checkbox" class="row-checkbox" ${isSelected ? 'checked' : ''} onchange="toggleRowSelection(${item.rowId})" onclick="event.stopPropagation()">
        </td>
        <td style="max-width: 200px; word-wrap: break-word; font-size: 0.85rem;">${item.address}</td>
        <td style="font-size: 0.85rem;">${item.name || '-'}</td>
        <td style="font-size: 0.85rem;">${statusIcon} ${item.status}</td>
        <td ${visitClass} style="font-size: 0.85rem;">${item.visitCount}</td>
        <td ${visitClass} style="font-size: 0.85rem;">${item.lastVisited}</td>
        <td ${noteClass} style="font-size: 0.85rem;">${item.hasNotes ? '📝' : '-'}</td>
        <td style="font-size: 0.85rem;">${item.auctionDateFormatted || '-'}</td>
      </tr>
    `;
  }).join('');
  
  updateSelectedCount();
}

// Get filtered data based on current filter settings
function getFilteredData() {
  let filtered = [...window.currentTableData];
  
  // Status filter
  const statusFilter = document.getElementById('statusFilter')?.value;
  if (statusFilter) {
    filtered = filtered.filter(item => item.status === statusFilter);
  }
  
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
  const selectionInfo = document.getElementById('selectionInfo');
  
  if (showSelectedBtn) {
    const count = window.selectedRows.size;
    showSelectedBtn.textContent = `📍 Show Selected on Map (${count})`;
    showSelectedBtn.disabled = count === 0;
  }
  
  if (selectionInfo && window.selectedRows.size > 0) {
    selectionInfo.textContent = `${window.selectedRows.size} address${window.selectedRows.size === 1 ? '' : 'es'} selected. Click "Show Selected on Map" to display them.`;
  } else if (selectionInfo) {
    selectionInfo.textContent = 'Click rows to select addresses, then use "Show Selected on Map" to display them.';
  }
  
  updateSelectAllCheckbox();
}

// Apply filters
function applyFilters() {
  updateTableRows();
}

// Clear all filters
function clearAllFilters() {
  document.getElementById('statusFilter').value = '';
  document.getElementById('notesFilter').value = '';
  document.getElementById('addressSearch').value = '';
  document.getElementById('visitCountFilter').value = '';
  updateTableRows();
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
  window.allExcelItems = selectedData;
  window.currentlyDisplayedItems = [...selectedData];
  
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
  
  // Close data panel
  if (typeof closeExcelDataPanel === 'function') {
    closeExcelDataPanel();
  }
  
  if (typeof showMessage === 'function') {
    showMessage(`Displaying ${selectedData.length} selected addresses on map`, 'success');
  }
  
  console.log('[excel-data-table] Showing', selectedData.length, 'selected addresses on map');
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