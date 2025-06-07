// Map Core Module - Basic map initialization and setup

let map;
let drawnItems;
let drawControl;

function initializeMapSystem() {
  initializeBasicMap();
  if (typeof initializeDrawingFeatures === 'function') {
    initializeDrawingFeatures();
  }
  if (typeof initializeGeocoding === 'function') {
    initializeGeocoding();
  }
}

function initializeBasicMap() {
  console.log("initializeBasicMap: Starting");
  try {
    map = L.map('map').setView([29.7604, -95.3698], 10);
    console.log("initializeBasicMap: L.map created");

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    console.log("initializeBasicMap: TileLayer added");

    drawnItems = new L.FeatureGroup();
    console.log("initializeBasicMap: FeatureGroup created");
    map.addLayer(drawnItems);
    console.log("initializeBasicMap: FeatureGroup added to map");

    drawControl = new L.Control.Draw({
      edit: false,
      draw: {
        polygon: true,
        polyline: false,
        rectangle: true,
        circle: false,
        marker: false,
        circlemarker: false
      }
    });
    console.log("initializeBasicMap: DrawControl options defined");
    map.addControl(drawControl);
    console.log("initializeBasicMap: DrawControl added to map");

    // Make variables globally available after they're initialized
    window.map = map;
    window.drawnItems = drawnItems;
    window.drawControl = drawControl;
    
  } catch (error) {
    console.error("initializeBasicMap: ERROR during initialization!", error);
  }
  console.log("initializeBasicMap: Finished (or error caught)");
}

function initializeGeocoding() {
  // Geocoding functionality is already implemented in the excel-handler
  // This function is here for completeness and future geocoding features
}

async function geocodeAddresses(itemsArray, progressCallback = null) {
  const apiKey = "AIzaSyAq-_o7JolKDWy943Q-dejkoqzPvJKIV2k"; 
  const cache = JSON.parse(localStorage.getItem("geocodeCache") || "{}");
  
  // Count addresses that need geocoding
  const addressesToGeocode = itemsArray.filter(item => {
    if (typeof item.lat === 'number' && typeof item.lng === 'number' && item.lat !== null && item.lng !== null) return false;
    return !cache[item.address];
  });
  
  const totalAddresses = itemsArray.length;
  const totalToGeocode = addressesToGeocode.length;
  let processed = 0;
  let geocoded = 0;
  let cached = 0;
  let failed = 0;
  
  const startTime = Date.now();
  
  // Initial progress update
  if (progressCallback) {
    progressCallback({
      processed: 0,
      total: totalAddresses,
      geocoded: 0,
      cached: 0,
      failed: 0,
      percentage: 0,
      status: 'Starting geocoding...',
      eta: null
    });
  }
  
  for (let i = 0; i < itemsArray.length; i++) {
    const item = itemsArray[i];
    processed++;
    
    // Skip if already has coordinates
    if (typeof item.lat === 'number' && typeof item.lng === 'number' && item.lat !== null && item.lng !== null) {
      // Update progress for skipped items
      if (progressCallback && processed % 5 === 0) {
        const elapsed = Date.now() - startTime;
        const rate = processed / elapsed * 1000; // items per second
        const remaining = totalAddresses - processed;
        const eta = remaining > 0 ? Math.round(remaining / rate) : 0;
        
        progressCallback({
          processed,
          total: totalAddresses,
          geocoded,
          cached,
          failed,
          percentage: Math.round((processed / totalAddresses) * 100),
          status: `Processing address ${processed}/${totalAddresses}...`,
          eta: eta > 0 ? `${eta}s remaining` : null
        });
      }
      continue;
    }
    
    const addressToGeocode = item.address;
    
    // Check cache first
    if (cache[addressToGeocode]) {
      item.lat = cache[addressToGeocode].lat;
      item.lng = cache[addressToGeocode].lng;
      cached++;
      
      // Update progress for cached items
      if (progressCallback && processed % 5 === 0) {
        const elapsed = Date.now() - startTime;
        const rate = processed / elapsed * 1000;
        const remaining = totalAddresses - processed;
        const eta = remaining > 0 ? Math.round(remaining / rate) : 0;
        
        progressCallback({
          processed,
          total: totalAddresses,
          geocoded,
          cached,
          failed,
          percentage: Math.round((processed / totalAddresses) * 100),
          status: `Found cached: ${addressToGeocode.substring(0, 30)}...`,
          eta: eta > 0 ? `${eta}s remaining` : null
        });
      }
      continue;
    }
    
    // Geocode using API
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressToGeocode)}&key=${apiKey}`;
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.status === "OK" && data.results && data.results[0]) {
        const loc = data.results[0].geometry.location;
        item.lat = loc.lat;
        item.lng = loc.lng;
        cache[addressToGeocode] = { lat: loc.lat, lng: loc.lng };
        geocoded++;
      } else {
        item.lat = null;
        item.lng = null;
        failed++;
        console.warn('Failed geocode:', addressToGeocode, data.status);
      }
    } catch (err) {
      item.lat = null;
      item.lng = null;
      failed++;
      console.error('Fetch error geocoding:', addressToGeocode, err);
    }
    
    // Update progress every few items or on important milestones
    if (progressCallback && (processed % 3 === 0 || processed === totalAddresses)) {
      const elapsed = Date.now() - startTime;
      const rate = processed / elapsed * 1000;
      const remaining = totalAddresses - processed;
      const eta = remaining > 0 ? Math.round(remaining / rate) : 0;
      
      progressCallback({
        processed,
        total: totalAddresses,
        geocoded,
        cached,
        failed,
        percentage: Math.round((processed / totalAddresses) * 100),
        status: processed < totalAddresses ? `Geocoding: ${addressToGeocode.substring(0, 30)}...` : 'Completing...',
        eta: eta > 0 ? `${eta}s remaining` : null
      });
    }
    
    // Rate limiting - shorter delay for better UX
    await new Promise(res => setTimeout(res, 50));
  }
  
  localStorage.setItem("geocodeCache", JSON.stringify(cache));
  
  // Final progress update
  if (progressCallback) {
    progressCallback({
      processed: totalAddresses,
      total: totalAddresses,
      geocoded,
      cached,
      failed,
      percentage: 100,
      status: `Complete! ${geocoded} geocoded, ${cached} cached, ${failed} failed`,
      eta: null
    });
  }
  
  return itemsArray; 
}

function handleClearSelections() {
  if (drawnItems) {
    drawnItems.clearLayers();
  }
  if (typeof populateAddressSelection === 'function' && typeof currentlyDisplayedItems !== 'undefined') {
    populateAddressSelection(currentlyDisplayedItems);
  }
  console.log("handleClearSelections: Selections cleared and address list repopulated.");
}

// Make core functions globally available
window.initializeMapSystem = initializeMapSystem;
window.geocodeAddresses = geocodeAddresses;
window.handleClearSelections = handleClearSelections;
