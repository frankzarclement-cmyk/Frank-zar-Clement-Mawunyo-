import React, { useState, useRef, useEffect } from "react";
import { Camera, Image as ImageIcon, Trash2, CheckCircle, AlertTriangle, Scan, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CameraScannerProps {
  onScanCompleted: (result: {
    scores: {
      sortingUnnecessary: number;
      clearAisles: number;
      storageLabels: number;
      binDisposal: number;
      safetyHazards: number;
    };
    auditorName?: string;
    auditorEmail?: string;
    zone?: string;
    date?: string;
    checklistImg: string;
    message: string;
  }) => void;
  zone: string;
  auditorName: string;
  auditorEmail: string;
}

// Sample High-Fidelity base64 paper presets for rapid sandbox auditing trials
import { MOCK_CHECKLIST_GOOD, MOCK_CHECKLIST_POOR, MOCK_SITES } from "../data/mock-presets";

export default function CameraScanner({ onScanCompleted, zone, auditorName, auditorEmail }: CameraScannerProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [checklistImg, setChecklistImg] = useState<string | null>(null);
  const [siteImg, setSiteImg] = useState<string | null>(null);

  const [scanState, setScanState] = useState<"idle" | "aligning" | "analyzing" | "completed" | "failed">("idle");
  const [scanMessage, setScanMessage] = useState("Scan to analyze 1S parameters.");
  const [isBoxAligned, setIsBoxAligned] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-scanning simulation checklist loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (scanState === "aligning") {
      setIsBoxAligned(false);
      setScanMessage("Align checklist sheet inside the bounding outline...");

      // Simulate document-scanning box trigger cycle
      timer = setTimeout(() => {
        setIsBoxAligned(true);
        setScanMessage("Checklist writings detected! Keep steady for automatic focus...");
        
        // Auto-snap shot triggered 2 seconds after green alignment detection
        timer = setTimeout(() => {
          if (scanState === "aligning") {
            handleAutoCapture();
          }
        }, 1800);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [scanState]);

  // Clean-up video streams
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      setChecklistImg(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
      setScanState("aligning");
    } catch (err: any) {
      console.warn("Unable to capture video stream. Displaying fallback document upload dashboard.", err);
      setCameraError("Camera permission blocked or inaccessible. Please use standard file upload or loaded trial presets.");
      setCameraActive(false);
    }
  };

  const handleAutoCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");
    if (context) {
      canvas.width = 640;
      canvas.height = 480;
      context.drawImage(video, 0, 0, 640, 480);
      const dataUrl = canvas.toDataURL("image/png");
      setChecklistImg(dataUrl);
      stopCamera();
      triggerServerAnalysis(dataUrl);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const selectMockPreset = (type: "good" | "poor") => {
    const selectedPreset = type === "good" ? MOCK_CHECKLIST_GOOD : MOCK_CHECKLIST_POOR;
    setChecklistImg(selectedPreset);
    triggerServerAnalysis(selectedPreset);
  };

  const triggerServerAnalysis = async (imgUri: string) => {
    setScanState("analyzing");
    setScanMessage("Processing checklist text values with Gemini-3.5-Flash...");
    try {
      const response = await fetch("/api/gemini/analyze-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklistImg: imgUri }),
      });

      if (!response.ok) {
        throw new Error("Checker parsing endpoint failed");
      }

      const report = await response.json();

      if (report.status === "valid" && report.extractedData) {
        setScanState("completed");
        setScanMessage(report.message || "1S analysis completed successfully.");
        
        // Pass scanned scores back up to root form state
        onScanCompleted({
          scores: report.extractedData.scores,
          auditorName: report.extractedData.auditorName || auditorName,
          auditorEmail: report.extractedData.auditorEmail || auditorEmail,
          zone: report.extractedData.zone || zone,
          date: report.extractedData.date || new Date().toISOString().split("T")[0],
          checklistImg: imgUri,
          message: report.message,
        });
      } else {
        setScanState("failed");
        setScanMessage(report.message || "The writings on the sheet are blurry or improperly framed. Try again.");
      }
    } catch (err) {
      console.error(err);
      setScanState("failed");
      setScanMessage("Network offline or server busy analyzing documents. Please check connection.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setChecklistImg(reader.result);
          triggerServerAnalysis(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const resetScanner = () => {
    setChecklistImg(null);
    setScanState("idle");
    setScanMessage("Scan to analyze 1S parameters.");
    setIsBoxAligned(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-5" id="camera_section">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Scan className="w-5 h-5 text-indigo-600" />
            1S Checklist Sheet Scanner
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-capture and OCR scan Starsteel scorecard papers using server-side Gemini AI.
          </p>
        </div>
        {checklistImg && (
          <button
            onClick={resetScanner}
            className="text-xs text-rose-600 font-medium hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Re-scan
          </button>
        )}
      </div>

      {!checklistImg && !cameraActive && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 relative overflow-hidden transition hover:border-slate-300">
            <div className="flex flex-col items-center max-w-sm mx-auto space-y-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                <Camera className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Scan Paper Audit Checklist</p>
              <p className="text-xs text-slate-400">
                Position your written Starsteel 1S audit checklist paper within the scanning frame, and our system will snap it and grade scores automatically.
              </p>
              
              <div className="flex flex-wrap gap-2 pt-2 justify-center">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4" /> Open Camera Feed
                </button>

                <label className="px-4 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 hover:border-slate-300 transition shadow-sm cursor-pointer flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-slate-500" /> Upload Form
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Preset trial files section */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/60">
            <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-2">
              No Physical Sheet? Test Instantly with Trial Presets:
            </p>
            <div className="grid grid-cols-2 gap-2 text-center">
              <button
                type="button"
                onClick={() => selectMockPreset("good")}
                className="p-2 border border-emerald-100 bg-emerald-50 text-emerald-800 text-xs rounded hover:bg-emerald-100 transition font-medium flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Loaded: High-SGP Preset (92%)
              </button>
              <button
                type="button"
                onClick={() => selectMockPreset("poor")}
                className="p-2 border border-amber-100 bg-amber-50 text-amber-800 text-xs rounded hover:bg-amber-100 transition font-medium flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Loaded: Action Preset (52%)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live web RTC camera container with alignment brackets */}
      {cameraActive && (
        <div className="relative border border-slate-300 rounded-xl overflow-hidden bg-slate-900 shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-72 object-cover"
          />

          {/* Holo Document Framing Hud */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className={`w-60 h-44 border-2 border-dashed rounded-lg transition-all duration-300 relative ${
                isBoxAligned ? "border-emerald-500 bg-emerald-50/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "border-rose-500 bg-rose-50/5"
              }`}
            >
              {/* Corner brackets */}
              <div className={`absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 -mt-1 -ml-1 ${isBoxAligned ? "border-emerald-400" : "border-rose-400"}`} />
              <div className={`absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 -mt-1 -mr-1 ${isBoxAligned ? "border-emerald-400" : "border-rose-400"}`} />
              <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 -mb-1 -ml-1 ${isBoxAligned ? "border-emerald-400" : "border-rose-400"}`} />
              <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 -mb-1 -mr-1 ${isBoxAligned ? "border-emerald-400" : "border-rose-400"}`} />

              <span className={`absolute inset-x-0 -bottom-6 text-[10px] text-center font-bold tracking-wider uppercase ${isBoxAligned ? "text-emerald-400" : "text-rose-400"}`}>
                {isBoxAligned ? "Checklist Aligned! Capturing..." : "Fit checklist paper in box"}
              </span>
            </div>
          </div>

          {/* Feedback control bar */}
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-between px-4 pointer-events-auto">
            <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 text-[11px] text-white rounded-full font-medium">
              <Scan className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span>{scanMessage}</span>
            </div>
            
            <button
              onClick={stopCamera}
              className="px-3 py-1 bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Analyzing or Completed overlay details state */}
      {checklistImg && (
        <div className="space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:w-32 h-24 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
              <img src={checklistImg} alt="Paper Scanned Checklist" className="w-full h-full object-cover" />
              <div className="absolute bottom-1 right-1 bg-indigo-600 text-white rounded p-1">
                <Scan className="w-3 h-3" />
              </div>
            </div>

            <div className="flex-1 w-full text-slate-700 space-y-1">
              <div className="flex items-center gap-1.5">
                {scanState === "analyzing" && (
                  <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                )}
                {scanState === "completed" && (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                )}
                {scanState === "failed" && (
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                )}
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  A.I. Checker Status:
                </span>
                <span className={`text-xs ml-1 font-semibold ${
                  scanState === "completed" ? "text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded" :
                  scanState === "failed" ? "text-rose-700 bg-rose-50 px-2 py-0.5 rounded" : "text-amber-700 bg-amber-50 px-2 py-0.5 rounded"
                }`}>
                  {scanState.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2 mt-1">{scanMessage}</p>
              {scanState === "failed" && (
                <button
                  onClick={resetScanner}
                  className="text-xs font-semibold text-indigo-600 hover:underline mt-1.5 block"
                >
                  Clear and Scan Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
