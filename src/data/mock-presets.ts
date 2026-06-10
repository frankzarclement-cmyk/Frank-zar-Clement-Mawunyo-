// Vector design representations for high-fidelity interactive simulation trials
export const MOCK_CHECKLIST_GOOD = `data:image/svg+xml;utf8,` + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500" style="background:#ffffff; font-family: 'Courier New', Courier, monospace; color:#334155; padding:20px; box-sizing:border-box; border:6px double #475569;">
  <!-- Header -->
  <rect x="5" y="5" width="350" height="60" fill="#f1f5f9" stroke="#475569" stroke-width="2"/>
  <text x="20" y="30" font-size="14" font-weight="bold" fill="#0f172a">STARSTEEL 5S AUDITING</text>
  <text x="20" y="48" font-size="11" font-weight="bold" fill="#2563eb">1S SORT DAILY PERFORMANCE CARD</text>

  <!-- Metadata Grid -->
  <text x="15" y="90" font-size="10" font-weight="bold">AUDITOR: J. Clement</text>
  <text x="15" y="105" font-size="10" font-weight="bold">EMAIL: frankzarclement@gmail.com</text>
  <text x="15" y="120" font-size="10" font-weight="bold">ZONE: MECHANICAL DEVELOPMENT - ZONE -4</text>
  <line x1="15" y1="130" x2="345" y2="130" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3,3"/>

  <!-- Items and scores -->
  <text x="15" y="155" font-size="10" font-weight="bold" fill="#1e293b">1. Sorting Unnecessary Items (sortingUnnecessary)</text>
  <text x="310" y="155" font-size="12" font-weight="bold" fill="#15803d">[ 5 ]</text>

  <text x="15" y="200" font-size="10" font-weight="bold" fill="#1e293b">2. Aisles &amp; Doorways Clear (clearAisles)</text>
  <text x="310" y="200" font-size="12" font-weight="bold" fill="#15803d">[ 5 ]</text>

  <text x="15" y="245" font-size="10" font-weight="bold" fill="#1e293b">3. Material &amp; Tool Organization (storageLabels)</text>
  <text x="310" y="245" font-size="12" font-weight="bold" fill="#15803d">[ 4 ]</text>

  <text x="15" y="290" font-size="10" font-weight="bold" fill="#1e293b">4. Bin Disposal/Waste Segregation (binDisposal)</text>
  <text x="310" y="290" font-size="12" font-weight="bold" fill="#15803d">[ 4 ]</text>

  <text x="15" y="335" font-size="10" font-weight="bold" fill="#1e293b">5. Safety Hazard Mitigation/Sorting (safetyHazards)</text>
  <text x="310" y="335" font-size="12" font-weight="bold" fill="#15803d">[ 5 ]</text>

  <line x1="15" y1="365" x2="345" y2="365" stroke="#475569" stroke-width="2"/>

  <!-- Aggregate values -->
  <text x="15" y="390" font-size="12" font-weight="bold" fill="#0f172a">TOTAL SCORE: 23 / 25</text>
  <text x="15" y="410" font-size="13" font-weight="bold" fill="#16a34a">1S COMPLIANCE PERFORMANCE: 92.0%</text>

  <!-- Visual stamps -->
  <circle cx="280" cy="410" r="30" fill="none" stroke="#16a34a" stroke-width="3" stroke-dasharray="2,2"/>
  <text x="260" y="414" font-size="11" font-weight="bold" fill="#16a34a">PASSED</text>

  <text x="15" y="445" font-size="8" fill="#64748b">* Auto-aligned check of writings. Verify digital records in app.</text>
