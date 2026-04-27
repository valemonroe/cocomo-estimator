export type ESLOCInputs = {
  asloc: number; // legacy LOC
  dm: number; // %
  cm: number; // %
  im: number; // %
  aa: number; // % (0–8 typical)
  su: number; // % (0–50)
  unfm: number; // 0–1
};

export type CocomoInputs = {
  assumptions: {
    totalLoc: number; // total LOC to modernize (maps to ASLOC)

    // capacity baseline
    avgTotalFTE: number; // avg total internal R&D FTE pool (used with rdAllocation)

    // $/hr loaded internal blended rates
    fteRateLow: number;
    fteRateHigh: number;

    // planning assumptions
    scheduleMonths: number;
    rdAllocation: number; // 0–1 share of total R&D FTE capacity available to this project
    hoursPerMonth: number; // default 160

    contractorRateLow: number; // $/hr
    contractorRateHigh: number; // $/hr
  };

  esloc: ESLOCInputs;

  // Scale factors as numeric weights (your sheet uses direct numeric weights)
  scaleFactors: {
    prec: number;
    flex: number;
    resl: number;
    team: number;
    pmat: number;
  };

  // Effort multipliers as numeric multipliers
  effortMultipliers: {
    rely: number;
    data: number;
    cplx: number;
    ruse: number;
    docu: number;
    time: number;
    stor: number;
    pvol: number;
    acap: number;
    pcap: number;
    pcon: number;
    tool: number;
    site: number;
    sced: number;
  };

  calibration: {
    a: number; // COCOMO II A
    /**
     * Deprecated: Base B is fixed to 0.91 (COCOMO II Post-Architecture coefficient).
     * Kept optional for backward compatibility with older UI/state objects.
     */
    bBase?: number;
  };

  resources: {
    // Derived from assumptions; kept here so existing calc logic stays simple.
    // UI writes these fields from the Assumptions page.
    scheduleMonths: number;
    hoursPerPM: number;

    avgTotalFTE: number; // avg total R&D FTE available
    internalAllocation: number; // 0–1 (share allocated to project)

    // Rates are sourced from assumptions (kept for compatibility / explicitness)
    fteRateLow: number; // $/hr
    fteRateHigh: number; // $/hr
    contractorRateLow: number; // $/hr
    contractorRateHigh: number; // $/hr
  };
};

/**
 * Industry norm (assumed) annual working hours per resource.
 * Display this on the final step (per your requirement).
 */
export const HOURS_PER_YEAR = 1800;

/**
 * COCOMO II Post-Architecture Base B coefficient (fixed).
 * Requirement: Base B (default 0.91) is a coefficient and should not be user-editable.
 */
export const B_BASE = 0.91;

export function calcKSLOC(asloc: number): number {
  return asloc / 1000.0;
}

export function calcAAF(dm: number, cm: number, im: number): number {
  return 0.4 * dm + 0.3 * cm + 0.3 * im;
}

export function calcESLOCkSLOC(i: ESLOCInputs): number {
  // Excel: ESLOC = KSLOC * (AA + AAF*(1 + (0.02*SU*UNFM))) / 100
  const ksloc = calcKSLOC(i.asloc);
  const aaf = calcAAF(i.dm, i.cm, i.im);
  const reuseAdj = i.aa + aaf * (1 + 0.02 * i.su * i.unfm);
  return (ksloc * reuseAdj) / 100.0;
}

export function calcSumSF(sf: CocomoInputs["scaleFactors"]): number {
  return sf.prec + sf.flex + sf.resl + sf.team + sf.pmat;
}

export function calcExponentE(sumSF: number): number {
  // Excel: E = 0.91 + 0.01*ΣSF (Base B fixed to 0.91)
  return B_BASE + 0.01 * sumSF;
}

export function calcEMProduct(em: CocomoInputs["effortMultipliers"]): number {
  return Object.values(em).reduce((acc, v) => acc * v, 1);
}

export function calcPM(a: number, eslocKsloc: number, e: number, emProd: number): number {
  return a * Math.pow(eslocKsloc, e) * emProd;
}

export function round0(x: number): number {
  return Math.round(x);
}

export function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

export function calcAll(input: CocomoInputs) {
  const eslocKsloc = calcESLOCkSLOC(input.esloc);
  const sumSF = calcSumSF(input.scaleFactors);
  const e = calcExponentE(sumSF); // Base B locked to 0.91
  const emProd = calcEMProduct(input.effortMultipliers);
  const pm = calcPM(input.calibration.a, eslocKsloc, e, emProd);

  const schedule = input.resources.scheduleMonths;
  const hoursPerPM = input.resources.hoursPerPM;

  const internalFTE = Math.round(input.resources.avgTotalFTE * input.resources.internalAllocation);
  const internalPMDelivered = internalFTE * schedule;

  const contractPM = Math.max(0, pm - internalPMDelivered);
  const contractors = Math.ceil(contractPM / Math.max(1e-9, schedule));

  const contractHours = contractPM * hoursPerPM;
  const costLow = contractHours * input.resources.contractorRateLow;
  const costHigh = contractHours * input.resources.contractorRateHigh;

  // Internal cost (range) for the PM actually delivered internally
  const internalPMUsed = Math.min(pm, internalPMDelivered);
  const internalHours = internalPMUsed * hoursPerPM;
  const internalCostLow = internalHours * input.resources.fteRateLow;
  const internalCostHigh = internalHours * input.resources.fteRateHigh;

  const totalCostLow = internalCostLow + costLow;
  const totalCostHigh = internalCostHigh + costHigh;

  return {
    // model constants (for UI display)
    hoursPerYearAssumed: HOURS_PER_YEAR,
    baseBCoefficient: B_BASE,

    // core COCOMO outputs
    eslocKsloc,
    sumSF,
    exponentE: e,
    emProd,
    pm,

    // planning inputs echoed
    scheduleMonths: schedule,
    hoursPerPM,

    // internal capacity & cost
    internalFTE,
    internalPMDelivered,
    internalPMUsed,
    internalHours,
    internalCostLow,
    internalCostHigh,

    // contractor capacity & cost
    contractors, // non-FTEs in your framing
    contractPM,
    contractHours,
    costLow,
    costHigh,

    // totals
    totalCostLow,
    totalCostHigh,
  };
}