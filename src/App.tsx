import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Routes, Route } from 'react-router-dom';
import { initialQuoteData } from './data';
import { chatWithAI } from './gemini';
import { PublicQuote } from './PublicQuote';
import { supabase } from './supabase';
import { Login } from './Login';
import type { QuoteData } from "./types";
import type { AIModel, UploadedFile, ThinkingLevel } from './gemini';
import type { User } from '@supabase/supabase-js';
import './App.css';

// Components
import { HistoryModal } from './components/modals/HistoryModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { ShareModal } from './components/modals/ShareModal';
import { InspectorPanel } from './components/sidebar/InspectorPanel';
import { PreviewPanel } from './components/preview/PreviewPanel';

// Hooks
import { useQuoteLogic } from './hooks/useQuoteLogic';

const App: React.FC = () => {
  // --- States ---
  const [data, setData] = useState<QuoteData>(initialQuoteData);
  const [apiKey, setApiKey] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showQuotesList, setShowQuotesList] = useState(false);
  const [quotesList, setQuotesList] = useState<any[]>([]);
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string, files?: string[] }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const [model, setModel] = useState<AIModel>('flash');
  const [thinking, setThinking] = useState<ThinkingLevel>('high');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set(['Inter', 'Plus Jakarta Sans']));

  // --- Refs ---
  const chatEndRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Custom Hook Logic ---
  const {
    recalculate,
    handlePrint,
    handleDownloadPDF,
    handleDownloadPNG,
    handleShare,
    saveQuotationToDB
  } = useQuoteLogic(data, setData, user);

  // --- Effects ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSystemKey();
      fetchLatestQuoteNo();
      const today = new Date();
      const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
      setData(prev => ({ ...prev, date: formattedDate }));
    }
  }, [user]);

  // Dynamic Font Loading
  useEffect(() => {
    const style = data.style;
    if (!style) return;
    const fontsToLoad = [style.fontFamily, style.headingFont].filter(f => f && !loadedFonts.has(f));
    if (fontsToLoad.length > 0) {
      const fontUrls = fontsToLoad.map(font => `family=${font.replace(/ /g, '+')}:wght@300;400;500;600;700`).join('&');
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?${fontUrls}&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      setLoadedFonts(prev => new Set([...prev, ...fontsToLoad]));
    }
  }, [data.style?.fontFamily, data.style?.headingFont]);

  // Scaling effect
  useEffect(() => {
    const handleResize = () => {
      if (previewRef.current) {
        const containerWidth = previewRef.current.offsetWidth - 80;
        const docWidth = 794;
        setScale(containerWidth < docWidth ? containerWidth / docWidth : 1);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Handlers ---
  const fetchSystemKey = async () => {
    if (!user) return;
    const { data: userData } = await supabase.from('profiles').select('gemini_api_key').eq('id', user.id).single();
    if (userData?.gemini_api_key) {
      setApiKey(userData.gemini_api_key);
      return;
    }
    const { data: systemData } = await supabase.from('system_api_keys').select('encrypted_key').eq('is_active', true).eq('provider', 'gemini').limit(1).single();
    if (systemData) setApiKey(systemData.encrypted_key);
  };

  const fetchLatestQuoteNo = async () => {
    const { data: quotes } = await supabase.from('quotations').select('quote_number').order('created_at', { ascending: false }).limit(1);
    if (quotes?.[0]) {
      const lastNo = quotes[0].quote_number;
      const match = lastNo.match(/(\d+)$/);
      if (match) {
        const nextNum = parseInt(match[1]) + 1;
        const prefix = lastNo.substring(0, lastNo.length - match[1].length);
        setData(prev => ({ ...prev, quoteNo: `${prefix}${nextNum.toString().padStart(match[1].length, '0')}` }));
      }
    }
  };

  const validateApiKey = async () => {
    if (!apiKey.trim()) return;
    setApiKeyStatus('checking');
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const testModel = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
      const result = await testModel.generateContent('Hi');
      setApiKeyStatus(result.response.text() ? 'valid' : 'invalid');
    } catch { setApiKeyStatus('invalid'); }
  };

  const saveUserKey = async () => {
    if (!user || !apiKey) return;
    const { error } = await supabase.from('profiles').upsert({ id: user.id, gemini_api_key: apiKey });
    if (!error) {
      setApiKeyStatus('valid');
      alert('✅ Đã lưu API Key thành công!');
      setTimeout(() => setShowSettingsModal(false), 1000);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && files.length === 0) || !apiKey) return;
    const userMsg = input.trim() || 'Phân tích file đính kèm';
    setMessages(prev => [...prev, { role: 'user', content: userMsg, files: files.map(f => f.name) }]);
    setInput('');
    setLoading(true);
    try {
      const response = await chatWithAI(apiKey, userMsg, data, files, model, thinking);
      setMessages(prev => [...prev, { role: 'ai', content: response.message }]);
      if (response.updatedQuote) {
        setData(response.updatedQuote);
        setTimeout(() => saveQuotationToDB(response.updatedQuote), 500);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'Có lỗi xảy ra khi gọi Gemini API.' }]);
    } finally {
      setLoading(false);
      setFiles([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setFiles(prev => [...prev, {
          name: file.name,
          type: file.type,
          data: (reader.result as string).split(',')[1],
          preview: file.type.startsWith('image/') ? reader.result as string : undefined
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'));
    if (item) {
      const file = item.getAsFile();
      if (file) {
        const reader = new FileReader();
        reader.onload = () => setFiles(prev => [...prev, {
          name: `clipboard-${Date.now()}.png`,
          type: file.type,
          data: (reader.result as string).split(',')[1],
          preview: reader.result as string
        }]);
        reader.readAsDataURL(file);
      }
    }
  };

  const loadQuotes = async () => {
    const { data: quotes } = await supabase.from('quotations').select('*').order('created_at', { ascending: false });
    if (quotes) setQuotesList(quotes);
  };

  if (authLoading) return <div className="loading-screen"><Loader2 className="animate-spin" size={48} /><p>Connecting...</p></div>;

  return (
    <Routes>
      <Route path="/quote/:token" element={<PublicQuote />} />
      <Route path="/" element={
        !user ? <Login onLogin={() => { }} /> : (
          <div className="app-layout">
            {showQuotesList && <HistoryModal quotesList={quotesList} loadQuoteFromList={(q) => { setData(q); setShowQuotesList(false); }} setShowQuotesList={setShowQuotesList} />}
            {showSettingsModal && <SettingsModal apiKey={apiKey} setApiKey={setApiKey} apiKeyStatus={apiKeyStatus} validateApiKey={validateApiKey} saveUserKey={saveUserKey} handleLogout={() => supabase.auth.signOut()} setShowSettingsModal={setShowSettingsModal} />}
            {showShareModal && <ShareModal shareUrl={shareUrl} copyToClipboard={(text) => { navigator.clipboard.writeText(text); alert('Copied!'); }} setShowShareModal={setShowShareModal} />}

            <InspectorPanel
              user={user} model={model} setModel={setModel} thinking={thinking} setThinking={setThinking}
              apiKeyStatus={apiKeyStatus} apiKey={apiKey} messages={messages} input={input} setInput={setInput}
              loading={loading} files={files} handleSend={handleSend} handleFileUpload={handleFileUpload}
              handlePaste={handlePaste} removeFile={(i) => setFiles(f => f.filter((_, idx) => idx !== i))}
              setShowSettingsModal={setShowSettingsModal} fetchQuotesList={loadQuotes} setShowQuotesList={setShowQuotesList}
              fileInputRef={fileInputRef} chatEndRef={chatEndRef}
            />

            <PreviewPanel
              data={data} setData={setData} scale={scale} previewRef={previewRef}
              handleShare={() => handleShare(setShareUrl, setShowShareModal)}
              handleDownloadPNG={handleDownloadPNG} handleDownloadPDF={handleDownloadPDF}
              handlePrint={handlePrint} recalculate={recalculate}
            />
          </div>
        )
      } />
    </Routes>
  );
}

export default App;