</svg>
`);

export const MOCK_CHECKLIST_POOR = `data:image/svg+xml;utf8,` + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500" style="background:#ffffff; font-family: 'Courier New', Courier, monospace; color:#334155; padding:20px; box-sizing:border-box; border:6px double #9f1239;">
  <!-- Header -->
  <rect x="5" y="5" width="350" height="60" fill="#fff1f2" stroke="#9f1239" stroke-width="2"/>
  <text x="20" y="30" font-size="14" font-weight="bold" fill="#9f1239">STARSTEEL 5S AUDITING</text>
  <text x="20" y="48" font-size="11" font-weight="bold" fill="#e11d48">1S SORT DAILY PERFORMANCE CARD</text>

  <!-- Metadata Grid -->
  <text x="15" y="90" font-size="10" font-weight="bold">AUDITOR: J. Clement</text>
  <text x="15" y="105" font-size="10" font-weight="bold">EMAIL: frankzarclement@gmail.com</text>
  <text x="15" y="120" font-size="10" font-weight="bold">ZONE: ECR ROOM ZONE -7</text>
  <line x1="15" y1="130" x2="345" y2="130" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3,3"/>

  <!-- Items and scores -->
  <text x="15" y="155" font-size="10" font-weight="bold" fill="#1e293b">1. Sorting Unnecessary Items (sortingUnnecessary)</text>
  <text x="310" y="155" font-size="12" font-weight="bold" fill="#b91c1c">[ 2 ]</text>

  <text x="15" y="200" font-size="10" font-weight="bold" fill="#1e293b">2. Aisles &amp; Doorways Clear (clearAisles)</text>
  <text x="310" y="200" font-size="12" font-weight="bold" fill="#b91c1c">[ 3 ]</text>

  <text x="15" y="245" font-size="10" font-weight="bold" fill="#1e293b">3. Material &amp; Tool Organization (storageLabels)</text>
  <text x="310" y="245" font-size="12" font-weight="bold" fill="#b91c1c">[ 2 ]</text>

  <text x="15" y="290" font-size="10" font-weight="bold" fill="#1e293b">4. Bin Disposal/Waste Segregation (binDisposal)</text>
  <text x="310" y="290" font-size="12" font-weight="bold" fill="#b91c1c">[ 3 ]</text>

  <text x="15" y="335" font-size="10" font-weight="bold" fill="#1e293b">5. Safety Hazard Mitigation/Sorting (safetyHazards)</text>
  <text x="310" y="335" font-size="12" font-weight="bold" fill="#b91c1c">[ 3 ]</text>

  <line x1="15" y1="365" x2="345" y2="365" stroke="#9f1239" stroke-width="2"/>

  <!-- Aggregate values -->
  <text x="15" y="390" font-size="12" font-weight="bold" fill="#0f172a">TOTAL SCORE: 13 / 25</text>
  <text x="15" y="410" font-size="13" font-weight="bold" fill="#e11d48">1S COMPLIANCE PERFORMANCE: 52.0%</text>

  <!-- Visual stamps -->
  <circle cx="280" cy="410" r="30" fill="none" stroke="#e11d48" stroke-width="3" stroke-dasharray="2,2"/>
  <text x="255" y="414" font-size="9" font-weight="bold" fill="#e11d48">REJECTED</text>

  <text x="15" y="445" font-size="8" fill="#64748b">* Margins check alert. Red flagged for immediate sort review.</text>
</svg>
`);

