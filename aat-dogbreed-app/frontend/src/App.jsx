import React, { useRef, useState } from "react";

// --- API base (quiet & safe) -------------------------------------------------
function getApiBase() {
  const DEF = "http://localhost:8000";
  let fromUrl = null;
  try {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      fromUrl = url.searchParams.get("api") || url.searchParams.get("base");
    }
  } catch (_) {}
  const fromWin = (typeof window !== "undefined" && window.AAT_API_BASE) ? String(window.AAT_API_BASE) : null;
  let fromStorage = null;
  try { fromStorage = (typeof localStorage !== "undefined") ? localStorage.getItem("AAT_API_BASE") : null; } catch (_) {}
  const g = (typeof globalThis !== "undefined") ? globalThis : {};
  const fromGlobalThis = g.__VITE_API_BASE__ || g.VITE_API_BASE || null;
  return fromUrl || fromWin || fromStorage || fromGlobalThis || DEF;
}

const LOGO_SRC = "/logo.png"; // put a file at public/logo.png

function Header({ logoSrc, title, subtitle }) {
  return (
    <header className="w-full sticky top-0 z-10 bg-[#F1FAEE]/90 backdrop-blur supports-[backdrop-filter]:bg-[#F1FAEE]/70 border-b border-[#A8DADC]/30">
      <div className="mx-auto w-full max-w-[420px] flex items-center gap-3 p-3">
        <img
          src={logoSrc}
          alt="Logo"
          className="w-8 h-8 md:w-30 md:h-30 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.08)] object-contain"
        />        
        <div className="leading-tight">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1D3557] drop-shadow-sm">
            {title}
          </h1>
          <p className="text-xs text-[#2F2F2F]/70">{subtitle}</p>
        </div>
      </div>
    </header>
  );
}

function Dropzone({ onFile, accept = "image/*" }) {
  const inputRef = useRef(null);
  const handleFiles = (files) => { const f = files?.[0]; if (f) onFile(f); };
  return (
    <div
      className="border-2 border-dashed border-[#457B9D]/60 rounded-2xl bg-white hover:bg-[#A8DADC]/20 cursor-pointer p-6 text-center"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
    >
      <input type="file" accept={accept} ref={inputRef} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <p className="text-[#2F2F2F]/70">Tap to select or drag & drop an image</p>
    </div>
  );
}

function Bars({ items }) {
  if (!items?.length) return null;
  const max = Math.max(...items.map((d) => d.prob || 0), 0.0001);
  return (
    <div className="space-y-2">
      {items.map((t, i) => {
        const pct = (t.prob / max) * 100;
        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-[#2F2F2F]">{i + 1}. {t.label.replaceAll("_", " ")}</span>
              <span className="text-[#2F2F2F]/80">{(t.prob * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-[#A8DADC]/40 overflow-hidden">
              <div className="h-3 rounded-full" style={{ width: `${pct}%`, backgroundColor: "#457B9D" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [apiBase] = useState(getApiBase());
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [pred, setPred] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const shell = "bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.08)] p-4 border border-[#A8DADC]/30";
  const btnPrimary = "bg-[#1D3557] text-white px-5 py-3 rounded-2xl text-base font-semibold hover:opacity-90 active:scale-95 disabled:opacity-60 w-full";
  const btnSecondary = "bg-[#457B9D] text-white px-4 py-3 rounded-2xl text-base font-medium hover:opacity-90 active:scale-95 w-full";

  const onFile = (f) => {
    setFile(f); setPred(null); setError("");
    const url = URL.createObjectURL(f); setPreview(url);
  };

  const classify = async () => {
    if (!file) return;
    setLoading(true); setError("");
    try {
      const form = new FormData(); form.append("file", file);
      const res = await fetch(`${apiBase}/predict`, { method: "POST", body: form });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json(); setPred(data);
    } catch (e) { setError(e.message || "Failed to classify"); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-[#F1FAEE] min-h-[100svh]">
      <div className="mx-auto w-full max-w-[420px] min-h-[100svh] flex flex-col">
        <Header logoSrc={LOGO_SRC} title="Dog Breed Identification" subtitle="Upload → Predict (Top-K)" />

        <main className="flex-1 p-3 space-y-4">
          <div className={`${shell} space-y-4`}>
            <h2 className="text-base font-semibold text-[#1D3557]">Upload Image</h2>
            <Dropzone onFile={onFile} />
            {preview && (
              <div className="rounded-xl overflow-hidden border border-[#A8DADC]/40">
                <img src={preview} className="w-full max-h-[420px] object-contain bg-white" alt="preview" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button className={btnPrimary} onClick={classify} disabled={!file || loading}>
                {loading ? "Classifying…" : "Classify"}
              </button>
              <button className={btnSecondary} onClick={() => { setFile(null); setPreview(null); setPred(null); setError(""); }}>
                Reset
              </button>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>

          <div className={`${shell} space-y-3`}>
            <h2 className="text-base font-semibold text-[#1D3557]">Results</h2>
            {!pred && <p className="text-[#2F2F2F]/70">No predictions yet. Upload an image and tap <strong>Classify</strong>.</p>}
            {pred && <Bars items={pred.top} />}
          </div>
        </main>

        <footer className="py-6 text-center text-[#2F2F2F]/60 text-xs">
          <p>
            © {new Date().getFullYear()} Applied AI Tutorials — <a href="https://appliedaitutorials.com" className="underline" target="_blank" rel="noreferrer">appliedaitutorials.com</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
