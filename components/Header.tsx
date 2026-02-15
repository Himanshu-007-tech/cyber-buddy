
import React, { useState } from 'react';
import { SUPPORTED_LANGUAGES, Language } from '../types';

interface HeaderProps {
  onLogout: () => void;
  userName: string;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout, userName, currentLanguage, onLanguageChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-3 sm:top-6 left-3 sm:left-6 right-3 sm:right-6 z-40">
      <div className="max-w-7xl mx-auto glass-card rounded-2xl sm:rounded-3xl p-2 sm:p-3 border border-white/10 shadow-2xl flex items-center justify-between backdrop-blur-3xl">
        <div className="flex items-center gap-2 sm:gap-4 pl-1 sm:pl-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
            <i className="fas fa-shield-halved text-white text-xl sm:text-2xl"></i>
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-lg font-black text-white uppercase truncate">
              SOC <span className="hidden xs:inline">Academy</span>
            </h1>
            <p className="text-[8px] sm:text-[10px] text-slate-500 font-black uppercase tracking-widest truncate">{userName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-[9px] sm:text-[11px] font-black text-white uppercase tracking-widest"
            >
              <span>{currentLanguage.flag}</span>
              <span className="hidden sm:inline">Settings</span>
              <i className={`fas fa-chevron-down text-[8px] transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                <div className="absolute right-0 mt-3 w-56 glass-card rounded-2xl shadow-2xl z-50 p-2 border border-white/10 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-2 border-b border-white/5 mb-1">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-2">Mission Options</p>
                  </div>
                  
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { onLanguageChange(lang); setIsMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold rounded-xl transition-all ${
                        currentLanguage.code === lang.code ? 'bg-indigo-600/20 text-indigo-400' : 'hover:bg-white/5 text-slate-400'
                      }`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span className="flex-grow text-left">{lang.name}</span>
                    </button>
                  ))}

                  <div className="mt-2 pt-2 border-t border-white/5">
                    <button 
                      onClick={() => { setIsMenuOpen(false); onLogout(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black text-white bg-red-500/20 hover:bg-red-500/40 rounded-xl transition-all uppercase tracking-widest"
                    >
                      <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <button 
            onClick={onLogout}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center flex-shrink-0"
            title="Logout"
          >
            <i className="fas fa-power-off text-sm sm:text-base"></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