// Preset High contrast mock workspace before / after visual diagrams
// Dynamically generate high-fidelity distinct SVG diagram vectors for all 16 industrial zones in both compliant & non-compliant states
export function generateSitePresetSVG(zoneLabel: string, isCompliant: boolean, indexSeed: number = 0): string {
  const bgFill = isCompliant ? "#f8fafc" : "#fff1f2";
  const borderStroke = isCompliant ? "#10b981" : "#ef4444";
  const titleFill = isCompliant ? "#0f172a" : "#9f1239";
  const badgeFill = isCompliant ? "#e6f4ea" : "#fce8e6";
  const badgeStroke = isCompliant ? "#137333" : "#c5221f";
  const badgeText = isCompliant ? "1S PASS: COMPLIANT" : "1S REJECT: CLUTTERED";
  const statusAccent = isCompliant ? "#10b981" : "#ef4444";

  // Specific machinery drawing components based on zone names
  let machineryElements = "";
  const labelLower = zoneLabel.toLowerCase();

  if (labelLower.includes("furnace")) {
    machineryElements = `
      <!-- Melting Furnace Reactor layout -->
      <path d="M 120 180 L 120 100 Q 120 60 160 60 L 240 60 Q 280 60 280 100 L 280 180 Z" fill="#475569" stroke="#1e293b" stroke-width="2"/>
      <ellipse cx="200" cy="180" rx="60" ry="15" fill="${isCompliant ? "#3b82f6" : "#f97316"}" opacity="0.8"/>
      <rect x="180" y="70" width="40" height="30" fill="#334155" stroke="#1e293b"/>
      <text x="186" y="88" font-size="8" fill="#e2e8f0" font-weight="bold">HEATER</text>
    `;
  } else if (labelLower.includes("ccm") || labelLower.includes("casting")) {
    machineryElements = `
      <!-- Continuous Casting Machine mold and rollers -->
      <rect x="130" y="70" width="140" height="40" fill="#64748b" stroke="#1e293b" stroke-width="1.5" rx="3"/>
      <circle cx="160" cy="130" r="14" fill="#94a3b8" stroke="#334155"/>
      <circle cx="200" cy="130" r="14" fill="#94a3b8" stroke="#334155"/>
      <circle cx="240" cy="130" r="14" fill="#94a3b8" stroke="#334155"/>
      <path d="M 140 180 L 260 180" stroke="#3b82f6" stroke-width="4" stroke-dasharray="3,3"/>
      <text x="155" y="93" font-size="8" fill="#fff" font-weight="bold">CASTING MOLD</text>
    `;
  } else if (labelLower.includes("electrical") || labelLower.includes("room")) {
    machineryElements = `
      <!-- High Voltage terminal cabinets with controls -->
      <rect x="80" y="70" width="70" height="110" fill="#334155" stroke="#1e293b" stroke-width="2"/>
      <rect x="160" y="70" width="70" height="110" fill="#334155" stroke="#1e293b" stroke-width="2"/>
      <circle cx="115" cy="95" r="8" fill="#ef4444"/>
      <circle cx="115" cy="120" r="8" fill="#22c55e"/>
      <rect x="180" y="85" width="30" height="30" fill="#1e293b" stroke="#4b5563"/>
      <path d="M 195 90 L 195 110 M 185 100 L 205 100" stroke="#10b981" stroke-width="2"/>
      <text x="92" y="165" font-size="7" fill="#cbd5e1" font-weight="bold">PANEL A</text>
      <text x="172" y="165" font-size="7" fill="#cbd5e1" font-weight="bold">PANEL B</text>
    `;
  } else if (labelLower.includes("workshop") || labelLower.includes("development") || labelLower.includes("maintenance")) {
    machineryElements = `
      <!-- Workbenches & organized tools slot mounts -->
      <rect x="70" y="80" width="260" height="10" fill="#78350f" stroke="#451a03" stroke-width="1.5"/>
      <rect x="90" y="90" width="50" height="50" fill="#475569" stroke="#1e293b"/>
      <rect x="260" y="90" width="50" height="50" fill="#475569" stroke="#1e293b"/>
      <!-- Shadow outlines of tools -->
      <path d="M 110 100 L 110 130 M 102 110 L 118 110" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="280" y1="100" x2="290" y2="130" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
      <text x="156" y="125" font-size="8" fill="#475569" font-weight="bold">HEAVY BENCH</text>
    `;
  } else {
    machineryElements = `
      <!-- General steel manufacturing platforms & tracks -->
      <rect x="110" y="80" width="180" height="80" fill="#cbd5e1" stroke="#475569" stroke-width="1.5" rx="4"/>
      <line x1="110" y1="120" x2="290" y2="120" stroke="#94a3b8" stroke-width="3"/>
      <text x="145" y="110" font-size="9" fill="#1e293b" font-weight="bold">PRODUCTION LINE TRACK</text>
    `;
  }

  // 1S Clutter and debris vs Sorted efficiency layout
  const sortingStateGraphics = isCompliant
    ? `
      <!-- GANGWAYS PAINTED LINES -->
      <rect x="40" y="195" width="320" height="42" fill="#f1f5f9" stroke="#10b981" stroke-width="2"/>
      <line x1="40" y1="216" x2="360" y2="216" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6,4"/>
      <text x="140" y="221" font-size="12" font-weight="900" fill="#10b981" letter-spacing="0.5">🐾 CLERWALKWAY SAFE</text>

      <!-- Proper storage cabinets -->
      <rect x="330" y="110" width="30" height="80" fill="#e2e8f0" stroke="#047857" stroke-width="1.5"/>
      <line x1="330" y1="136" x2="360" y2="136" stroke="#047857"/>
      <line x1="330" y1="162" x2="360" y2="162" stroke="#047857"/>
      <text x="334" y="125" font-size="6" font-weight="bold" fill="#047857">1S RACK</text>
      <text x="334" y="150" font-size="6" font-weight="bold" fill="#166534">SORTED</text>

      <!-- Colored Recyclable disposal bins -->
      <rect x="45" y="145" width="18" height="26" fill="#1d4ed8" rx="1.5"/>
      <text x="49" y="160" font-size="5" font-weight="bold" fill="#fff" transform="rotate(-90 49 160)">STEEL</text>
      <rect x="68" y="145" width="18" height="26" fill="#15803d" rx="1.5"/>
      <text x="72" y="160" font-size="5" font-weight="bold" fill="#fff" transform="rotate(-90 72 160)">SLAG</text>
      <rect x="91" y="145" width="18" height="26" fill="#b45309" rx="1.5"/>
      <text x="95" y="160" font-size="5" font-weight="bold" fill="#fff" transform="rotate(-90 95 160)">HAZARD</text>
    `
    : `
      <!-- GANGWAYS PAINTED LINES BLOCKED -->
      <rect x="40" y="195" width="320" height="42" fill="#fee2e2" stroke="#ef4444" stroke-width="2"/>
      <text x="135" y="221" font-size="11" font-weight="900" fill="#ef4444">❌ BLOCKED / OIL LEAKING</text>

      <!-- Slag slag scatters -->
      <rect x="110" y="200" width="30" height="25" fill="#7c2d12" stroke="#431407" rx="1"/>
      <text x="113" y="215" font-size="6" font-weight="bold" fill="#fff">SLAG BOX</text>

      <!-- Discarded metals cluttering -->
      <path d="M 270 205 L 290 225 M 275 220 L 295 210" stroke="#71717a" stroke-width="3.5" stroke-linecap="round"/>
      <text x="250" y="234" font-size="6" font-weight="bold" fill="#71717a">METAL SCRAP</text>

      <!-- Spill on floor puddles -->
      <ellipse cx="210" cy="216" rx="20" ry="8" fill="#44403c" opacity="0.7"/>
      <text x="200" y="219" font-size="6" font-weight="bold" fill="#fecdd3">DANGER SPILL</text>

      <!-- Steel coil lying loose -->
      <circle cx="340" cy="170" r="16" fill="none" stroke="#dc2626" stroke-width="4"/>
      <circle cx="340" cy="170" r="8" fill="none" stroke="#dc2626" stroke-width="2"/>
      <text x="315" y="145" font-size="7" font-weight="bold" fill="#b91c1c">⚠️ UNANCHORED</text>
    `;

  const visualStamp = isCompliant
    ? `<circle cx="200" cy="115" r="28" fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="3,2"/>
       <text x="181" y="119" font-size="9" font-weight="900" fill="#10b981" letter-spacing="0.5">APPROVED</text>`
    : `<circle cx="200" cy="115" r="28" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="3,2"/>
       <text x="183" y="119" font-size="9" font-weight="900" fill="#ef4444" letter-spacing="0.5">REJECTED</text>`;

  const feedbackSummary = isCompliant
    ? `Compliant 1S Check: Walkways marked clear. Bins deployed.`
    : `Failure Alert: Disorganized debris blockades. Safety hazards identified.`;

  const svgText = `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" style="background:#f1f5f9; font-family:'Inter',system-ui,sans-serif;">
  <!-- Inner Background Canvas -->
  <rect x="0" y="0" width="400" height="300" fill="${bgFill}"/>
  
  <!-- Outer Double Double Border -->
  <rect x="8" y="8" width="384" height="284" fill="none" stroke="${borderStroke}" stroke-width="2"/>
  <rect x="12" y="12" width="376" height="276" fill="none" stroke="${borderStroke}" stroke-width="1" stroke-dasharray="3,3"/>

  <!-- Top Title Bar HUD -->
  <text x="24" y="36" font-size="11" font-weight="bold" fill="${titleFill}" letter-spacing="0.8">5S INDUSTRIAL TRACKER • STARSTEEL INDUSTRIAL</text>
  <text x="24" y="52" font-size="9" font-weight="bold" fill="#64748b" uppercase>ZONE SPEC: ${zoneLabel}</text>
  
  <!-- Status Badge Flag -->
  <rect x="250" y="24" width="126" height="30" fill="${badgeFill}" stroke="${badgeStroke}" stroke-width="1.5" rx="3"/>
  <text x="260" y="42" font-size="8.5" font-weight="900" fill="${badgeStroke}" letter-spacing="0.2">${badgeText}</text>

  <line x1="24" y1="64" x2="376" y2="64" stroke="#cbd5e1" stroke-width="1.5"/>

  <!-- Base Machinery and Tools Render -->
  ${machineryElements}

  <!-- 1S Sorting Quality Indicators -->
  ${sortingStateGraphics}

  <!-- QA Stamp circle -->
  ${visualStamp}

  <!-- Lower Status Banner bar -->
  <rect x="20" y="254" width="360" height="28" fill="${isCompliant ? "#e6f4ea" : "#fce8e6"}" stroke="${isCompliant ? "#10b981" : "#ef4444"}" stroke-width="1" rx="2"/>
  <text x="30" y="271" font-size="8" font-weight="bold" fill="${isCompliant ? "#137333" : "#c5221f"}" letter-spacing="0.1">${feedbackSummary}</text>
</svg>
  `;

  return `data:image/svg+xml;utf8,` + encodeURIComponent(svgText.trim());
}

