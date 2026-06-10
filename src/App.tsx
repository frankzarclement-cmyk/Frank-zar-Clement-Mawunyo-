import React, { useState, useEffect } from "react";
import {
  Scan,
  ClipboardList,
  Download,
  Search,
  Lock,
  Unlock,
  LayoutDashboard,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Mail,
  MapPin,
  Building2,
  Sparkles,
  Plus,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  Info,
  BookOpen,
  ArrowRight,
  Eye,
  CheckCircle2,
  MessageSquare,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";

import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  limit,
} from "firebase/firestore";

import { Audit, STARSTEEL_ZONES, ZoneOption, ScoreBreakdown, AdminMessage } from "./types";
import { MOCK_CHECKLIST_GOOD, MOCK_CHECKLIST_POOR, MOCK_SITES, PRESET_ZONES_POOL } from "./data/mock-presets";
import CameraScanner from "./components/CameraScanner";
import SetupDocManual from "./components/SetupDocManual";

// Seed fallbacks so the app has high-quality data immediately if firestore has no records yet
const INITIAL_DEMO_AUDITS: Audit[] = [
  {
    id: "demo-1",
    auditorName: "Frank Clement",
    auditorEmail: "frankzarclement@gmail.com",
    zone: "FURNACE-1 -ZONE -1",
    zoneGroup: "SMS",
    date: "2026-06-08",
    checklistImg: MOCK_CHECKLIST_GOOD,
    siteImg: MOCK_SITES[0],
    scores: {
      sortingUnnecessary: 4,
      clearAisles: 5,
      storageLabels: 4,
      binDisposal: 5,
      safetyHazards: 4,
    },
    totalScore: 22,
    maxScore: 25,
    compliancePercentage: 88,
    feedback: "Furnace walkway clear of scrap slag blocks. Excellent label markings on maintenance rack.",
  },
  {
    id: "demo-2",
    auditorName: "Arthur Pendelton",
    auditorEmail: "apendelton@starsteel.com",
    zone: "ECR ROOM ZONE -7",
    zoneGroup: "General",
    date: "2026-06-09",
    checklistImg: MOCK_CHECKLIST_POOR,
    siteImg: MOCK_SITES[1],
    scores: {
      sortingUnnecessary: 2,
      clearAisles: 3,
      storageLabels: 2,
      binDisposal: 3,
      safetyHazards: 3,
    },
    totalScore: 13,
    maxScore: 25,
    compliancePercentage: 52,
    feedback: "High trip hazards due to cables left unorganized on the floor. Scrap wood box blocking doorway.",
  },
  {
    id: "demo-3",
    auditorName: "Frank Clement",
    auditorEmail: "frankzarclement@gmail.com",
    zone: "MECHANICAL DEVELOPMENT - ZONE -4",
    zoneGroup: "General",
    date: "2026-06-10",
    checklistImg: MOCK_CHECKLIST_GOOD,
    siteImg: MOCK_SITES[0],
    scores: {
      sortingUnnecessary: 5,
      clearAisles: 5,
      storageLabels: 4,
      binDisposal: 5,
      safetyHazards: 5,
    },
    totalScore: 24,
    maxScore: 25,
    compliancePercentage: 96,
    feedback: "World class sorting executed. Walkway clear indicators painted. High-grade bins deployed.",
  },
];

// Seed chat conversations for the administrative panel
const INITIAL_DEMO_CHATS: AdminMessage[] = [
  {
    id: "chat-1",
    senderName: "Furnace-1 HOD",
    senderPin: "1029",
    message: "We've completed the corrective action on the Furnace-1 walkway and segregated all the heavy slag blocks. It's totally sorted.",
    zone: "FURNACE-1 -ZONE -1",
    createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
  },
  {
    id: "chat-2",
    senderName: "Senior 5S Officer & Admin",
    senderPin: "8888",
    message: "Excellent work Furnace-1 group! Arthur, have you cleared the scrap wood blockage on the ECR Room floor yet?",
    zone: "ECR ROOM ZONE -7",
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
  },
  {
    id: "chat-3",
    senderName: "ECR Room HOD",
    senderPin: "5432",
    message: "Loose wires are being bundled now. Also, the scrap wooden pallet is being moved to the waste depot. We will pass our next 5S check tomorrow morning.",
    zone: "ECR ROOM ZONE -7",
    createdAt: new Date(Date.now() - 1800 * 1000).toISOString(),
  },
];

