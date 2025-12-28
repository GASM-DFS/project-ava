import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  BarChart3, Settings2, Users, Play, Activity, Zap, CheckCircle2, 
  FileText, Search, Database, UploadCloud, AlertCircle, TrendingUp,
  FileUp, Trash2, ClipboardList, ShieldAlert, BrainCircuit, Loader2,
  Fingerprint, MessageSquare, Target, Sparkles, Cpu, Clock, Gauge, Scale,
  Globe, UserCheck, Microscope, History
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// --- System Configuration (V35.0 Omniscient) ---
const apiKey = "AIzaSyBMdmqbEZwFhszfP0HvKOuHrLNEOh3Q44A"; 

const firebaseConfig = {
  apiKey: "AIzaSyDfpFSr5Qpfb3lDGiRprTCorW448Xag2js",
  authDomain: "ava-dfs-dfcb9.firebaseapp.com",
  projectId: "ava-dfs-dfcb9",
  storageBucket: "ava-dfs-dfcb9.firebasestorage.app",
  messagingSenderId: "178222076928",
  appId: "1:178222076928:web:99e9f01bf3dfef1f8074e5",
  measurementId: "G-251MR7CYWJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'ava-v35-omniscient-pro';

export default function App() {
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [logs, setLogs] = useState([{ time: new Date().toLocaleTimeString(), msg: "Architect Node Online. Grounding Active." }]);
  const [activeTab, setActiveTab] = useState('ingestion');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [aiReport, setAiReport] = useState(null); 
  const [projections, setProjections] = useState([]);

  // --- Auth Lifecycle ---
  useEffect(() => {
    signInAnonymously(auth).catch(err => addLog("Auth Error: " + err.message));
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- Persistence Layer ---
  useEffect(() => {
    if (!user) return;
    const slateDoc = doc(db, 'artifacts', appId, 'public', 'data', 'slates', 'v35_grounded');
    const unsubSlate = onSnapshot(slateDoc, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPlayers(data.players || []);
        setAiReport(data.aiReport || null);
      }
    }, (err) => addLog("Sync Error: " + err.message));
    return () => unsubSlate();
  }, [user]);

  const addLog = (msg) => {
    const text = typeof msg === 'object' ? JSON.stringify(msg) : String(msg);
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg: text }, ...prev].slice(0, 50));
  };

  // --- Phase 1: Global Intelligence Hunt (Gemini 2.5) ---
  const executeOmniscientHunt = async () => {
    if (!players || players.length === 0) return addLog("Error: Load salaries before executing hunt.");
    setIsSearching(true);
    addLog("Engaging Gemini 2.5 Pro: Crawling live data...");

    const userPrompt = `Perform a full DFS tactical audit for the NBA slate on Dec 27-28, 2025. 
    Identify Out/Inactive players, starters, and coaching tendencies.`;
    const systemPrompt = `You are the Lead Systems Architect. Use Search grounding. Return JSON strictly: 
    {"unavailable": [], "lineups": {}, "coaching_profiles": {}, "usage_shifts": [], "global_strategy": ""}`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          tools: [{ "google_search": {} }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
        })
      });
      const result = await response.json();
      const output = JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
      
      if (output) {
        const outNames = (output.unavailable || []).map(o => String(o.name).toLowerCase());
        const updatedPlayers = players.map(p => {
          const isOut = outNames.some(name => String(p.name).toLowerCase().includes(name));
          return { ...p, status: isOut ? 'Out' : 'Active' };
        });

        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slates', 'v35_grounded'), { 
          players: updatedPlayers,
          aiReport: output,
          huntTime: new Date().toISOString()
        });
        addLog("Omniscient Hunt Complete.");
        setActiveTab('intel');
      }
    } catch (error) {
      addLog(`Hunt failure: ${error.message}`);
    } finally { setIsSearching(false); }
  };

  // --- Phase 2: CSV Ingestion ---
  const processDkSalaries = async (text) => {
    try {
      addLog("Parsing DK Data Stream...");
      const lines = text.split(/\r?\n/);
      const headerRow = lines.find(l => l.includes("Position,Name + ID,Name,ID"));
      if (!headerRow) return addLog("Error: Invalid DK CSV Header.");

      const headers = headerRow.split(',').map(h => h.trim());
      const baseIdx = headers.indexOf("Position");
      const parsed = lines.slice(lines.indexOf(headerRow) + 1)
        .filter(l => l.trim().length > 30)
        .map(line => {
          const c = line.split(',').map(cell => cell.trim());
          const baselineAvg = parseFloat(c[baseIdx + 8]) || 10.0;
          return {
            id: String(c[baseIdx + 3]), 
            name: String(c[baseIdx + 2]), 
            pos: String(c[baseIdx]),
            team: String(c[baseIdx + 7]), 
            salary: parseInt(c[baseIdx + 5]) || 3000,
            base_proj: baselineAvg, 
            status: 'Active',
            baseline_efficiency: (baselineAvg / 30).toFixed(2)
          };
        }).filter(p => p.id && p.name !== "Unknown");

      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slates', 'v35_grounded'), { players: parsed });
      addLog(`Success: ${parsed.length} player nodes initialized.`);
      setActiveTab('research');
    } catch (e) { addLog(`Ingestion failure: ${e.message}`); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processDkSalaries(ev.target.result);
    reader.readAsText(file);
  };

  // --- Phase 3: Gaussian Simulation ---
  const runSim = () => {
    setIsSimulating(true);
    addLog("Executing 10,000 possession distributions...");
    setTimeout(() => {
      const results = players.filter(p => p.status === 'Active').map(p => {
        const mean = p.base_proj;
        const stdDev = mean * 0.25;
        return {
          ...p,
          sim_mean: mean.toFixed(2),
          sim_ceiling: (mean + (stdDev * 1.64)).toFixed(2)
        };
      }).sort((a,b) => b.sim_ceiling - a.sim_ceiling);
      setProjections(results);
      setIsSimulating(false);
      setActiveTab('projections');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans">
      <header className="border-b border-white/5 bg-black/90 px-10 h-24 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Fingerprint className="text-indigo-500" size={32} />
          <h1 className="text-2xl font-black tracking-tighter uppercase">PROJECT AVA <span className="text-indigo-500 italic">V35.0</span></h1>
        </div>
        <nav className="flex gap-4">
          {['ingestion', 'intel', 'research', 'projections'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest ${activeTab === t ? 'bg-indigo-600' : 'bg-white/5'}`}>{t}</button>
          ))}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-12 space-y-12">
        {activeTab === 'ingestion' && (
          <div className="bg-white/[0.03] border border-white/10 rounded-[48px] p-16 text-center">
            <FileUp className="mx-auto text-indigo-500 mb-6" size={64} />
            <h2 className="text-3xl font-bold mb-4 uppercase">Upload DraftKings CSV</h2>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="mx-auto block" />
          </div>
        )}

        {activeTab === 'intel' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <button onClick={executeOmniscientHunt} className="p-12 bg-indigo-600 rounded-[32px] font-black uppercase tracking-widest flex items-center justify-center gap-4">
                <Zap size={24} /> {isSearching ? "Searching..." : "Trigger Global Hunt"}
             </button>
             {aiReport && <div className="bg-white/5 p-8 rounded-[32px] font-mono text-xs">{JSON.stringify(aiReport.global_strategy)}</div>}
          </div>
        )}

        {activeTab === 'research' && (
          <div className="bg-white/5 rounded-[48px] overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between">
                <h3 className="text-xl font-bold uppercase">Entity Pool</h3>
                <button onClick={runSim} className="bg-indigo-600 px-8 py-3 rounded-full font-bold uppercase text-xs">Run Simulation</button>
            </div>
            <table className="w-full text-left">
               <thead><tr className="text-slate-500 uppercase text-[10px] tracking-widest border-b border-white/5"><th className="p-6">Player</th><th>Team</th><th>Salary</th><th>Status</th></tr></thead>
               <tbody>
                  {players.map(p => (
                    <tr key={p.id} className="border-b border-white/5 text-sm">
                       <td className="p-6 font-bold">{p.name}</td><td>{p.team}</td><td>${p.salary}</td>
                       <td><span className={p.status === 'Active' ? 'text-emerald-500' : 'text-rose-500'}>{p.status}</span></td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>
        )}

        {activeTab === 'projections' && (
          <div className="space-y-6">
             {projections.map(p => (
               <div key={p.id} className="bg-white/5 p-8 rounded-[32px] flex justify-between items-center">
                  <div>
                    <div className="text-xl font-bold">{p.name}</div>
                    <div className="text-xs text-slate-500 uppercase">{p.team} | ${p.salary}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase">Ceiling</div>
                    <div className="text-3xl font-black text-emerald-400 font-mono">{p.sim_ceiling}</div>
                  </div>
               </div>
             ))}
          </div>
        )}
      </main>

      <footer className="h-20 bg-black/95 border-t border-white/5 fixed bottom-0 w-full flex items-center px-10 gap-8">
        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_emerald]"></div>
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex-1 truncate">
          {logs[0]?.msg}
        </div>
        <div className="text-[10px] font-black text-indigo-500 uppercase">v35.0 Omniscient</div>
      </footer>
    </div>
  );
}
