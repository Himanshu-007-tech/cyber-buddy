
import React, { useState, useEffect, useRef } from 'react';

interface LoginPageProps {
  onLogin: (name: string) => void;
}

const AIScanningVideo: React.FC = () => {
  const [nodes, setNodes] = useState<{ x: number; y: number; id: number; size: number; driftX: number; driftY: number }[]>([]);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialNodes = Array.from({ length: 25 }).map((_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      id: i,
      size: Math.random() * 2 + 1,
      driftX: (Math.random() - 0.5) * 0.05,
      driftY: (Math.random() - 0.5) * 0.05,
    }));
    setNodes(initialNodes);

    const driftInterval = setInterval(() => {
      setNodes(prev => prev.map(node => ({
        ...node,
        x: (node.x + node.driftX + 100) % 100,
        y: (node.y + node.driftY + 100) % 100,
      })));
    }, 50);

    return () => clearInterval(driftInterval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!videoRef.current) return;
    const rect = videoRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div 
      ref={videoRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-[35vh] sm:h-[40vh] lg:h-[50vh] glass-card rounded-[2rem] lg:rounded-[3.5rem] overflow-hidden border-indigo-500/30 group cursor-none shadow-[0_0_50px_rgba(99,102,241,0.2)]"
    >
      {/* Background Visuals */}
      <div className="absolute inset-0 bg-slate-950/80">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-30 grayscale transition-all duration-1000 group-hover:opacity-60 group-hover:grayscale-0 scale-110 group-hover:scale-100"></div>
      </div>
      
      {/* Interactive Cursor Crosshair */}
      <div 
        className="absolute z-50 pointer-events-none transition-opacity duration-300"
        style={{ 
          left: `${mousePos.x}%`, 
          top: `${mousePos.y}%`, 
          opacity: isHovered ? 1 : 0,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="relative w-10 h-10 lg:w-16 lg:h-16 border border-indigo-400/50 rounded-full flex items-center justify-center">
          <div className="absolute w-full h-[0.5px] bg-indigo-400/40"></div>
          <div className="absolute h-full w-[0.5px] bg-indigo-400/40"></div>
          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_15px_#6366f1]"></div>
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[8px] font-mono text-indigo-300 whitespace-nowrap bg-black/90 px-2 py-0.5 rounded border border-indigo-500/30">
            {mousePos.y.toFixed(1)} : {mousePos.x.toFixed(1)}
          </div>
        </div>
      </div>

      <div className="absolute inset-0 video-overlay z-10 pointer-events-none"></div>
      
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="scan-line-v opacity-20"></div>
        <div className="scan-line-h opacity-20"></div>
        
        {/* Core HUD - Pulsating Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-75 lg:scale-100 transition-transform duration-1000">
          <div className={`w-48 h-48 lg:w-64 lg:h-64 border-2 border-dashed border-indigo-500/20 rounded-full flex items-center justify-center ${isHovered ? 'animate-[spin_4s_linear_infinite]' : 'animate-[spin_12s_linear_infinite]'}`}>
            <div className="w-[85%] h-[85%] border-t-2 border-indigo-500 rounded-full opacity-60"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-6 h-6 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_30px_#6366f1]"></div>
          </div>
        </div>

        {/* Dynamic Telemetry Nodes */}
        {nodes.map(node => (
          <div 
            key={node.id}
            className="absolute bg-indigo-400 rounded-full opacity-20 transition-all duration-700"
            style={{ 
              left: `${node.x}%`, 
              top: `${node.y}%`, 
              width: `${node.size}px`, 
              height: `${node.size}px`,
              transform: isHovered ? `translate(${(mousePos.x - node.x) * 0.05}px, ${(mousePos.y - node.y) * 0.05}px)` : 'none'
            }}
          />
        ))}
      </div>

      {/* PRIMARY LABEL: Neural_Scanner - Highly Visible */}
      <div className="absolute top-4 lg:top-8 left-4 lg:left-8 z-40 font-mono space-y-2">
        <div className="flex items-center gap-2 lg:gap-3 bg-black/90 px-3 lg:px-5 py-1.5 lg:py-2 rounded-lg lg:rounded-xl border border-indigo-500/40 backdrop-blur-xl shadow-[0_0_20px_rgba(99,102,241,0.4)]">
          <span className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]"></span>
          <span className="text-[9px] lg:text-[11px] font-black text-white uppercase tracking-[0.3em] glow-text">Neural_Scanner</span>
        </div>
        <div className="hidden lg:flex flex-col gap-1">
          <div className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10 w-fit">
            SYS: ACTIVE
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 lg:bottom-8 right-4 lg:right-8 z-40 text-right font-mono">
        <div className="text-[8px] lg:text-[10px] font-black text-white uppercase tracking-tighter mb-1">
          STATUS: <span className={isHovered ? 'text-emerald-400' : 'text-indigo-400'}>{isHovered ? 'STABLE' : 'SYNCING'}</span>
        </div>
        <div className="w-20 lg:w-32 h-1 bg-white/5 rounded-full overflow-hidden border border-white/10">
          <div className={`h-full bg-indigo-500 rounded-full transition-all duration-1000 ${isHovered ? 'w-full shadow-[0_0_15px_#6366f1]' : 'w-2/3'}`}></div>
        </div>
      </div>
    </div>
  );
};

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [hasConsent, setHasConsent] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && hasConsent) {
      setIsEntering(true);
      setTimeout(() => onLogin(name.trim()), 800);
    }
  };

  return (
    <div className={`min-h-screen w-screen flex flex-col items-center justify-center p-4 lg:p-10 relative overflow-x-hidden portal-transition ${isEntering ? 'opacity-0 scale-105 blur-lg' : 'opacity-100 scale-100'}`}>
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-950/20 via-slate-950 to-violet-950/20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] aspect-square bg-indigo-600/5 rounded-full blur-[120px] lg:blur-[200px] animate-pulse"></div>
      </div>

      <div className="max-w-[1600px] w-full grid lg:grid-cols-2 gap-8 lg:gap-20 items-center z-10 py-12 lg:py-0">
        
        {/* Left Side: Branding & AI Video Visual */}
        <div className="flex flex-col gap-6 lg:gap-10 order-2 lg:order-1">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] lg:text-[11px] font-black uppercase tracking-[0.3em] mb-4 lg:mb-8 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Secure Neural Protocol // READY
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-white leading-[0.85] tracking-tighter mb-4 lg:mb-8 uppercase">
              CYBER<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500 glow-text">BUDDY</span>
            </h1>
            <p className="hidden lg:block text-slate-400 text-lg lg:text-xl max-w-xl leading-relaxed font-medium">
              Monitor threats, analyze suspicious artifacts, and master digital defense with your intelligent security companion.
            </p>
          </div>

          <div className="relative group w-full">
            <div className="absolute -inset-4 lg:-inset-6 bg-indigo-500/10 rounded-[2.5rem] lg:rounded-[4rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <AIScanningVideo />
            <div className="mt-4 lg:mt-6 flex items-center justify-between text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 lg:px-4">
              <span className="flex items-center gap-2">
                <i className="fas fa-video text-indigo-500"></i> LIVE_FEED
              </span>
              <span className="flex items-center gap-2">
                <i className="fas fa-shield-halved text-indigo-400"></i> CB_CORE_v4.5
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Identity Initialization (Login) */}
        <div className="relative w-full max-w-xl mx-auto order-1 lg:order-2">
          <div className="lg:hidden mb-6 text-center">
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-1">
              CYBER<span className="text-indigo-500">BUDDY</span>
            </h1>
          </div>

          <div className="glass-card p-6 sm:p-10 lg:p-16 rounded-[2.5rem] lg:rounded-[4.5rem] shadow-2xl border-white/10 relative overflow-hidden group/card">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover/card:opacity-[0.06] transition-all duration-1000">
              <i className="fas fa-fingerprint text-[180px] lg:text-[240px] text-white"></i>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-4 lg:gap-6 mb-8 lg:mb-12">
                <div className="w-14 h-14 lg:w-20 lg:h-20 bg-white/5 rounded-[1.5rem] lg:rounded-[2rem] flex items-center justify-center border border-white/10 shadow-inner group">
                   <i className="fas fa-id-card text-indigo-400 text-2xl lg:text-4xl group-hover:scale-110 transition-transform"></i>
                </div>
                <div>
                  <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-none mb-1 lg:mb-2 uppercase">Identify</h2>
                  <p className="text-slate-500 text-[9px] lg:text-[11px] font-black uppercase tracking-[0.3em]">Initialize Session</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-10">
                <div className="space-y-4 lg:space-y-6">
                  <div className="relative group/input">
                    <div className="absolute left-6 lg:left-8 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-indigo-400 transition-colors">
                      <i className="fas fa-user-secret text-lg lg:text-2xl"></i>
                    </div>
                    <input
                      type="text"
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="CADET NAME..."
                      className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] lg:rounded-[2.5rem] py-5 lg:py-7 pl-14 lg:pl-20 pr-6 lg:pr-8 text-white font-black placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-base lg:text-2xl uppercase tracking-widest"
                      required
                    />
                  </div>

                  <label className="flex items-start gap-4 cursor-pointer group/consent p-3 lg:p-5 rounded-[1.5rem] lg:rounded-[2.5rem] hover:bg-white/5 transition-colors">
                    <div className="mt-1 relative flex-shrink-0">
                      <input 
                        type="checkbox" 
                        checked={hasConsent}
                        onChange={(e) => setHasConsent(e.target.checked)}
                        className="sr-only" 
                      />
                      <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-lg lg:rounded-xl border-2 transition-all flex items-center justify-center ${hasConsent ? 'bg-indigo-600 border-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'border-white/20'}`}>
                        {hasConsent && <i className="fas fa-check text-[10px] lg:text-[14px] text-white"></i>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-slate-300 text-[9px] lg:text-[11px] font-black uppercase tracking-wider leading-none">Privacy Authorization</span>
                       <span className="text-slate-500 text-[8px] lg:text-[10px] leading-relaxed">
                        I authorize session data anonymization for security training.
                       </span>
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!name.trim() || !hasConsent || isEntering}
                  className={`w-full py-5 lg:py-7 rounded-[1.5rem] lg:rounded-[2.5rem] font-black text-lg lg:text-2xl flex items-center justify-center gap-3 lg:gap-4 transition-all transform active:scale-95 group/btn relative overflow-hidden ${
                    name.trim() && hasConsent 
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_15px_30px_rgba(79,70,229,0.4)]' 
                      : 'bg-white/5 text-slate-700 cursor-not-allowed grayscale'
                  }`}
                >
                  {isEntering ? (
                    <span className="tracking-widest flex items-center gap-3 lg:gap-4"><i className="fas fa-satellite fa-spin"></i> SYNCING...</span>
                  ) : (
                    <>
                      <span className="relative z-10 tracking-[0.2em] uppercase">Start Mission</span>
                      <i className="fas fa-chevron-right text-xs lg:text-base group-hover/btn:translate-x-2 transition-transform"></i>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Footer - visible in full screen */}
      <div className="mt-12 lg:mt-0 lg:absolute lg:bottom-10 flex gap-6 lg:gap-10 opacity-30 text-[8px] lg:text-[11px] font-black uppercase tracking-[0.4em] lg:tracking-[0.6em] text-slate-500 select-none pb-8 lg:pb-0">
        <span>GATEWAY_2025</span>
        <span className="text-indigo-500">•</span>
        <span>SYSTEM_RESTRICTED</span>
      </div>
    </div>
  );
};

export default LoginPage;
