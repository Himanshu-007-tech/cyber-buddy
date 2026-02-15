
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Header from './components/Header';
import InputArea from './components/InputArea';
import LoginPage from './components/LoginPage';
import VoiceChatOverlay from './components/VoiceChatOverlay';
import { Message, MessageRole, SUPPORTED_LANGUAGES, Language, ViewState } from './types';
import { generateCyberBuddyResponse } from './services/geminiService';
import { saveMessageToBackend, getChatHistory } from './services/supabaseService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('portal');
  const [userName, setUserName] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState<Language>(SUPPORTED_LANGUAGES[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (view === 'academy') {
      scrollToBottom();
    }
  }, [messages, isLoading, view, scrollToBottom]);

  const handleLogin = async (name: string) => {
    const sanitizedName = name.trim();
    if (!sanitizedName) return;
    
    setUserName(sanitizedName);
    setIsSyncing(true);

    try {
      const history = await getChatHistory(sanitizedName);
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        const welcomeMsg: Message = {
          id: 'welcome-' + Date.now(),
          role: MessageRole.BOT,
          text: currentLanguage.welcome.replace('**${name}**', `**${sanitizedName}**`),
          timestamp: new Date()
        };
        setMessages([welcomeMsg]);
        await saveMessageToBackend(sanitizedName, welcomeMsg);
      }
      setView('academy');
    } catch (err) {
      console.error("Login sync failed:", err);
      alert("Database connection failed. Please check your network.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    setView('portal');
    setUserName('');
    setMessages([]);
    setIsLoading(false);
    setIsSyncing(false);
    setIsVoiceOpen(false);
  };

  const handleSendMessage = async (text: string, image?: File) => {
    if (!text.trim() && !image) return;
    
    setIsLoading(true);
    setIsSyncing(true);

    let imageUrl: string | undefined;
    let imagePayload: { data: string, mimeType: string } | undefined;

    try {
      if (image) {
        imageUrl = URL.createObjectURL(image);
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(image);
        });
        imagePayload = { data: base64Data, mimeType: image.type };
      }

      const userText = text.trim() || "Analyze this media artifact.";
      const userMsg: Message = {
        id: 'msg-user-' + Date.now(),
        role: MessageRole.USER,
        text: userText,
        imageUrl,
        timestamp: new Date()
      };

      // Construct history from current state BEFORE updating it
      const historyPayload = messages.map(m => ({
        role: m.role === MessageRole.USER ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      setMessages(prev => [...prev, userMsg]);
      
      // Save user turn to DB
      await saveMessageToBackend(userName, { ...userMsg, imageUrl: undefined });

      const botText = await generateCyberBuddyResponse(
        userText, 
        currentLanguage.name, 
        historyPayload,
        imagePayload
      );

      const botMsg: Message = {
        id: 'msg-bot-' + Date.now(),
        role: MessageRole.BOT,
        text: botText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
      await saveMessageToBackend(userName, botMsg);
    } catch (err) {
      console.error("Critical Send Failure:", err);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  const formatText = (text: string) => {
    const lines = text.split('\n');
    const result: React.ReactNode[] = [];

    lines.forEach((line, i) => {
      let formatted = line.trim();
      if (!formatted) return;

      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');

      if (formatted.includes('⚠️ Security Briefing')) {
        result.push(
          <div key={i} className="mb-4 p-1 bg-gradient-to-r from-red-500/20 to-indigo-500/20 rounded-2xl border border-white/5">
            <div className="glass-card p-4 rounded-xl">
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <i className="fas fa-satellite-dish animate-pulse"></i> Briefing
              </h4>
              <p className="text-base font-bold text-white" dangerouslySetInnerHTML={{ __html: formatted }} />
            </div>
          </div>
        );
        return;
      }

      if (formatted.includes('🛡 Safety Score')) {
        const scoreMatch = formatted.match(/\d+/);
        const score = scoreMatch ? scoreMatch[0] : '0';
        result.push(
          <div key={i} className="my-6 p-6 glass-card rounded-3xl border-indigo-500/20 flex flex-col items-center">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Resilience Score</span>
            <div className="text-7xl font-black text-white glow-text mb-4">{score}</div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${score}%` }}></div>
            </div>
          </div>
        );
        return;
      }

      result.push(<p key={i} className="mb-3 text-slate-300 text-sm sm:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />);
    });

    return result;
  };

  if (view === 'portal') {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-black/40 cyber-grid">
      <Header 
        onLogout={handleLogout}
        userName={userName}
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />

      <div className="flex flex-grow overflow-hidden pt-20 sm:pt-24">
        <aside className="hidden lg:flex w-80 flex-col border-r border-white/5 px-8 py-10 bg-black/30 backdrop-blur-xl">
          <div className="space-y-6">
            <div className="p-5 glass-card rounded-2xl border-emerald-500/20 bg-emerald-500/5">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase">Shield Active</span>
               </div>
               <p className="text-[11px] text-slate-400">PII scrubbing engine is currently online.</p>
            </div>
          </div>

          <div className="mt-auto space-y-4">
             <div className="p-4 border border-indigo-500/10 rounded-2xl bg-indigo-500/5">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Session Protocol</p>
                <p className="text-[11px] text-slate-400 font-medium">Neural link secured via SOC Academy Gateway.</p>
             </div>
          </div>
        </aside>

        <main className="flex-grow flex flex-col relative px-4 sm:px-6 lg:px-10 pb-32 sm:pb-40">
          <div className="flex-grow overflow-y-auto custom-scrollbar pt-6">
            <div className="max-w-4xl mx-auto space-y-8">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === MessageRole.USER ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
                  <div className={`max-w-[85%] sm:max-w-[75%] ${m.role === MessageRole.USER ? 'order-2' : ''}`}>
                    <div className="flex items-center gap-2 mb-2 px-2">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        {m.role === MessageRole.USER ? userName : 'CyberBuddy'}
                       </span>
                       <span className="text-[8px] font-bold text-slate-600">
                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                    
                    <div className={`p-4 sm:p-6 rounded-[1.8rem] ${
                      m.role === MessageRole.USER 
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-[0_10px_30px_rgba(79,70,229,0.3)]' 
                        : 'glass-card border-white/5 text-slate-200 rounded-tl-none'
                    }`}>
                      {m.imageUrl && (
                        <div className="mb-4 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                          <img src={m.imageUrl} alt="Uploaded" className="w-full h-auto max-h-64 object-cover" />
                        </div>
                      )}
                      <div className="prose prose-invert max-w-none">
                        {formatText(m.text)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="glass-card p-6 rounded-[1.8rem] rounded-tl-none border-white/5">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </main>
      </div>

      <InputArea 
        onSendMessage={handleSendMessage} 
        onStartVoice={() => setIsVoiceOpen(true)}
        isLoading={isLoading} 
      />

      <VoiceChatOverlay 
        isOpen={isVoiceOpen} 
        onClose={() => setIsVoiceOpen(false)} 
        currentLanguage={currentLanguage}
      />
      
      {isSyncing && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600/20 backdrop-blur-md border border-indigo-500/30 px-3 py-1.5 rounded-full flex items-center gap-2">
          <i className="fas fa-sync fa-spin text-indigo-400 text-[10px]"></i>
          <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Neural Sync</span>
        </div>
      )}
    </div>
  );
};

export default App;
