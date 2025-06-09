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
                            📍 Route
                        </button>
                        <button class="mobile-tab-btn" data-tab="files">
                            📁 Files
                        </button>
                    </div>
                </div>
                
                <!-- Mobile Tab Content -->
                <div class="mobile-tab-content">
                    <!-- Route Navigation Tab -->
                    <div class="mobile-tab-pane active" id="mobile-route-tab">
                        <div class="mobile-route-tab">
                            <div class="mobile-map-container">
                                <!-- Map will be moved here -->
                            </div>
                            
                            <!-- Create Route Button (shown when addresses loaded) -->
                            <div class="mobile-create-route-btn" id="mobile-create-route-container">
                                <button class="mobile-nav-btn primary" id="mobile-create-route-btn">
                                    🗺️ Create Route
                                </button>
                            </div>
                            
                            <!-- Destination Card (hidden initially) -->
                            <div class="destination-card" id="mobile-destination-card">
                                <div class="destination-header">
                                    <div class="destination-progress" id="mobile-progress">
                                        Stop 1 of 8 • 12% Complete
                                    </div>
                                    <div class="destination-address" id="mobile-address">
                                        123 Main Street
                                    </div>
                                    <div class="destination-details" id="mobile-details">
                                        Houston, TX 77025
                                    </div>
                                </div>
                                
                                <div class="destination-controls">
                                    <div class="control-row">
                                        <button class="mobile-nav-btn" id="mobile-prev-btn">
                                            ← Prev
                                        </button>
                                        <button class="mobile-nav-btn primary" id="mobile-navigate-btn">
                                            🗺️ Navigate
                                        </button>
                                        <button class="mobile-nav-btn" id="mobile-next-btn">
                                            Next →
                                        </button>
                                    </div>
                                    <div class="control-row">
                                        <button class="mobile-nav-btn complete" id="mobile-complete-btn">
                                            ✓ Mark Complete
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
            if (e.target.matches('.mobile-tab-btn')) {
                this.switchTab(e.target.dataset.tab);
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
            } else if (e.target.matches('#mobile-complete-btn')) {
                this.markComplete();
            }
        });
        
        // File actions
        document.addEventListener('click', (e) => {
            console.log('[Mobile] Click detected on:', e.target.id, e.target.className);
            
            if (e.target.matches('.mobile-load-addresses-btn')) {
                const fileId = e.target.dataset.fileId;
                this.loadAddressesFromFile(fileId);
            } else if (e.target.matches('#mobile-create-route-btn')) {
                console.log('[Mobile] Create route button clicked!');
                e.preventDefault();
                e.stopPropagation();
                
                // Try clicking the desktop create route button directly
                const desktopBtn = document.getElementById('createRouteBtn');
                if (desktopBtn) {
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
        
        // Resize map if switching to route tab
        if (tabName === 'route' && window.map) {
            setTimeout(() => {
                console.log('[Mobile] Resizing map after tab switch to route');
                window.map.invalidateSize();
                
                // Re-fit the map to show all content properly
                setTimeout(() => {
                    if (window.addresses && window.addresses.length > 0) {
                        if (typeof window.fitMapToAddresses === 'function') {
                            window.fitMapToAddresses();
                        }
                    }
                }, 200);
            }, 100);
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
            
            // Switch to route tab
            this.switchTab('route');
            
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
            // Switch to route tab
            this.switchTab('route');
            
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
        try {
            console.log('[Mobile] 🚀 Creating optimized route...');
            console.log('[Mobile] desktopRouteCreator exists:', !!window.desktopRouteCreator);
            console.log('[Mobile] handleCreateRoute exists:', !!(window.desktopRouteCreator && window.desktopRouteCreator.handleCreateRoute));
            
            // Show loading on button
            const btn = document.getElementById('mobile-create-route-btn');
            if (btn) {
                const originalText = btn.textContent;
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
                        // Reset button
                        if (btn) {
                            btn.textContent = '🗺️ Create Route';
                            btn.disabled = false;
                        }
                    }
                }, 1000);
                
            } else {
                console.error('[Mobile] Desktop route creator not available');
                console.log('[Mobile] window.desktopRouteCreator:', window.desktopRouteCreator);
                
                // Reset button
                if (btn) {
                    btn.textContent = '🗺️ Create Route';
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
            
            // Reset button
            const btn = document.getElementById('mobile-create-route-btn');
            if (btn) {
                btn.textContent = '🗺️ Create Route';
                btn.disabled = false;
            }
        }
    }
    
    /**
     * Handle route creation
     */
    handleRouteCreated(routeData) {
        console.log('[Mobile] handleRouteCreated called with:', routeData);
        this.currentRoute = routeData.addresses || [];
        this.currentPosition = 0;
        this.navigationActive = true;
        
        // Hide create route button first
        this.hideCreateRouteButton();
        
        // Then show destination card
        this.showDestinationCard();
        this.updateDestinationDisplay();
        
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
        
        // Update address
        document.getElementById('mobile-address').textContent = current.address || 'Unknown Address';
        
        // Update details
        const details = [];
        if (current.city) details.push(current.city);
        if (current.state) details.push(current.state);
        if (current.firstName || current.lastName) {
            details.push(`${current.firstName || ''} ${current.lastName || ''}`.trim());
        }
        document.getElementById('mobile-details').textContent = details.join(' • ');
        
        // Update button states
        document.getElementById('mobile-prev-btn').disabled = this.currentPosition === 0;
        document.getElementById('mobile-next-btn').disabled = this.currentPosition >= this.currentRoute.length - 1;
    }
    
    /**
     * Navigate to previous stop
     */
    navigatePrevious() {
        if (this.currentPosition > 0) {
            this.currentPosition--;
            this.updateDestinationDisplay();
        }
    }
    
    /**
     * Navigate to next stop
     */
    navigateNext() {
        if (this.currentPosition < this.currentRoute.length - 1) {
            this.currentPosition++;
            this.updateDestinationDisplay();
        }
    }
    
    /**
     * Open Google Maps for current destination
     */
    openGoogleMaps() {
        const current = this.currentRoute[this.currentPosition];
        if (!current) return;
        
        // Build Google Maps URL for single destination
        const address = encodeURIComponent(current.address || '');
        const url = `https://www.google.com/maps/dir/?api=1&destination=${address}`;
        
        // Open in new tab
        window.open(url, '_blank');
    }
    
    /**
     * Mark current stop as complete
     */
    markComplete() {
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
     * Handle route completion
     */
    handleRouteComplete() {
        alert('🎉 Route Complete!\n\nAll destinations have been visited.');
        this.hideDestinationCard();
        this.navigationActive = false;
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