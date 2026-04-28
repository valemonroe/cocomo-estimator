/**
 * ranges.ts
 * Centralized min/max validation rules for ALL numeric inputs.
 *
 * Notes:
 * - Effort Multipliers (EM) and Scale Factors (SF) bounds are aligned to standard
 *   COCOMO II Post-Architecture published ranges (numeric multiplier/weight bounds).
 * - Assumptions + ESLOC reuse bounds are “realistic guardrails” for production usage.
 */

export type RangeRule = {
  min: number;
  max: number;
  units?: string;
  note?: string;
};

export const RANGES: Record<string, RangeRule> = {
  // -----------------------------
  // Assumptions (planning / cost)
  // -----------------------------
  "assumptions.totalLoc": { min: 1, max: 10_000_000, units: "LOC" },
  "assumptions.avgTotalFTE": { min: 0, max: 10_000, units: "FTE" },
  "assumptions.scheduleMonths": { min: 1, max: 120, units: "months" },
  "assumptions.rdAllocation": { min: 0, max: 100, units: "%" },

  // Industry norm: 2,080 hrs/year ≈ 173.3 hrs/month; keep a practical band.
  "assumptions.hoursPerMonth": {
    min: 120,
    max: 200,
    units: "hrs/month",
    note: "2,080 hrs/year ≈ 173.3 hrs/month",
  },

  "assumptions.fteRateLow": { min: 0, max: 500, units: "$/hr" },
  "assumptions.fteRateHigh": { min: 0, max: 500, units: "$/hr" },
  "assumptions.contractorRateLow": { min: 0, max: 500, units: "$/hr" },
  "assumptions.contractorRateHigh": { min: 0, max: 500, units: "$/hr" },

  // -----------------------------
  // ESLOC / Reuse (COCOMO II reuse model inputs)
  // -----------------------------
  "esloc.asloc": { min: 1, max: 10_000_000, units: "LOC" },
  "esloc.dm": { min: 0, max: 100, units: "%" },
  "esloc.cm": { min: 0, max: 100, units: "%" },
  "esloc.im": { min: 0, max: 100, units: "%" },

  // Typical bounds used in practice
  "esloc.aa": { min: 0, max: 8, units: "%" },
  "esloc.su": { min: 0, max: 50, units: "%" },
  "esloc.unfm": { min: 0, max: 1, units: "0–1" },

  // -----------------------------
  // Scale Factors (numeric weights) — Post-Architecture bounds
  // -----------------------------
  "scaleFactors.prec": { min: 0.00, max: 6.20 },
  "scaleFactors.flex": { min: 0.00, max: 5.07 },
  "scaleFactors.resl": { min: 0.00, max: 7.07 },
  "scaleFactors.team": { min: 0.00, max: 5.48 },
  "scaleFactors.pmat": { min: 0.00, max: 7.80 },

  // -----------------------------
  // Effort Multipliers (numeric multipliers) — Post-Architecture bounds
  // -----------------------------
  "effortMultipliers.rely": { min: 0.82, max: 1.26 },
  "effortMultipliers.data": { min: 0.90, max: 1.28 },
  "effortMultipliers.cplx": { min: 0.73, max: 1.74 },
  "effortMultipliers.ruse": { min: 0.95, max: 1.24 },
  "effortMultipliers.docu": { min: 0.81, max: 1.23 },
  "effortMultipliers.time": { min: 1.00, max: 1.63 },
  "effortMultipliers.stor": { min: 1.00, max: 1.46 },
  "effortMultipliers.pvol": { min: 0.87, max: 1.30 },
  "effortMultipliers.acap": { min: 0.71, max: 1.42 },
  "effortMultipliers.pcap": { min: 0.76, max: 1.34 },
  "effortMultipliers.pcon": { min: 0.81, max: 1.29 },
  "effortMultipliers.tool": { min: 0.78, max: 1.17 },
  "effortMultipliers.site": { min: 0.80, max: 1.22 },
  "effortMultipliers.sced": { min: 1.00, max: 1.43 },

  // -----------------------------
  // Calibration
  // -----------------------------
  "calibration.a": { min: 1.0, max: 5.0 },
  "calibration.bBase": { min: 0.80, max: 1.20 },
};

export function getRange(id: string): RangeRule | undefined {
  return RANGES[id];
}

export function validateNumber(id: string, value: number): string | null {
  const rule = RANGES[id];
  if (!rule) return null;

  if (!Number.isFinite(value)) {
    return `Enter a number in the valid range: ${rule.min}–${rule.max}${rule.units ? ` ${rule.units}` : ""}.`;
  }

  if (value < rule.min || value > rule.max) {
    const u = rule.units ? ` ${rule.units}` : "";
    const note = rule.note ? ` (${rule.note})` : "";
    return `Valid range: ${rule.min}–${rule.max}${u}. ${rule.note ? rule.note : ""}`.trim();
  }

  return null;
}

// Utility: safe deep-get for "a.b.c" paths
export function getByPath(obj: any, path: string): any {
  return path.split(".").reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);
}