/**
 * Mobile Navigation System for SmashRoutes
 * Provides clean, document-preview style mobile interface
 * Handles two-tab system: Route Navigation and File Management
 */

class MobileNavigation {
    constructor() {
        this.currentRoute = [];
        this.currentPosition = 0;
        this.navigationActive = false;
        this.mobileInterface = null;
        
        // Performance optimization tracking
        this._mapResizeTimeout = null;
        this._navigating = false; // Debounce flag
        this.cachedElements = {}; // Cache DOM elements
        
        this.init();
    }
    
    /**
     * Initialize mobile navigation system
     */
    init() {
        if (this.isMobile()) {
            // Ensure DOM is ready before creating interface
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.createMobileInterface();
                    this.bindEvents();
                    this.showMobileInterface();
                });
            } else {
                this.createMobileInterface();
                this.bindEvents();
                this.showMobileInterface();
            }
        }
    }
    
    /**
     * Detect if device should use mobile interface
     */
    isMobile() {
        const width = window.innerWidth;
        const userAgent = navigator.userAgent;
        
        return /iPhone|iPad|Android/i.test(userAgent) || width <= 768;
    }
    
    /**
     * Create the mobile interface HTML structure
     */
    createMobileInterface() {
        const mobileHTML = `
            <div class="mobile-interface">
                <!-- Mobile Tab Header -->
                <div class="mobile-tabs">
                    <div class="mobile-tab-header">
                        <button class="mobile-tab-btn active" data-tab="route">
                            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 3h6l2 3h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
                            </svg>
                            <span class="tab-label">Route</span>
                        </button>
                        <button class="mobile-tab-btn" data-tab="map">
                            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <span class="tab-label">Map</span>
                        </button>
                        <button class="mobile-tab-btn" data-tab="files">
                            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                            </svg>
                            <span class="tab-label">Files</span>
                        </button>
                        <div class="auth-container">
                            <button class="auth-btn" id="mobile-auth-btn">
                                <svg class="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <circle cx="12" cy="10" r="3"/>
                                    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Mobile Tab Content -->
                <div class="mobile-tab-content">
                    <!-- Route Planning Tab (Manual Input) -->
                    <div class="mobile-tab-pane active" id="mobile-route-tab">
                        <div class="mobile-route-tab">
                            <!-- Manual Address Input Section -->
                            <div class="mobile-address-input" id="mobile-address-input">
                                <div class="mobile-input-header">
                                    <h3>Plan Your Route</h3>
                                    <p>Enter starting address and destinations</p>
                                </div>
                                
                                <!-- Starting Address -->
                                <div class="mobile-input-group">
                                    <label>Starting Address</label>
                                    <input type="text" id="mobile-start-address" class="mobile-address-field" placeholder="Enter your starting location">
                                </div>
                                
                                <!-- Destination Fields -->
                                <div class="mobile-input-group">
                                    <label>Destinations</label>
                                    <div class="mobile-destinations" id="mobile-destinations">
                                        <div class="mobile-destination-row">
                                            <input type="text" class="mobile-address-field mobile-destination-field" placeholder="Destination 1">
                                            <button class="mobile-remove-btn" style="display: none;">×</button>
                                        </div>
                                    </div>
                                    <button class="mobile-add-btn" id="mobile-add-destination">+ Add Destination</button>
                                </div>
                                
                                <!-- Action Buttons -->
                                <div class="mobile-input-actions">
                                    <button class="mobile-action-btn secondary" id="mobile-paste-addresses">📋 Paste</button>
                                    <button class="mobile-action-btn primary" id="mobile-create-route-manual">🗺️ Create Route</button>
                                    <button class="mobile-action-btn secondary" id="mobile-clear-all">🗑️ Clear</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Map Tab (Loaded Addresses) -->
                    <div class="mobile-tab-pane" id="mobile-map-tab">
                        <div class="mobile-map-tab">
                            <div class="mobile-map-container">
                                <!-- Map will be moved here -->
                            </div>
                            
                            <!-- Create Route Button (shown when Excel addresses loaded) -->
                            <div class="mobile-create-route-btn" id="mobile-create-route-container">
                                <button class="mobile-nav-btn primary" id="mobile-create-route-btn">
                                    🗺️ Create Route from Files
                                </button>
                            </div>
                            
                            <!-- Destination Card (hidden initially) -->
                            <div class="destination-card" id="mobile-destination-card">
                                <div class="destination-header">
                                    <div class="destination-info-row">
                                        <span class="progress-count" id="mobile-progress">13/23</span>
                                        <span class="address-street" id="mobile-address">5243 Castlebury Meadows Dr</span>
                                        <span class="customer-name" id="mobile-details">Amber Evans</span>
                                    </div>
                                </div>
                                
                                <div class="destination-controls">
                                    <div class="control-row">
                                        <button class="mobile-nav-btn" id="mobile-prev-btn">
                                            <span class="icon">←</span>
                                            <span class="label">Prev</span>
                                        </button>
                                        <button class="mobile-nav-btn" id="mobile-next-btn">
                                            <span class="icon">→</span>
                                            <span class="label">Next</span>
                                        </button>
                                        <button class="mobile-nav-btn complete" id="mobile-checkin-notes-btn">
                                            <span class="icon">📝</span>
                                            <span class="label">Check In</span>
                                        </button>
                                        <button class="mobile-nav-btn primary" id="mobile-navigate-btn">
                                            <span class="icon">🗺️</span>
                                            <span class="label">Navigate</span>
                                        </button>
                                        <button class="mobile-nav-btn" id="mobile-end-route-btn" style="background: #dc3545; color: white;">
                                            <span class="icon">🏁</span>
                                            <span class="label">End Route</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Files Management Tab -->
                    <div class="mobile-tab-pane" id="mobile-files-tab">
                        <div class="mobile-files-tab">
                            <div class="mobile-files-header">
                                <div class="mobile-files-title">Saved Files</div>
                                <div class="mobile-files-subtitle">
                                    Load addresses from your saved Excel files
                                </div>
                            </div>
                            
                            <div class="mobile-file-list" id="mobile-file-list">
                                <!-- Files will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insert mobile interface into DOM
        document.body.insertAdjacentHTML('beforeend', mobileHTML);
        this.mobileInterface = document.querySelector('.mobile-interface');
    }
    
    /**
     * Show mobile interface and hide desktop
     */
    showMobileInterface() {
        // Hide desktop interface
        const desktopElements = document.querySelectorAll('.left-panel, .right-panel, .tab-content:not(.mobile-interface)');
        desktopElements.forEach(el => el.style.display = 'none');
        
        // Move map to mobile container
        this.moveMapToMobile();
        
        // Load files in files tab (with delay to ensure DOM is ready)
        setTimeout(() => {
            this.loadSavedFiles();
        }, 100);
    }
    
    /**
     * Move existing map to mobile container
     */
    moveMapToMobile() {
        const existingMap = document.getElementById('map');
        const mobileMapContainer = document.querySelector('.mobile-map-container');
        
        if (existingMap && mobileMapContainer) {
            mobileMapContainer.appendChild(existingMap);
            
            // Trigger map resize after move with multiple attempts
            setTimeout(() => {
                if (window.map) {
                    console.log('[Mobile] Resizing map for mobile container');
                    window.map.invalidateSize();
                    
                    // Additional resize after a longer delay to ensure proper sizing
                    setTimeout(() => {
                        window.map.invalidateSize();
                        console.log('[Mobile] Final map resize completed');
                    }, 500);
                }
            }, 100);
        }
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Tab switching
        document.addEventListener('click', (e) => {
            // Handle tab button clicks (including clicks on SVG children)
            const tabBtn = e.target.closest('.mobile-tab-btn');
            if (tabBtn) {
                e.preventDefault();
                e.stopPropagation();
                this.switchTab(tabBtn.dataset.tab);
                return;
            }
            
            // Handle auth button clicks
            const authBtn = e.target.closest('#mobile-auth-btn');
            if (authBtn) {
                e.preventDefault();
                e.stopPropagation();
                this.handleAuthClick();
                return;
            }
        });
        
        // Navigation controls
        document.addEventListener('click', (e) => {
            if (e.target.matches('#mobile-prev-btn')) {
                this.navigatePrevious();
            } else if (e.target.matches('#mobile-next-btn')) {
                this.navigateNext();
            } else if (e.target.matches('#mobile-navigate-btn')) {
                this.openGoogleMaps();
            } else if (e.target.matches('#mobile-checkin-notes-btn')) {
                this.checkInWithNotes();
            } else if (e.target.matches('#mobile-complete-btn')) {
                this.checkIn();
            } else if (e.target.matches('#mobile-notes-btn')) {
                this.openNotes();
            } else if (e.target.matches('#mobile-end-route-btn')) {
                this.endRoute();
            } else if (e.target.matches('#mobile-add-destination')) {
                this.addDestinationField();
            } else if (e.target.matches('.mobile-remove-btn')) {
                this.removeDestinationField(e.target);
            } else if (e.target.matches('#mobile-create-route-manual')) {
                this.createRouteFromManualInput();
            } else if (e.target.matches('#mobile-paste-addresses')) {
                this.pasteAddresses();
            } else if (e.target.matches('#mobile-clear-all')) {
                this.clearAllFields();
            }
        });
        
        // File actions
        document.addEventListener('click', (e) => {
            // Removed excessive click logging for performance
            
            if (e.target.matches('.mobile-load-addresses-btn')) {
                const fileId = e.target.dataset.fileId;
                this.loadAddressesFromFile(fileId);
            } else if (e.target.matches('#mobile-create-route-btn')) {
                console.log('[Mobile] Create route button clicked!');
                e.preventDefault();
                e.stopPropagation();
                
                // Ensure desktop button state is updated before trying to click it
                if (window.desktopRouteCreator && typeof window.desktopRouteCreator._updateButtonState === 'function') {
                    console.log('[Mobile] Updating desktop button state before route creation');
                    window.desktopRouteCreator._updateButtonState();
                }
                
                // Try clicking the desktop create route button directly
                const desktopBtn = document.getElementById('createRouteBtn');
                if (desktopBtn) {
                    if (desktopBtn.disabled) {
                        console.warn('[Mobile] Desktop create route button is disabled - checking addresses');
                        // Check if we have addresses loaded
                        if (window.addresses && window.addresses.length > 0) {
                            console.log('[Mobile] Addresses available, force enabling desktop button');
                            desktopBtn.disabled = false;
                            desktopBtn.textContent = '🗺️ Create Route';
                        } else {
                            console.error('[Mobile] No addresses available for route creation');
                            alert('No addresses loaded. Please load addresses from the Files tab first.');
                            return;
                        }
                    }
                    console.log('[Mobile] Triggering desktop create route button');
                    desktopBtn.click();
                } else {
                    console.log('[Mobile] Desktop create route button not found, using mobile method');
                    this.createRoute();
                }
            }
        });
        
        // Listen for route creation
        window.addEventListener('routeCreated', (e) => {
            console.log('[Mobile] Route created event detected:', e.detail);
            this.handleRouteCreated(e.detail);
        });
        
        // Also listen for when desktop route creator finishes  
        setInterval(() => {
            if (window.desktopRouteCreator && window.desktopRouteCreator.optimizedRoute && window.desktopRouteCreator.optimizedRoute.length > 0) {
                if (!this.navigationActive) {
                    console.log('[Mobile] Detected completed route, activating mobile navigation');
                    console.log('[Mobile] Route addresses:', window.desktopRouteCreator.optimizedRoute);
                    
                    // Force hide create button and show destination card
                    this.hideCreateRouteButton();
                    
                    this.handleRouteCreated({
                        addresses: window.desktopRouteCreator.optimizedRoute,
                        type: 'mobile-auto-detect'
                    });
                }
            } else if (!this.navigationActive) {
                // If no optimized route and not navigating, ensure create button is shown when appropriate
                const hasLoadedAddresses = window.addresses && window.addresses.length > 0;
                const hasLassoedAddresses = window.selectedItemsInShape && window.selectedItemsInShape.length > 0;
                
                if ((hasLoadedAddresses || hasLassoedAddresses) && document.querySelector('.mobile-tab-btn.active')?.dataset.tab === 'map') {
                    const createBtn = document.getElementById('mobile-create-route-btn');
                    if (createBtn && (createBtn.textContent.includes('Creating') || createBtn.textContent.includes('⏳'))) {
                        // Reset stuck button state
                        console.log('[Mobile] Resetting stuck create button state');
                        createBtn.textContent = '🗺️ Create Route from Files';
                        createBtn.disabled = false;
                        this.showCreateRouteButton();
                    }
                }
            }
        }, 1000);
        
        // Listen for addresses loaded
        window.addEventListener('addressesLoaded', () => {
            this.handleAddressesLoaded();
        });
        
        // Listen for auth state changes to refresh file list
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                if (user && this.mobileInterface) {
                    // Refresh file list when user signs in
                    setTimeout(() => {
                        this.loadSavedFiles();
                    }, 500);
                }
            });
        }
        
        // Direct event listener for create route button (fallback)
        setTimeout(() => {
            const createRouteBtn = document.getElementById('mobile-create-route-btn');
            if (createRouteBtn) {
                console.log('[Mobile] Adding direct click listener to create route button');
                createRouteBtn.addEventListener('click', (e) => {
                    console.log('[Mobile] Direct button click detected!');
                    e.preventDefault();
                    e.stopPropagation();
                    this.createRoute();
                });
            } else {
                console.error('[Mobile] Create route button not found for direct listener');
            }
        }, 1000);
    }
    
    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.mobile-tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`mobile-${tabName}-tab`).classList.add('active');
        
        // Handle map tab specific operations
        if (tabName === 'map' && window.map) {
            // Clear any pending resize operations
            if (this._mapResizeTimeout) {
                clearTimeout(this._mapResizeTimeout);
            }
            
            this._mapResizeTimeout = setTimeout(() => {
                console.log('[Mobile] Resizing map after tab switch to map');
                window.map.invalidateSize();
                
                // Re-fit the map to show all content properly
                if (window.addresses && window.addresses.length > 0) {
                    if (typeof window.fitMapToAddresses === 'function') {
                        window.fitMapToAddresses();
                    }
                }
                
                // Show drawing controls on map tab
                this.showDrawingControls();
                
                this._mapResizeTimeout = null;
            }, 150);
        } else {
            // Hide drawing controls on non-map tabs
            this.hideDrawingControls();
        }
    }
    
    /**
     * Load saved files in files tab
     */
    loadSavedFiles() {
        const fileList = document.getElementById('mobile-file-list');
        
        // Check if element exists
        if (!fileList) {
            console.warn('[Mobile] File list element not found');
            return;
        }
        
        // Check if user is authenticated (use same variable as excel-history)
        if (!window.excelHistoryCurrentUser) {
            fileList.innerHTML = `
                <div class="mobile-loading">
                    Please sign in to view saved files
                </div>
            `;
            return;
        }
        
        // Show loading
        fileList.innerHTML = `
            <div class="mobile-loading">
                Loading saved files...
            </div>
        `;
        
        // Load files from Firebase or local storage
        setTimeout(() => {
            const savedFilesObj = window.savedExcelFiles || {};
            const savedFiles = Object.values(savedFilesObj);
            
            if (savedFiles.length === 0) {
                fileList.innerHTML = `
                    <div class="mobile-loading">
                        No saved files found. Upload files on desktop to access them here.
                    </div>
                `;
                return;
            }
            
            // Render files
            fileList.innerHTML = savedFiles.map(file => `
                <div class="mobile-file-card">
                    <div class="mobile-file-name">${file.fileName || file.filename || 'Unknown File'}</div>
                    <div class="mobile-file-details">
                        ${file.addressCount || file.rowCount || 0} addresses • Saved ${this.formatDate(file.uploadDate)}
                    </div>
                    <div class="mobile-file-actions">
                        <button class="mobile-file-btn primary mobile-load-addresses-btn" 
                                data-file-id="${file.id}">
                            Load Addresses
                        </button>
                    </div>
                </div>
            `).join('');
        }, 500);
    }
    
    /**
     * Handle mobile auth button click
     */
    handleAuthClick() {
        // Check if user is signed in
        const user = firebase.auth().currentUser;
        
        if (user) {
            // User is signed in - show user menu
            this.showUserMenu();
        } else {
            // User not signed in - trigger sign in
            const desktopSignInBtn = document.getElementById('show-login-btn');
            if (desktopSignInBtn) {
                desktopSignInBtn.click();
            }
        }
    }

    /**
     * Show user menu when authenticated
     */
    showUserMenu() {
        // Create a simple mobile-friendly menu
        const menu = document.createElement('div');
        menu.className = 'mobile-auth-menu';
        menu.innerHTML = `
            <div class="mobile-auth-overlay" onclick="this.parentElement.remove()">
                <div class="mobile-auth-popup">
                    <div class="auth-popup-header">
                        <h3>Account</h3>
                        <button class="close-popup-btn" onclick="this.closest('.mobile-auth-menu').remove()">×</button>
                    </div>
                    <div class="auth-popup-content">
                        <div class="user-info">
                            <span class="user-email">${firebase.auth().currentUser?.email || ''}</span>
                        </div>
                        <div class="auth-actions">
                            <button class="auth-action-btn" onclick="document.getElementById('user-preferences-btn')?.click(); this.closest('.mobile-auth-menu').remove();">
                                ⚙️ Settings
                            </button>
                            <button class="auth-action-btn logout" onclick="document.getElementById('logout-btn')?.click(); this.closest('.mobile-auth-menu').remove();">
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(menu);
    }

    /**
     * Load addresses from selected file
     */
    async loadAddressesFromFile(fileId) {
        try {
            // Find the file using the same logic as desktop
            const file = window.savedExcelFiles ? window.savedExcelFiles[fileId] : null;
            if (!file) {
                console.error('[Mobile] Excel data not found for ID:', fileId);
                return;
            }
            
            // Show loading
            const btn = document.querySelector(`[data-file-id="${fileId}"]`);
            const originalText = btn.textContent;
            btn.textContent = 'Loading...';
            btn.disabled = true;
            
            // Use the same loading logic as desktop
            if (typeof loadExcelAddresses === 'function') {
                await loadExcelAddresses(fileId);
            }
            
            // Switch to map tab to show loaded addresses
            this.switchTab('map');
            
            // Show create route button after addresses are loaded
            setTimeout(() => {
                this.showCreateRouteButton();
            }, 500);
            
            // Reset button
            btn.textContent = originalText;
            btn.disabled = false;
            
        } catch (error) {
            console.error('[Mobile] Error loading addresses:', error);
            alert('Error loading addresses from file');
            
            // Reset button on error
            const btn = document.querySelector(`[data-file-id="${fileId}"]`);
            if (btn) {
                btn.textContent = 'Load Addresses';
                btn.disabled = false;
            }
        }
    }
    
    /**
     * Handle when addresses are loaded
     */
    handleAddressesLoaded() {
        // Ensure map shows all addresses
        if (window.map && window.addresses && window.addresses.length > 0) {
            // Switch to map tab to show loaded addresses
            this.switchTab('map');
            
            // Show create route button
            this.showCreateRouteButton();
            
            // Fit map to show all addresses
            setTimeout(() => {
                if (window.fitMapToAddresses) {
                    window.fitMapToAddresses();
                }
            }, 200);
        }
    }
    
    /**
     * Show create route button
     */
    showCreateRouteButton() {
        console.log('[Mobile] Showing create route button');
        const createRouteContainer = document.getElementById('mobile-create-route-container');
        console.log('[Mobile] Create route container found:', !!createRouteContainer);
        
        if (createRouteContainer) {
            createRouteContainer.classList.add('visible');
            console.log('[Mobile] Added visible class to create route button');
        } else {
            console.error('[Mobile] Create route container not found!');
        }
    }
    
    /**
     * Hide create route button
     */
    hideCreateRouteButton() {
        const createRouteContainer = document.getElementById('mobile-create-route-container');
        if (createRouteContainer) {
            createRouteContainer.classList.remove('visible');
        }
    }
    
    /**
     * Create route from all loaded addresses (same logic as desktop)
     */
    async createRoute() {
        const btn = document.getElementById('mobile-create-route-btn');
        const originalText = btn ? btn.textContent : '';
        
        try {
            console.log('[Mobile] 🚀 Creating optimized route...');
            console.log('[Mobile] desktopRouteCreator exists:', !!window.desktopRouteCreator);
            console.log('[Mobile] handleCreateRoute exists:', !!(window.desktopRouteCreator && window.desktopRouteCreator.handleCreateRoute));
            
            // Show loading on button
            if (btn) {
                btn.textContent = '⏳ Creating Route...';
                btn.disabled = true;
            }
            
            // Use the same logic as desktop route creator
            if (window.desktopRouteCreator && typeof window.desktopRouteCreator.handleCreateRoute === 'function') {
                console.log('[Mobile] Calling desktop route creator...');
                await window.desktopRouteCreator.handleCreateRoute();
                
                console.log('[Mobile] Desktop route creator finished');
                console.log('[Mobile] Optimized route:', window.desktopRouteCreator.optimizedRoute);
                
                // Hide create route button after successful route creation
                this.hideCreateRouteButton();
                
                // Check if route was created and show destination card
                setTimeout(() => {
                    if (window.desktopRouteCreator.optimizedRoute && window.desktopRouteCreator.optimizedRoute.length > 0) {
                        console.log('[Mobile] Route created successfully, showing destination card');
                        this.handleRouteCreated({
                            addresses: window.desktopRouteCreator.optimizedRoute,
                            type: 'mobile'
                        });
                    } else {
                        console.warn('[Mobile] No optimized route found after creation');
                        // Reset button to original state
                        if (btn) {
                            btn.textContent = originalText || '🗺️ Create Route from Files';
                            btn.disabled = false;
                            this.showCreateRouteButton();
                        }
                    }
                }, 1000);
                
            } else {
                console.error('[Mobile] Desktop route creator not available');
                console.log('[Mobile] window.desktopRouteCreator:', window.desktopRouteCreator);
                
                // Reset button to original state
                if (btn) {
                    btn.textContent = originalText || '🗺️ Create Route from Files';
                    btn.disabled = false;
                }
                
                // Fallback if desktop route creator not available
                const addresses = window.addresses || window.currentlyDisplayedItems || [];
                console.log('[Mobile] Available addresses:', addresses.length);
                
                if (addresses.length === 0) {
                    alert('No addresses loaded. Please load addresses from the Files tab first.');
                    return;
                }
                
                alert('Route creation system not available. Please try refreshing the page.');
            }
            
        } catch (error) {
            console.error('[Mobile] Error creating route:', error);
            alert('Error creating route. Please try again.');
            
            // Reset button to original state on error
            if (btn) {
                btn.textContent = originalText || '🗺️ Create Route from Files';
                btn.disabled = false;
                this.showCreateRouteButton();
            }
        }
    }
    
    /**
     * Handle route creation
     */
    handleRouteCreated(routeData) {
        console.log('[Mobile] handleRouteCreated called with:', routeData);
        console.log('[Mobile] First route address data:', routeData.addresses[0]);
        console.log('[Mobile] First route address keys:', Object.keys(routeData.addresses[0]));
        
        // Check second address (should be from Excel)
        if (routeData.addresses.length > 1) {
            console.log('[Mobile] Second route address data:', routeData.addresses[1]);
            console.log('[Mobile] Second route address keys:', Object.keys(routeData.addresses[1]));
        }
        
        this.currentRoute = routeData.addresses || [];
        this.currentPosition = 0;
        this.navigationActive = true;
        
        // Hide address input panel
        this.hideAddressInput();
        
        // Hide create route button
        this.hideCreateRouteButton();
        
        // Show destination card and hide drawing controls during navigation
        this.showDestinationCard();
        this.hideDrawingControls();
        this.updateDestinationDisplay();
        
        // Sync with desktop navigation controller
        if (window.desktopRouteCreator && window.desktopRouteCreator.navigationController) {
            // Make sure desktop navigation is at the same position
            window.desktopRouteCreator.navigationController.currentStopIndex = this.currentPosition;
        }
        
        console.log('[Mobile] Navigation activated with', this.currentRoute.length, 'stops');
    }
    
    /**
     * Show destination card
     */
    showDestinationCard() {
        const card = document.getElementById('mobile-destination-card');
        if (card) {
            card.classList.add('visible');
        }
    }
    
    /**
     * Hide destination card
     */
    hideDestinationCard() {
        const card = document.getElementById('mobile-destination-card');
        if (card) {
            card.classList.remove('visible');
        }
    }
    
    /**
     * Update destination display
     */
    updateDestinationDisplay() {
        if (!this.navigationActive || this.currentRoute.length === 0) return;
        
        const current = this.currentRoute[this.currentPosition];
        if (!current) return;
        
        // Update progress
        const progress = Math.round(((this.currentPosition + 1) / this.currentRoute.length) * 100);
        document.getElementById('mobile-progress').textContent = 
            `Stop ${this.currentPosition + 1} of ${this.currentRoute.length} • ${progress}% Complete`;
        
        // Get name using same logic as desktop markers
        let displayName = null;
        if (current.name) {
            displayName = current.name;
        } else if (current['Borrower Name']) {
            displayName = current['Borrower Name'];
        } else if (current.borrowerName) {
            displayName = current.borrowerName;
        } else if (current['Property Owner']) {
            displayName = current['Property Owner'];
        } else if (current.propertyOwner) {
            displayName = current.propertyOwner;
        } else if (current.owner) {
            displayName = current.owner;
        } else if (current.firstName && current.lastName) {
            displayName = `${current.firstName} ${current.lastName}`;
        } else if (current.firstName) {
            displayName = current.firstName;
        } else if (current.lastName) {
            displayName = current.lastName;
        }
        
        // If no name found in route data, look up from currently loaded Excel data
        if (!displayName && typeof window.currentlyDisplayedItems !== 'undefined' && 
            window.currentlyDisplayedItems && Array.isArray(window.currentlyDisplayedItems)) {
          
          console.log('[Mobile] No name in route data, looking up from Excel data for:', current.address);
          
          // Find matching address in Excel data
          const matchingItem = window.currentlyDisplayedItems.find(item => {
            if (!item || !item.address) return false;
            const itemAddr = item.address.toLowerCase().trim();
            const currentAddr = current.address.toLowerCase().trim();
            
            // Try exact match first
            if (itemAddr === currentAddr) return true;
            
            // Try partial match (remove common suffixes)
            const cleanItem = itemAddr.replace(/, usa$|, tx$|, texas$/i, '').trim();
            const cleanCurrent = currentAddr.replace(/, usa$|, tx$|, texas$/i, '').trim();
            
            return cleanItem === cleanCurrent;
          });
          
          if (matchingItem) {
            // Use same name detection logic
            if (matchingItem.name) {
              displayName = matchingItem.name;
            } else if (matchingItem['Borrower Name']) {
              displayName = matchingItem['Borrower Name'];
            } else if (matchingItem.borrowerName) {
              displayName = matchingItem.borrowerName;
            } else if (matchingItem['Property Owner']) {
              displayName = matchingItem['Property Owner'];
            } else if (matchingItem.propertyOwner) {
              displayName = matchingItem.propertyOwner;
            } else if (matchingItem.owner) {
              displayName = matchingItem.owner;
            } else if (matchingItem.firstName && matchingItem.lastName) {
              displayName = `${matchingItem.firstName} ${matchingItem.lastName}`;
            } else if (matchingItem.firstName) {
              displayName = matchingItem.firstName;
            } else if (matchingItem.lastName) {
              displayName = matchingItem.lastName;
            }
            
            console.log('[Mobile] Found name from Excel lookup:', displayName);
          } else {
            console.log('[Mobile] No matching address found in Excel data');
          }
        }
        
        // Update address with name if available
        const addressText = current.address || 'Unknown Address';
        if (displayName) {
            document.getElementById('mobile-address').innerHTML = `<strong>${displayName}</strong><br>${addressText}`;
        } else {
            document.getElementById('mobile-address').textContent = addressText;
        }
        
        // Update details (city/state only, name now shown above)
        const details = [];
        if (current.city) details.push(current.city);
        if (current.state) details.push(current.state);
        document.getElementById('mobile-details').textContent = details.join(', ');
        
        // Update button states
        document.getElementById('mobile-prev-btn').disabled = this.currentPosition === 0;
        document.getElementById('mobile-next-btn').disabled = this.currentPosition >= this.currentRoute.length - 1;
    }
    
    /**
     * Navigate to previous stop
     */
    navigatePrevious() {
        // Prevent rapid clicks
        if (this._navigating || this.currentPosition === 0) return;
        
        this._navigating = true;
        
        // Immediate visual feedback
        const prevBtn = this.getCachedElement('mobile-prev-btn');
        if (prevBtn) {
            prevBtn.style.opacity = '0.5';
            prevBtn.disabled = true;
        }
        
        try {
            // Use desktop navigation controller which handles map centering
            if (window.desktopRouteCreator && window.desktopRouteCreator.navigationController) {
                window.desktopRouteCreator.navigationController.navigateToPreviousStop();
                
                // Sync mobile position with desktop controller
                this.currentPosition = window.desktopRouteCreator.navigationController.currentStopIndex;
                this.updateDestinationDisplay();
            } else {
                // Fallback to mobile-only navigation
                if (this.currentPosition > 0) {
                    this.currentPosition--;
                    this.updateDestinationDisplay();
                }
            }
        } catch (error) {
            console.error('[Mobile] Navigation error:', error);
        }
        
        // Reset navigation state
        setTimeout(() => {
            this._navigating = false;
            if (prevBtn) {
                prevBtn.style.opacity = '';
                prevBtn.disabled = this.currentPosition === 0;
            }
        }, 300);
    }
    
    /**
     * Navigate to next stop
     */
    navigateNext() {
        // Prevent rapid clicks
        if (this._navigating || this.currentPosition >= this.currentRoute.length - 1) return;
        
        this._navigating = true;
        
        // Immediate visual feedback
        const nextBtn = this.getCachedElement('mobile-next-btn');
        if (nextBtn) {
            nextBtn.style.opacity = '0.5';
            nextBtn.disabled = true;
        }
        
        try {
            // Use desktop navigation controller which handles map centering
            if (window.desktopRouteCreator && window.desktopRouteCreator.navigationController) {
                window.desktopRouteCreator.navigationController.navigateToNextStop();
                
                // Sync mobile position with desktop controller
                this.currentPosition = window.desktopRouteCreator.navigationController.currentStopIndex;
                this.updateDestinationDisplay();
            } else {
                // Fallback to mobile-only navigation
                if (this.currentPosition < this.currentRoute.length - 1) {
                    this.currentPosition++;
                    this.updateDestinationDisplay();
                }
            }
        } catch (error) {
            console.error('[Mobile] Navigation error:', error);
        }
        
        // Reset navigation state
        setTimeout(() => {
            this._navigating = false;
            if (nextBtn) {
                nextBtn.style.opacity = '';
                nextBtn.disabled = this.currentPosition >= this.currentRoute.length - 1;
            }
        }, 300);
    }
    
    /**
     * Get cached DOM element to reduce queries
     */
    getCachedElement(id) {
        if (!this.cachedElements[id]) {
            this.cachedElements[id] = document.getElementById(id);
        }
        return this.cachedElements[id];
    }
    
    /**
     * Clear element cache when DOM changes
     */
    clearElementCache() {
        this.cachedElements = {};
    }
    
    /**
     * Open Google Maps for current destination
     */
    openGoogleMaps() {
        const current = this.currentRoute[this.currentPosition];
        if (!current) {
            console.error('[Mobile] No current destination to navigate to');
            return;
        }
        
        // Build Google Maps URL for single destination
        const address = encodeURIComponent(current.address || '');
        const url = `https://www.google.com/maps/dir/?api=1&destination=${address}`;
        
        console.log('[Mobile] Opening Google Maps for:', current.address);
        console.log('[Mobile] Google Maps URL:', url);
        
        // Open in new tab - Note: Mobile browsers may return null even when successful
        window.open(url, '_blank');
        console.log('[Mobile] Google Maps navigation initiated');
    }
    
    /**
     * Check in at current stop
     */
    checkIn() {
        const current = this.currentRoute[this.currentPosition];
        if (!current) return;
        
        // Mark as visited using existing system
        if (window.markAddressAsVisited) {
            window.markAddressAsVisited(current.id || current.address);
        }
        
        // Auto-advance to next stop
        if (this.currentPosition < this.currentRoute.length - 1) {
            setTimeout(() => {
                this.navigateNext();
            }, 300);
        } else {
            // Route complete
            this.handleRouteComplete();
        }
    }
    
    /**
     * Open notes for current stop
     */
    openNotes() {
        const current = this.currentRoute[this.currentPosition];
        if (!current) {
            console.error('[Mobile] No current address for notes');
            return;
        }
        
        const address = current.address;
        console.log('[Mobile] Opening notes for:', address);
        
        // Set global current address for notes system
        window.currentAddress = address;
        
        // Use existing notes system
        if (typeof openNotesFromMap === 'function') {
            openNotesFromMap(address);
        } else {
            console.error('[Mobile] Notes system not available');
            alert('Notes system not available. Please try again.');
        }
    }
    
    /**
     * Combined check in and notes - opens notes interface and marks as visited
     */
    checkInWithNotes() {
        const current = this.currentRoute[this.currentPosition];
        if (!current) {
            console.error('[Mobile] No current address for check-in with notes');
            return;
        }
        
        const address = current.address;
        console.log('[Mobile] Check in with notes for:', address);
        
        // Set global current address for notes system
        window.currentAddress = address;
        
        // Mark as visited using existing system
        if (window.markAddressAsVisited) {
            window.markAddressAsVisited(current.id || current.address);
        }
        
        // Open notes interface
        if (typeof openNotesFromMap === 'function') {
            openNotesFromMap(address);
        } else {
            console.error('[Mobile] Notes system not available');
            alert('Notes system not available. Please try again.');
        }
        
        // Note: We don't auto-advance here since user is taking notes
        // They can use Prev/Next buttons after adding notes
    }
    
    /**
     * Handle route completion
     */
    handleRouteComplete() {
        alert('🎉 Route Complete!\n\nAll destinations have been checked in.');
        this.hideDestinationCard();
        this.navigationActive = false;
    }
    
    /**
     * End route and return to normal view
     */
    endRoute() {
        console.log('[Mobile] Ending route');
        
        // Use desktop navigation controller to end route
        if (window.desktopRouteCreator && window.desktopRouteCreator.navigationController) {
            window.desktopRouteCreator.navigationController.endRoute();
        }
        
        // Clear mobile navigation state completely
        this.hideDestinationCard();
        this.navigationActive = false;
        this.currentRoute = [];
        this.currentPosition = 0;
        
        // Clear optimized route from desktop route creator
        if (window.desktopRouteCreator) {
            window.desktopRouteCreator.optimizedRoute = null;
        }
        
        // Always switch to map tab after ending route
        console.log('[Mobile] Ending route - switching to map tab');
        this.switchTab('map');
        
        // Check if we have loaded addresses to show create route button
        const hasLoadedAddresses = window.addresses && window.addresses.length > 0;
        const hasLassoedAddresses = window.selectedItemsInShape && window.selectedItemsInShape.length > 0;
        
        console.log('[Mobile] After route end - hasLoadedAddresses:', hasLoadedAddresses, 'hasLassoedAddresses:', hasLassoedAddresses);
        
        if (hasLoadedAddresses || hasLassoedAddresses) {
            console.log('[Mobile] Showing create route button - addresses available');
            this.showCreateRouteButton();
        } else {
            console.log('[Mobile] Hiding create route button - no addresses available');
            this.hideCreateRouteButton();
        }
        
        // Show drawing controls again when on map tab
        if (document.querySelector('.mobile-tab-btn.active')?.dataset.tab === 'map') {
            this.showDrawingControls();
        }
        
        // Force comprehensive button state update with multiple attempts to ensure it sticks
        const updateButtonState = () => {
            if (window.desktopRouteCreator && typeof window.desktopRouteCreator._updateButtonState === 'function') {
                console.log('[Mobile] Force updating button state after route end');
                window.desktopRouteCreator._updateButtonState();
                
                // Ensure desktop button text is properly reset
                const desktopBtn = document.getElementById('createRouteBtn');
                if (desktopBtn) {
                    if (hasLoadedAddresses || hasLassoedAddresses) {
                        desktopBtn.textContent = '🗺️ Create Route';
                        desktopBtn.disabled = false;
                        console.log('[Mobile] Desktop button enabled with addresses available');
                    } else {
                        desktopBtn.textContent = 'Create Route';
                        desktopBtn.disabled = true;
                        console.log('[Mobile] Desktop button disabled - no addresses');
                    }
                }
                
                // Also ensure mobile button is in correct state
                const mobileBtn = document.getElementById('mobile-create-route-btn');
                if (mobileBtn && (hasLoadedAddresses || hasLassoedAddresses)) {
                    mobileBtn.textContent = '🗺️ Create Route from Files';
                    mobileBtn.disabled = false;
                    console.log('[Mobile] Mobile button enabled with addresses available');
                }
            }
        };
        
        // Update button state immediately and with delays to handle any async operations
        updateButtonState();
        setTimeout(updateButtonState, 100);
        setTimeout(updateButtonState, 300);
        
        console.log('[Mobile] Route ended successfully');
    }
    
    /**
     * Add new destination field
     */
    addDestinationField() {
        const container = document.getElementById('mobile-destinations');
        const fieldCount = container.querySelectorAll('.mobile-destination-row').length;
        
        const newRow = document.createElement('div');
        newRow.className = 'mobile-destination-row';
        newRow.innerHTML = `
            <input type="text" class="mobile-address-field mobile-destination-field" placeholder="Destination ${fieldCount + 1}">
            <button class="mobile-remove-btn">×</button>
        `;
        
        container.appendChild(newRow);
        
        // Update remove button visibility
        this.updateRemoveButtons();
        
        // Focus new field
        const newInput = newRow.querySelector('.mobile-address-field');
        newInput.focus();
        
        // Scroll to new field
        newRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    /**
     * Remove destination field
     */
    removeDestinationField(button) {
        const row = button.closest('.mobile-destination-row');
        if (row) {
            row.remove();
            this.updateRemoveButtons();
            this.updateDestinationPlaceholders();
        }
    }
    
    /**
     * Update remove button visibility and placeholder text
     */
    updateRemoveButtons() {
        const rows = document.querySelectorAll('.mobile-destination-row');
        
        rows.forEach((row, index) => {
            const removeBtn = row.querySelector('.mobile-remove-btn');
            const input = row.querySelector('.mobile-destination-field');
            
            // Show remove button if more than 1 field
            removeBtn.style.display = rows.length > 1 ? 'flex' : 'none';
            
            // Update placeholder
            input.placeholder = `Destination ${index + 1}`;
        });
    }
    
    /**
     * Update destination placeholders
     */
    updateDestinationPlaceholders() {
        const inputs = document.querySelectorAll('.mobile-destination-field');
        inputs.forEach((input, index) => {
            input.placeholder = `Destination ${index + 1}`;
        });
    }
    
    /**
     * Create route from manual input
     */
    async createRouteFromManualInput() {
        console.log('[Mobile] Creating route from manual input');
        
        // Get all input values
        const startingAddress = document.getElementById('mobile-start-address').value.trim();
        const destinationInputs = document.querySelectorAll('.mobile-destination-field');
        const destinations = Array.from(destinationInputs)
            .map(input => input.value.trim())
            .filter(value => value.length > 0);
        
        // Validation
        if (!startingAddress) {
            alert('Please enter a starting address');
            document.getElementById('mobile-start-address').focus();
            return;
        }
        
        if (destinations.length === 0) {
            alert('Please enter at least one destination');
            document.querySelector('.mobile-destination-field').focus();
            return;
        }
        
        console.log('[Mobile] Manual input - Start:', startingAddress);
        console.log('[Mobile] Manual input - Destinations:', destinations);
        
        // Update desktop fields with mobile values
        this.syncToDesktopFields(startingAddress, destinations);
        
        // Hide input panel and show map
        this.hideAddressInput();
        
        // Use desktop route creator
        if (window.desktopRouteCreator && typeof window.desktopRouteCreator.handleCreateRoute === 'function') {
            try {
                await window.desktopRouteCreator.handleCreateRoute();
                console.log('[Mobile] Route created successfully from manual input');
            } catch (error) {
                console.error('[Mobile] Error creating route:', error);
                alert('Error creating route. Please try again.');
                this.showAddressInput();
            }
        } else {
            console.error('[Mobile] Desktop route creator not available');
            alert('Route creation system not available. Please try refreshing the page.');
            this.showAddressInput();
        }
    }
    
    /**
     * Sync mobile input values to desktop fields
     */
    syncToDesktopFields(startingAddress, destinations) {
        // Set starting address
        const startField = document.getElementById('manualStartAddress');
        if (startField) {
            startField.value = startingAddress;
        }
        
        // Clear existing destination fields
        const destinationContainer = document.getElementById('destinationFields');
        if (destinationContainer) {
            destinationContainer.innerHTML = '';
            
            // Add destination fields
            destinations.forEach((destination, index) => {
                const fieldHtml = `
                    <div class="destination-input-container" style="position: relative; margin-bottom: 12px;">
                        <input type="text" class="clean-input destination-input destination-field" 
                               value="${destination}" placeholder="Destination ${index + 1}" 
                               style="width: 100%; padding-right: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.06);">
                        <button type="button" class="clear-btn" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); box-shadow: 0 1px 3px rgba(0,0,0,0.1);">×</button>
                    </div>
                `;
                destinationContainer.insertAdjacentHTML('beforeend', fieldHtml);
            });
        }
    }
    
    /**
     * Paste addresses from clipboard
     */
    async pasteAddresses() {
        try {
            if (!navigator.clipboard) {
                alert('Clipboard access not available. Please enter addresses manually.');
                return;
            }
            
            const text = await navigator.clipboard.readText();
            if (!text.trim()) {
                alert('Clipboard is empty');
                return;
            }
            
            // Split by lines and filter out empty lines
            const lines = text.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
            
            if (lines.length === 0) {
                alert('No valid addresses found in clipboard');
                return;
            }
            
            // First line as starting address if current starting address is empty
            const startField = document.getElementById('mobile-start-address');
            let addressIndex = 0;
            
            if (!startField.value.trim() && lines.length > 0) {
                startField.value = lines[0];
                addressIndex = 1;
            }
            
            // Clear existing destinations
            document.getElementById('mobile-destinations').innerHTML = '';
            
            // Add remaining lines as destinations
            for (let i = addressIndex; i < lines.length; i++) {
                if (i === addressIndex) {
                    // Update the first destination field
                    const firstRow = document.createElement('div');
                    firstRow.className = 'mobile-destination-row';
                    firstRow.innerHTML = `
                        <input type="text" class="mobile-address-field mobile-destination-field" value="${lines[i]}" placeholder="Destination 1">
                        <button class="mobile-remove-btn" style="display: none;">×</button>
                    `;
                    document.getElementById('mobile-destinations').appendChild(firstRow);
                } else {
                    // Add additional destination fields
                    this.addDestinationField();
                    const lastInput = document.querySelector('.mobile-destination-row:last-child .mobile-destination-field');
                    lastInput.value = lines[i];
                }
            }
            
            this.updateRemoveButtons();
            console.log('[Mobile] Pasted', lines.length, 'addresses from clipboard');
            
        } catch (error) {
            console.error('[Mobile] Error pasting addresses:', error);
            alert('Failed to paste addresses. Please enter them manually.');
        }
    }
    
    /**
     * Clear all input fields
     */
    clearAllFields() {
        // Clear starting address
        document.getElementById('mobile-start-address').value = '';
        
        // Reset to single destination field
        document.getElementById('mobile-destinations').innerHTML = `
            <div class="mobile-destination-row">
                <input type="text" class="mobile-address-field mobile-destination-field" placeholder="Destination 1">
                <button class="mobile-remove-btn" style="display: none;">×</button>
            </div>
        `;
        
        this.updateRemoveButtons();
        console.log('[Mobile] Cleared all address fields');
    }
    
    /**
     * Hide address input panel
     */
    hideAddressInput() {
        const panel = document.getElementById('mobile-address-input');
        if (panel) {
            panel.classList.add('hidden');
        }
    }
    
    /**
     * Show address input panel
     */
    showAddressInput() {
        const panel = document.getElementById('mobile-address-input');
        if (panel) {
            panel.classList.remove('hidden');
        }
    }
    
    /**
     * Show drawing controls for mobile map interaction
     */
    showDrawingControls() {
        const drawingControls = document.querySelector('.leaflet-control-container .leaflet-top.leaflet-left');
        if (drawingControls) {
            drawingControls.style.display = 'block';
            console.log('[Mobile] Drawing controls shown for map tab');
        }
    }
    
    /**
     * Hide drawing controls when not on map tab
     */
    hideDrawingControls() {
        const drawingControls = document.querySelector('.leaflet-control-container .leaflet-top.leaflet-left');
        if (drawingControls) {
            drawingControls.style.display = 'none';
            console.log('[Mobile] Drawing controls hidden for non-map tab');
        }
    }
    
    /**
     * Format date for display
     */
    formatDate(date) {
        if (!date) return 'Unknown';
        
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString();
    }
}

// Initialize mobile navigation
if (!window.mobileNavigation) {
    window.mobileNavigation = new MobileNavigation();
}

// Handle window resize
window.addEventListener('resize', () => {
    if (window.mobileNavigation && window.mobileNavigation.isMobile()) {
        // Ensure mobile interface is shown
        window.mobileNavigation.showMobileInterface();
    }
});