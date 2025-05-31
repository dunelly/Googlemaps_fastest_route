const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('Harris County Data.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const headers = rows[0];
  const previewRows = rows.slice(0, 10);
  console.log('Headers:', headers);
  console.log('First 10 rows:', previewRows);
} catch (err) {
  console.error('Error reading Excel file:', err);
}
