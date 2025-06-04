# Product Requirements Document: Smash Routes

## 1. Introduction

Smash Routes is a web-based application designed to help users optimize multi-stop routes. It allows users to input a list of addresses through various methods, visualizes these addresses on an interactive map, and then calculates the most efficient route, which can be opened in Google Maps.

## 2. Goals

- Provide an intuitive interface for users to input multiple addresses for route planning.
- Offer flexible address input methods (manual entry, paste list, file upload).
- Visualize address locations on an interactive map.
- Enable users to select addresses for routing directly from the map or a list.
- Calculate and display an optimized travel route for the selected addresses.
- Seamlessly integrate with Google Maps for turn-by-turn navigation.
- Support data import from common file formats like Excel and CSV.

## 3. Target Audience

- Delivery drivers
- Sales representatives
- Field service technicians
- Real estate agents (especially with the "Auction Date" feature)
- Logistics planners
- Anyone needing to plan routes with multiple stops.

## 4. User Stories / Use Cases

- **UC-1: Manual Address Entry & Optimization**
  - As a user, I want to manually type a start address and several destination addresses so that I can quickly get an optimized route for a small number of stops.
- **UC-2: Paste List of Addresses & Optimization**
  - As a user, I want to paste a list of addresses copied from another source so that I can avoid retyping them and efficiently create a route.
- **UC-3: File Upload & Column Mapping**
  - As a user, I want to upload an Excel or CSV file containing addresses so that I can process a large number of potential stops.
  - As a user, I want to map columns from my uploaded file to relevant fields (address, city, state, name, auction date) so that the application correctly interprets my data.
  - As a user, I want the application to remember my column mapping preferences for future uploads.
- **UC-4: Filtering Addresses (Auction Date)**
  - As a user (e.g., real estate agent), I want to filter addresses from an uploaded file by auction date so that I can focus on properties relevant to a specific day.
- **UC-5: Map-Based Address Selection**
  - As a user, I want to see all uploaded/entered addresses plotted on a map so that I can visualize their geographic distribution.
  - As a user, I want to draw a shape (rectangle or lasso) on the map to select a group of addresses within that area for routing.
- **UC-6: Route Optimization & Navigation**
  - As a user, I want to click a button to get an optimized route for my selected start, destination, and waypoint addresses.
  - As a user, I want the optimized route to open in Google Maps in a new tab for easy navigation.
- **UC-7: Managing Addresses from File**
  - As a user, I want to select/deselect addresses from a list generated from an uploaded file.
  - As a user, I want to mark addresses from a file as "visited" to keep track of completed stops.
  - As a user, I want to copy selected addresses from the file list to my clipboard.

## 5. Features

### F-1: Address Input Module

- **F-1.1: Single Entry Tab:**
  - Input field for Start Address.
  - Dynamically addable input fields for destination addresses.
  - Button to add more destination fields.
  - Button to remove individual destination fields.
- **F-1.2: Paste List Tab:**
  - Textarea for pasting a list of addresses (one per line).
  - Button to confirm and transfer pasted addresses to the Single Entry tab fields.
- **F-1.3: Upload File Tab:**
  - File input for Excel (.xlsx, .xls) and CSV (.csv) files.
  - Dynamic column selection UI (Address, City, State, First Name, Last Name, Auction Date) based on uploaded file headers.
  - Persistence of column selection preset using `localStorage`.
  - Option to clear the saved preset.
  - Message area for feedback (e.g., "Addresses loaded", errors).

### F-2: Address Processing & Display (from File Upload)

- **F-2.1: Data Parsing:** Parses data from uploaded Excel/CSV.
- **F-2.2: Date Formatting:** Standardizes auction dates.
- **F-2.3: Geocoding:** Converts addresses to latitude/longitude coordinates using Google Geocoding API.
  - Geocoding results cached in `localStorage` to reduce API calls.
- **F-2.4: Auction Date Filter:** Dropdown to filter displayed addresses by unique auction dates found in the file.
- **F-2.5: Address List Display:**
  - Input for a custom Start Address (required if using file data).
  - Input for a custom End Address (optional).
  - Scrollable list of addresses from the file (excluding start/end if specified).
  - Each list item includes a checkbox, address, name (if available), and auction date (if available).
  - Visual indication for "visited" addresses (strikethrough, greyed out).
  - "Copy Selected" button: Copies checked addresses to clipboard.
  - "Mark Visited" button: Marks checked addresses as visited.

