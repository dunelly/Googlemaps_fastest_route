// Node.js Express backend for route optimization

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = 3001;
const GOOGLE_API_KEY = 'AIzaSyD44WoKyp2KEAwe06d3PD2f93vn5T31fZo';

app.use(cors());
app.use(express.json());

app.post('/optimize-route', async (req, res) => {
  const { addresses } = req.body;
  if (!addresses || !Array.isArray(addresses) || addresses.length < 2) {
    return res.status(400).json({ error: 'Starting addresses required.' });
  }
  const start = addresses[0];
  const end = addresses[addresses.length - 1];
  const waypoints = addresses.slice(1, -1);

  const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(start)}&destination=${encodeURIComponent(end)}&waypoints=optimize:true|${waypoints.map(encodeURIComponent).join('|')}&key=${GOOGLE_API_KEY}`;
  console.log("Google Directions API URL:", directionsUrl);
  try {
    const response = await fetch(directionsUrl);
    const data = await response.json();
    console.log("Google Directions API response:", data);
    if (data.status !== "OK") {
      console.error("Directions API error:", data);
      return res.status(500).json({ error: data.status, details: data });
    }
    const order = data.routes[0].waypoint_order;
    res.json({ order });
  } catch (err) {
    console.error("Backend fetch error:", err);
    res.status(500).json({ error: 'Failed to fetch directions.', details: err.message });
  }
});

// --- Google Sheets CSV Proxy Endpoint ---
app.get('/fetch-google-sheet-csv', async (req, res) => {
  try {
    const { sheetId } = req.query;
    if (!sheetId || !/^[a-zA-Z0-9-_]+$/.test(sheetId)) {
      return res.status(400).json({ error: 'Invalid or missing sheetId' });
    }
    // Only allow Google Sheets IDs
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    // Fetch CSV from Google
    const response = await fetch(csvUrl);
    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch Google Sheet. Make sure it is shared as "Anyone with the link can view".' });
    }
    const csv = await response.text();

    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', 'text/csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Route optimizer backend running on port ${PORT}`);
});
