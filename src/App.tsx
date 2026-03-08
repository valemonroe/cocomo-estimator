import React, { useMemo, useState } from "react";
import { defaults } from "./data/defaults";
// ===== V2 ADDITIONS START: range validation imports =====
import { RANGES, validateNumber } from "./data/ranges";
// ===== V2 ADDITIONS END: range validation imports =====
import { help, HelpEntry } from "./data/help";
import { CocomoInputs, calcAll, calcAAF, round0, round1, HOURS_PER_YEAR, B_BASE } from "./model/cocomo";
//import { CocomoInputs, calcAll, round0, round1, HOURS_PER_YEAR, B_BASE } from "./model/cocomo";
// ===== V3 ADDITIONS START: Excel export =====
import { exportEstimatorToExcel } from "./exportExcel";
// ===== V3 ADDITIONS END: Excel export =====

type Step = 0 | 1 | 2 | 3 | 4 | 5;
// V3 ADDITION — number formatting helper
const f3 = (n:number | undefined | null) =>
  n === undefined || n === null ? "" : Number(n).toFixed(3);
function fmtNum(x: number) {
  if (!Number.isFinite(x)) return "0";
  return x.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

function Pill({ impact }: { impact: string }) {
  const cls = impact.startsWith("Good")
    ? "pill good"
    : impact.startsWith("Bad")
      ? "pill bad"
      : "pill neutral";
  return <span className={cls}>{impact}</span>;
}

function HelpIcon({ entry }: { entry: HelpEntry }) {
  const ratings = entry.ratings ?? [];
  return (
    <span className="helpWrap" tabIndex={0}>
      <span className="helpBtn" aria-label="Help" title="Help">
        ?
      </span>
      <div className="tooltip" role="tooltip">
        <div className="tipTitle">{entry.title}</div>
        <p className="tipDesc">{entry.description}</p>

        {ratings.length > 0 ? (
          <table className="tipTable">
            <thead>
              <tr>
                <th>Rating</th>
                <th>Numeric</th>
                <th>Impact</th>
                <th>Meaning</th>
                <th>Example</th>
              </tr>
            </thead>
            <tbody>
              {ratings.map((r) => (
                <tr key={r.rating}>
                  <td style={{ fontWeight: 800 }}>{r.rating}</td>
                  <td>{r.numeric == null ? "n/a" : r.numeric.toFixed(2)}</td>
                  <td>
                    <Pill impact={r.impact} />
                  </td>
                  <td>{r.meaning}</td>
                  <td>{r.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {(entry.notes?.length ?? 0) > 0 ? (
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--wm-muted)" }}>
            {entry.notes!.map((n, idx) => (
              <div key={idx}>• {n}</div>
            ))}
          </div>
        ) : null}
      </div>
    </span>
  );
}
function NumField(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  helpKey?: string;
  rangeId?: string;
  formulaText?: React.ReactNode;
}) {
  const entry = props.helpKey ? help[props.helpKey] : undefined;

  const range = props.rangeId ? RANGES[props.rangeId] : undefined;

  const err =
    props.rangeId && range
      ? validateNumber(props.rangeId, props.value)
      : null;

  const handleChange = (raw: string) => {
    const value = Number(raw);
    props.onChange(value);
  };

  const handleBlur = () => {
    // keep value; error message guides correction
  };

  return (
    <div className="field">
      <div className="labelRow">
        <span className="labelText">{props.label}</span>
        {entry ? <HelpIcon entry={entry} /> : null}
      </div>

      {props.formulaText ? <FormulaText>{props.formulaText}</FormulaText> : null}

      <div style={{ display: "flex", flexDirection: "column" }}>
        <input
          className={`input ${err ? "inputError" : ""}`}
          type="number"
          value={Number.isFinite(props.value) ? props.value : 0}
          step={props.step ?? 1}
          min={range?.min}
          max={range?.max}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          aria-invalid={!!err}
        />

        {err ? <div className="errorMsg">{err}</div> : null}
      </div>
    </div>
  );
}

function FormulaText(props: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 4,
        fontSize: 12,
        lineHeight: 1.4,
        color: "var(--wm-muted)",
        whiteSpace: "pre-line",
      }}
    >
      {props.children}
    </div>
  );
}

function ReadOnlyField(props:{
  label:string
  value:string
  helpKey?:string
  formula?:React.ReactNode
}){

  const entry = props.helpKey ? help[props.helpKey] : undefined

  return(

    <div className="calcField">

      {/* LABEL + VALUE */}
      <div className="calcLabelRow">

        <div className="calcLabel">
          {props.label}
          {entry ? <HelpIcon entry={entry}/> : null}
        </div>

        <div className="calcValue">
          {props.value}
        </div>

      </div>

      {/* FORMULA / DESCRIPTION */}
      {props.formula &&
        <div className="calcFormula">
          {props.formula}
        </div>
      }

    </div>

  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function FormGrid({ count, children }: { count: number; children: React.ReactNode }) {
  const cls = count > 8 ? "formGrid twoCol" : "formGrid";
  return <div className={cls}>{children}</div>;
}

export default function App() {
  const [step, setStep] = useState<Step>(0);
  const [m, setM] = useState<CocomoInputs>(defaults);
  const r = useMemo(() => calcAll(m), [m]);

  const stepHasErrors = useMemo(() => {
    const checksByStep: Record<number, string[]> = {
      0: [
        "assumptions.totalLoc","assumptions.avgTotalFTE","assumptions.scheduleMonths","assumptions.rdAllocation",
        "assumptions.hoursPerMonth","assumptions.fteRateLow","assumptions.fteRateHigh","assumptions.contractorRateLow","assumptions.contractorRateHigh"
      ],
      1: ["esloc.asloc","esloc.dm","esloc.cm","esloc.im","esloc.aa","esloc.su","esloc.unfm"],
      2: ["scaleFactors.prec","scaleFactors.flex","scaleFactors.resl","scaleFactors.team","scaleFactors.pmat"],
      3: [
        "effortMultipliers.rely","effortMultipliers.data","effortMultipliers.cplx","effortMultipliers.ruse","effortMultipliers.docu",
        "effortMultipliers.time","effortMultipliers.stor","effortMultipliers.pvol","effortMultipliers.acap","effortMultipliers.pcap",
        "effortMultipliers.pcon","effortMultipliers.tool","effortMultipliers.site","effortMultipliers.sced"
      ],
      4: ["calibration.a"],
      5: []
    };

    const ids = checksByStep[step] ?? [];
    return ids.some((id) => validateNumber(id, (id.split(".").reduce((acc: any, k: string) => (acc == null ? undefined : acc[k]), m as any)) as number) != null);
  }, [m, step]);



  const steps: { title: string }[] = [
    { title: "1) Assumptions" },
    { title: "2) Size & ESLOC (Reuse)" },
    { title: "3) Scale Factors" },
    { title: "4) Effort Multipliers" },
    { title: "5) Calibration" },
    { title: "6) Results" },
  ];

  const next = () => setStep((s) => (Math.min(5, (s + 1) as Step) as Step));
  const prev = () => setStep((s) => (Math.max(0, (s - 1) as Step) as Step));

  const sfLabel = (code: "PREC" | "FLEX" | "RESL" | "TEAM" | "PMAT") =>
    `${help[code].title}`;

  const emLabel = (code: string) => help[code]?.title ?? code;

  return (
    <>
      <header className="wmHeader">
        <div className="wmHeaderInner">
          <img src="./wm-logo.png" alt="West Monroe" className="wmLogo" />
          <div className="wmTitle">
            <h1>COCOMO II Cost Model</h1>
            <p>Software Effort & Cost Estimation</p>
          </div>
        </div>
      </header>

      <div className="app">
        <div className="header">
          <div className="brand">
            <h1>COCOMO II Modernization Estimator V3</h1>
            <p>Modernization effort, staffing, and cost range using a COCOMO II-style model.</p>
          </div>
          <div className="stepBadge">
            Step {step + 1} / {steps.length}
          </div>
        </div>

        {step === 0 ? (
          <Section title={steps[0].title}>
            <FormGrid count={9}>
              <NumField
                label="Total legacy LOC to modernize"
                value={m.assumptions.totalLoc}
                onChange={(v) =>
                  setM({
                    ...m,
                    assumptions: { ...m.assumptions, totalLoc: v },
                    esloc: { ...m.esloc, asloc: v },
                  })
                }
                helpKey="totalLoc"
                rangeId="assumptions.totalLoc"
              />

              <NumField
                label="Total internal R&D FTE pool"
                value={m.assumptions.avgTotalFTE}
                onChange={(v) =>
                  setM({
                    ...m,
                    assumptions: { ...m.assumptions, avgTotalFTE: v },
                    resources: { ...m.resources, avgTotalFTE: v },
                  })
                }
                helpKey="avgTotalFTE"
                rangeId="assumptions.avgTotalFTE"
              />

              <NumField
                label="Project duration (months)"
                value={m.assumptions.scheduleMonths}
                onChange={(v) =>
                  setM({
                    ...m,
                    assumptions: { ...m.assumptions, scheduleMonths: v },
                    resources: { ...m.resources, scheduleMonths: v },
                  })
                }
                min={1}
                helpKey="scheduleMonths"
                rangeId="assumptions.scheduleMonths"
              />

              <NumField
                label="% of total R&D resources allocatable (0–1)"
                value={m.assumptions.rdAllocation}
                onChange={(v) =>
                  setM({
                    ...m,
                    assumptions: { ...m.assumptions, rdAllocation: v },
                    resources: { ...m.resources, internalAllocation: v },
                  })
                }
                step={0.01}
                min={0}
                max={1}
                helpKey="rdAllocation"
                rangeId="assumptions.rdAllocation"
              />

              <NumField
                label="Hours per month per resource"
                value={m.assumptions.hoursPerMonth}
                onChange={(v) =>
                  setM({
                    ...m,
                    assumptions: { ...m.assumptions, hoursPerMonth: v },
                    resources: { ...m.resources, hoursPerPM: v },
                  })
                }
                step={1}
                min={1}
                helpKey="hoursPerMonth"
                rangeId="assumptions.hoursPerMonth"
              />

              <NumField
                label="Internal FTE rate low ($/hr)"
                value={m.assumptions.fteRateLow}
                onChange={(v) =>
                  setM({
                    ...m,
                    assumptions: { ...m.assumptions, fteRateLow: v },
                    resources: { ...m.resources, fteRateLow: v },
                  })
                }
                step={1}
                min={0}
                helpKey="fteRateLow"
                rangeId="assumptions.fteRateLow"
              />

              <NumField
                label="Internal FTE rate high ($/hr)"
                value={m.assumptions.fteRateHigh}
                onChange={(v) =>
                  setM({
                    ...m,
                    assumptions: { ...m.assumptions, fteRateHigh: v },
                    resources: { ...m.resources, fteRateHigh: v },
                  })
                }
                step={1}
                min={0}
                helpKey="fteRateHigh"
                rangeId="assumptions.fteRateHigh"
              />

              <NumField
                label="Contractor rate low ($/hr)"
                value={m.assumptions.contractorRateLow}
                onChange={(v) =>
                  setM({
                    ...m,
                    assumptions: { ...m.assumptions, contractorRateLow: v },
                    resources: { ...m.resources, contractorRateLow: v },
                  })
                }
                step={1}
                min={0}
                helpKey="contractorRateLow"
                rangeId="assumptions.contractorRateLow"
              />

              <NumField
                label="Contractor rate high ($/hr)"
                value={m.assumptions.contractorRateHigh}
                onChange={(v) =>
                  setM({
                    ...m,
                    assumptions: { ...m.assumptions, contractorRateHigh: v },
                    resources: { ...m.resources, contractorRateHigh: v },
                  })
                }
                step={1}
                min={0}
                helpKey="contractorRateHigh"
                rangeId="assumptions.contractorRateHigh"
              />
            </FormGrid>

            <hr className="hr" />
            <div style={{ color: "var(--wm-muted)", fontSize: 13 }}>
              Hover the <b>?</b> next to an input to see recommended ranges and the rating-name → numeric scale.
            </div>

          </Section>
        ) : null}

        {step === 1 ? (
          <Section title={steps[1].title}>
            <FormGrid count={7}>
              <NumField
                label="Legacy LOC (ASLOC)"
                value={m.esloc.asloc}
                onChange={(v) =>
                  setM({
                    ...m,
                    esloc: { ...m.esloc, asloc: v },
                    assumptions: { ...m.assumptions, totalLoc: v },
                  })
                }
                helpKey="asloc"
                rangeId="esloc.asloc"
              />
              <NumField label="Design Modified % (DM)" value={m.esloc.dm} onChange={(v) => setM({ ...m, esloc: { ...m.esloc, dm: v } })} step={0.1} min={0} max={100} helpKey="dm" rangeId="esloc.dm" />
              <NumField label="Code Modified % (CM)" value={m.esloc.cm} onChange={(v) => setM({ ...m, esloc: { ...m.esloc, cm: v } })} step={0.1} min={0} max={100} helpKey="cm" rangeId="esloc.cm" />
              <NumField label="Integration Modified % (IM)" value={m.esloc.im} onChange={(v) => setM({ ...m, esloc: { ...m.esloc, im: v } })} step={0.1} min={0} max={100} helpKey="im" rangeId="esloc.im" />
              <NumField label="Assessment & Assimilation % (AA)" value={m.esloc.aa} onChange={(v) => setM({ ...m, esloc: { ...m.esloc, aa: v } })} step={0.1} min={0} helpKey="aa" rangeId="esloc.aa" />
              <NumField label="Software Understanding % (SU)" value={m.esloc.su} onChange={(v) => setM({ ...m, esloc: { ...m.esloc, su: v } })} step={0.1} min={0} helpKey="su" rangeId="esloc.su" />
              <NumField label="Programmer Unfamiliarity (UNFM) 0–1" value={m.esloc.unfm} onChange={(v) => setM({ ...m, esloc: { ...m.esloc, unfm: v } })} step={0.01} min={0} max={1} helpKey="unfm" rangeId="esloc.unfm" />
            </FormGrid>

            <hr className="hr" />

                  <ReadOnlyField
                  label="Adaptation Adjustment Factor (AAF)"
                  value={fmtNum(calcAAF(m.esloc.dm,m.esloc.cm,m.esloc.im))}
                  formula={
                  <>
                  The AAF is a weighted percentage of the modifications.

                  AAF = (0.4 × DM) + (0.3 × CM) + (0.3 × IM)
                  </>
                  }
                  />
            <div style={{ fontWeight: 900, color: "var(--wm-navy)" }}>
                  <ReadOnlyField
                  label="Equivalent Source Lines of Code (ESLOC)"
                  value={`${fmtNum(r.eslocKsloc)} KSLOC`}
                  formula={
                  <>
                  ESLOC = KSLOC × [AA + AAF × (1 + (0.02 × SU × UNFM))] / 100
                  </>
                  }
                  />
            </div>

          </Section>
        ) : null}

        {step === 2 ? (
          <Section title={steps[2].title}>
            <div style={{ color: "var(--wm-muted)", fontSize: 13, marginBottom: 10 }}>
              Use the numeric weights for scale factors. Higher weights increase effort.
            </div>
            <FormGrid count={6}>
              <NumField label={sfLabel("PREC")} value={m.scaleFactors.prec} onChange={(v) => setM({ ...m, scaleFactors: { ...m.scaleFactors, prec: v } })} step={0.01} helpKey="PREC" rangeId="scaleFactors.prec" />
              <NumField label={sfLabel("FLEX")} value={m.scaleFactors.flex} onChange={(v) => setM({ ...m, scaleFactors: { ...m.scaleFactors, flex: v } })} step={0.01} helpKey="FLEX" rangeId="scaleFactors.flex" />
              <NumField label={sfLabel("RESL")} value={m.scaleFactors.resl} onChange={(v) => setM({ ...m, scaleFactors: { ...m.scaleFactors, resl: v } })} step={0.01} helpKey="RESL" rangeId="scaleFactors.resl" />
              <NumField label={sfLabel("TEAM")} value={m.scaleFactors.team} onChange={(v) => setM({ ...m, scaleFactors: { ...m.scaleFactors, team: v } })} step={0.01} helpKey="TEAM" rangeId="scaleFactors.team" />
              <NumField label={sfLabel("PMAT")} value={m.scaleFactors.pmat} onChange={(v) => setM({ ...m, scaleFactors: { ...m.scaleFactors, pmat: v } })} step={0.01} helpKey="PMAT" rangeId="scaleFactors.pmat" />

              {/* Base B locked */}
              <ReadOnlyField
                label={`${help["B"].title} (Constant)`}
                value={B_BASE.toFixed(2)}
                helpKey="B"
              />
            </FormGrid>

            <hr className="hr" />
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <FormGrid count={2}>

                <ReadOnlyField
                label="Σ Scale Factors (ΣSF)"
                value={fmtNum(r.sumSF)}
                formula={
                <>
                Sum of the five scale factor weights.

                ΣSF = PREC + FLEX + RESL + TEAM + PMAT
                </>
                }
                />

                <ReadOnlyField
                label="Exponent E"
                value={fmtNum(r.exponentE)}
                formula={
                <>
                Effort exponent used in the COCOMO II effort equation.

                E = B + (0.01 × ΣSF)

                B = 0.91
                </>
                }
                />

                </FormGrid>
            </div>
          </Section>
        ) : null}

        {step === 3 ? (
          <Section title={steps[3].title}>
            <div style={{ color: "var(--wm-muted)", fontSize: 13, marginBottom: 10 }}>
              Enter the numeric effort multiplier (EM). Values &lt; 1 reduce effort; values &gt; 1 increase effort.
            </div>

            {(() => {
              const fields: { key: keyof CocomoInputs["effortMultipliers"]; code: string }[] = [
                { key: "rely", code: "RELY" },
                { key: "data", code: "DATA" },
                { key: "cplx", code: "CPLX" },
                { key: "ruse", code: "RUSE" },
                { key: "docu", code: "DOCU" },
                { key: "time", code: "TIME" },
                { key: "stor", code: "STOR" },
                { key: "pvol", code: "PVOL" },
                { key: "acap", code: "ACAP" },
                { key: "pcap", code: "PCAP" },
                { key: "pcon", code: "PCON" },
                { key: "tool", code: "TOOL" },
                { key: "site", code: "SITE" },
                { key: "sced", code: "SCED" },
              ];

              return (
                <>
                  <FormGrid count={fields.length}>
                    {fields.map((f) => (
                      <NumField
                        key={f.key}
                        label={emLabel(f.code)}
                        value={m.effortMultipliers[f.key]}
                        onChange={(v) => setM({ ...m, effortMultipliers: { ...m.effortMultipliers, [f.key]: v } })}
                        step={0.01}
                        helpKey={f.code}
                        rangeId={`effortMultipliers.${f.key}`}
                      />
                    ))}
                  </FormGrid>

                  <hr className="hr" />
                  <div style={{ fontWeight: 900, color: "var(--wm-navy)" }}>ΠEM: {fmtNum(r.emProd)}</div>
                </>
              );
            })()}
          </Section>
        ) : null}

        {step === 4 ? (
          <Section title={steps[4].title}>
            <FormGrid count={1}>
              <NumField
                label="COCOMO II A"
                value={m.calibration.a}
                onChange={(v) => setM({ ...m, calibration: { ...m.calibration, a: v } })}
                step={0.01}
                helpKey="A"
                rangeId="calibration.a"
              />
            </FormGrid>

            <hr className="hr" />
            <div style={{ fontWeight: 900, color: "var(--wm-navy)", fontSize: 18 }}>
              Total Effort (PM): {fmtNum(round0(r.pm))}
            </div>
          </Section>
        ) : null}

        {step === 5 ? (
          <Section title={steps[5].title}>
            <div className="kpis">
              <div className="kpi">
                <div className="k">Equivalent Size</div>
                <div className="v">{fmtNum(round1(r.eslocKsloc))} KSLOC</div>
                <div className="s">From reuse/modernization</div>
              </div>
              <div className="kpi">
                <div className="k">Total Effort</div>
                <div className="v">{fmtNum(round0(r.pm))} PM</div>
                <div className="s">A × KSLOC^E × ΠEM</div>
              </div>
              <div className="kpi">
                <div className="k">Schedule</div>
                <div className="v">{fmtNum(r.scheduleMonths)} mo</div>
                <div className="s">Assumptions</div>
              </div>
            </div>

            <hr className="hr" />

            <FormGrid count={9}>
              <div className="kpi">
                <div className="k">Internal FTEs Applied</div>
                <div className="v">{fmtNum(r.internalFTE)}</div>
                <div className="s">round(total FTE × allocation)</div>
              </div>
              <div className="kpi">
                <div className="k">Non-FTEs (Contractors)</div>
                <div className="v">{fmtNum(r.contractors)}</div>
                <div className="s">To cover remaining PM</div>
              </div>
              <div className="kpi">
                <div className="k">Total Dev Hours</div>
                <div className="v">{fmtNum(round0(r.pm * r.hoursPerPM))}</div>
                <div className="s">PM × hours/month</div>
              </div>

              {/* Hours/year display (industry norm) */}
              <div className="kpi">
                <div className="k">Assumed Hours / Year</div>
                <div className="v">{fmtNum(HOURS_PER_YEAR)}</div>
                <div className="s">Industry norm</div>
              </div>

              <div className="kpi">
                <div className="k">Internal Cost (Low–High)</div>
                <div className="v">
                  ${fmtNum(round0(r.internalCostLow))} – ${fmtNum(round0(r.internalCostHigh))}
                </div>
                <div className="s">Internal hourly rate range</div>
              </div>
              <div className="kpi">
                <div className="k">Contract Cost (Low–High)</div>
                <div className="v">
                  ${fmtNum(round0(r.costLow))} – ${fmtNum(round0(r.costHigh))}
                </div>
                <div className="s">Contractor hourly rate range</div>
              </div>
              <div className="kpi">
                <div className="k">Total Cost (Low–High)</div>
                <div className="v">
                  ${fmtNum(round0(r.totalCostLow))} – ${fmtNum(round0(r.totalCostHigh))}
                </div>
                <div className="s">Internal + contractor</div>
              </div>
            </FormGrid>
          </Section>
        ) : null}

        <div className="footerNav">
          <button className="btn" onClick={prev} disabled={step === 0}>
            Back
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            {/* ===== V3 ADDITIONS START: Export button (Final Step only) ===== */}
            {step === 5 ? (
              <button className="btn" onClick={() => exportEstimatorToExcel(m)}>
                Export to Excel
              </button>
            ) : null}
            {/* ===== V3 ADDITIONS END: Export button (Final Step only) ===== */}
            <button
              className="btn"
              onClick={() => {
                setM(defaults);
                setStep(0);
              }}
            >
              Reset
            </button>
            <button className="btn primary" onClick={next} disabled={step === 5 || stepHasErrors}>
              Next
            </button>
          </div>
        </div>

        <footer className="wmFooter">
          <div className="wmFooterInner">
            <img src="./wm-logo.png" alt="West Monroe" className="wmLogoFooter" />
            <span>© {new Date().getFullYear()} West Monroe Partners</span>
          </div>
        </footer>
      </div>
    </>
  );
}