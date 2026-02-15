
import React, { useState, useRef } from 'react';

interface InputAreaProps {
  onSendMessage: (text: string, image?: File) => void;
  onStartVoice: () => void;
  isLoading: boolean;
}

const SCENARIOS = [
  { label: "🕵️ Suspicious Text", prompt: "Can you check this message for me? It says: 'Urgent: Your account is locked. Click here to verify: bit.ly/34xyz'" },
  { label: "🔗 Link Check", prompt: "Is this link safe to click? https://student-rewards-free.web.app" },
  { label: "🛡 Safety Score", prompt: "I want to know my Safety Score. I use 2FA, long passwords, but I sometimes click links from friends." },
];

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, onStartVoice, isLoading }) => {
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((text.trim() || selectedImage) && !isLoading) {
      onSendMessage(text, selectedImage || undefined);
      setText('');
      setSelectedImage(null);
      setPreviewUrl(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-6 z-30 pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto">
        
        {/* Image Preview Overlay */}
        {previewUrl && (
          <div className="mb-3 flex justify-center animate-in slide-in-from-bottom-2 duration-300">
            <div className="relative glass-card p-1.5 rounded-xl border-indigo-500/50">
              <img src={previewUrl} alt="Preview" className="h-16 sm:h-24 w-auto rounded-lg object-cover" />
              <button 
                onClick={() => { setSelectedImage(null); setPreviewUrl(null); }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
              >
                <i className="fas fa-times text-[10px]"></i>
              </button>
            </div>
          </div>
        )}

        {/* Suggestion Chips */}
        {!previewUrl && (
          <div className="flex overflow-x-auto gap-2 mb-3 no-scrollbar pb-1 px-1">
            {SCENARIOS.map((s, i) => (
              <button 
                key={i}
                onClick={() => onSendMessage(s.prompt)}
                className="whitespace-nowrap text-[9px] sm:text-[10px] font-black bg-white/5 hover:bg-white/10 text-indigo-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10 transition-all flex-shrink-0 backdrop-blur-lg uppercase tracking-widest"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="glass-card rounded-[1.8rem] sm:rounded-[2.5rem] p-1.5 sm:p-3 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleSubmit} className="flex gap-1.5 sm:gap-2">
            <div className="relative flex-grow flex items-center">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageSelect}
              />
              <button
                type="button"
                onClick={triggerFileUpload}
                className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center rounded-full transition-all ${
                  selectedImage ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-indigo-400'
                }`}
              >
                <i className="fas fa-camera text-base sm:text-lg"></i>
              </button>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={selectedImage ? "Describe..." : "Ask CyberBuddy..."}
                className="w-full bg-transparent border-none rounded-[1.2rem] sm:rounded-[1.8rem] py-2.5 sm:py-3 px-2 sm:px-4 focus:outline-none transition-all text-white font-medium placeholder:text-slate-600 resize-none min-h-[40px] max-h-32 custom-scrollbar text-xs sm:text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              
              <button
                type="submit"
                disabled={(!text.trim() && !selectedImage) || isLoading}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all flex-shrink-0 ${
                  (text.trim() || selectedImage) && !isLoading 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white/5 text-slate-700 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <i className="fas fa-paper-plane text-xs sm:text-sm"></i>
                )}
              </button>
            </div>
            
            <button
              type="button"
              onClick={onStartVoice}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-[1.2rem] sm:rounded-[1.8rem] bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex flex-col items-center justify-center flex-shrink-0 shadow-xl glow-indigo group"
            >
              <i className="fas fa-microphone text-lg sm:text-xl transition-transform group-active:scale-90"></i>
              <span className="text-[7px] font-black uppercase tracking-widest hidden sm:block">Voice</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
