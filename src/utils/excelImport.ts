import * as XLSX from 'xlsx';
import { CocomoInputs } from '../model/cocomo';

/**
 * Parse Excel file and extract COCOMO input data from xlsx
 * Maps Excel columns to CocomoInputs structure for steps 1-5
 */
export async function parseExcelFile(file: File): Promise<CocomoInputs> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) {
          throw new Error('Failed to read file');
        }
        console.log(`File read successfully: ${file.name}`);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0]; // Get first sheet
        const worksheet = workbook.Sheets[sheetName];

        // Convert sheet to array format (handles the 3-column layout)
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // Parse the raw data to CocomoInputs
        const inputs = parseExcelData(rawData);
        resolve(inputs);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse raw array data from Excel and map to CocomoInputs
 * The Excel file has a 3-column layout:
 * Column A: Field name (e.g., "Total LOC", "DM", "PREC", etc.)
 * Column B: Value (the numeric or text value)
 * Column C: Notes (unit or description)
 */
function parseExcelData(rawData: any[][]): CocomoInputs {
  if (!rawData || rawData.length === 0) {
    throw new Error('Excel file is empty');
  }

  // Build a map from field names to values by scanning the array
  const fieldMap = new Map<string, number>();

  for (const row of rawData) {
    if (!row || row.length < 2) continue;
    
    const fieldName = String(row[0] || '').trim();
    const value = row[1];

    // Skip empty rows or headers
    if (!fieldName || fieldName === 'Field' || fieldName === 'Value' || fieldName === 'Notes') continue;

    // Parse the numeric value
    const numValue = Number(value);
    if (Number.isFinite(numValue)) {
      fieldMap.set(fieldName, numValue);
      console.log(`Mapped field: "${fieldName}" -> ${numValue}`);
    }
  }

  // Helper function to safely get a value from the map
  const getVal = (fieldNames: string[], defaultVal: number): number => {
    for (const name of fieldNames) {
      if (fieldMap.has(name)) {
        const val = fieldMap.get(name)!;
        console.log(`Retrieved: "${name}" -> ${val}`);
        return val;
      }
    }
    console.log(`Using default for [${fieldNames.join(', ')}]: ${defaultVal}`);
    return defaultVal;
  };

  // Step 1: Assumptions & ASLOC
  const totalLoc = getVal(['Total LOC', 'ASLOC', 'total_loc', 'asloc'], 800_000);
  const avgTotalFTE = getVal(['Avg Total R&D FTE Pool', 'Total Internal FTE Pool', 'avgTotalFTE', 'total_fte'], 20);
  const scheduleMonths = getVal(['Schedule (months)', 'schedule', 'Schedule'], 18);
  const rdAllocation = getVal(['R&D Allocation', 'rdAllocation', 'allocation'], 0.50); // In decimal form from Excel
  const hoursPerMonth = getVal(['Hours per Month', 'hoursPerMonth', 'hours_per_month'], 152);
  const fteRateLow = getVal(['FTE Rate Low', 'fteRateLow', 'fte_rate_low'], 90);
  const fteRateHigh = getVal(['FTE Rate High', 'fteRateHigh', 'fte_rate_high'], 140);
  const contractorRateLow = getVal(['Contractor Rate Low', 'contractorRateLow', 'contractor_rate_low'], 50);
  const contractorRateHigh = getVal(['Contractor Rate High', 'contractorRateHigh', 'contractor_rate_high'], 75);

  // Step 2: ESLOC (Reuse/Adaptation)
  const dm = getVal(['DM', 'Design Modified'], 15);
  const cm = getVal(['CM', 'Code Modified'], 20);
  const im = getVal(['IM', 'Integration Modified'], 15);
  const aa = getVal(['AA', 'Assessment & Assimilation'], 1.5);
  const su = getVal(['SU', 'Software Understanding'], 15);
  const unfm = getVal(['UNFM', 'Unfamiliarity'], 0.3);

  // Step 3: Scale Factors
  const prec = getVal(['PREC', 'Precedentedness'], 2.48);
  const flex = getVal(['FLEX', 'Flexibility'], 2.03);
  const resl = getVal(['RESL', 'Resolution'], 2.83);
  const team = getVal(['TEAM', 'Team Cohesion'], 2.19);
  const pmat = getVal(['PMAT', 'Process Maturity'], 3.12);

  // Step 4: Effort Multipliers
  const rely = getVal(['RELY', 'Reliability'], 1.0);
  const data = getVal(['DATA', 'Database Size'], 1.0);
  const cplx = getVal(['CPLX', 'Complexity'], 1.0);
  const ruse = getVal(['RUSE', 'Reusability'], 1.0);
  const docu = getVal(['DOCU', 'Documentation'], 1.0);
  const time = getVal(['TIME', 'Time Constraint'], 1.0);
  const stor = getVal(['STOR', 'Storage'], 1.0);
  const pvol = getVal(['PVOL', 'Platform Volatility'], 1.0);
  const acap = getVal(['ACAP', 'Analyst Capability'], 1.0);
  const pcap = getVal(['PCAP', 'Programmer Capability'], 1.0);
  const pcon = getVal(['PCON', 'Personnel Continuity'], 1.0);
  const tool = getVal(['TOOL', 'Tools'], 1.0);
  const site = getVal(['SITE', 'Multisite'], 1.0);
  const sced = getVal(['SCED', 'Schedule'], 1.0);

  // Step 5: Calibration
  const a = getVal(['A', 'Calibration A'], 2.94);
  const bBase = getVal(['B', 'Calibration B'], 0.91);

  return {
    assumptions: {
      totalLoc,
      avgTotalFTE,
      fteRateLow,
      fteRateHigh,
      scheduleMonths,
      rdAllocation,
      hoursPerMonth,
      contractorRateLow,
      contractorRateHigh,
    },
    esloc: {
      asloc: totalLoc,
      dm,
      cm,
      im,
      aa,
      su,
      unfm,
    },
    scaleFactors: {
      prec,
      flex,
      resl,
      team,
      pmat,
    },
    effortMultipliers: {
      rely,
      data,
      cplx,
      ruse,
      docu,
      time,
      stor,
      pvol,
      acap,
      pcap,
      pcon,
      tool,
      site,
      sced,
    },
    calibration: {
      a,
      bBase,
    },
    resources: {
      scheduleMonths,
      hoursPerPM: hoursPerMonth,
      avgTotalFTE,
      internalAllocation: rdAllocation, // Already in 0-1 format from Excel
      fteRateLow,
      fteRateHigh,
      contractorRateLow,
      contractorRateHigh,
    },
  };
}
