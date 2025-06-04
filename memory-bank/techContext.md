# Tech Context: Smash Routes

## Technologies Used

- HTML, CSS, JavaScript (Vanilla)
- Leaflet.js (interactive maps)
- Leaflet.draw (map drawing tools)
- xlsx.js (Excel/CSV parsing)
- Google Maps Geocoding API (address geocoding)
- External route optimization API

## Development Setup

- No build step; static files served directly.
- All logic runs client-side in the browser.
- Dependencies loaded via CDN.

## Technical Constraints

- API keys exposed in frontend (should be moved to backend for production).
- Limited by browser memory and localStorage for caching.
- No persistent backend or user authentication in initial version.

## Dependencies

- [Leaflet.js](https://leafletjs.com/)
- [Leaflet.draw](https://github.com/Leaflet/Leaflet.draw)
- [xlsx.js](https://github.com/SheetJS/sheetjs)
- [Google Maps APIs](https://developers.google.com/maps/documentation)
- External route optimization service

## Tool Usage Patterns

- Use localStorage for caching geocoding results and user preferences.
- Use fetch for API calls to geocoding and optimization services.
- Modular event-driven JavaScript for UI updates.
