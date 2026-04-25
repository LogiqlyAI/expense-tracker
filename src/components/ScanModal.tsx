"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { EXPENSE_CATEGORIES } from "@/lib/validations";
import { CURRENCIES } from "@/lib/currencies";

const CATEGORY_LABELS: Record<string, string> = {
  GROCERIES: "Groceries",
  DINING: "Dining",
  TRANSPORTATION: "Transportation",
  ENTERTAINMENT: "Entertainment",
  UTILITIES: "Utilities",
  HEALTHCARE: "Healthcare",
  SHOPPING: "Shopping",
  TRAVEL: "Travel",
  OTHER: "Other",
};

interface ScanResult {
  merchant: string;
  amount: number;
  date: string;
  category: string;
  description?: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

type Step = "choose" | "scanning" | "review";
type InputMode = "upload" | "camera";

interface ScanModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function ScanModal({ open, onClose, onSaved }: ScanModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<Step>("choose");
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [currency, setCurrency] = useState("SGD");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Clean up camera on unmount or close
  useEffect(() => {
    if (!open) {
      stopCamera();
      // Reset state when modal closes
      setStep("choose");
      setInputMode("upload");
      setPreview(null);
      setFile(null);
      setResult(null);
      setError("");
      setSaving(false);
    }
  }, [open, stopCamera]);

  async function startCamera() {
    setError("");
    setInputMode("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      setCameraActive(true);
      // Wait for video element to be rendered
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch {
      setError("Could not access camera. Please check permissions or use file upload instead.");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setPreview(dataUrl);

    // Convert to File
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const capturedFile = new File([blob], "receipt-capture.jpg", { type: "image/jpeg" });
          setFile(capturedFile);
        }
      },
      "image/jpeg",
      0.9
    );

    stopCamera();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(selected);
  }

  async function handleScan() {
    if (!file) return;
    setStep("scanning");
    setError("");

    const formData = new FormData();
    formData.append("receipt", file);

    try {
      const res = await fetch("/api/expenses/scan", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Scan failed");
        setStep("choose");
        return;
      }

      const scanResult: ScanResult = data.result;
      setResult(scanResult);
      setMerchant(scanResult.merchant);
      setAmount(scanResult.amount.toString());
      setDate(scanResult.date);
      setCategory(scanResult.category);
      setDescription(scanResult.description || "");
      setStep("review");
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("choose");
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant,
          amount: parseFloat(amount),
          quantity: parseInt(quantity) || 1,
          currency,
          date,
          category,
          description: description || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save");
        setSaving(false);
        return;
      }

      toast.success("Expense saved from receipt");
      onSaved();
      onClose();
    } catch {
      toast.error("Something went wrong");
      setSaving(false);
    }
  }

  function handleReset() {
    stopCamera();
    setStep("choose");
    setInputMode("upload");
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (!open) return null;

  const inputClass = "mt-1 block w-full rounded-lg border px-3 py-2.5 text-sm";
  const labelClass = "block text-sm font-medium";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}>
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}
      >
        {/* Close button */}
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="absolute right-4 top-4 rounded-lg p-1 transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Scan Receipt</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Upload a photo or use your camera to scan a receipt.
        </p>

        {error && (
          <div className="mt-3 rounded-lg p-3 text-sm" style={{ backgroundColor: "rgba(255, 107, 107, 0.1)", color: "var(--accent-red)" }}>
            {error}
          </div>
        )}

        <div className="mt-5">
          {/* Step 1: Choose input method */}
          {step === "choose" && (
            <div className="space-y-4">
              {/* Show preview if we have one */}
              {preview && (
                <div className="relative">
                  <img src={preview} alt="Receipt preview" className="max-h-48 w-full rounded-xl object-contain" style={{ backgroundColor: "var(--bg-primary)" }} />
                  <button
                    onClick={handleReset}
                    className="absolute right-2 top-2 rounded-lg p-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff" }}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Camera view */}
              {cameraActive && !preview && (
                <div className="relative overflow-hidden rounded-xl" style={{ backgroundColor: "#000" }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full"
                    style={{ maxHeight: "300px", objectFit: "cover" }}
                  />
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                    <button
                      onClick={capturePhoto}
                      className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white"
                      style={{ background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))" }}
                    >
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={stopCamera}
                      className="flex h-10 w-10 items-center justify-center self-center rounded-full"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Upload / Camera buttons */}
              {!preview && !cameraActive && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors"
                    style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-primary)" }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))", opacity: 0.8 }}>
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3M6.75 19.25h10.5a2 2 0 002-2V8.56a2 2 0 00-.586-1.414l-3.31-3.31A2 2 0 0013.94 3.25H6.75a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Upload File</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>JPEG, PNG, WebP</span>
                  </button>

                  <button
                    onClick={startCamera}
                    className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors"
                    style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-primary)" }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg, var(--accent-teal), var(--accent-blue))", opacity: 0.8 }}>
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Use Camera</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Take a photo</span>
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Hidden canvas for camera capture */}
              <canvas ref={canvasRef} className="hidden" />

              {file && (
                <button
                  onClick={handleScan}
                  className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))" }}
                >
                  Scan Receipt
                </button>
              )}
            </div>
          )}

          {/* Step 2: Scanning */}
          {step === "scanning" && (
            <div className="flex flex-col items-center py-8">
              <div className="h-10 w-10 animate-spin rounded-full border-4" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--accent-purple)" }} />
              <p className="mt-4 font-medium" style={{ color: "var(--text-primary)" }}>Scanning your receipt...</p>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>This may take a few seconds</p>
            </div>
          )}

          {/* Step 3: Review */}
          {step === "review" && result && (
            <div className="space-y-4">
              {result.confidence === "LOW" && (
                <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "rgba(253, 203, 110, 0.1)", color: "var(--accent-yellow)" }}>
                  Low confidence scan — please review all fields carefully.
                </div>
              )}
              {result.confidence === "MEDIUM" && (
                <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "rgba(116, 185, 255, 0.1)", color: "var(--accent-blue)" }}>
                  Medium confidence — some fields may need correction.
                </div>
              )}

              <div>
                <label className={labelClass} style={{ color: "var(--text-secondary)" }}>Merchant</label>
                <input type="text" value={merchant} onChange={(e) => setMerchant(e.target.value)} className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} style={{ color: "var(--text-secondary)" }}>Amount</label>
                  <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} style={{ color: "var(--text-secondary)" }}>Quantity</label>
                  <input type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} style={{ color: "var(--text-secondary)" }}>Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} style={{ color: "var(--text-secondary)" }}>Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass} style={{ color: "var(--text-secondary)" }}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass} style={{ color: "var(--text-secondary)" }}>Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))" }}
                >
                  {saving ? "Saving..." : "Save Expense"}
                </button>
                <button
                  onClick={handleReset}
                  className="rounded-lg border px-5 py-2.5 text-sm font-medium"
                  style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
                >
                  Scan Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
