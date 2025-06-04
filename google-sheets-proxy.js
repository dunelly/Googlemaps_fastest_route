// google-sheets-proxy.js
// Simple Express server to proxy Google Sheets CSV export and add CORS headers

const express = require('express');
const fetch = require('node-fetch');
const app = express();

const PORT = process.env.PORT || 4001;

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
  console.log(`Google Sheets proxy server running on port ${PORT}`);
});
