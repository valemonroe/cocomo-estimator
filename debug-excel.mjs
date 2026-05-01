import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'Enento estimates with tweaks.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Get raw data including headers
const range = XLSX.utils.decode_range(worksheet['!ref']);
console.log('Sheet dimensions:', range);

// Try different header row approaches
console.log('\n=== Raw array format ===');
let jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
for (let i = 0; i < Math.min(50, jsonData.length); i++) {
  console.log(`Row ${i}:`, jsonData[i]);
}

console.log('\n=== All Sheet Names ===');
console.log(workbook.SheetNames);
