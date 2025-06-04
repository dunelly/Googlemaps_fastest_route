// inspect-excel.js
// Usage: node inspect-excel.js "Drew Main list - PRE-FORECLOSURE FEB-MARCH 2025 PT.2.xlsx"

const XLSX = require('xlsx');
const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node inspect-excel.js <filename.xlsx>');
  process.exit(1);
}

try {
  const workbook = XLSX.readFile(file);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

  // Print headers and first 20 rows for inspection
  console.log('Headers:', rows[0]);
  for (let i = 1; i <= 20 && i < rows.length; i++) {
    console.log(rows[i]);
  }

  // Print unique auction dates (if any column contains "auction" in header)
  const headerRow = rows[0].map(h => (h || '').toString().toLowerCase());
  const auctionColIdx = headerRow.findIndex(h => h.includes('auction'));
  if (auctionColIdx !== -1) {
    const auctionDates = new Set();
    for (let i = 1; i < rows.length; i++) {
      const val = rows[i][auctionColIdx];
      if (val && val.trim && val.trim() !== '') auctionDates.add(val.trim());
    }
    console.log('Unique auction dates:', Array.from(auctionDates));
  } else {
    console.log('No auction date column found.');
  }
} catch (err) {
  console.error('Error reading Excel file:', err);
  process.exit(1);
}
