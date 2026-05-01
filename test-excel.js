const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Enento estimates with tweaks.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const jsonData = XLSX.utils.sheet_to_json(worksheet);

console.log('Sheet name:', sheetName);
console.log('Number of rows:', jsonData.length);
console.log('\n=== Column Headers ===');
if (jsonData.length > 0) {
  console.log(Object.keys(jsonData[0]));
  console.log('\n=== First Row Data ===');
  console.log(JSON.stringify(jsonData[0], null, 2));
}
