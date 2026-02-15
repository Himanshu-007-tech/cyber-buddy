
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, Blob } from '@google/genai';
import { CYBERBUDDY_SYSTEM_PROMPT } from '../constants';
import { encode, decode, decodeAudioData } from '../services/audioUtils';
import { Language } from '../types';

interface VoiceChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: Language;
}

const VoiceChatOverlay: React.FC<VoiceChatOverlayProps> = ({ isOpen, onClose, currentLanguage }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'idle'>('connecting');
  const [transcription, setTranscription] = useState('');
  
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      startSession();
    } else {
      stopSession();
    }
    return () => stopSession();
  }, [isOpen]);

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setIsActive(false);
    setStatus('idle');
  };

  const startSession = async () => {
    try {
      setStatus('connecting');
      // Create a new GoogleGenAI instance right before making an API call to ensure latest key is used.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setStatus('listening');
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              // Initiating sendRealtimeInput after live.connect call resolves.
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => (prev + ' ' + message.serverContent?.outputTranscription?.text).trim());
            }

            // Correctly access model turn parts.
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              setStatus('speaking');
              const ctx = audioContextOutRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus('listening');
            }

            if (message.serverContent?.turnComplete) {
              setTranscription('');
            }
          },
          onerror: (e) => console.error('Live API Error:', e),
          onclose: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `${CYBERBUDDY_SYSTEM_PROMPT}\n\nYou are in VOICE MODE. Be concise. The user is speaking in ${currentLanguage.name}. Respond in the same language.`
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to start voice session', err);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center p-6 sm:p-8 relative border border-white/10 max-h-[95vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 text-slate-500 transition-colors"
        >
          <i className="fas fa-times text-xl"></i>
        </button>

        <div className="mb-6 sm:mb-8 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <i className="fas fa-shield-halved text-white text-2xl sm:text-3xl"></i>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Voice Session</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">CyberBuddy Academy</p>
        </div>

        <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center mb-6 sm:mb-8">
          <div className={`absolute inset-0 rounded-full bg-indigo-500/10 transition-all duration-500 ${status === 'listening' ? 'animate-ping' : 'scale-90 opacity-0'}`}></div>
          <div className={`absolute inset-4 rounded-full bg-violet-500/10 transition-all duration-700 ${status === 'speaking' ? 'animate-pulse' : 'scale-95 opacity-0'}`}></div>
          
          <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${status === 'speaking' ? 'bg-indigo-600 scale-110 shadow-2xl shadow-indigo-500/40' : 'bg-indigo-500'}`}>
             {status === 'connecting' ? (
               <i className="fas fa-spinner fa-spin text-white text-3xl sm:text-4xl"></i>
             ) : (
               <i className={`fas ${status === 'speaking' ? 'fa-volume-high' : 'fa-microphone'} text-white text-3xl sm:text-4xl`}></i>
             )}
          </div>
        </div>

        <div className="w-full bg-white/5 rounded-2xl p-4 min-h-[80px] sm:min-h-[100px] text-center border border-white/5 mb-6">
          <p className="text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-2">Live Analysis Feed</p>
          <p className="text-white font-medium italic text-sm sm:text-base">
            {transcription || (status === 'connecting' ? 'Initializing secure link...' : 'I\'m listening. How can I help?')}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
            status === 'listening' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
            status === 'speaking' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-white/5 text-slate-500 border-white/5'
          }`}>
            Status: {status}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceChatOverlay;
