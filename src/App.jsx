import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  Shield, 
  Navigation, 
  Radio, 
  Rocket, 
  AlertTriangle, 
  Plus, 
  Minus,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const INITIAL_SUBSYSTEMS = {
  propulsion: { id: 'propulsion', name: 'Propulsion', allocation: 20, maxCapacity: 100, icon: 'Rocket' },
  defense: { id: 'defense', name: 'Defense', allocation: 30, maxCapacity: 100, icon: 'Shield' },
  navigation: { id: 'navigation', name: 'Navigation', allocation: 15, maxCapacity: 100, icon: 'Navigation' },
  communication: { id: 'communication', name: 'Communication', allocation: 10, maxCapacity: 100, icon: 'Radio' },
};

const IconMap = {
  Rocket: Rocket,
  Shield: Shield,
  Navigation: Navigation,
  Radio: Radio,
};

export default function App() {
  const [subsystems, setSubsystems] = useState(INITIAL_SUBSYSTEMS);
  const [totalCapacity, setTotalCapacity] = useState(100);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([
    { time: '03:34:42', msg: 'Core stabilization complete.', type: 'info' },
    { time: '03:34:43', msg: 'Subsystem handshake verified.', type: 'info' },
    { time: '03:34:45', msg: 'Power distribution online.', type: 'info' },
  ]);
  const [lastLoggedValues, setLastLoggedValues] = useState(
    Object.fromEntries(Object.entries(INITIAL_SUBSYSTEMS).map(([k, v]) => [k, v.allocation]))
  );
  const logTimeouts = React.useRef({});

  const addLog = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    setLogs(prev => [{ time, msg, type }, ...prev].slice(0, 10));
  };

  const debouncedLogChange = (id, nextValue) => {
    if (logTimeouts.current[id]) {
      clearTimeout(logTimeouts.current[id]);
    }

    logTimeouts.current[id] = setTimeout(() => {
      const startValue = lastLoggedValues[id];
      const diff = nextValue - startValue;
      
      if (diff !== 0) {
        addLog(`Energy ${diff > 0 ? 'added' : 'reduced'} ${Math.abs(diff)} units to ${subsystems[id].name}`, 'success');
        setLastLoggedValues(prev => ({ ...prev, [id]: nextValue }));
      }
      delete logTimeouts.current[id];
    }, 800);
  };

  const usedEnergy = useMemo(() => {
    return Object.values(subsystems).reduce((acc, s) => acc + s.allocation, 0);
  }, [subsystems]);

  const remainingEnergy = totalCapacity - usedEnergy;
  const stability = Math.max(0, 100 - (usedEnergy > totalCapacity * 0.9 ? ((usedEnergy - totalCapacity * 0.9) / (totalCapacity * 0.1)) * 100 : 0));

  const handleUpdateAllocation = (id, valueOrDelta, isDirect = false) => {
    const current = subsystems[id].allocation;
    const next = isDirect ? Math.max(0, Math.min(totalCapacity, parseInt(valueOrDelta) || 0)) : Math.max(0, current + valueOrDelta);
    const delta = next - current;

    if (delta > 0 && remainingEnergy < delta) {
      const msg = `Insufficient energy for ${subsystems[id].name} boost`;
      setError(msg);
      addLog(msg, 'error');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSubsystems(prev => ({
      ...prev,
      [id]: { ...prev[id], allocation: next }
    }));
    
    debouncedLogChange(id, next);
    setError(null);
  };

  const handleUpdateTotalCapacity = (val) => {
    const next = Math.max(1, parseInt(val) || 0);
    setTotalCapacity(next);
    
    // Automatically divide power into 4 equal parts
    const equalShare = Math.floor(next / 4);
    const remainder = next % 4;
    
    setSubsystems(prev => {
      const nextSubsystems = { ...prev };
      const keys = Object.keys(nextSubsystems);
      keys.forEach((key, index) => {
        nextSubsystems[key] = { 
          ...nextSubsystems[key], 
          allocation: equalShare + (index < remainder ? 1 : 0) 
        };
      });
      
      addLog(`Total capacity updated to ${next}. Power redistributed equally.`, 'info');
      setLastLoggedValues(Object.fromEntries(Object.entries(nextSubsystems).map(([k, v]) => [k, v.allocation])));
      return nextSubsystems;
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-12 px-4 md:px-8 bg-reactor-bg selection:bg-reactor-cyan/30 overflow-y-auto">
      {/* Header Section */}
      <header className="w-full max-w-6xl mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-reactor-cyan/10 border border-reactor-cyan/20">
            <Zap className="w-8 h-8 text-reactor-cyan animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-white uppercase italic">Arc Reactor Core</h1>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">4script</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">System Stability</p>
            <div className="flex items-center gap-2">
              <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className={cn(
                    "h-full rounded-full",
                    stability > 80 ? "bg-reactor-cyan shadow-[0_0_10px_rgba(0,242,255,0.5)]" : 
                    stability > 50 ? "bg-yellow-400" : "bg-reactor-red"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${stability}%` }}
                />
              </div>
              <span className="font-mono text-sm font-bold text-white">{stability.toFixed(0)}%</span>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Core Temperature</p>
            <p className="font-mono text-xl font-bold text-white">3,452 <span className="text-xs text-slate-500 font-normal italic">K</span></p>
          </div>
        </div>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Subsystems */}
        <div className="lg:col-span-4 space-y-4 order-2 lg:order-1">
          <h2 className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <Activity className="w-3 h-3" /> Subsystem Allocation
          </h2>
          {Object.values(subsystems).map((subsystem) => {
            const Icon = IconMap[subsystem.icon];
            const efficiency = Math.min(100, (subsystem.allocation / 40) * 100);
            
            return (
              <motion.div 
                key={subsystem.id}
                layout
                className="group relative p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-reactor-cyan/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5 text-slate-400 group-hover:text-reactor-cyan transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200">{subsystem.name}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                          Power:
                        </p>
                        <input 
                          type="number"
                          value={subsystem.allocation}
                          onChange={(e) => handleUpdateAllocation(subsystem.id, e.target.value, true)}
                          className="w-12 bg-white/5 border border-white/10 rounded px-1 text-[10px] font-mono text-reactor-cyan focus:outline-none focus:border-reactor-cyan/50"
                        />
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Units</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleUpdateAllocation(subsystem.id, -1)}
                      className="p-1 rounded-md bg-white/5 hover:bg-reactor-red/20 hover:text-reactor-red transition-all border border-white/5"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleUpdateAllocation(subsystem.id, 1)}
                      className="p-1 rounded-md bg-white/5 hover:bg-reactor-cyan/20 hover:text-reactor-cyan transition-all border border-white/5"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <input 
                    type="range"
                    min="0"
                    max={totalCapacity}
                    value={subsystem.allocation}
                    onChange={(e) => handleUpdateAllocation(subsystem.id, e.target.value, true)}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-reactor-cyan hover:accent-reactor-cyan/80 transition-all"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-slate-600 uppercase tracking-widest">
                    <span>0</span>
                    <span>{totalCapacity}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>


        {/* Center Column: Main Reactor Visualization */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center order-1 lg:order-2 py-8 lg:py-0">
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full border border-white/5" />
            
            {/* Rotating Rings */}
            <motion.div 
              className="absolute inset-4 rounded-full border-2 border-dashed border-reactor-cyan/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
              className="absolute inset-8 rounded-full border border-reactor-blue/30"
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Main Core */}
            <div className={cn(
              "relative w-48 h-48 md:w-56 md:h-56 rounded-full bg-reactor-bg border-4 flex flex-col items-center justify-center reactor-radial transition-all duration-500",
              error ? "border-reactor-red glow-red" : "border-reactor-cyan/40 glow-cyan"
            )}>
              <motion.div 
                className={cn(
                  "absolute inset-0 rounded-full",
                  error ? "bg-reactor-red/5" : "bg-reactor-cyan/5"
                )}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-1">Available</p>
              <motion.div 
                key={remainingEnergy}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "text-5xl md:text-6xl font-bold font-mono transition-colors duration-300",
                  error ? "text-reactor-red" : "text-white text-glow-cyan"
                )}
              >
                {remainingEnergy}
              </motion.div>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mt-1">Units</p>
            </div>

            {/* Energy Arcs (Visual Decoration) */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-full text-center"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-reactor-red/20 border border-reactor-red/40 text-reactor-red text-xs font-mono uppercase tracking-wider">
                    <AlertTriangle className="w-3 h-3" />
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Status & Telemetry */}
        <div className="lg:col-span-4 space-y-6 order-3">
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
            <h2 className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <Activity className="w-3 h-3" /> Core Telemetry
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Load Factor</p>
                <p className="text-xl font-bold text-white font-mono">{(usedEnergy / totalCapacity * 100).toFixed(1)}%</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Total Capacity</p>
                <div className="flex items-center gap-1">
                  <input 
                    type="number"
                    value={totalCapacity}
                    onChange={(e) => handleUpdateTotalCapacity(e.target.value)}
                    className="w-full bg-transparent border-none text-xl font-bold text-white font-mono focus:outline-none focus:ring-1 focus:ring-reactor-cyan/30 rounded"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">UNITS</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider">
                <span className="text-slate-500">System Status</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-md",
                  stability > 80 ? "bg-emerald-500/20 text-emerald-400" : "bg-reactor-red/20 text-reactor-red"
                )}>
                  {stability > 80 ? 'Optimal' : stability > 50 ? 'Warning' : 'Critical'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider">
                <span className="text-slate-500">Coolant Flow</span>
                <span className="text-white">Active (98%)</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider">
                <span className="text-slate-500">Grid Sync</span>
                <span className="text-white">Locked</span>
              </div>
            </div>

            <button 
              onClick={() => {
                setSubsystems(INITIAL_SUBSYSTEMS);
                setTotalCapacity(100);
                setLastLoggedValues(
                  Object.fromEntries(Object.entries(INITIAL_SUBSYSTEMS).map(([k, v]) => [k, v.allocation]))
                );
                addLog('System reset to defaults', 'info');
              }}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-mono uppercase tracking-widest border border-white/10 transition-all"
            >
              Reset Distribution
            </button>
          </div>

          {/* Log Section */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 font-mono text-[10px] text-slate-600 space-y-1 h-48 overflow-y-auto scrollbar-hide">
            <p className="text-slate-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-1 sticky top-0 bg-black/40">System Log</p>
            <AnimatePresence initial={false}>
              {logs.map((log, i) => (
                <motion.p 
                  key={`${log.time}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex gap-2",
                    log.type === 'error' ? "text-reactor-red" : 
                    log.type === 'success' ? "text-emerald-400" : "text-slate-500"
                  )}
                >
                  <span className="text-reactor-cyan shrink-0">[{log.time}]</span> 
                  <span>{log.msg}</span>
                </motion.p>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer Visual Decor */}
      <footer className="mt-12 mb-8 text-center">
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.5em]">Team Fourscript</p>
      </footer>
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-reactor-cyan/20 to-transparent" />
    </div>
  );
}
