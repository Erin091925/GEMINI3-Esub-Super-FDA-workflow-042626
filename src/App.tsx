/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Sun, 
  Moon, 
  Globe, 
  Trash2, 
  Download, 
  Save, 
  ChevronRight, 
  Terminal,
  AlertCircle,
  CheckCircle2,
  Search,
  BookOpen,
  Shuffle,
  FileCheck,
  Square,
  RotateCcw,
  History,
  Key,
  Cpu,
  MessageSquare,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { PANTONE_PALETTES, TRANSLATIONS, DEFAULT_PROMPTS, MODEL_OPTIONS } from './constants';
import { PantoneStyle, Language, PipelineStep, LogEntry, PipelineState, AppSettings, HistoryEntry, WowEffect } from './types';

// --- Wow Effect Components ---

const ParticlesEffect = () => (
  <motion.div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
    {[...Array(50)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full bg-[var(--accent)]"
        initial={{ scale: 0, x: 0, y: 0 }}
        animate={{ 
          scale: [0, 1, 0],
          x: (Math.random() - 0.5) * 1000,
          y: (Math.random() - 0.5) * 1000,
          rotate: Math.random() * 360
        }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
    ))}
  </motion.div>
);

const ScannerEffect = () => (
  <motion.div 
    className="fixed inset-0 pointer-events-none z-[100] border-y-4 border-[var(--accent)] shadow-[0_0_50px_var(--accent)] opacity-50"
    initial={{ y: "-100%" }}
    animate={{ y: "200%" }}
    transition={{ duration: 1.2, ease: "linear" }}
  />
);

const GlitchEffect = () => (
  <motion.div 
    className="fixed inset-0 pointer-events-none z-[100] bg-[var(--accent)]/10"
    animate={{ 
      x: [-5, 5, -2, 2, 0],
      opacity: [0, 0.5, 0.2, 0.8, 0],
      filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"]
    }}
    transition={{ duration: 0.4, repeat: 3 }}
  />
);

const AuraEffect = () => (
  <motion.div 
    className="fixed inset-0 pointer-events-none z-[100] shadow-[inset_0_0_150px_var(--accent)]"
    initial={{ opacity: 0 }}
    animate={{ opacity: [0, 0.8, 0] }}
    transition={{ duration: 2 }}
  />
);

const LiquidEffect = () => (
  <motion.div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden flex items-end">
    <motion.div 
      className="w-[200%] h-1/2 bg-[var(--accent)]/20"
      style={{ borderRadius: "40% 40% 0 0" }}
      animate={{ 
        x: ["-50%", "0%"],
        y: ["100%", "20%", "100%"]
      }}
      transition={{ 
        x: { duration: 4, repeat: Infinity, ease: "linear" },
        y: { duration: 2, ease: "easeInOut" }
      }}
    />
  </motion.div>
);