### F-3: Interactive Map Module (Leaflet.js)

- **F-3.1: Map Display:** Shows an OpenStreetMap base layer.
- **F-3.2: Marker Display:** Plots geocoded addresses from the active list (e.g., filtered file data) as markers.
  - Popups on markers showing address details (name, address, auction date).
- **F-3.3: Drawing Tools (Leaflet.Draw):**
  - Rectangle draw tool.
  - Polygon (lasso) draw tool.
  - Drawing a shape selects markers (and corresponding addresses in the list) within that shape.
- **F-3.4: Clear Selections:**
  - "CLEAR" button on the map to remove drawn shapes and deselect addresses.
- **F-3.5: Onboarding Tooltip:** A one-time tooltip pointing to the draw button for new users.

### F-4: Route Optimization Module

- **F-4.1: "Get Optimized Route" Button:** Triggers route calculation.
- **F-4.2: Backend Integration:** Sends selected addresses (start, waypoints, end) to an external API endpoint (`https://googlemaps-fastest-route-1.onrender.com/optimize-route`) for optimization.
- **F-4.3: Google Maps Redirection:** Constructs a Google Maps Directions URL with the optimized route order and opens it in a new browser tab.
- **F-4.4: Feedback:** Displays messages for success or failure of optimization.

### F-5: UI/UX

- **F-5.1: Layout:** Two-panel responsive layout (input on left, map on right; stacks vertically on smaller screens).
- **F-5.2: Styling:** Custom styling for a clean and modern interface. Uses Google Fonts (Montserrat, Inter).
- **F-5.3: User Feedback:** Clear messages for actions, errors, and statuses.

## 6. Design & UI/UX Considerations

- The application already has a defined visual style as per the HTML/CSS.
- **Clarity**: Ensure all interactive elements are clearly labeled and their purpose is obvious.
- **Feedback**: Provide immediate visual feedback for user actions (e.g., button clicks, file uploads, selection changes).
- **Error Handling**: Gracefully handle errors (e.g., file parsing errors, geocoding failures, API errors) and provide informative messages to the user.
- **Responsiveness**: Ensure usability across various screen sizes (desktop, tablet, mobile).
- **Accessibility**: While not explicitly detailed in the code, future considerations should include ARIA attributes and keyboard navigation.

## 7. Technical Considerations

- **Frontend**: HTML, CSS, JavaScript.
- **Libraries**:
  - `xlsx.full.min.js`: For parsing Excel and CSV files.
  - `Leaflet.js`: For interactive maps.
  - `Leaflet.Draw.js`: For drawing tools on the map.
- **APIs**:
  - Google Maps Geocoding API (API key is present in the frontend code - **Security Risk: This key should be moved to a backend proxy**).
  - External Route Optimization API: `https://googlemaps-fastest-route-1.onrender.com/optimize-route`.
- **Data Persistence**: `localStorage` is used for:
  - Geocoding cache (`geocodeCache`).
  - Column mapping preset for file uploads (`addressColPreset`).
  - Last used start address (`savedStartAddress`).
  - Flag for draw button tooltip (`drawButtonTooltipShown`).
- **Performance**:
  - Geocoding is done asynchronously with a small delay between requests to manage API rate limits.
  - Caching geocoded results helps improve performance for repeated addresses.

## 8. Success Metrics (Potential)

- Number of routes successfully optimized per day/week.
- Average number of stops per optimized route.
- User adoption rate (if tracking is implemented).
- Task completion rate (e.g., percentage of users who successfully get an optimized route after starting the process).
- Reduction in API errors for geocoding/routing.

## 9. Future Considerations / Potential Enhancements

- **Backend Proxy for API Keys**: Move Google API key usage to a backend to protect it.
- **User Accounts**: Allow users to save routes, preferences, and common addresses.
- **Advanced Route Options**:
  - Specify vehicle type.
  - Avoid tolls/highways.
  - Time windows for stops.
- **Route Saving & Sharing**: Allow users to save and share their optimized routes.
- **Real-time GPS Tracking Integration**: (Major feature) For live tracking of drivers.
- **Improved Error Handling & Reporting**: More detailed error messages and potentially a logging mechanism.
- **Internationalization (i18n)**: Support for multiple languages.
- **Enhanced Accessibility (a11y)**.
- **Direct Route Display on Map**: Instead of just opening Google Maps, display the optimized polyline on the Leaflet map itself.
- **Drag-and-Drop Reordering**: Allow manual reordering of stops in the list.
