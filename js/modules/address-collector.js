// AddressCollector - Handles gathering addresses from various sources
class AddressCollector {
  constructor() {
    this.sources = {
      manual: 'Manual Input Fields',
      lasso: 'Box Selection',
      excel: 'Excel/File Upload'
    };
  }

  // Collect all addresses from available sources
  collectAllAddresses() {
    console.log('📍 AddressCollector: Collecting addresses from all sources');
    
    const addresses = [];
    const sources = [];
    
    try {
      // 1. Get starting address
      const startingAddress = this.getStartingAddress();
      if (startingAddress) {
        addresses.push(startingAddress);
        sources.push('starting_address');
      }

      // 2. Get box-selected addresses (prioritize these over manual addresses)
      const selectedAddresses = this.getBoxSelectedAddresses();
      
      // 3. Get manual destination addresses (only if no box selection exists)
      const manualAddresses = this.getManualAddresses();
      
      // Prioritize box-selected addresses over manual addresses
      if (selectedAddresses.length > 0) {
        console.log('📍 AddressCollector: Using box-selected addresses (with names)');
        console.log('📍 AddressCollector: Selected addresses data:', selectedAddresses);
        selectedAddresses.forEach(addr => {
          console.log(`📍 AddressCollector: Selected - Address: ${addr.address}, Name: ${addr.name}`);
        });
        addresses.push(...selectedAddresses);
        sources.push('box_selection');
      } else if (manualAddresses.length > 0) {
        console.log('📍 AddressCollector: Using manual destination addresses (no box selection available)');
        console.log('📍 AddressCollector: Manual addresses data:', manualAddresses);
        addresses.push(...manualAddresses);
        sources.push('manual');
      }

      // Remove duplicates while preserving order
      const uniqueAddresses = this.removeDuplicates(addresses);
      
      console.log(`📍 AddressCollector: Collected ${uniqueAddresses.length} unique addresses from sources:`, sources);
      
      return {
        addresses: uniqueAddresses,
        sources: sources,
        stats: {
          total: uniqueAddresses.length,
          starting: startingAddress ? 1 : 0,
          manual: manualAddresses.length,
          selected: selectedAddresses.length
        }
      };
      
    } catch (error) {
      console.error('❌ AddressCollector: Error collecting addresses:', error);
      return {
        addresses: [],
        sources: [],
        stats: { total: 0, starting: 0, manual: 0, selected: 0 }
      };
    }
  }

  // Get the starting address
  getStartingAddress() {
    const startingField = document.getElementById('manualStartAddress');
    if (!startingField || !startingField.value.trim()) {
      return null;
    }

    const address = startingField.value.trim();
    return {
      address: address,
      isStartingAddress: true,
      source: 'manual_start'
    };
  }

  // Get manually entered destination addresses
  getManualAddresses() {
    const destinationFields = document.querySelectorAll('.destination-field');
    const addresses = [];

    destinationFields.forEach((field, index) => {
      const address = field.value.trim();
      if (address) {
        addresses.push({
          address: address,
          isStartingAddress: false,
          source: 'manual_destination',
          fieldIndex: index
        });
      }
    });

    console.log(`📍 AddressCollector: Found ${addresses.length} manual addresses`);
    return addresses;
  }

  // Get addresses selected via box selection tool
  getBoxSelectedAddresses() {
    if (!window.selectedItemsInShape || !Array.isArray(window.selectedItemsInShape)) {
      return [];
    }

    const addresses = window.selectedItemsInShape
      .filter(item => item && item.address)
      .map(item => {
        // Try multiple name field variations like in the popup
        let name = null;
        if (item.name) {
          name = item.name;
        } else if (item['Borrower Name']) {
          name = item['Borrower Name'];
        } else if (item.borrowerName) {
          name = item.borrowerName;
        } else if (item['Property Owner']) {
          name = item['Property Owner'];
        } else if (item.propertyOwner) {
          name = item.propertyOwner;
        } else if (item.owner) {
          name = item.owner;
        } else if (item.firstName && item.lastName) {
          name = `${item.firstName} ${item.lastName}`;
        } else if (item.firstName) {
          name = item.firstName;
        } else if (item.lastName) {
          name = item.lastName;
        }
        
        return {
          address: item.address,
          name: name,
          lat: item.lat || null,
          lng: item.lng || null,
          auctionDateFormatted: item.auctionDateFormatted || null,
          isStartingAddress: false,
          source: 'box_selection',
          originalData: item
        };
      });

    console.log(`📍 AddressCollector: Found ${addresses.length} box-selected addresses`);
    return addresses;
  }

