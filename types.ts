
export enum MessageRole {
  USER = 'user',
  BOT = 'bot'
}

export type ViewState = 'portal' | 'academy';

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
  imageUrl?: string;
  isHygieneCheck?: boolean;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
  welcome: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { 
    code: 'en', 
    name: 'English', 
    flag: '🇺🇸', 
    welcome: "👋 Welcome to Cyber Academy — Mission Control initialized.\n\nI am your Security Companion. What is our first objective?\n1️⃣ Phishing Email Drill\n2️⃣ Link Verification Scan\n3️⃣ Screenshot Vulnerability Analysis\n4️⃣ Global Hygiene Score Check" 
  },
  { 
    code: 'hi', 
    name: 'Hindi', 
    flag: '🇮🇳', 
    welcome: "👋 साइबर एकेडमी में आपका स्वागत है — मिशन कंट्रोल सक्रिय हो गया है।\n\nमैं आपका सुरक्षा साथी हूँ। हमारा पहला मिशन क्या है?\n1️⃣ फ़िशिंग ईमेल ड्रिल\n2️⃣ लिंक सत्यापन स्कैन\n3️⃣ स्क्रीनशॉट भेद्यता विश्लेषण\n4️⃣ वैश्विक सुरक्षा स्कोर की जाँच" 
  }
];
