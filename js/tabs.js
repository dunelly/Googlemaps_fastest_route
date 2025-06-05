// Tab Switching Functionality Module

function initializeTabSwitching() {
  if (!singleEntryTab || !pasteListTab || !uploadFileTab) {
    console.error("Tab elements not found");
    return;
  }

  const tabButtons = [singleEntryTab, pasteListTab, uploadFileTab];
  const tabContents = [singleEntryContent, pasteListContent, uploadFileContent];

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
  singleEntryTab.addEventListener('click', () => setActiveTab(0));
  pasteListTab.addEventListener('click', () => setActiveTab(1));
  uploadFileTab.addEventListener('click', () => {
    setActiveTab(2);
    let addressFieldPrompt = document.getElementById('addressFieldPrompt');
    const excelFileHasValue = excelFileInput && excelFileInput.files && excelFileInput.files.length > 0;
    if (addressFieldPrompt && !excelFileHasValue && (!addressListSection.style.display || addressListSection.style.display === 'none')) {
       // addressFieldPrompt.style.display = 'block';
    }
  });
  
  // Paste confirmation handler
  if (confirmPasteBtn) {
    confirmPasteBtn.addEventListener('click', () => {
      if (!pasteAddressesTextarea) return;
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
        
        pasteAddressesTextarea.value = '';
        setActiveTab(0);
        showMessage(`${addressesToPaste.length} addresses added to Single Entry.`, 'success');
      } else {
        showMessage('No addresses to paste.', 'warning');
      }
    });
  }

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

  // Create new destination input field (original clean design)
  const newFieldContainer = document.createElement('div');
  newFieldContainer.className = 'destination-input-container';
  newFieldContainer.innerHTML = `
    <input type="text" class="clean-input destination-input destination-field" placeholder="Enter destination address">
    <button type="button" class="clear-btn">×</button>
  `;
  
  // Insert the new field at the end of the fields container (above the button)
  fieldsContainer.appendChild(newFieldContainer);
  
  // Focus on the new input
  const newInput = newFieldContainer.querySelector('.destination-field');
  if (newInput) {
    newInput.focus();
  }
  
  // Reconnect clear buttons
  connectClearButtons();
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
}

function connectClearButtons() {
  // Clear buttons for destination inputs
  document.querySelectorAll('.clear-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      if (input) {
        input.value = '';
        input.focus();
      }
    });
  });
}