  // Remove duplicate addresses while preserving order
  removeDuplicates(addresses) {
    const seen = new Set();
    const unique = [];

    for (const addr of addresses) {
      // Normalize address for comparison
      const normalizedAddress = addr.address.toLowerCase().trim();
      
      if (!seen.has(normalizedAddress)) {
        seen.add(normalizedAddress);
        unique.push(addr);
      } else {
        console.log('📍 AddressCollector: Skipped duplicate address:', addr.address);
      }
    }

    return unique;
  }

  // Validate collected addresses
  validateAddresses(addresses) {
    const validation = {
      valid: [],
      invalid: [],
      warnings: []
    };

    addresses.forEach((addr, index) => {
      const issues = [];
      
      // Check for required address field
      if (!addr.address || typeof addr.address !== 'string') {
        issues.push('Missing or invalid address');
      } else if (addr.address.trim().length === 0) {
        issues.push('Empty address');
      } else if (addr.address.trim().length < 5) {
        issues.push('Address too short');
      }

      // Check for coordinates if available
      if (addr.lat !== null && addr.lng !== null) {
        if (typeof addr.lat !== 'number' || typeof addr.lng !== 'number') {
          issues.push('Invalid coordinates');
        } else if (Math.abs(addr.lat) > 90 || Math.abs(addr.lng) > 180) {
          issues.push('Coordinates out of range');
        }
      }

      if (issues.length > 0) {
        validation.invalid.push({
          index: index,
          address: addr,
          issues: issues
        });
      } else {
        validation.valid.push(addr);
      }
    });

    // Check for minimum addresses
    if (validation.valid.length === 0) {
      validation.warnings.push('No valid addresses found');
    } else if (validation.valid.length === 1) {
      validation.warnings.push('Only one address found - route will have no waypoints');
    }

    // Check for starting address
    const hasStartingAddress = validation.valid.some(addr => addr.isStartingAddress);
    if (!hasStartingAddress) {
      validation.warnings.push('No starting address specified');
    }

    console.log(`📍 AddressCollector: Validation complete - ${validation.valid.length} valid, ${validation.invalid.length} invalid`);
    
    if (validation.warnings.length > 0) {
      console.warn('📍 AddressCollector: Warnings:', validation.warnings);
    }

    return validation;
  }

  // Get summary of address sources
  getSourceSummary() {
    const collection = this.collectAllAddresses();
    
    return {
      total: collection.stats.total,
      breakdown: {
        'Starting Address': collection.stats.starting,
        'Manual Destinations': collection.stats.manual,
        'Box Selected': collection.stats.selected
      },
      sources: collection.sources
    };
  }

  // Check if we have enough addresses for a route
  hasValidRoute() {
    const collection = this.collectAllAddresses();
    const validation = this.validateAddresses(collection.addresses);
    
    return {
      isValid: validation.valid.length >= 1,
      addressCount: validation.valid.length,
      hasStartingAddress: validation.valid.some(addr => addr.isStartingAddress),
      issues: validation.warnings
    };
  }

  // Clear all address sources
  clearAllSources() {
    console.log('🗑️ AddressCollector: Clearing all address sources');
    
    // Clear manual starting address
    const startingField = document.getElementById('manualStartAddress');
    if (startingField) {
      startingField.value = '';
    }

    // Clear manual destination fields
    const destinationFields = document.querySelectorAll('.destination-field');
    destinationFields.forEach(field => {
      field.value = '';
    });

    // Clear box selections
    if (window.selectedItemsInShape) {
      window.selectedItemsInShape = [];
    }

    // Clear any drawn shapes on map
    if (typeof window.handleClearSelections === 'function') {
      window.handleClearSelections();
    }

    console.log('✅ AddressCollector: All sources cleared');
  }
}

// Export for use in other modules
window.AddressCollector = AddressCollector;