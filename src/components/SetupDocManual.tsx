import { useState } from "react";
import { BookOpen, Copy, Check, Terminal, Shield, FolderGit2, FileCode2 } from "lucide-react";

export default function SetupDocManual() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const steps = [
    {
      title: "Prerequisites & Environment Setup",
      desc: "Install Node.js (v18+) on your workstation. Run the following command inside your project directory to install dependencies from package.json:",
      command: "npm install",
      icon: Terminal,
    },
    {
      title: "Configure Private Credentials (.env)",
      desc: "Create a local file named '.env' in your root directory. Populate it with your Gemini API key from the Google AI Studio console for paper analysis to work:",
      command: `GEMINI_API_KEY="YOUR_ACTUAL_API_KEY_HERE"\nPORT=3000`,
      icon: FolderGit2,
    },
    {
      title: "Run in Local Development Mode",
      desc: "Start the concurrent full-stack Node container in development mode. The browser page will automatically fast-reload on code updates:",
      command: "npm run dev",
      icon: Terminal,
    },
    {
      title: "Build and Deploy to Production",
      desc: "When launching online globally, compile the static front-end assets and bundle the CJS backend server using esbuild:",
      command: "npm run build\nnpm start",
      icon: FileCode2,
    },
  ];

  const rulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if false; }

    function incoming() { return request.resource.data; }
    function isValidId(id) { return id is string && id.size() <= 128; }

    function isValidAudit(data) {
      return data.keys().hasAll(['id', 'auditorName', 'auditorEmail', 'zone', 'zoneGroup', 'scores', 'totalScore', 'maxScore', 'compliancePercentage']);
    }

    match /audits/{auditId} {
      allow create: if isValidId(auditId) && isValidAudit(incoming());
      allow read: if true;
      allow update, delete: if false;
    }
  }
}`;

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-6 space-y-6" id="setup_guide">
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-5.5 h-5.5 text-indigo-600" />
          5S Officer's Setup Guide &amp; Code Deployment Manual
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Detailed, step-by-step manual on how to run this portal independently on your local machines, intranet, or full cloud servers.
        </p>
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((st, i) => {
          const Icon = st.icon;
          return (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 bg-indigo-50 text-indigo-600 text-[10px] font-bold flex items-center justify-center rounded-full">
                    {i + 1}
                  </span>
                  <h4 className="text-xs font-bold text-slate-800">{st.title}</h4>
                </div>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">{st.desc}</p>
              </div>
              <div className="relative">
                <pre className="bg-slate-900 text-slate-200 text-[11px] p-2.5 rounded-lg overflow-x-auto font-mono">
                  {st.command}
                </pre>
                <button
                  type="button"
                  onClick={() => handleCopyText(st.command, `step-${i}`)}
                  className="absolute right-2 top-2 p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                >
                  {copiedSection === `step-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security rules codes */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-800">Production Security Rules (firestore.rules)</h4>
          </div>
          <button
            type="button"
            onClick={() => handleCopyText(rulesCode, "rules")}
            className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
          >
            {copiedSection === "rules" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSection === "rules" ? "Copied" : "Copy Rules"}
          </button>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          The code below locks your Cloud Firestore, preventing end-users from editing, updating, or deleting existing 5S spreadsheets once logged by operations HODs. Paste this into your firebase folder.
        </p>
        <pre className="bg-slate-900 text-slate-300 text-[10px] p-3 rounded-lg overflow-y-auto max-h-48 font-mono">
          {rulesCode}
        </pre>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-indigo-900">
        <Terminal className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold">Deploying directly to Cloud Run?</h4>
          <p className="text-xs leading-relaxed text-indigo-700">
            This application is fully responsive and supports standard headless container structures out-of-the-box. Your active deployment URL is:
            <span className="block font-mono bg-indigo-100/60 p-1 rounded mt-1 text-[11px] font-semibold text-indigo-900 select-all">
              https://ais-pre-zcocna3fjnjf2uazo5e2bb-909458706345.europe-west2.run.app
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
