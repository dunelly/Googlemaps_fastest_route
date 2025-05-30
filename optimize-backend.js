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
    return res.status(400).json({ error: 'At least two addresses required.' });
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

app.listen(PORT, () => {
  console.log(`Route optimizer backend running on port ${PORT}`);
});
