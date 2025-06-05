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

async function geocodeAddresses(itemsArray) {
  const apiKey = "AIzaSyAq-_o7JolKDWy943Q-dejkoqzPvJKIV2k"; 
  const cache = JSON.parse(localStorage.getItem("geocodeCache") || "{}");
  
  for (const item of itemsArray) {
    if (typeof item.lat === 'number' && typeof item.lng === 'number' && item.lat !== null && item.lng !== null) continue;
    
    const addressToGeocode = item.address;
    if (cache[addressToGeocode]) {
      item.lat = cache[addressToGeocode].lat;
      item.lng = cache[addressToGeocode].lng;
      continue;
    }
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressToGeocode)}&key=${apiKey}`;
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.status === "OK" && data.results && data.results[0]) {
        const loc = data.results[0].geometry.location;
        item.lat = loc.lat;
        item.lng = loc.lng;
        cache[addressToGeocode] = { lat: loc.lat, lng: loc.lng };
      } else {
        item.lat = null;
        item.lng = null;
        console.warn('Failed geocode:', addressToGeocode, data.status);
      }
    } catch (err) {
      item.lat = null;
      item.lng = null;
      console.error('Fetch error geocoding:', addressToGeocode, err);
    }
    await new Promise(res => setTimeout(res, 60));
  }
  
  localStorage.setItem("geocodeCache", JSON.stringify(cache));
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
