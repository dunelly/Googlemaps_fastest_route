// Notes Management Module for Firebase Firestore

let notesCurrentUser = null;
let currentAddress = null;
let userNotes = {};
// Make userNotes globally available for address list integration
window.userNotes = userNotes;
// Visit tracking is now handled in visit-tracker.js

// Initialize notes functionality
function initializeNotesManager() {
  // Set up overlay event listeners
  setupNotesOverlayEvents();
  
  // Set up note icon click handlers
  setupNoteIconHandlers();
  
  // Listen for auth state changes
  firebase.auth().onAuthStateChanged(function(user) {
    notesCurrentUser = user;
    if (user) {
      loadUserNotes(user.uid);
    } else {
      userNotes = {};
      updateNoteIcons();
    }
  });
}

// Set up overlay event listeners
function setupNotesOverlayEvents() {
  const overlay = document.getElementById('notesOverlay');
  const closeBtn = document.getElementById('closeNotesBtn');
  const saveBtn = document.getElementById('saveNoteBtn');
  const deleteBtn = document.getElementById('deleteNoteBtn');
  const cancelBtn = document.getElementById('cancelNoteBtn');
  const textarea = document.getElementById('noteTextarea');
  const charCount = document.getElementById('noteCharCount');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closeNotesOverlay);
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeNotesOverlay);
  }
  
  if (saveBtn) {
    saveBtn.addEventListener('click', saveNote);
  }
  
  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteNote);
  }
  
  if (textarea) {
    textarea.addEventListener('input', updateCharacterCount);
  }
  
  // Close overlay when clicking outside
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeNotesOverlay();
      }
    });
  }
}

// Set up note icon click handlers using event delegation
function setupNoteIconHandlers() {
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('note-icon-btn')) {
      const listItem = e.target.closest('.address-checklist li');
      
      if (listItem) {
        const checkbox = listItem.querySelector('input[type="checkbox"]');
        const addressSpan = listItem.querySelector('span');
        
        if (addressSpan) {
          const address = addressSpan.textContent.trim();
          if (address) {
            openNotesOverlay(address);
          } else {
            showMessage('No address found', 'warning');
          }
        }
      }
    }
  });
}

// Address hashing is now handled by firebase-utils.js

// Open notes overlay for specific address
function openNotesOverlay(address) {
  if (!notesCurrentUser) {
    showMessage('Please sign in to add notes', 'warning');
    return;
  }
  
  // Check if overlay is already open
  const overlay = document.getElementById('notesOverlay');
  const isAlreadyOpen = overlay && overlay.classList.contains('open');
  
  currentAddress = address;
  window.currentAddress = address; // Make globally available for visit-tracker
  
  // Update overlay content for the new address
  updateNotesOverlayContent(address);
  
  // Show overlay if not already open
  if (overlay && !isAlreadyOpen) {
    overlay.classList.add('open');
    setTimeout(() => {
      document.getElementById('noteTextarea').focus();
    }, 300);
  } else if (isAlreadyOpen) {
    // If already open, just focus the textarea
    setTimeout(() => {
      document.getElementById('noteTextarea').focus();
    }, 100);
  }
  
  updateCharacterCount();
  
  // Call visit display update from visit-tracker
  if (typeof updateVisitDisplay === 'function') {
    updateVisitDisplay();
  }
}

// Update notes overlay content for a specific address
function updateNotesOverlayContent(address) {
  const addressHash = generateAddressHash(address);
  const existingNote = userNotes[addressHash];
  
  // Update address display
  const addressText = document.getElementById('notesAddressText');
  if (addressText) {
    addressText.textContent = address;
  }
  
  // Update note textarea
  const textarea = document.getElementById('noteTextarea');
  if (textarea) {
    textarea.value = existingNote ? existingNote.note : '';
  }
  
  // Update timestamp
  const timestamp = document.getElementById('noteTimestamp');
  if (existingNote && timestamp) {
    timestamp.textContent = `Last modified: ${new Date(existingNote.lastModified).toLocaleDateString()}`;
  } else if (timestamp) {
    timestamp.textContent = '';
  }
  
  // Update delete button visibility
  const deleteBtn = document.getElementById('deleteNoteBtn');
  if (deleteBtn) {
    deleteBtn.style.display = existingNote ? 'block' : 'none';
  }
}

// Close notes overlay
function closeNotesOverlay() {
  const overlay = document.getElementById('notesOverlay');
  if (overlay) {
    overlay.classList.remove('open');
  }
  currentAddress = null;
  window.currentAddress = null;
}

