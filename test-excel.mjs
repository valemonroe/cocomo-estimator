import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'Enento estimates with tweaks.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const jsonData = XLSX.utils.sheet_to_json(worksheet);

console.log('Sheet name:', sheetName);
console.log('Number of rows:', jsonData.length);
console.log('\n=== First 15 Rows ===');
for (let i = 0; i < Math.min(15, jsonData.length); i++) {
  console.log(`Row ${i}:`, JSON.stringify(jsonData[i]));
}