const CubeEffect = () => (
  <motion.div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
    <div className="relative w-48 h-48 [perspective:1000px]">
      <motion.div 
        className="w-full h-full relative [transform-style:preserve-3d]"
        animate={{ 
          rotateX: [0, 360],
          rotateY: [0, 360],
          scale: [0.5, 1, 0.5],
          opacity: [0, 1, 0]
        }}
        transition={{ duration: 2, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 border-2 border-[var(--accent)] opacity-50 bg-[var(--accent)]/10" />
        <div className="absolute inset-0 border-2 border-[var(--accent)] opacity-50 bg-[var(--accent)]/10 [transform:rotateY(90deg)]" />
        <div className="absolute inset-0 border-2 border-[var(--accent)] opacity-50 bg-[var(--accent)]/10 [transform:rotateX(90deg)]" />
      </motion.div>
    </div>
  </motion.div>
);

// --- Components ---

const InteractiveIndicator = ({ step, currentStep, label, onClick }: { step: PipelineStep, currentStep: PipelineStep, label: string, onClick: (step: PipelineStep) => void }) => {
  const isActive = currentStep === step;
  const isCompleted = currentStep > step;

  return (
    <div className="flex flex-col items-center gap-3 relative z-10">
      <motion.button 
        onClick={() => onClick(step)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-lg ${
          isActive ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]' : 
          isCompleted ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] text-[var(--text-muted)] bg-[var(--card)]'
        }`}
        animate={isActive ? { 
          scale: [1, 1.05, 1], 
          boxShadow: ["0 0 0px var(--accent)", "0 0 25px var(--accent)", "0 0 0px var(--accent)"] 
        } : { scale: 1 }}
        transition={{ repeat: Infinity, duration: 3 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
      >
        {isCompleted ? <CheckCircle2 size={28} strokeWidth={2.5} /> : <span className="text-lg font-bold">{step}</span>}
      </motion.button>
      <div className="flex flex-col items-center">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
          {label}
        </span>
        {isActive && (
          <motion.div 
            layoutId="active-dot"
            className="w-1 h-1 rounded-full bg-[var(--accent)] mt-1" 
          />
        )}
      </div>
      {step < 4 && (
        <div className="absolute left-[calc(100%+0.5rem)] top-7 w-12 h-[3px] bg-[var(--border)] rounded-full hidden md:block">
          <motion.div 
            className="h-full bg-[var(--accent)] rounded-full shadow-[0_0_10px_var(--accent)]"
            initial={{ width: 0 }}
            animate={{ width: isCompleted ? '100%' : '0%' }}
            transition={{ duration: 0.8, ease: "circOut" }}
          />
        </div>
      )}
    </div>
  );
};

const Dashboard = ({ riskData, tokenData, t, history, onRollback }: { riskData: any[], tokenData: any[], t: any, history: HistoryEntry[], onRollback: (entry: HistoryEntry) => void }) => {
  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto scrollbar-hide">
      <div className="grid grid-cols-1 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="nordic-card p-6 h-72 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={80} className="text-[var(--accent)]" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-[var(--text-muted)]">
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            {t.riskRadar}
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskData}>
                <PolarGrid stroke="var(--border)" strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Risk"
                  dataKey="A"
                  stroke="var(--accent)"
                  fill="var(--accent)"
                  fillOpacity={0.4}
                  animationDuration={1500}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="nordic-card p-6 h-48 relative overflow-hidden group"
        >
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-[var(--text-muted)]">
            <LayoutDashboard size={14} className="text-[var(--accent)]" />
            {t.tokenEfficiency}
          </h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tokenData}>
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderColor: 'var(--border)', 
                    color: 'var(--text)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="stepAfter" 
                  dataKey="tokens" 
                  stroke="var(--accent)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorTokens)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Timeline / DAG */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="nordic-card p-6 flex-1 min-h-[300px] flex flex-col"
      >
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-[var(--text-muted)]">
          <History size={14} className="text-[var(--accent)]" />
          {t.timeline}
        </h3>
        <div className="space-y-4 flex-1">
          {history.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
              <RotateCcw size={40} className="mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest">No Lineage Recorded</p>
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {history.map((entry, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] group hover:border-[var(--accent)]/50 transition-colors cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] font-bold text-[10px]">
                    {history.length - idx}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono opacity-50 tracking-tighter">{entry.timestamp}</span>
                    <span className="text-xs font-bold text-[var(--text)]">{entry.label}</span>
                  </div>
                </div>
                <button 
                  onClick={() => onRollback(entry)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] rounded-lg transition-all shadow-sm"
                  title={t.rollback}
                >
                  <RotateCcw size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

const LogViewer = ({ logs, t }: { logs: LogEntry[], t: any }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="nordic-card bg-[#050505] text-[#00FF41] font-mono text-[10px] p-6 h-64 overflow-hidden flex flex-col border-[#00FF41]/20 shadow-[0_0_30px_rgba(0,255,65,0.1)]">
      <div className="flex items-center justify-between mb-4 border-b border-[#00FF41]/20 pb-2">
        <span className="flex items-center gap-3 tracking-[0.3em] font-bold">
          <div className="w-2 h-2 rounded-full bg-[#00FF41] shadow-[0_0_10px_#00FF41] animate-pulse" />
          {t.logs}
        </span>
        <span className="opacity-40 text-[8px] tracking-widest uppercase font-bold">Encrypted Session: Active</span>
      </div>
      <div ref={scrollRef} className="overflow-y-auto flex-1 scrollbar-hide space-y-1.5 custom-scrollbar">
        {logs.map((log) => (
          <motion.div 
            key={log.id} 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-3 items-start group"
          >
            <span className="opacity-30 flex-shrink-0 font-bold select-none tracking-tighter">[{log.timestamp}]</span>
            <span className={`leading-relaxed break-words ${
              log.type === 'error' ? 'text-red-500 font-bold' : 
              log.type === 'warning' ? 'text-yellow-400' : 
              log.type === 'success' ? 'text-blue-400 font-bold' : 
              log.type === 'system' ? 'text-purple-400 italic underline decoration-purple-400/30' : 'opacity-90'
            }`}>
               <span className="opacity-50 mr-1 select-none">›</span>
               {log.message}
            </span>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 pt-2 border-t border-[#00FF41]/10 flex justify-between items-center opacity-30 text-[8px] font-bold">
        <span className="tracking-[0.2em]">{logs.length} ENTRIES CACHED</span>
        <span>BUFFER: 4096KB</span>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [theme, setTheme] = useState<PantoneStyle>('ClassicBlue');
  const [isDark, setIsDark] = useState(false);
  const [lang, setLang] = useState<Language>('EN');
  const [pipeline, setPipeline] = useState<PipelineState>({
    step1: '',
    step2: '',
    step3: '',
    step4: '',
    currentStep: 1,
  });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeWow, setActiveWow] = useState<WowEffect>('none');
  
  // LLM Settings
  const [settings, setSettings] = useState<AppSettings>({
    apiKey: process.env.GEMINI_API_KEY || '',
    selectedWowEffect: 'particles',
    features: {
      step1: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step1 },
      step2: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step2 },
      step3: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step3 },
      step4: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step4 },
      reorganize: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.reorganize },
      finalReport: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.finalReport },
      ocr: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.ocr },
      wow: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.wow },
    }
  });

  const [globalModel, setGlobalModel] = useState('gemini-3-flash-preview');

  const updateGlobalModel = (model: string) => {
    setGlobalModel(model);
    setSettings(prev => {
      const newFeatures = { ...prev.features };
      Object.keys(newFeatures).forEach(key => {
        newFeatures[key as keyof typeof newFeatures].model = model;
      });
      return { ...prev, features: newFeatures };
    });
  };

  const abortControllerRef = useRef<AbortController | null>(null);
  const t = TRANSLATIONS[lang];

  // --- Theme Injection ---
  useEffect(() => {
    const root = document.documentElement;
    const palette = PANTONE_PALETTES[theme];
    root.style.setProperty('--accent', palette.accent);
    root.style.setProperty('--accent-foreground', palette.foreground);
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, isDark]);

  // --- Logging Helper ---
  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
      message,
      type,
    };
    setLogs(prev => [...prev, newLog].slice(-50));
  };

  useEffect(() => {
    addLog('System Initialized: Nordic WOW Pantone Edition v3.0.1', 'system');
  }, []);

  // --- Mock Data for Charts ---
  const riskData = [
    { subject: 'Clinical', A: 85, fullMark: 100 },
    { subject: 'Technical', A: 65, fullMark: 100 },
    { subject: 'Regulatory', A: 90, fullMark: 100 },
    { subject: 'Safety', A: 75, fullMark: 100 },
    { subject: 'Labeling', A: 40, fullMark: 100 },
  ];

  const tokenData = [
    { name: '1', tokens: 400 },
    { name: '2', tokens: 1200 },
    { name: '3', tokens: 800 },
    { name: '4', tokens: 2400 },
    { name: '5', tokens: 1800 },
    { name: '6', tokens: 3200 },
    { name: '7', tokens: 2100 },
  ];

  // --- Pipeline Actions ---
  const generateArtifact = async () => {
    setIsGenerating(true);
    addLog(`Initiating Generation for Step ${pipeline.currentStep}...`, 'info');
    
    abortControllerRef.current = new AbortController();

    try {
      const featureKey = `step${pipeline.currentStep}` as keyof AppSettings['features'];
      const config = settings.features[featureKey];
      
      const ai = new GoogleGenAI({ apiKey: settings.apiKey });
      
      // Note: @google/genai doesn't natively support AbortController in generateContent yet, 
      // but we can simulate the "Stop" by ignoring the result if aborted.
      const response = await ai.models.generateContent({
        model: config.model,
        contents: config.prompt,
      });

      if (abortControllerRef.current?.signal.aborted) {
        addLog('Generation stopped by user.', 'warning');
        return;
      }

      const text = response.text || "Failed to generate content.";
      
      // Save to history before updating
      const newHistoryEntry: HistoryEntry = {
        timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
        state: { ...pipeline },
        label: `Step ${pipeline.currentStep} Generated`
      };
      setHistory(prev => [newHistoryEntry, ...prev].slice(0, 10));

      setPipeline(prev => ({
        ...prev,
        [`step${pipeline.currentStep}`]: text
      }));
      
      addLog(`Step ${pipeline.currentStep} Artifact Generated Successfully.`, 'success');

      // Trigger WOW effect
      if (settings.selectedWowEffect !== 'none') {
        setActiveWow(settings.selectedWowEffect);
        setTimeout(() => setActiveWow('none'), 2500);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        addLog('Generation aborted.', 'warning');
      } else {
        addLog(`Generation Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      addLog('Stopping generation...', 'warning');
    }
  };

  const handlePurge = () => {
    setPipeline({
      step1: '',
      step2: '',
      step3: '',
      step4: '',
      currentStep: 1,
    });
    setHistory([]);
    setLogs([]);
    addLog('Total Purge Executed. Session Cleared.', 'warning');
  };

  const resetToDefaults = () => {
    setSettings(prev => ({
      ...prev,
      features: {
        step1: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step1 },
        step2: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step2 },
        step3: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step3 },
        step4: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step4 },
        reorganize: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.reorganize },
        finalReport: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.finalReport },
        ocr: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.ocr },
        wow: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.wow },
      }
    }));
    addLog('LLM Matrix reset to FDA Defaults.', 'system');
  };

  const reorganizeContent = async () => {
    if (!currentContent.trim()) {
      addLog('No content to reorganize.', 'warning');
      return;
    }
    setIsGenerating(true);
    addLog(`Reorganizing Step ${pipeline.currentStep} content...`, 'info');
    abortControllerRef.current = new AbortController();

    try {
      const config = settings.features.reorganize;
      const ai = new GoogleGenAI({ apiKey: settings.apiKey });
      const response = await ai.models.generateContent({
        model: config.model,
        contents: `${config.prompt}\n\nContent to reorganize:\n${currentContent}`,
      });

      if (abortControllerRef.current?.signal.aborted) return;

      const text = response.text || "Failed to reorganize content.";
      setPipeline(prev => ({ ...prev, [`step${pipeline.currentStep}`]: text }));
      addLog('Content reorganized successfully.', 'success');
    } catch (error) {
      addLog(`Reorganize Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const generateFinalReport = async () => {
    setIsGenerating(true);
    addLog('Generating Final Comprehensive Report...', 'info');
    abortControllerRef.current = new AbortController();

    try {
      const config = settings.features.finalReport;
      const ai = new GoogleGenAI({ apiKey: settings.apiKey });
      
      const context = `
        INSTRUCTIONS (Step 2):
        ${pipeline.step2}

        REORGANIZED SUBMISSION (Step 3):
        ${pipeline.step3}
      `;

      const response = await ai.models.generateContent({
        model: config.model,
        contents: `${config.prompt}\n\nContext:\n${context}`,
      });

      if (abortControllerRef.current?.signal.aborted) return;

      const text = response.text || "Failed to generate report.";
      setPipeline(prev => ({ ...prev, step4: text }));
      addLog('Final Report Generated Successfully.', 'success');
    } catch (error) {
      addLog(`Report Generation Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleRollback = (entry: HistoryEntry) => {
    setPipeline(entry.state);
    addLog(`Rolled back to state: ${entry.label}`, 'system');
  };

  const currentContent = pipeline[`step${pipeline.currentStep}` as keyof PipelineState] as string;

  return (
    <div className="min-h-screen flex flex-col selection:bg-[var(--accent)] selection:text-[var(--accent-foreground)]">
      {/* Wow Effect Layer */}
      <AnimatePresence>
        {activeWow === 'particles' && <ParticlesEffect />}
        {activeWow === 'scanner' && <ScannerEffect />}
        {activeWow === 'glitch' && <GlitchEffect />}
        {activeWow === 'aura' && <AuraEffect />}
        {activeWow === 'liquid' && <LiquidEffect />}
        {activeWow === 'cube' && <CubeEffect />}
      </AnimatePresence>

      {/* --- Header --- */}
      <header className="nordic-card m-6 p-8 flex flex-col md:flex-row justify-between items-center gap-6 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-[var(--border)] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-[var(--accent-foreground)] shadow-[0_0_15px_var(--accent)]">
              <Activity size={18} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-[var(--text)]">{t.title}</h1>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-[0.3em] pl-11">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-[var(--bg)] p-1 rounded-xl border border-[var(--border)] shadow-inner">
            {/* Language Toggle */}
            <button 
              onClick={() => setLang(lang === 'EN' ? 'ZH' : 'EN')}
              className="px-3 py-1.5 rounded-lg hover:bg-[var(--card)] transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
            >
              <Globe size={14} className="text-[var(--accent)]" />
              {lang}
            </button>
            <div className="w-[1px] bg-[var(--border)] mx-1" />
            {/* Theme Toggle */}
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 rounded-lg hover:bg-[var(--card)] transition-all text-[var(--text-muted)] hover:text-[var(--accent)]"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          
          <div className="h-8 w-[1px] bg-[var(--border)] md:block hidden" />

          {/* Pantone Selector */}
          <div className="relative group/pantone">
            <select 
              value={theme}
              onChange={(e) => setTheme(e.target.value as PantoneStyle)}
              className="nordic-input text-[10px] font-bold uppercase tracking-widest py-2 bg-transparent pr-8 cursor-pointer focus:ring-0 appearance-none border-none"
            >
              {Object.entries(PANTONE_PALETTES).map(([key, val]) => (
                <option key={key} value={key}>{val.name}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none opacity-40" size={14} />
          </div>

          <button 
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 flex items-center justify-center bg-[var(--bg)] border border-[var(--border)] rounded-xl hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all group/btn shadow-sm"
            title={t.settings}
          >
            <Settings size={20} className="group-hover/btn:rotate-90 transition-transform duration-500" />
          </button>

          <button 
            onClick={handlePurge}
            className="w-10 h-10 flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
            title={t.purge}
          >
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 pt-0">
        {/* --- Left Sidebar: Dashboard & Logs --- */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="nordic-card flex-1 flex flex-col overflow-hidden bg-white/50 dark:bg-black/50 backdrop-blur-md">
            <Dashboard 
              riskData={riskData} 
              tokenData={tokenData} 
              t={t} 
              history={history}
              onRollback={handleRollback}
            />
            <div className="p-6 pt-0">
              <LogViewer logs={logs} t={t} />
            </div>
          </div>
          
          {/* Pipeline Indicators */}
          <div className="nordic-card p-8 flex justify-between items-center relative overflow-hidden bg-gradient-to-br from-[var(--card)] to-[var(--bg)]">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--accent) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <InteractiveIndicator step={1} currentStep={pipeline.currentStep} label={t.step1.split(' ')[0]} onClick={(s) => setPipeline(p => ({ ...p, currentStep: s }))} />
            <InteractiveIndicator step={2} currentStep={pipeline.currentStep} label={t.step2.split(' ')[0]} onClick={(s) => setPipeline(p => ({ ...p, currentStep: s }))} />
            <InteractiveIndicator step={3} currentStep={pipeline.currentStep} label={t.step3.split(' ')[0]} onClick={(s) => setPipeline(p => ({ ...p, currentStep: s }))} />
            <InteractiveIndicator step={4} currentStep={pipeline.currentStep} label={t.step4.split(' ')[0]} onClick={(s) => setPipeline(p => ({ ...p, currentStep: s }))} />
          </div>
        </div>

        {/* --- Center/Right: Pipeline Workspace --- */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="nordic-card flex-1 flex flex-col overflow-hidden shadow-2xl relative">
            {/* Step Header */}
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--accent)] text-[var(--accent-foreground)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                  {pipeline.currentStep === 1 && <Search size={24} />}
                  {pipeline.currentStep === 2 && <BookOpen size={24} />}
                  {pipeline.currentStep === 3 && <Shuffle size={24} />}
                  {pipeline.currentStep === 4 && <FileCheck size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight uppercase italic">
                    {t[`step${pipeline.currentStep}` as keyof typeof t]}
                  </h2>
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{t.activeStep} {pipeline.currentStep}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] relative z-10">
                <div className="px-3 py-1 bg-black/20 rounded-full backdrop-blur-md">
                  {t.wordCount}: {currentContent.split(/\s+/).filter(x => x).length}
                </div>
              </div>
            </div>

            {/* Dual-View Editor */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden bg-[var(--card)]">
              {/* Editor Pane */}
              <div className="border-r border-[var(--border)] flex flex-col relative">
                <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                  <Terminal size={120} />
                </div>
                <textarea 
                  className="flex-1 p-8 bg-transparent resize-none focus:outline-none font-mono text-sm leading-relaxed scrollbar-hide selection:bg-[var(--accent)]"
                  value={currentContent}
                  onChange={(e) => setPipeline(prev => ({ ...prev, [`step${pipeline.currentStep}`]: e.target.value }))}
                  placeholder="Paste or generate content here..."
                />
              </div>
              {/* Preview Pane */}
              <div className="p-8 overflow-y-auto bg-[var(--bg)]/30 backdrop-blur-sm relative">
                {currentContent ? (
                  <div className="markdown-body">
                    <ReactMarkdown>{currentContent}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] opacity-20">
                    <FileText size={80} className="mb-4 stroke-[1px]" />
                    <p className="text-sm font-bold uppercase tracking-[0.3em]">No Content Generated</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-6 border-t border-[var(--border)] bg-[var(--card)] relative">
              <div className="flex flex-wrap justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-widest flex items-center gap-2">
                      <Cpu size={10} className="text-[var(--accent)]" />
                      {t.model}
                    </label>
                    <select 
                      className="nordic-input px-4 py-2 text-xs font-bold bg-[var(--bg)] border-2 border-transparent focus:border-[var(--accent)] transition-all cursor-pointer rounded-xl"
                      value={globalModel}
                      onChange={(e) => updateGlobalModel(e.target.value)}
                    >
                      {MODEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  
                  {!isGenerating ? (
                    <button 
                      onClick={generateArtifact}
                      className="nordic-button h-12 px-8 flex items-center gap-3 text-sm font-black uppercase tracking-widest shadow-[0_10px_20px_-10px_var(--accent)] hover:shadow-[0_15px_30px_-10px_var(--accent)] hover:-translate-y-0.5 transition-all active:translate-y-0"
                    >
                      <FileText size={18} />
                      {t.generate}
                    </button>
                  ) : (
                    <button 
                      onClick={stopGeneration}
                      className="nordic-button h-12 px-8 bg-red-600 flex items-center gap-3 text-sm font-black uppercase tracking-widest shadow-[0_10px_20px_-10px_rgba(220,38,38,0.5)] hover:bg-red-700 transition-all"
                    >
                      <Square size={18} className="animate-pulse" />
                      {t.stop}
                    </button>
                  )}

                  <button 
                    onClick={reorganizeContent}
                    className="h-12 px-6 border-2 border-[var(--border)] rounded-xl hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all flex items-center gap-3 text-xs font-black uppercase tracking-widest group shadow-sm"
                    title={t.reorganize}
                  >
                    <Shuffle size={16} className="group-hover:rotate-180 transition-transform duration-700" />
                    {t.reorganize}
                  </button>

                  {pipeline.currentStep === 4 && (
                    <button 
                      onClick={generateFinalReport}
                      className="nordic-button h-12 px-8 bg-black dark:bg-white dark:text-black hover:bg-zinc-800 transition-all flex items-center gap-3 text-sm font-black uppercase tracking-widest shadow-xl"
                    >
                      <FileCheck size={20} />
                      {t.createReport}
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button className="w-12 h-12 flex items-center justify-center border-2 border-[var(--border)] rounded-xl hover:bg-[var(--accent)] hover:text-white transition-all group shadow-sm">
                    <Save size={20} />
                  </button>
                  <button className="w-12 h-12 flex items-center justify-center border-2 border-[var(--border)] rounded-xl hover:bg-[var(--accent)] hover:text-white transition-all group shadow-sm">
                    <Download size={20} />
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-8">
                {pipeline.currentStep > 1 ? (
                  <button 
                    onClick={() => setPipeline(prev => ({ ...prev, currentStep: (prev.currentStep - 1) as PipelineStep }))}
                    className="flex items-center gap-3 text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px] hover:text-[var(--accent)] transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] flex items-center justify-center group-hover:border-[var(--accent)] group-hover:-translate-x-1 transition-all">
                      <ChevronRight size={16} className="rotate-180" />
                    </div>
                    {t.back}
                  </button>
                ) : <div />}

                {pipeline.currentStep < 4 && (
                  <button 
                    onClick={() => setPipeline(prev => ({ ...prev, currentStep: (prev.currentStep + 1) as PipelineStep }))}
                    className="flex items-center gap-3 text-[var(--accent)] font-black uppercase tracking-widest text-[10px] group transition-all"
                  >
                    {t.next}
                    <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] flex items-center justify-center group-hover:bg-[var(--accent)] group-hover:text-white group-hover:translate-x-1 transition-all">
                      <ChevronRight size={16} />
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- Settings Modal --- */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="nordic-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Settings size={24} className="text-[var(--accent)]" />
                  {t.settings}
                </h2>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={resetToDefaults}
                    className="text-xs flex items-center gap-1 text-[var(--accent)] hover:underline"
                  >
                    <RotateCcw size={14} />
                    {t.reset}
                  </button>
                  <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-[var(--border)] rounded">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* API Key Section */}
                {!process.env.GEMINI_API_KEY && (
                  <section className="space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Key size={16} />
                      {t.apiKey}
                    </h3>
                    <input 
                      type="password"
                      className="nordic-input w-full"
                      value={settings.apiKey}
                      onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="Enter Gemini API Key..."
                    />
                  </section>
                )}

                {/* Wow Effect Selector */}
                <section className="p-4 border border-[var(--border)] rounded bg-[var(--bg)]/50 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Sun size={16} className="text-[var(--accent)]" />
                    {t.wowEffect}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(Object.keys(t.wowEffects) as WowEffect[]).map((effect) => (
                      <button
                        key={effect}
                        onClick={() => setSettings(prev => ({ ...prev, selectedWowEffect: effect }))}
                        className={`p-3 rounded-lg border-2 text-xs font-medium transition-all ${
                          settings.selectedWowEffect === effect 
                            ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]' 
                            : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50'
                        }`}
                      >
                        {t.wowEffects[effect]}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Feature Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(settings.features).map(([key, config]) => (
                    <div key={key} className="p-4 border border-[var(--border)] rounded bg-[var(--bg)]/50 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                        {key.toUpperCase()}
                      </h4>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-semibold text-[var(--text-muted)] flex items-center gap-1">
                          <Cpu size={10} />
                          {t.model}
                        </label>
                        <select 
                          className="nordic-input w-full text-xs"
                          value={config.model}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            features: {
                              ...prev.features,
                              [key]: { ...config, model: e.target.value }
                            }
                          }))}
                        >
                          {MODEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-semibold text-[var(--text-muted)] flex items-center gap-1">
                          <MessageSquare size={10} />
                          {t.prompt}
                        </label>
                        <textarea 
                          className="nordic-input w-full text-xs h-24 resize-none"
                          value={config.prompt}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            features: {
                              ...prev.features,
                              [key]: { ...config, prompt: e.target.value }
                            }
                          }))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-[var(--border)] flex justify-end">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="nordic-button"
                >
                  {t.save}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Footer --- */}
      <footer className="p-4 text-center text-[10px] text-[var(--text-muted)] uppercase tracking-[0.2em]">
        © 2026 Regulatory Command Center • Nordic WOW Pantone Edition • Secure Session Active
      </footer>
    </div>
  );
}