// Save note to Firestore
async function saveNote() {
  if (!notesCurrentUser || !currentAddress) return;
  
  const noteText = document.getElementById('noteTextarea').value.trim();
  const addressHash = generateAddressHash(currentAddress);
  
  try {
    const noteData = {
      address: currentAddress,
      note: noteText,
      lastModified: new Date().toISOString(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (noteText) {
      // Save note using Firebase utils
      await FirebaseUtils.saveUserData('addressNotes', addressHash, noteData);
      userNotes[addressHash] = noteData;
      window.userNotes = userNotes; // Sync with global
      showMessage('Note saved successfully', 'success');
    } else {
      // Delete note if empty
      await deleteNote();
      return;
    }
    
  } catch (error) {
    console.error('Error saving note:', error);
    showMessage('Failed to save note: ' + error.message, 'error');
    return;
  }
  
  updateNoteIcons();
  
  // Refresh address list to show updated note icons
  if (typeof updateMiddleAddresses === 'function') {
    updateMiddleAddresses();
  }
  
  closeNotesOverlay();
}

// Delete note from Firestore
async function deleteNote() {
  if (!notesCurrentUser || !currentAddress) return;
  
  const addressHash = generateAddressHash(currentAddress);
  
  try {
    await FirebaseUtils.deleteUserData('addressNotes', addressHash);
    delete userNotes[addressHash];
    window.userNotes = userNotes; // Sync with global
    showMessage('Note deleted successfully', 'success');
    
  } catch (error) {
    console.error('Error deleting note:', error);
    showMessage('Failed to delete note: ' + error.message, 'error');
    return;
  }
  
  updateNoteIcons();
  
  // Refresh address list to show updated note icons
  if (typeof updateMiddleAddresses === 'function') {
    updateMiddleAddresses();
  }
  
  closeNotesOverlay();
}

// Load all notes for current user
async function loadUserNotes(userId) {
  try {
    userNotes = await FirebaseUtils.loadUserData('addressNotes');
    window.userNotes = userNotes; // Sync with global
    updateNoteIcons();
    
    console.log('[notes-manager] Loaded notes for user:', userId);
    
    // Refresh address list if it exists
    if (typeof updateMiddleAddresses === 'function') {
      updateMiddleAddresses();
    }
    
  } catch (error) {
    console.error('Error loading notes:', error);
    showMessage('Failed to load notes: ' + error.message, 'error');
  }
}

// Update note icons to show which addresses have notes
function updateNoteIcons() {
  const noteIcons = document.querySelectorAll('.note-icon-btn');
  
  noteIcons.forEach(icon => {
    const listItem = icon.closest('.address-checklist li');
    
    if (listItem) {
      const addressSpan = listItem.querySelector('span');
      
      if (addressSpan) {
        const address = addressSpan.textContent.trim();
        const addressHash = generateAddressHash(address);
        
        if (userNotes[addressHash]) {
          icon.classList.add('has-note');
          icon.title = 'Edit Note';
        } else {
          icon.classList.remove('has-note');
          icon.title = 'Add Note';
        }
      }
    }
  });
}

// Update character count display
function updateCharacterCount() {
  const textarea = document.getElementById('noteTextarea');
  const charCount = document.getElementById('noteCharCount');
  
  if (textarea && charCount) {
    const length = textarea.value.length;
    charCount.textContent = `${length}/500`;
    
    if (length > 500) {
      charCount.style.color = '#dc3545';
    } else if (length > 400) {
      charCount.style.color = '#ff9800';
    } else {
      charCount.style.color = '#999999';
    }
  }
}

// Visit tracking functionality is now handled in visit-tracker.js

// Function to switch notes to a new address (if overlay is open)
function switchNotesToAddress(address) {
  const overlay = document.getElementById('notesOverlay');
  if (overlay && overlay.classList.contains('open')) {
    // Update the overlay content without closing/reopening
    currentAddress = address;
    window.currentAddress = address;
    updateNotesOverlayContent(address);
    updateCharacterCount();
    
    // Update visit display if available
    if (typeof updateVisitDisplay === 'function') {
      updateVisitDisplay();
    }
    
    console.log('[notes-manager] Switched notes overlay to address:', address);
  }
}

// Make functions globally available
window.openNotesOverlay = openNotesOverlay;
window.switchNotesToAddress = switchNotesToAddress;
window.updateNotesOverlayContent = updateNotesOverlayContent;

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNotesManager);
} else {
  initializeNotesManager();
}
