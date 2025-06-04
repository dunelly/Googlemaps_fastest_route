# System Patterns: Smash Routes

## System Architecture

- Client-side web application (HTML, CSS, JavaScript).
- Uses Leaflet.js for interactive mapping and drawing.
- Integrates with external APIs for geocoding and route optimization.

## Key Technical Decisions

- All address processing and visualization handled in-browser for responsiveness.
- Geocoding and route optimization delegated to external APIs for scalability and simplicity.
- Memory Bank documentation system adopted for project continuity.

## Design Patterns in Use

- Modular UI: Address input, map, and results are separated into logical sections.
- Event-driven programming: UI updates and state changes are triggered by user actions and API responses.
- Local storage caching: Geocoding results and user preferences are cached in localStorage.

## Component Relationships

- Address input modules feed data to the map and route optimizer.
- Map selections update the list of addresses for optimization.
- Route optimization results are displayed and linked to Google Maps.

## Critical Implementation Paths

- Address import (manual, paste, file) → Geocoding → Map display → User selection (map/list) → Route optimization → Google Maps output.