// Fixed list of high quality initial presets
export const PRESET_ZONES_POOL = [
  "SMS FURNACE-1 (ZONE -1)",
  "SMS CCM (ZONE -3)",
  "SMS ELECTRICAL (ZONE-5)",
  "MECHANICAL DEVELOPMENT (ZONE -4)",
  "ECR ROOM (ZONE -7)",
  "C5 TO C8 (ZONE -1)",
  "ROUCHING (ZONE -3)",
  "ROLL SHOP (ZONE -10)",
  "SMS FURNACE-2 (ZONE -2)",
  "SMS FABRICATION YARD (ZONE -4)",
  "SMS REWIDING ROOM (ZONE-6)",
  "MECHANICAL MAINTENANCE (ZONE -5)",
  "C1 TO C4 (ZONE -2)",
  "HOT CHARGING (ZONE -6)",
  "WORKSHOP (ZONE -10)",
  "RHF & RFO (ZONE -9)",
];

// Generate exactly 32 distinct site pictures (16 compliant items, followed by 16 cluttered items)
const generatedPool: string[] = [];

// 1. First 16 are compliant versions of each zone
PRESET_ZONES_POOL.forEach((zone, idx) => {
  generatedPool.push(generateSitePresetSVG(zone, true, idx));
});

// 2. Next 16 are non-compliant versions of each zone
PRESET_ZONES_POOL.forEach((zone, idx) => {
  generatedPool.push(generateSitePresetSVG(zone, false, idx + 16));
});

export const MOCK_SITES = generatedPool;