export default function App() {
  const [activePortal, setActivePortal] = useState<"operator" | "admin" | "manual">("operator");

  // Operator Portal Form States
  const [auditorName, setAuditorName] = useState("");
  const [auditorEmail, setAuditorEmail] = useState("");
  const [zoneCategory, setZoneCategory] = useState<"General" | "SMS">("General");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [siteImg, setSiteImg] = useState<string | null>(null);
  const [manualFeedback, setManualFeedback] = useState("");

  // Site picture preset gallery choices states (supporting custom count "more than 20 or less")
  const [presetLimit, setPresetLimit] = useState<number>(32);
  const [presetFilter, setPresetFilter] = useState<"all" | "compliant" | "cluttered">("all");

  // Scanner Results Integration
  const [scannedScores, setScannedScores] = useState<ScoreBreakdown | null>(null);
  const [checklistImg, setChecklistImg] = useState<string | null>(null);
  const [isScanned, setIsScanned] = useState(false);
  const [scanMessage, setScanMessage] = useState("");

  // General Application Database State
  const [auditsList, setAuditsList] = useState<Audit[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSubmittedId, setLastSubmittedId] = useState("");

  // Admin Verification Gate State
  const [adminCode, setAdminCode] = useState("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminError, setAdminError] = useState("");

  // Admin Search & Filters State
  const [adminSearch, setAdminSearch] = useState("");
  const [adminGroupFilter, setAdminGroupFilter] = useState<"All" | "General" | "SMS">("All");
  const [selectedAuditDetail, setSelectedAuditDetail] = useState<Audit | null>(null);

  // Admin Chat States
  const [chatMessages, setChatMessages] = useState<AdminMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [chatSelectedZone, setChatSelectedZone] = useState("General / All");
  const [selectedChatZoneFilter, setSelectedChatZoneFilter] = useState("All");
  const [chatSearchFilter, setChatSearchFilter] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Auto-calculated fields based on Zone
  const activeZoneOption = STARSTEEL_ZONES.find((z) => z.value === selectedZone);
  const activeHOD = activeZoneOption ? activeZoneOption.hod : "No Zone Selected";

  // Filter zones list by selection category
  const filteredZones = STARSTEEL_ZONES.filter((z) => z.zoneGroup === zoneCategory);

  // Sync audits list real-time from Firestore
  useEffect(() => {
    const q = query(collection(db, "audits"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: Audit[] = [];
        snapshot.forEach((doc) => {
          loaded.push({ id: doc.id, ...doc.data() } as Audit);
        });

        // Fallback to loaded defaults if database is empty for visual evaluation trials
        if (loaded.length === 0) {
          setAuditsList(INITIAL_DEMO_AUDITS);
        } else {
          setAuditsList(loaded);
        }
      },
      (error) => {
        console.warn("Firestore access error. Running in local fallback cache mode.", error);
        setAuditsList(INITIAL_DEMO_AUDITS);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sync admin chat messages real-time from Firestore
  useEffect(() => {
    const q = query(
      collection(db, "admin_chats"),
      orderBy("createdAt", "asc"),
      limit(100)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: AdminMessage[] = [];
        snapshot.forEach((doc) => {
          loaded.push({ id: doc.id, ...doc.data() } as AdminMessage);
        });

        if (loaded.length === 0) {
          setChatMessages(INITIAL_DEMO_CHATS);
        } else {
          setChatMessages(loaded);
        }
      },
      (error) => {
        console.warn("Firestore admin_chats access error. Running in local fallback mode.", error);
        setChatMessages(INITIAL_DEMO_CHATS);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle posting a new chat message to Firestore
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    setIsSendingMessage(true);
    try {
      // Look up HOD/Officer sender representation from authorized PINs
      let displaySenderName = "Admin Coordinator";
      if (adminCode.trim() === "1029") {
        displaySenderName = "Furnace-1 HOD";
      } else if (adminCode.trim() === "5432") {
        displaySenderName = "ECR Room HOD";
      } else if (adminCode.trim() === "8888") {
        displaySenderName = "Senior 5S Officer & Admin";
      }

      const chatPayload = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        senderName: displaySenderName,
        senderPin: adminCode.trim() || "Guest",
        message: newMessageText.trim(),
        zone: chatSelectedZone,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "admin_chats"), chatPayload);
      setNewMessageText("");
    } catch (err) {
      console.error("Failed to post chat message:", err);
      // Fallback local memory append for seamless sandbox test play
      const localMsg: AdminMessage = {
        id: `local-${Date.now()}`,
        senderName: adminCode.trim() === "1029" ? "Furnace-1 HOD" : adminCode.trim() === "5432" ? "ECR Room HOD" : "Senior 5S Officer & Admin",
        senderPin: adminCode.trim() || "Guest",
        message: newMessageText.trim(),
        zone: chatSelectedZone,
        createdAt: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, localMsg]);
      setNewMessageText("");
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Handle Scan completion triggers
  const handleScanCompleted = (result: any) => {
    setScannedScores(result.scores);
    setChecklistImg(result.checklistImg);
    setIsScanned(true);
    setScanMessage(result.message);

    // Auto fill metadata fields if parsed by Gemini
    if (result.auditorName && !auditorName) setAuditorName(result.auditorName);
    if (result.auditorEmail && !auditorEmail) setAuditorEmail(result.auditorEmail);
    if (result.zone) {
      const matched = STARSTEEL_ZONES.find(
        (z) => z.value.toLowerCase().includes(result.zone.toLowerCase()) || result.zone.toLowerCase().includes(z.value.toLowerCase())
      );
      if (matched) {
        setZoneCategory(matched.zoneGroup);
        setSelectedZone(matched.value);
      }
    }
  };

  const selectSitePreset = (imgUrl: string) => {
    setSiteImg(imgUrl);
  };

  const handleSitePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setSiteImg(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Audit Data Log to Firestore
  const handleSubmitAudit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auditorName || !auditorEmail || !selectedZone || !siteImg || !checklistImg || !scannedScores) {
      alert("Missing Required Fields! Please make sure Email registration, Zone, Site Photo and Checklist Scan are populated.");
      return;
    }

    setIsSubmitting(true);

    // Compute standard scores
    const totalScore =
      scannedScores.sortingUnnecessary +
      scannedScores.clearAisles +
      scannedScores.storageLabels +
      scannedScores.binDisposal +
      scannedScores.safetyHazards;
    const maxScore = 25;
    const compliancePercentage = Math.round((totalScore / maxScore) * 100);

    const auditPayload: Omit<Audit, "id"> = {
      auditorName,
      auditorEmail,
      zone: selectedZone,
      zoneGroup: zoneCategory,
      date: selectedDate,
      checklistImg,
      siteImg,
      scores: scannedScores,
      totalScore,
      maxScore,
      compliancePercentage,
      feedback: manualFeedback || "Audit processed. No corrective comments declared.",
      createdAt: new Date().toISOString(), // Fallback standard string
    };

    try {
      // Save directly into the secure audits collection in firestore
      const docRef = await addDoc(collection(db, "audits"), {
        ...auditPayload,
        serverTimestamp: serverTimestamp(),
      });

      setLastSubmittedId(docRef.id);
      setShowSuccessModal(true);

      // Reset Operator fields except auditor credentials for smooth field sequences
      setSiteImg(null);
      setChecklistImg(null);
      setScannedScores(null);
      setIsScanned(false);
      setManualFeedback("");
    } catch (err) {
      console.error("Failed to commit 1S audit logs:", err);
      alert("Database error: Unable to submit report. Please save records or check rules.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify Admin PIN special numbers
  const handleAdminVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const authorizedPINs = ["1029", "5432", "8888"];

    if (authorizedPINs.includes(adminCode.trim())) {
      setIsAdminLoggedIn(true);
      setAdminError("");
    } else {
      setAdminError("Invalid Auth Code. Only authorized HODs / 5S Officers can log in.");
    }
  };

  // Spreadsheet Compiler via SheetJS (xlsx)
  const handleExportToExcel = () => {
    const tableRows = auditsList.map((au) => {
      const zoneDetails = STARSTEEL_ZONES.find((z) => z.value === au.zone);
      return {
        "Audit Date": au.date,
        "Department / Zone": au.zone,
        "Zone Group": au.zoneGroup,
        "Managing Coordination HOD": zoneDetails ? zoneDetails.hod : "N/A",
        "Auditing Inspector Name": au.auditorName,
        "Auditing Inspector Email": au.auditorEmail,
        "Q1: Sorting Obsolete Items (Score)": au.scores.sortingUnnecessary,
        "Q2: Clear Walkways / Aisles (Score)": au.scores.clearAisles,
        "Q3: Material Tags / Organizing (Score)": au.scores.storageLabels,
        "Q4: Garbage Sorting Bins (Score)": au.scores.binDisposal,
        "Q5: Workplace Hazards Sorting (Score)": au.scores.safetyHazards,
        "Total Audit Grade (Out of 25)": au.totalScore,
        "1S Sort Compliance Perf (%)": `${au.compliancePercentage}%`,
        "Auditor Notes / Action Checklist": au.feedback || "Verified - Fully Compliant",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(tableRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "1S Sort Audit History");

    // Auto adjust column widths for a premium spreadsheet layout
    const columnWidths = [
      { wch: 12 }, { wch: 35 }, { wch: 12 }, { wch: 25 }, { wch: 22 }, { wch: 30 },
      { wch: 38 }, { wch: 38 }, { wch: 38 }, { wch: 38 }, { wch: 38 }, { wch: 28 },
      { wch: 28 }, { wch: 50 }
    ];
    worksheet["!cols"] = columnWidths;

    XLSX.writeFile(workbook, "Starsteel_5S_ZoneWise_1S_Audit_Export.xlsx");
  };

  // Perform Calculations for Admin view
  const totalAudits = auditsList.length;
  const averageCompliance = totalAudits
    ? Math.round(auditsList.reduce((sum, a) => sum + a.compliancePercentage, 0) / totalAudits)
    : 0;

  const criticalIssuesCount = auditsList.filter((a) => a.compliancePercentage < 65).length;
  const excellentScoresCount = auditsList.filter((a) => a.compliancePercentage >= 90).length;

  // Filter admin submissions database list
  const filteredAdminAudits = auditsList.filter((aud) => {
    const matchesSearch =
      aud.auditorName.toLowerCase().includes(adminSearch.toLowerCase()) ||
      aud.auditorEmail.toLowerCase().includes(adminSearch.toLowerCase()) ||
      aud.zone.toLowerCase().includes(adminSearch.toLowerCase());

    const matchesGroup =
      adminGroupFilter === "All" || aud.zoneGroup === adminGroupFilter;

    return matchesSearch && matchesGroup;
  });

  // Data aggregations for custom vector charts
  // Group compliance over time
  const datesMap: { [date: string]: { sum: number; count: number } } = {};
  auditsList.forEach((a) => {
    if (!datesMap[a.date]) datesMap[a.date] = { sum: 0, count: 0 };
    datesMap[a.date].sum += a.compliancePercentage;
    datesMap[a.date].count += 1;
  });
  const sortedDatesTrend = Object.keys(datesMap)
    .sort()
    .map((date) => ({
      date,
      avg: Math.round(datesMap[date].sum / datesMap[date].count),
    }));

  // Zone Performance Breakdown data compile
  const zoneBreakdownMap: { [zone: string]: { sum: number; count: number } } = {};
  STARSTEEL_ZONES.forEach((z) => {
    zoneBreakdownMap[z.value] = { sum: 0, count: 0 };
  });
  auditsList.forEach((a) => {
    if (zoneBreakdownMap[a.zone]) {
      zoneBreakdownMap[a.zone].sum += a.compliancePercentage;
      zoneBreakdownMap[a.zone].count += 1;
    }
  });
  const zonePerformanceData = STARSTEEL_ZONES.map((z) => {
    const data = zoneBreakdownMap[z.value];
    return {
      name: z.label,
      avg: data && data.count ? Math.round(data.sum / data.count) : 0,
      group: z.zoneGroup,
    };
  }).filter((z) => z.avg > 0); // Only show active coded zones in bar charts

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none" id="app_root">
      {/* Premium Header Layout with Starsteel Industrial Accent */}
      <header className="flex flex-col md:flex-row items-center justify-between px-6 py-3 bg-slate-900 text-white border-b border-slate-700 shrink-0 sticky top-0 z-40 gap-3">
        <div className="flex items-center gap-3">
          {/* Real Starsteel 5S Portal Logo matching user uploaded image */}
          <div className="flex items-center gap-2 select-none" id="starsteels_brand_logo">
            <svg 
              viewBox="0 0 85 62" 
              className="w-10 h-10 shrink-0" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Starsteels Logo"
            >
              <defs>
                <linearGradient id="starsteel-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" /> {/* bright orange */}
                  <stop offset="50%" stopColor="#ea580c" /> {/* deep orange */}
                  <stop offset="100%" stopColor="#dc2626" /> {/* fiery red */}
                </linearGradient>
              </defs>
              
              {/* Top set of slanted bars, skewed for dynamic speed feel */}
              <g transform="skewX(-32)">
                {/* Left short bar, cut at the top */}
                <rect x="56" y="14.5" width="7.5" height="13.5" rx="1.8" fill="url(#starsteel-logo-grad)" />
                {/* Middle long bar */}
                <rect x="67.5" y="2" width="7.5" height="26" rx="1.8" fill="url(#starsteel-logo-grad)" />
                {/* Right long bar */}
                <rect x="79" y="2" width="7.5" height="26" rx="1.8" fill="url(#starsteel-logo-grad)" />
              </g>
              
              {/* Bottom set of slanted bars, separated by diagonal 5S horizontal channel */}
              <g transform="skewX(-32)">
                {/* Left long bar */}
                <rect x="44" y="32" width="7.5" height="26" rx="1.8" fill="url(#starsteel-logo-grad)" />
                {/* Middle long bar */}
                <rect x="55.5" y="32" width="7.5" height="26" rx="1.8" fill="url(#starsteel-logo-grad)" />
                {/* Right short bar, cut at the bottom */}
                <rect x="67" y="32" width="7.5" height="13.5" rx="1.8" fill="url(#starsteel-logo-grad)" />
              </g>
            </svg>
            <div className="flex flex-col text-left font-sans select-none leading-none pt-0.5">
              <span className="text-[13.5px] font-black tracking-[0.06em] text-white font-sans leading-[1.0]">STAR</span>
              <span className="text-[13.5px] font-black tracking-[0.06em] text-white font-sans leading-[1.0] mt-0.5">STEELS</span>
            </div>
          </div>
          <div className="ml-2 pl-3 border-l border-slate-700 hidden md:block">
            <h1 className="text-[12px] font-black uppercase tracking-wider text-slate-100 select-none">
              Starsteel 5S ZONE-WISE 1S AUDIT PERFORMANCE (%)
            </h1>
          </div>
        </div>

        {/* Quick Nav Switches and Welcome bar */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded p-1 font-semibold gap-1">
            <button
              onClick={() => setActivePortal("operator")}
              className={`px-2.5 py-1.5 rounded transition duration-200 cursor-pointer ${
                activePortal === "operator" ? "bg-blue-600 text-white shadow-sm" : "text-slate-300 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-1">
                <Scan className="w-3.5 h-3.5" />
                Operator Log
              </span>
            </button>
            <button
              onClick={() => setActivePortal("admin")}
              className={`px-2.5 py-1.5 rounded transition duration-200 cursor-pointer ${
                activePortal === "admin" ? "bg-blue-600 text-white shadow-sm" : "text-slate-300 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-1">
                <LayoutDashboard className="w-3.5 h-3.5" />
                HOD Analytics
              </span>
            </button>
            <button
              onClick={() => setActivePortal("manual")}
              className={`px-2.5 py-1.5 rounded transition duration-200 cursor-pointer ${
                activePortal === "manual" ? "bg-blue-600 text-white shadow-sm" : "text-slate-300 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                Setup Guide
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3 border-l border-slate-700 pl-4">
            <div className="flex flex-col items-end">
              <span className="font-semibold text-slate-200 text-right truncate max-w-[120px]">
                {auditorName || "Guest Auditor"}
              </span>
              <span className="text-[9px] text-blue-400">
                {activePortal === "admin" && isAdminLoggedIn ? "HOD Inspector" : "Daily Auditor"}
              </span>
            </div>
            {activePortal !== "admin" && (
              <button
                onClick={() => {
                  setActivePortal("admin");
                }}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-300 hover:bg-slate-700 hover:text-white transition"
              >
                Admin Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container Workspace Frame */}
      <main className="flex-grow w-full mx-auto px-4 py-4 max-w-7xl">
        <AnimatePresence mode="wait">
          {/* 1. OPERATOR AUDIT PORTAL */}
          {activePortal === "operator" && (
            <motion.div
              key="operator"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-4"
            >
              {/* Form Entry Column */}
              <div className="lg:col-span-7 space-y-4">
                <form onSubmit={handleSubmitAudit} className="space-y-4">
                  {/* Step A: Profile Setup */}
                  <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold uppercase text-slate-500 mb-2 border-b pb-1.5 flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                          1
                        </span>
                        <span>Auditor Registration</span>
                      </span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-455 mb-1 uppercase tracking-wider">
                          Auditor Full Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Frank Clement"
                            value={auditorName}
                            onChange={(e) => setAuditorName(e.target.value)}
                            className="pl-8 pr-2.5 py-1.5 border border-slate-300 bg-slate-50 rounded text-xs w-full text-slate-850 focus:outline-none focus:border-blue-500 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-455 mb-1 uppercase tracking-wider">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="email"
                            required
                            placeholder="e.g. user@starsteel.com"
                            value={auditorEmail}
                            onChange={(e) => setAuditorEmail(e.target.value)}
                            className="pl-8 pr-2.5 py-1.5 border border-slate-300 bg-slate-50 rounded text-xs w-full text-slate-850 focus:outline-none focus:border-blue-500 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step B: Zone & Category Selector */}
                  <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold uppercase text-slate-500 mb-2 border-b pb-1.5 flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                          2
                        </span>
                        <span>Location &amp; Zone Target</span>
                      </span>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-bold">
                        Connected to Excel
                      </span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-455 mb-1 uppercase tracking-wider">
                          Department Classification
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setZoneCategory("General");
                              setSelectedZone("");
                            }}
                            className={`p-1.5 border text-[11px] font-medium rounded transition ${
                              zoneCategory === "General"
                                ? "border-blue-600 bg-blue-50 text-blue-700 font-bold"
                                : "border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            General (C1-C8, Workshops)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setZoneCategory("SMS");
                              setSelectedZone("");
                            }}
                            className={`p-1.5 border text-[11px] font-medium rounded transition ${
                              zoneCategory === "SMS"
                                ? "border-blue-600 bg-blue-50 text-blue-700 font-bold"
                                : "border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            SMS Steel Plant
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-455 mb-1 uppercase tracking-wider">
                          Target Physical Zone *
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                          <select
                            required
                            value={selectedZone}
                            onChange={(e) => setSelectedZone(e.target.value)}
                            className="pl-8 pr-2.5 py-1.5 border border-slate-300 bg-slate-50 rounded text-xs w-full text-slate-850 focus:outline-none focus:border-blue-500 focus:bg-white"
                          >
                            <option value="">-- Choose Starsteel Zone --</option>
                            {filteredZones.map((z, id) => (
                              <option key={id} value={z.value}>
                                {z.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="bg-slate-100/80 rounded p-2.5 border border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-blue-500" />
                          HOD ASSIGNED:
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-slate-500 italic">
                          {activeHOD}
                        </span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-455 mb-1 uppercase tracking-wider">
                          Log Execution Date
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="pl-8 pr-2.5 py-1.5 border border-slate-300 bg-slate-50 rounded text-xs w-full text-slate-850 focus:outline-none focus:border-blue-500 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step C: 1S Site Area Photo Capture */}
                  <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold uppercase text-slate-500 mb-2 border-b pb-1.5 flex items-center gap-2">
                      <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                        3
                      </span>
                      <span>Upload Target 5S Workspace Photo *</span>
                    </h3>
                    <p className="text-[11px] text-slate-540 leading-relaxed">
                      Capture or attach a real photo showing where sorting/clearing activities occurred.
                    </p>

                    {!siteImg ? (
                      <div className="space-y-3">
                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-5 text-center bg-slate-50 relative hover:border-slate-300 transition-colors">
                          <div className="max-w-md mx-auto space-y-1.5">
                            <span className="text-xs font-bold text-slate-700 block">Drag &amp; Drop Site Photo Here</span>
                            <span className="text-[10px] text-slate-400 block pb-1">Supports standard image files</span>
                            <label className="px-3 py-1.5 bg-slate-800 text-white rounded text-xs font-semibold hover:bg-slate-700 transition cursor-pointer shadow-sm">
                              Select from Files
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleSitePhotoUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        {/* Presets for frictionless developer testing */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 border-slate-200">
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Sandbox Tool: Select a Trial Workspace Image
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Select from {MOCK_SITES.length} dynamic digital site layouts.
                              </p>
                            </div>
                            {/* Interactive Count Filter: "The site pictures can be more than 20 or less" */}
                            <div className="flex items-center gap-1.5 self-start sm:self-center">
                              <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">Show Limit:</span>
                              <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-white shadow-xs">
                                <button
                                  type="button"
                                  onClick={() => setPresetLimit(10)}
                                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded-sm transition-all ${
                                    presetLimit === 10 ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  10 (Less)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPresetLimit(20)}
                                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded-sm transition-all ${
                                    presetLimit === 20 ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  20
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPresetLimit(32)}
                                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded-sm transition-all ${
                                    presetLimit === 32 ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  32 (More)
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Quick filters for compliance */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => setPresetFilter("all")}
                                className={`px-2 py-0.5 text-[9px] rounded-full border font-semibold transition ${
                                  presetFilter === "all"
                                    ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                All Statuses
                              </button>
                              <button
                                type="button"
                                onClick={() => setPresetFilter("compliant")}
                                className={`px-2 py-0.5 text-[9px] rounded-full border font-semibold transition flex items-center gap-1 ${
                                  presetFilter === "compliant"
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                    : "bg-white text-emerald-700 border-emerald-100 hover:bg-emerald-50"
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                Compliant Only
                              </button>
                              <button
                                type="button"
                                onClick={() => setPresetFilter("cluttered")}
                                className={`px-2 py-0.5 text-[9px] rounded-full border font-semibold transition flex items-center gap-1 ${
                                  presetFilter === "cluttered"
                                    ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                                    : "bg-white text-rose-700 border-rose-100 hover:bg-rose-50"
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                                Cluttered Only
                              </button>
                            </div>
                          </div>

                          {/* Render the grid list with custom limit and filters applied */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                            {MOCK_SITES
                              .map((img, idx) => {
                                const isCompliant = idx < 16;
                                const zoneName = PRESET_ZONES_POOL[idx % 16];
                                return { img, idx, isCompliant, zoneName };
                              })
                              .filter((item) => {
                                if (presetFilter === "compliant") return item.isCompliant;
                                if (presetFilter === "cluttered") return !item.isCompliant;
                                return true;
                              })
                              .slice(0, presetLimit)
                              .map((item) => (
                                <button
                                  key={item.idx}
                                  type="button"
                                  onClick={() => selectSitePreset(item.img)}
                                  className="group border border-slate-200 hover:border-indigo-500 bg-white rounded p-1 transition text-left flex flex-col justify-between h-20 shadow-xxs hover:shadow-xs relative overflow-hidden"
                                >
                                  {/* Thumbnail Preview rendering the mini SVG */}
                                  <div className="absolute inset-0 opacity-15 group-hover:opacity-25 transition">
                                    <img src={item.img} alt="" className="w-full h-full object-cover" />
                                  </div>

                                  <div className="relative z-5 flex flex-col justify-between h-full">
                                    <span className="text-[8px] font-bold text-slate-700 leading-tight block truncate group-hover:text-indigo-700">
                                      {item.zoneName}
                                    </span>
                                    <div className="flex items-center justify-between gap-1 w-full mt-auto">
                                      <span className={`text-[7px] font-bold px-1 rounded-sm uppercase tracking-wider ${
                                        item.isCompliant 
                                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                                          : "bg-rose-100 text-rose-800 border border-rose-200"
                                      }`}>
                                        {item.isCompliant ? "Pass" : "Fail"}
                                      </span>
                                      <span className="text-[7.5px] text-indigo-600 font-bold group-hover:underline">
                                        Select →
                                      </span>
                                    </div>
                                  </div>
                                </button>
                              ))}
                          </div>
                          <div className="text-[9px] text-slate-400 italic text-right">
                            Showing {Math.min(presetLimit, MOCK_SITES.filter((_, idx) => {
                              if (presetFilter === "compliant") return idx < 16;
                              if (presetFilter === "cluttered") return idx >= 16;
                              return true;
                            }).length)} of {MOCK_SITES.length} dynamic preset items.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative rounded overflow-hidden border border-slate-200 bg-slate-100 h-56 shadow-sm">
                        <img src={siteImg} alt="Site 5S Area upload" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setSiteImg(null)}
                          className="absolute top-2 right-2 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded shadow-md transition flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Remove Photo
                        </button>
                        <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-sm font-medium shadow-xs">
                          5S Site Area Selected!
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submission and Scanner completion validations summary block */}
                  {isScanned && scannedScores && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3.5"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Parsed 1S Scorecard summary
                        </h4>
                        <div className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                          Compliance: {Math.round(((scannedScores.sortingUnnecessary + scannedScores.clearAisles + scannedScores.storageLabels + scannedScores.binDisposal + scannedScores.safetyHazards) / 25) * 100)}%
                        </div>
                      </div>

                      {/* Display breakdown parameters */}
                      <div className="space-y-2 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-650">Sorting &amp; Disposing Obsolete Items (1S Sort)</span>
                          <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-750">
                            {scannedScores.sortingUnnecessary} / 5
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-650">Walkways, Aisles &amp; Doorways Clear of Blockage</span>
                          <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-750">
                            {scannedScores.clearAisles} / 5
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-655">Storage Organization &amp; Label Placements</span>
                          <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-750">
                            {scannedScores.storageLabels} / 5
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-655">Waste Segregation &amp; Bin Deployments</span>
                          <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-750">
                            {scannedScores.binDisposal} / 5
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-655">Immediate Action on Tripping/Leak Hazards</span>
                          <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-750">
                            {scannedScores.safetyHazards} / 5
                          </span>
                        </div>
                      </div>

                      <div className="pt-1">
                        <label className="block text-[10px] font-semibold text-slate-455 mb-1 uppercase tracking-wider">
                          Auditor Remarks / Action Notes (Optional)
                        </label>
                        <textarea
                          placeholder="Insert additional HOD compliance flags or required repairs observed in this area..."
                          value={manualFeedback}
                          onChange={(e) => setManualFeedback(e.target.value)}
                          className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800 bg-slate-50 h-16 focus:outline-none focus:border-blue-500 focus:bg-white"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <span>Uploading Data To Excel Database...</span>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" /> Log Complete 1S Audit
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}
                </form>
              </div>

              {/* Camera Scanner Component Column */}
              <div className="lg:col-span-5 space-y-4">
                <CameraScanner
                  onScanCompleted={handleScanCompleted}
                  zone={selectedZone}
                  auditorName={auditorName}
                  auditorEmail={auditorEmail}
                />

                <div className="bg-slate-50 border border-slate-200 rounded p-3 flex gap-2 text-slate-600">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" id="instructions_info_icon" />
                  <div className="space-y-0.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-700">1S Sort System Instructions</h4>
                    <p className="text-[11px] leading-relaxed text-slate-500">
                      1S represents sorting out necessary and unnecessary materials and disposing of them appropriately. Snap your physical checklist paper or trigger one of our testing presets to analyze the grades directly.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. ADMIN ANALYTICS PORTAL */}
          {activePortal === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {!isAdminLoggedIn ? (
                // ADMIN DECRYPT LOGIN GATEWAY
                <div className="max-w-xs mx-auto bg-white border border-slate-300 rounded p-5 shadow-sm space-y-4 my-8" id="admin_login">
                  <div className="text-center space-y-1.5">
                    <div className="mx-auto w-8 h-8 bg-slate-100 text-slate-700 rounded flex items-center justify-center border border-slate-200">
                      <Lock className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Starsteel HOD Authentication</h3>
                    <p className="text-[10px] text-slate-400">
                      Enter authorized administration PIN to unlock variables database.
                    </p>
                  </div>

                  <form onSubmit={handleAdminVerify} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-455 mb-1 uppercase tracking-wider">
                        Coordinator PIN Code
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Authorized PIN"
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 text-center font-mono tracking-widest text-xs bg-slate-50 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                      {adminError && <p className="text-[10px] text-rose-600 font-semibold mt-1 text-center">{adminError}</p>}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5" /> Unlock Database Portals
                    </button>
                  </form>

                  <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center text-[10px] text-slate-500 font-medium font-mono">
                    Demo PINs: <span className="font-mono font-bold text-blue-600">1029</span> | <span className="font-mono font-bold text-blue-600">5432</span> | <span className="font-mono font-bold text-blue-600">8888</span>
                  </div>
                </div>
              ) : (
                // EXHAUSTIVE ADMIN DATABASE INTERFACES
                <div className="space-y-4">
                  {/* Stats Stripe block */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white border border-slate-200 p-3 rounded shadow-sm space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Total logged audits</span>
                      <p className="text-xl font-bold text-slate-900 leading-none font-sans">{totalAudits}</p>
                    </div>

                    <div className="bg-white border border-slate-200 p-3 rounded shadow-sm space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Avg 1S Compliance</span>
                      <p className={`text-xl font-bold leading-none font-sans ${averageCompliance >= 85 ? "text-emerald-600" : "text-amber-600"}`}>
                        {averageCompliance}%
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 p-3 rounded shadow-sm space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Excellent Grades</span>
                      <p className="text-xl font-bold text-emerald-600 leading-none font-sans">{excellentScoresCount}</p>
                    </div>

                    <div className="bg-white border border-slate-200 p-3 rounded shadow-sm space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Critical Actions</span>
                      <p className="text-xl font-bold text-rose-600 leading-none font-sans">{criticalIssuesCount}</p>
                    </div>
                  </div>

                  {/* HIGH ACCURACY CUSTOM VECTOR ANALYTICS CHARTS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Area Trend Chart */}
                    <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-3 font-sans">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">
                          1S Compliance trend over time (%)
                        </h4>
                        <p className="text-[10px] text-slate-400 font-sans">Chronological analysis of Starsteel Sort ratios</p>
                      </div>

                      {/* SVG Line & Area Render */}
                      <div className="h-40 w-full bg-slate-50 rounded p-2 border border-slate-200 flex flex-col justify-between">
                        {sortedDatesTrend.length > 0 ? (
                          <div className="relative w-full h-full flex flex-col justify-end">
                            {/* Grid vertical scaling labels */}
                            <div className="absolute left-1 top-0 bottom-0 flex flex-col justify-between text-[8px] text-slate-400 font-mono select-none pointer-events-none z-10 font-sans">
                              <span>100%</span>
                              <span>50%</span>
                              <span>0%</span>
                            </div>

                            {/* Main Canvas Area */}
                            <svg className="w-full h-28" viewBox="0 0 100 100" preserveAspectRatio="none">
                              {/* Create gradient */}
                              <defs>
                                <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" />
                                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                                </linearGradient>
                              </defs>

                              {/* Grid lines */}
                              <line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2"/>
                              <line x1="0" y1="0" x2="100" y2="0" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2"/>

                              {/* Draw area filled polygon */}
                              <polygon
                                points={`
                                  0,100
                                  ${sortedDatesTrend.map((t, idx) => {
                                    const x = (idx / Math.max(1, sortedDatesTrend.length - 1)) * 100;
                                    const y = 100 - t.avg;
                                    return `${x},${y}`;
                                  }).join(" ")}
                                  100,100
                                `}
                                fill="url(#area-grad)"
                              />

                              {/* Draw boundary polyline */}
                              <polyline
                                fill="none"
                                stroke="#2563eb"
                                strokeWidth="2.5"
                                points={sortedDatesTrend.map((t, idx) => {
                                  const x = (idx / Math.max(1, sortedDatesTrend.length - 1)) * 100;
                                  const y = 100 - t.avg;
                                  return `${x},${y}`;
                                }).join(" ")}
                              />
                            </svg>

                            {/* X-axis date labels */}
                            <div className="flex justify-between items-center px-4 pt-1 border-t border-slate-200 select-none">
                              {sortedDatesTrend.map((t, idx) => (
                                <span key={idx} className="text-[8px] font-mono font-semibold text-slate-400">
                                  {t.date.substring(5)}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-xs text-slate-400 font-sans">
                            Insufficient audit records to plot trend metrics.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Horizontal Bar breakdown chart */}
                    <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-3 font-sans">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">
                          Zone-Wise Average Compliance ratios (%)
                        </h4>
                        <p className="text-[10px] text-slate-400 font-sans">Actual score compare across active audited Starsteel areas</p>
                      </div>

                      <div className="h-40 w-full bg-slate-50 rounded p-3 border border-slate-200 overflow-y-auto space-y-2">
                        {zonePerformanceData.length > 0 ? (
                          zonePerformanceData.map((zp, id) => (
                            <div key={id} className="space-y-0.5 font-sans">
                              <div className="flex justify-between text-[10px] font-bold text-slate-655 font-sans">
                                <span className="truncate max-w-[70%] font-sans">{zp.name}</span>
                                <span className={`font-mono ${zp.avg >= 85 ? "text-emerald-750" : zp.avg >= 60 ? "text-amber-700" : "text-rose-700"}`}>
                                  {zp.avg}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    zp.avg >= 85 ? "bg-emerald-500" : zp.avg >= 60 ? "bg-amber-500" : "bg-rose-500"
                                  }`}
                                  style={{ width: `${zp.avg}%` }}
                                />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="h-full flex items-center justify-center text-xs text-slate-400 font-sans">
                            Perform first check scans to see zone comparisons.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* REAL-TIME ADMIN & HOD COORDINATION LOUNGE */}
                  <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-4 font-sans animate-fade-in" id="admin_coordination_chat">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                            <MessageSquare className="w-4 h-4 text-indigo-600" />
                            Starsteel HOD & Admin Real-time Chat Lounge
                          </h4>
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                          Coordinate quick workplace actions, broadcast sorting updates, or assign 1S tasks in real-time
                        </p>
                      </div>

                      {/* Chat Filters */}
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={selectedChatZoneFilter}
                          onChange={(e) => setSelectedChatZoneFilter(e.target.value)}
                          className="py-1 px-2 border border-slate-350 rounded text-[10px] text-slate-700 bg-slate-50 font-sans focus:outline-none focus:bg-white cursor-pointer"
                          id="chat_zone_filter"
                        >
                          <option value="All">Filter by: All Zones</option>
                          <option value="General / All">General / All</option>
                          {STARSTEEL_ZONES.map((zone, idx) => (
                            <option key={idx} value={zone.value}>
                              {zone.label}
                            </option>
                          ))}
                        </select>
                        
                        <div className="relative">
                          <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search messages..."
                            value={chatSearchFilter}
                            onChange={(e) => setChatSearchFilter(e.target.value)}
                            className="pl-7 pr-2 py-1 border border-slate-300 rounded text-[10px] bg-slate-50 w-36 focus:outline-none focus:bg-white focus:border-blue-500"
                            id="chat_text_search"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Left Column: Messages List representation */}
                      <div className="lg:col-span-8 flex flex-col justify-between border border-slate-200 rounded p-3 bg-slate-50 h-[340px]">
                        <div className="overflow-y-auto space-y-2.5 pr-1 flex-1 max-h-[260px] scroll-smooth" id="chat_messages_scroller">
                          {chatMessages
                            .filter((msg) => {
                              const matchesZone = selectedChatZoneFilter === "All" || msg.zone === selectedChatZoneFilter;
                              const matchesSearch = msg.message.toLowerCase().includes(chatSearchFilter.toLowerCase()) || 
                                msg.senderName.toLowerCase().includes(chatSearchFilter.toLowerCase());
                              return matchesZone && matchesSearch;
                            }).length > 0 ? (
                            chatMessages
                              .filter((msg) => {
                                const matchesZone = selectedChatZoneFilter === "All" || msg.zone === selectedChatZoneFilter;
                                const matchesSearch = msg.message.toLowerCase().includes(chatSearchFilter.toLowerCase()) || 
                                  msg.senderName.toLowerCase().includes(chatSearchFilter.toLowerCase());
                                return matchesZone && matchesSearch;
                              })
                              .map((msg, idx) => {
                                // Highlights message belonging to user
                                const isSelf = msg.senderPin === adminCode.trim();
                                return (
                                  <div
                                    key={msg.id || idx}
                                    className={`flex flex-col max-w-[85%] space-y-1 ${
                                      isSelf ? "ml-auto items-end" : "mr-auto items-start"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                        msg.senderPin === "8888" 
                                          ? "text-indigo-650 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded-sm" 
                                          : msg.senderPin === "1029"
                                          ? "text-blue-650 bg-blue-50 border border-blue-200 px-1 py-0.2 rounded-sm"
                                          : msg.senderPin === "5432"
                                          ? "text-orange-650 bg-orange-50 border border-orange-200 px-1 py-0.2 rounded-sm"
                                          : "text-slate-600 bg-slate-100 border border-slate-200 px-1 py-0.2 rounded-sm"
                                      }`}>
                                        {msg.senderName}
                                      </span>
                                      {msg.zone && msg.zone !== "General / All" && (
                                        <span className="text-[8px] font-mono bg-slate-200/80 px-1 py-0.2 rounded text-slate-500 max-w-[120px] truncate">
                                          🏷️ {msg.zone.replace(" - ", " ")}
                                        </span>
                                      )}
                                      <span className="text-[8px] text-slate-400 font-mono">
                                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                                      </span>
                                    </div>
                                    <div className={`p-2.5 rounded-lg text-xs leading-relaxed border shadow-xxs ${
                                      isSelf 
                                        ? "bg-indigo-600 text-white border-indigo-700 rounded-tr-none" 
                                        : "bg-white text-slate-800 border-slate-200 rounded-tl-none"
                                    }`}>
                                      {msg.message}
                                    </div>
                                  </div>
                                );
                              })
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-1">
                              <MessageSquare className="w-8 h-8 text-slate-300 stroke-1 animate-pulse" />
                              <p className="text-xs text-slate-450 font-bold">No Lounge Messages Found</p>
                              <p className="text-[10px] text-slate-400">Be the first to post a coordination update in the chat room!</p>
                            </div>
                          )}
                        </div>

                        {/* Input bar */}
                        <form onSubmit={handleSendChatMessage} className="flex gap-2 items-center border-t border-slate-200 pt-2.5 mt-2">
                          <input
                            type="text"
                            required
                            placeholder={`Reply as ${
                              adminCode.trim() === "1029" 
                                ? "Furnace-1 HOD" 
                                : adminCode.trim() === "5432" 
                                ? "ECR Room HOD" 
                                : adminCode.trim() === "8888" 
                                ? "Senior 5S Officer" 
                                : "Admin Coordinator"
                            }...`}
                            value={newMessageText}
                            onChange={(e) => setNewMessageText(e.target.value)}
                            className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs flex-grow focus:outline-none focus:border-indigo-500 shadow-xxs font-sans text-slate-800 placeholder-slate-400"
                            id="chat_input_text"
                          />
                          <button
                            type="submit"
                            disabled={isSendingMessage || !newMessageText.trim()}
                            className="p-1.5 rounded bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-350 text-white font-bold text-xs transition duration-150 flex items-center justify-center gap-1 cursor-pointer min-w-[70px]"
                            id="chat_submit_btn"
                          >
                            {isSendingMessage ? (
                              <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                <span>Send</span>
                              </>
                            )}
                          </button>
                        </form>
                      </div>

                      {/* Right Column: Mini Info Panel/Zone selection */}
                      <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded p-3 flex flex-col justify-between h-[340px]">
                        <div className="space-y-3">
                          <div>
                            <span className="text-[8px] font-bold text-indigo-600 uppercase tracking-widest block font-sans">Target Announcement Segment</span>
                            <h5 className="text-[11px] font-bold text-slate-700 font-sans">Associate Message with a Specific Area</h5>
                          </div>
                          
                          <p className="text-[10px] text-slate-450 leading-relaxed font-sans">
                            Assigning your message to a specific Starsteel zone allows HODs and auditors of that zone to filter and view targets.
                          </p>

                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Selected Tag Zone</label>
                            <select
                              value={chatSelectedZone}
                              onChange={(e) => setChatSelectedZone(e.target.value)}
                              className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded text-xs text-slate-700 font-sans focus:outline-none focus:border-indigo-500 cursor-pointer"
                              id="chat_message_zone_tag_select"
                            >
                              <option value="General / All">General / All Areas</option>
                              {STARSTEEL_ZONES.map((zone, idx) => (
                                <option key={idx} value={zone.value}>
                                  {zone.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Fast suggestions buttons list for frictionless trials */}
                        <div className="space-y-2 border-t border-slate-200 pt-3">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Quick Message Shortcuts</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setNewMessageText("⚠️ Critical 1S clutter alert! Please verify recent checklist and clean up immediately.");
                                setChatSelectedZone("FURNACE-1 -ZONE -1");
                              }}
                              className="p-1 bg-white hover:bg-rose-50 border border-rose-100 hover:border-rose-200 text-rose-700 rounded text-[9px] font-mono font-semibold transition text-left leading-tight truncate block"
                            >
                              ⚠️ Alert Clutter
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNewMessageText("🚀 Walkway cleared and certified compliant. High quality 5S sorting executed.");
                                setChatSelectedZone("General / All");
                              }}
                              className="p-1 bg-white hover:bg-emerald-50 border border-emerald-100 hover:border-emerald-200 text-emerald-700 rounded text-[9px] font-mono font-semibold transition text-left leading-tight truncate block"
                            >
                              🚀 Certify Sorted
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SUBMISSIONS DATABASE EXPLORER TABLE */}
                  <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-3 font-sans">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">
                          Logged 5S 1S Compliance database
                        </h4>
                        <p className="text-[10px] text-slate-400 font-sans">Explore, detail, and export records collected from fields</p>
                      </div>

                      {/* Export button */}
                      <button
                        onClick={handleExportToExcel}
                        className="px-2.5 py-1 bg-green-700 hover:bg-green-800 text-white rounded text-[11px] font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0 font-sans"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" /> Export to Excel (.xlsx)
                      </button>
                    </div>

                    {/* Filters bar */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={adminSearch}
                          onChange={(e) => setAdminSearch(e.target.value)}
                          placeholder="Search database by auditor, email, or zone name..."
                          className="pl-8 pr-2.5 py-1.5 border border-slate-350 rounded bg-slate-50 text-xs w-full text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                        />
                      </div>

                      <select
                        value={adminGroupFilter}
                        onChange={(e: any) => setAdminGroupFilter(e.target.value)}
                        className="py-1.5 px-2.5 border border-slate-350 rounded text-xs text-slate-700 bg-slate-50 font-sans focus:outline-none focus:bg-white"
                      >
                        <option value="All">All Category Groups</option>
                        <option value="General">General Zones</option>
                        <option value="SMS">SMS Steel Plant</option>
                      </select>
                    </div>

                    {/* Table Render */}
                    <div className="overflow-x-auto rounded border border-slate-200">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100/100 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="p-2.5 font-sans">Audit Date</th>
                            <th className="p-2.5 font-sans">Department Target / Zone</th>
                            <th className="p-2.5 font-sans">Auditor Spec</th>
                            <th className="p-2.5 text-center font-sans">Score Grade</th>
                            <th className="p-2.5 text-center font-sans">1S Efficiency (%)</th>
                            <th className="p-2.5 text-center font-sans">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {filteredAdminAudits.length > 0 ? (
                            filteredAdminAudits.map((aud, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/75 transition">
                                <td className="p-2.5 font-mono font-medium">{aud.date}</td>
                                <td className="p-2.5 font-semibold text-slate-800">
                                  <span>{aud.zone}</span>
                                  <span className="block text-[9px] text-slate-400 uppercase tracking-widest mt-0.5 font-sans font-bold">
                                    {aud.zoneGroup} Category
                                  </span>
                                </td>
                                <td className="p-2.5 font-sans">
                                  <span className="font-semibold block font-sans">{aud.auditorName}</span>
                                  <span className="text-[10px] text-slate-400 font-mono block">{aud.auditorEmail}</span>
                                </td>
                                <td className="p-2.5 text-center font-mono font-bold text-slate-500">
                                  {aud.totalScore} / 25
                                </td>
                                <td className="p-2.5 text-center font-sans font-bold">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] ${
                                      aud.compliancePercentage >= 85
                                        ? "text-emerald-700 bg-emerald-50"
                                        : aud.compliancePercentage >= 65
                                        ? "text-amber-700 bg-amber-50"
                                        : "text-rose-700 bg-rose-50"
                                    }`}
                                  >
                                    {aud.compliancePercentage}%
                                  </span>
                                </td>
                                <td className="p-2.5 text-center font-sans">
                                  <button
                                    onClick={() => setSelectedAuditDetail(aud)}
                                    className="p-1 px-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded border border-blue-200 transition inline-flex items-center gap-1 font-bold cursor-pointer text-[10px]"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> View Scans
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold font-sans">
                                No records found matching current search parameters in database.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* 3. SETUP MAN CODE LISTINGS PORTAL */}
          {activePortal === "manual" && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <SetupDocManual />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER ACCENTS */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Starsteel Operations. Crafted strictly with 1S Sort industrial disciplines.</p>
          <div className="flex gap-4 font-bold text-indigo-600">
            <span className="p-1 hover:underline cursor-pointer" onClick={() => setActivePortal("operator")}>
              Operator Platform
            </span>
            <span className="p-1 hover:underline cursor-pointer" onClick={() => setActivePortal("admin")}>
              HOD Database Terminal
            </span>
          </div>
        </div>
      </footer>

      {/* DIALOG A: AUDIT SUCCESS CONGRATUALATIONS */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white max-w-sm w-full border border-slate-200 rounded-xl p-5 text-center space-y-4 shadow-xl"
          >
            <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-800">1S Sort Audit Registered!</h4>
              <p className="text-xs text-slate-500">
                The compliance log has been safely recorded inside the persistent multi-user database spreadsheet. The managing zone HOD was alert triggered.
              </p>
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
            >
              Close and Log Next Audit
            </button>
          </motion.div>
        </div>
      )}

      {/* DIALOG B: EXHAUSTIVE RECORD INSPECTOR */}
      {selectedAuditDetail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white max-w-2xl w-full border border-slate-200 rounded-xl shadow-2xl overflow-hidden my-8"
          >
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase block">
                  Coded Audit details
                </span>
                <h4 className="text-sm font-bold truncate pr-4">{selectedAuditDetail.zone}</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold bg-white/10 px-2.5 py-1 rounded">
                  Perf: {selectedAuditDetail.compliancePercentage}%
                </span>
                <button
                  onClick={() => setSelectedAuditDetail(null)}
                  className="font-bold text-xs bg-white/15 px-2 py-1 rounded hover:bg-white/25 transition cursor-pointer"
                >
                  X
                </button>
              </div>
            </div>

            {/* Inner Content Grid */}
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto text-slate-700">
              {/* Profile card metadata details */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Inspector auditor</span>
                  <span className="font-semibold text-slate-800">{selectedAuditDetail.auditorName}</span>
                  <span className="block text-[10px] font-mono">{selectedAuditDetail.auditorEmail}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Date recorded</span>
                  <span className="font-semibold text-slate-800">{selectedAuditDetail.date}</span>
                  <span className="block text-[10px] uppercase font-bold text-slate-450 mt-1">HOD Coordinator:</span>
                  <span className="font-semibold text-[10px] text-slate-700">
                    {STARSTEEL_ZONES.find((z) => z.value === selectedAuditDetail.zone)?.hod || "Coordinator"}
                  </span>
                </div>
              </div>

              {/* Vector site layout and scanned paper cards double showcase */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block pb-1">
                    Checklist Document Scan:
                  </span>
                  <div className="border border-slate-200 rounded-lg overflow-hidden h-44 bg-slate-50">
                    <img
                      src={selectedAuditDetail.checklistImg}
                      alt="Paper Scan"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block pb-1">
                    5S Location Spot Photo:
                  </span>
                  <div className="border border-slate-200 rounded-lg overflow-hidden h-44 bg-slate-50">
                    <img
                      src={selectedAuditDetail.siteImg}
                      alt="5S Site spot"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* 5S Sorted Breakdown table metrics */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-bold uppercase text-slate-400">1S Compliance Grading details:</h5>
                <div className="space-y-2 text-xs">
                  {Object.entries(selectedAuditDetail.scores).map(([key, val]: any, i) => {
                    const labelList: any = {
                      sortingUnnecessary: "Sorting & Disposing Obsolete Items (1S Sort)",
                      clearAisles: "Walkways, Aisles & Doorways Clear of Blockage",
                      storageLabels: "Storage Organization & Label Placements",
                      binDisposal: "Waste Segregation & Bin Deployments",
                      safetyHazards: "Immediate Action on Tripping/Leak Hazards",
                    };
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-slate-600">
                          <span>{labelList[key] || key}</span>
                          <span className="font-bold">{val} / 5</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              val >= 4 ? "bg-emerald-500" : val >= 3 ? "bg-amber-400" : "bg-rose-500"
                            }`}
                            style={{ width: `${(val / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Comments details */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <span className="font-bold text-[10px] uppercase text-slate-400 block">Corrective notes</span>
                <p className="text-slate-700 italic mt-0.5">{selectedAuditDetail.feedback}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 p-4 flex justify-end">
              <button
                onClick={() => setSelectedAuditDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Close Audit Viewer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
