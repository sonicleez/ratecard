import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Send,
  Settings,
  Sparkles,
  MapPin,
  Mail,
  Phone,
  ChevronRight,
  ShieldCheck,
  Zap,
  Loader2,
  Upload,
  X,
  FileType,
  CreditCard,
  Download,
  Image,
  Share2,
  Copy,
  Link as LinkIcon,
  History
} from 'lucide-react';
import { Routes, Route } from 'react-router-dom';
import { initialQuoteData } from './data';
import { formatCurrency } from './utils';
import { chatWithAI } from './gemini';
import { PublicQuote } from './PublicQuote';
import { supabase } from './supabase';
import { Login } from './Login';
import type { QuoteData } from "./types";
import type { AIModel, UploadedFile, ThinkingLevel } from './gemini';
import type { User } from '@supabase/supabase-js';
import './App.css';
import logoImg from './assets/logo.png';

const App: React.FC = () => {
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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset thinking level if switching to Pro (which only supports low/high)
  useEffect(() => {
    if (model === 'pro' && (thinking === 'medium' || thinking === 'minimal')) {
      setThinking('high');
    }
  }, [model]);

  // Check Auth Session
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

  // Fetch System API Key and Latest Quote Number + Update Date
  useEffect(() => {
    if (user) {
      fetchSystemKey();
      fetchLatestQuoteNo();
      // Auto-update date to today
      const today = new Date();
      const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
      setData(prev => ({ ...prev, date: formattedDate }));
    }
  }, [user]);

  const fetchSystemKey = async () => {
    if (!user) return;

    // First, try to fetch user-specific key
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('gemini_api_key')
      .eq('id', user.id)
      .single();

    if (userData?.gemini_api_key && !userError) {
      setApiKey(userData.gemini_api_key);
      return;
    }

    // Fallback to system key
    const { data: systemData, error: systemError } = await supabase
      .from('system_api_keys')
      .select('encrypted_key')
      .eq('is_active', true)
      .eq('provider', 'gemini')
      .limit(1)
      .single();

    if (systemData && !systemError) {
      setApiKey(systemData.encrypted_key);
    }
  };

  const saveUserKey = async () => {
    if (!user || !apiKey) return;
    setApiKeyStatus('checking');

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        gemini_api_key: apiKey
      });

    if (!error) {
      setApiKeyStatus('valid');
      alert('✅ Đã lưu API Key thành công!');
      setTimeout(() => setShowSettingsModal(false), 1000);
    } else {
      console.error('Supabase Save Error:', error);
      setApiKeyStatus('invalid');
      alert(`❌ Lỗi lưu API Key: ${error.message}\n\nVui lòng kiểm tra xem bảng 'profiles' đã có cột 'gemini_api_key' chưa.`);
    }
  };

  const fetchLatestQuoteNo = async () => {
    const { data: quotes, error } = await supabase
      .from('quotations')
      .select('quote_number')
      .order('created_at', { ascending: false })
      .limit(1);

    if (quotes && quotes.length > 0 && !error) {
      const lastNo = quotes[0].quote_number;
      const match = lastNo.match(/(\d+)$/);
      if (match) {
        const nextNum = parseInt(match[1]) + 1;
        const prefix = lastNo.substring(0, lastNo.length - match[1].length);
        const nextNo = `${prefix}${nextNum.toString().padStart(match[1].length, '0')}`;
        setData(prev => ({ ...prev, quoteNo: nextNo }));
      }
    }
  };

  const saveQuotationToDB = async () => {
    if (!user) return;

    await supabase.from('quotations').insert({
      user_id: user.id,
      quote_number: data.quoteNo,
      quote_data: data,
      status: 'downloaded'
    });
  };

  const incrementQuoteNo = () => {
    const currentNo = data.quoteNo;
    const match = currentNo.match(/(\d+)$/);
    if (match) {
      const nextNum = parseInt(match[1]) + 1;
      const prefix = currentNo.substring(0, currentNo.length - match[1].length);
      const nextNo = `${prefix}${nextNum.toString().padStart(match[1].length, '0')}`;
      setData(prev => ({ ...prev, quoteNo: nextNo }));
    }
  };

  const fetchQuotesList = async () => {
    if (!user) return;
    const { data: quotes, error } = await supabase
      .from('quotations')
      .select('id, quote_number, quote_data, created_at, status, public_token, view_count')
      .order('created_at', { ascending: false });

    if (!error && quotes) {
      setQuotesList(quotes);
    }
  };

  const loadQuoteFromList = (quoteData: any) => {
    setData(quoteData);
    setShowQuotesList(false);
  };

  const handleShare = async () => {
    if (!user) return;

    // Generate a random token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Đảm bảo lưu bản sao dữ liệu sạch (không bị dính suffix nếu đang load từ history)
    const cleanQuoteNo = data.quoteNo.split('_SHARED_')[0];
    const cleanData = { ...data, quoteNo: cleanQuoteNo };

    const { error } = await supabase.from('quotations').insert({
      user_id: user.id,
      quote_number: `${cleanQuoteNo}_SHARED_${Date.now()}`,
      quote_data: cleanData,
      status: 'shared',
      public_token: token
    });

    if (!error) {
      const url = `${window.location.origin}/quote/${token}`;
      setShareUrl(url);
      setShowShareModal(true);
    } else {
      alert('Có lỗi khi tạo link chia sẻ.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Đã copy link vào bộ nhớ tạm!');
  };

  // Dynamic Google Font loading
  useEffect(() => {
    const style = data.style;
    if (!style) return;

    const fontsToLoad = [style.fontFamily, style.headingFont].filter(f => f && !loadedFonts.has(f));

    if (fontsToLoad.length > 0) {
      const fontUrls = fontsToLoad.map(font =>
        `family=${font.replace(/ /g, '+')}:wght@300;400;500;600;700`
      ).join('&');

      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?${fontUrls}&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      setLoadedFonts(prev => new Set([...prev, ...fontsToLoad]));
    }
  }, [data.style?.fontFamily, data.style?.headingFont]);

  useEffect(() => {
    const handleResize = () => {
      if (previewRef.current) {
        const containerWidth = previewRef.current.offsetWidth - 80;
        const docWidth = 794;
        if (containerWidth < docWidth) {
          setScale(containerWidth / docWidth);
        } else {
          setScale(1);
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
    setApiKeyStatus('idle'); // Reset status when key changes
  }, [apiKey]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const validateApiKey = async () => {
    if (!apiKey.trim()) return;

    setApiKeyStatus('checking');
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);

      // Try multiple models as fallback
      const models = ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-pro'];
      let success = false;

      for (const modelName of models) {
        try {
          const testModel = genAI.getGenerativeModel({ model: modelName });
          const result = await testModel.generateContent('Hi');
          if (result.response.text()) {
            success = true;
            break;
          }
        } catch (modelError) {
          console.log(`Model ${modelName} failed, trying next...`);
          continue;
        }
      }

      setApiKeyStatus(success ? 'valid' : 'invalid');
    } catch (error: any) {
      console.error('API Key validation error:', error);
      setApiKeyStatus('invalid');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    Array.from(uploadedFiles).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        const preview = file.type.startsWith('image/') ? reader.result as string : undefined;
        setFiles(prev => [...prev, {
          name: file.name,
          type: file.type,
          data: base64,
          preview
        }]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle paste from clipboard
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            const preview = reader.result as string;
            setFiles(prev => [...prev, {
              name: `clipboard-${Date.now()}.png`,
              type: file.type,
              data: base64,
              preview
            }]);
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const recalculate = (quote: QuoteData) => {
    let totalQuote = 0;
    quote.groups.forEach(group => {
      let groupSubtotal = 0;
      group.items.forEach(item => {
        item.total = item.quantity * item.unitPrice;
        groupSubtotal += item.total;
      });
      group.subtotal = groupSubtotal;
      totalQuote += groupSubtotal;
    });
    quote.totalQuote = totalQuote;
    quote.vat = totalQuote * 0.1;
    quote.grandTotal = totalQuote + quote.vat;
  };

  const handleSend = async () => {
    if ((!input.trim() && files.length === 0) || !apiKey) return;

    const userMsg = input.trim() || 'Phân tích file đính kèm';
    const fileNames = files.map(f => f.name);
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg, files: fileNames }]);
    setLoading(true);

    try {
      const response = await chatWithAI(apiKey, userMsg, data, files, model, thinking);
      console.log('AI Full Response:', response);
      setMessages(prev => [...prev, { role: 'ai', content: response.message }]);

      if (response.updatedQuote) {
        setData(response.updatedQuote);
        // Tự động lưu bản cập nhật của AI vào lịch sử để có thể load lại sau này
        setTimeout(() => {
          saveQuotationToDB();
        }, 500);
      }
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Có lỗi xảy ra khi gọi Gemini API. Vui lòng kiểm tra lại API Key.' }]);
    } finally {
      setLoading(false);
      setFiles([]);
    }
  };

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    const element = document.querySelector('.page-print') as HTMLElement;
    if (!element) return;

    const html2pdf = (await import('html2pdf.js')).default;

    // Hide all no-print elements before generating PDF
    const noPrintElements = element.querySelectorAll('.no-print');
    noPrintElements.forEach(el => (el as HTMLElement).style.display = 'none');

    const opt = {
      margin: [5, 5, 5, 5] as [number, number, number, number],
      filename: `${data.quoteNo || 'BaoGia'}_${data.projectName?.replace(/\s+/g, '_') || 'Quote'}.pdf`,
      image: { type: 'png' as const, quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    await html2pdf().set(opt).from(element).save();

    // Restore no-print elements after PDF generation
    noPrintElements.forEach(el => (el as HTMLElement).style.display = '');

    // Save to DB and increment
    await saveQuotationToDB();
    incrementQuoteNo();
  };

  const handleDownloadPNG = async () => {
    const element = document.querySelector('.page-print') as HTMLElement;
    if (!element) return;

    const html2canvas = (await import('html2canvas')).default;

    const canvas = await html2canvas(element, {
      scale: 3, // High quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const link = document.createElement('a');
    link.download = `${data.quoteNo || 'BaoGia'}_${data.projectName?.replace(/\s+/g, '_') || 'Quote'}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();

    // Save to DB and increment
    await saveQuotationToDB();
    incrementQuoteNo();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (authLoading) {
    return (
      <div className="loading-screen">
        <Loader2 className="animate-spin" size={48} />
        <p>Connecting to AI Quotation Studio...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/quote/:token" element={<PublicQuote />} />
      <Route path="/" element={
        !user ? (
          <Login onLogin={() => { }} />
        ) : (
          <div className="app-layout">
            {/* Overlays */}
            {showQuotesList && (
              <div className="login-overlay">
                <div className="login-card history-card">
                  <div className="login-header">
                    <div className="logo-icon"><History size={24} /></div>
                    <h2>Lịch sử báo giá</h2>
                    <p>Các báo giá bạn đã tạo và chia sẻ</p>
                  </div>
                  <div className="quotes-list-container">
                    {quotesList.length === 0 ? (
                      <p className="empty-msg">Chưa có báo giá nào được lưu.</p>
                    ) : (
                      quotesList.map(q => (
                        <div key={q.id} className="quote-list-item" onClick={() => loadQuoteFromList(q.quote_data)}>
                          <div className="q-info">
                            <strong>{q.quote_number}</strong>
                            <span>{new Date(q.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="q-meta">
                            {q.public_token && <span className="view-badge"><Sparkles size={10} /> {q.view_count || 0} views</span>}
                            <ChevronRight size={14} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="login-actions">
                    <button onClick={() => setShowQuotesList(false)} className="login-btn primary">Đóng</button>
                  </div>
                </div>
              </div>
            )}

            {showSettingsModal && (
              <div className="login-overlay">
                <div className="login-card share-card">
                  <div className="login-header">
                    <div className="logo-icon"><Settings size={24} /></div>
                    <h2>Cài đặt ứng dụng</h2>
                    <p>Quản lý API Key và tài khoản của bạn</p>
                  </div>
                  <div className="settings-section">
                    <label style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px', display: 'block' }}>GEMINI API KEY (PRIVATE)</label>
                    <div className="input-group" style={{ marginTop: '0' }}>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Dán API Key của bạn vào đây..."
                        style={{ background: 'none', border: 'none', color: 'white', flex: 1, outline: 'none' }}
                      />
                      <button onClick={validateApiKey} className="copy-btn" title="Kiểm tra" style={{ background: 'rgba(255,255,255,0.1)', marginRight: '5px' }}>
                        <Zap size={18} color={apiKeyStatus === 'valid' ? '#4CAF50' : apiKeyStatus === 'invalid' ? '#F44336' : 'white'} />
                      </button>
                      <button onClick={saveUserKey} className="copy-btn" title="Lưu vào Database">
                        <Upload size={18} />
                      </button>
                    </div>
                    <small style={{ color: 'var(--primary)', fontSize: '11px', marginTop: '5px', display: 'block' }}>
                      * API Key này sẽ được ưu tiên hơn API hệ thống và chỉ dùng cho riêng bạn.
                    </small>
                  </div>
                  <div className="login-actions" style={{ flexDirection: 'column', gap: '10px' }}>
                    <button onClick={handleLogout} className="login-btn secondary" style={{ width: '100%', borderColor: 'rgba(255,68,68,0.3)', color: '#ff4444' }}>Đăng xuất tài khoản</button>
                    <button onClick={() => setShowSettingsModal(false)} className="login-btn primary" style={{ width: '100%' }}>Đóng</button>
                  </div>
                </div>
              </div>
            )}

            {showShareModal && (
              <div className="login-overlay">
                <div className="login-card share-card">
                  <div className="login-header">
                    <div className="logo-icon"><LinkIcon size={24} /></div>
                    <h2>Chia sẻ báo giá</h2>
                    <p>Copy link bên dưới để gửi cho khách hàng</p>
                  </div>
                  <div className="input-group">
                    <input type="text" value={shareUrl || ''} readOnly />
                    <button onClick={() => copyToClipboard(shareUrl || '')} className="copy-btn">
                      <Copy size={18} />
                    </button>
                  </div>
                  <div className="login-actions">
                    <button onClick={() => setShowShareModal(false)} className="login-btn primary">Đóng</button>
                  </div>
                </div>
              </div>
            )}

            {/* Main Application Interface */}
            <aside className="inspector-panel no-print">
              <div className="user-profile-bar">
                <div className="user-info">
                  <div className="user-avatar">{user.email?.substring(0, 2).toUpperCase()}</div>
                  <div className="user-details">
                    <span className="user-email">{user.email}</span>
                    <span className="user-role">Professional</span>
                  </div>
                </div>
                <button className="logout-btn" onClick={() => setShowSettingsModal(true)} title="Cài đặt">
                  <Settings size={16} />
                </button>
                <button className="logout-btn" onClick={() => { fetchQuotesList(); setShowQuotesList(true); }} title="Lịch sử báo giá" style={{ margin: '0 8px' }}>
                  <History size={16} />
                </button>
              </div>

              <div className="inspector-content">
                <div className="settings-bar-mini" style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Model & Intelligence</label>
                    <select
                      className="model-dropdown"
                      value={`${model}-${thinking}`}
                      onChange={(e) => {
                        const [newModel, newThinking] = e.target.value.split('-') as [AIModel, ThinkingLevel];
                        setModel(newModel);
                        setThinking(newThinking);
                      }}
                    >
                      <option value="pro-high">Gemini 3 Pro (Thinking: High)</option>
                      <option value="pro-low">Gemini 3 Pro (Thinking: Low)</option>
                      <option value="flash-high">Gemini 3 Flash (Thinking: High)</option>
                      <option value="flash-medium">Gemini 3 Flash (Thinking: Med)</option>
                      <option value="flash-low">Gemini 3 Flash (Thinking: Low)</option>
                      <option value="flash-minimal">Gemini 3 Flash (Thinking: Min)</option>
                    </select>
                  </div>
                  <div className="api-status-bar">
                    {apiKeyStatus === 'valid' && (
                      <p className="api-status valid" style={{ color: '#4CAF50', fontSize: '11px', margin: '0' }}>✓ API Key hoạt động</p>
                    )}
                    {apiKeyStatus === 'invalid' && (
                      <p className="api-status invalid" style={{ color: '#F44336', fontSize: '11px', margin: '0' }}>✗ API Key không hợp lệ</p>
                    )}
                    {!apiKey && <p style={{ fontSize: '10px', color: '#ff7043', margin: '0' }}>Vui lòng thiết lập API Key trong Cài đặt.</p>}
                  </div>
                </div>

                <div className="chat-container">
                  <div className="welcome-ai">
                    <Sparkles size={32} color="var(--primary)" />
                    <h4>AI Kế Toán Chuyên Nghiệp</h4>
                    <p>Upload file để phân tích & brainstorm:</p>
                    <ul style={{ textAlign: 'left', fontSize: '11px', color: 'var(--text-secondary)', margin: '10px 0' }}>
                      <li>📷 Ảnh màn hình, bảng chi phí</li>
                      <li>📄 File PDF brief, hợp đồng</li>
                      <li>💡 Tư vấn chiến lược giá có lợi</li>
                      <li>🔧 Chỉnh sửa toàn bộ layout</li>
                    </ul>
                  </div>

                  {messages.map((msg, i) => (
                    <div key={i} className={`chat-bubble ${msg.role}`}>
                      {msg.files && msg.files.length > 0 && (
                        <div className="attached-files">
                          {msg.files.map((f, fi) => (
                            <span key={fi} className="file-tag">📎 {f}</span>
                          ))}
                        </div>
                      )}
                      <div className="message-content">{msg.content}</div>
                    </div>
                  ))}
                  {loading && (
                    <div className="chat-bubble ai thinking">
                      <Loader2 className="spin" size={16} />
                      <span>Đang xử lý...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {files.length > 0 && (
                  <div className="file-preview-area">
                    {files.map((file, i) => (
                      <div key={i} className="file-preview-item">
                        {file.preview ? (
                          <img src={file.preview} alt={file.name} />
                        ) : (
                          <div className="file-icon">
                            <FileType size={24} />
                          </div>
                        )}
                        <span className="file-name">{file.name}</span>
                        <button className="remove-file" onClick={() => removeFile(i)}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="chat-input-area">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,.pdf"
                    multiple
                    style={{ display: 'none' }}
                  />
                  <button
                    className="upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload ảnh hoặc PDF"
                  >
                    <Upload size={18} />
                  </button>
                  <input
                    className="chat-input"
                    placeholder="Nhập lệnh hoặc Ctrl+V dán hình..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    onPaste={handlePaste}
                  />
                  <button className="send-btn" onClick={handleSend} disabled={loading || !apiKey}>
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </aside>

            <main className="preview-panel" ref={previewRef}>
              <div className="floating-actions no-print">
                <button onClick={handleShare} className="action-btn secondary">
                  <Share2 size={18} />
                  <span>Chia sẻ Link</span>
                </button>
                <button onClick={handleDownloadPNG} className="action-btn secondary">
                  <Image size={18} />
                  <span>Tải PNG</span>
                </button>
                <button onClick={handleDownloadPDF} className="action-btn secondary">
                  <Download size={18} />
                  <span>Tải PDF</span>
                </button>
                <button onClick={handlePrint} className="action-btn primary">
                  <Printer size={18} />
                  <span>In Báo Giá</span>
                </button>
              </div>

              {data.style?.customCss && (
                <style dangerouslySetInnerHTML={{ __html: data.style.customCss }} />
              )}

              <div
                className={`quote-wrapper ${data.style?.tableStyle || 'modern'} ${data.style?.layoutVariant || 'standard'}`}
                style={{
                  transform: `scale(${scale})`,
                  fontFamily: data.style?.fontFamily || 'Inter',
                  fontSize: `${data.style?.bodyFontSize || 12}px`,
                  color: data.style?.textColor || '#1A1A1A',
                  '--primary': data.style?.primaryColor || '#FF4D00',
                  '--secondary': data.style?.secondaryColor || '#1A1A1A',
                  '--primary-color': data.style?.primaryColor || '#FF4D00',
                  '--accent-color': data.style?.accentColor || '#FF7043',
                  '--heading-font': data.style?.headingFont || 'Plus Jakarta Sans',
                  '--heading-size': `${data.style?.headingFontSize || 28}px`,
                } as React.CSSProperties}
              >
                <div className="page-print">
                  <header className="quote-header">
                    <div className="brand-section">
                      <img src={logoImg} alt="MODOS Logo" className="brand-logo" />
                    </div>
                    <div className="company-details">
                      <h3
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setData({ ...data, companyInfo: { ...data.companyInfo, name: e.currentTarget.textContent || '' } })}
                        className="editable-field"
                      >{data.companyInfo?.name || 'CÔNG TY CỔ PHẦN MODOS'}</h3>
                      <p><MapPin size={10} />
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => setData({ ...data, companyInfo: { ...data.companyInfo, address: e.currentTarget.textContent || '' } })}
                          className="editable-field"
                        >{data.companyInfo?.address || 'Số 2 Trương Quốc Dung, P.8, Q. Phú Nhuận, TP.HCM'}</span>
                      </p>
                      <p><Mail size={10} />
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => setData({ ...data, companyInfo: { ...data.companyInfo, email: e.currentTarget.textContent || '' } })}
                          className="editable-field"
                        >{data.companyInfo?.email || 'info@modos.space'}</span> | <Phone size={10} />
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => setData({ ...data, companyInfo: { ...data.companyInfo, phone: e.currentTarget.textContent || '' } })}
                          className="editable-field"
                        >{data.companyInfo?.phone || '0559 139 749'}</span>
                      </p>
                      <p>MST:
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => setData({ ...data, companyInfo: { ...data.companyInfo, taxId: e.currentTarget.textContent || '' } })}
                          className="editable-field"
                        >{data.companyInfo?.taxId || '0319333677'}</span>
                      </p>
                    </div>
                  </header>

                  <div className="divider"></div>

                  <section className="title-area">
                    <h1
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => setData({ ...data, quoteTitle: e.currentTarget.textContent || '' })}
                      className="editable-field"
                    >
                      {data.quoteTitle || 'BẢNG BÁO GIÁ'}
                    </h1>
                    <p className="quote-subtitle">DỊCH VỤ SẢN XUẤT VIDEO MARKETING & AI VISUAL</p>
                  </section>

                  <section
                    className="meta-grid-new"
                    style={{
                      gridTemplateColumns: data.style?.metaGridColumns === 4
                        ? '1.2fr 1.2fr 1fr 1fr'
                        : '1fr 1fr'
                    }}
                  >
                    <div className="meta-item">
                      <label>KÍNH GỬI KHÁCH HÀNG</label>
                      <strong
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setData({ ...data, customerName: e.currentTarget.textContent || '' })}
                        className="editable-field"
                      >
                        {data.customerName}
                      </strong>
                    </div>
                    <div className="meta-item">
                      <label>DỰ ÁN</label>
                      <strong
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setData({ ...data, projectName: e.currentTarget.textContent || '' })}
                        className="editable-field"
                      >
                        {data.projectName}
                      </strong>
                    </div>
                    <div className="meta-item">
                      <label>NGÀY BÁO GIÁ</label>
                      <strong
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setData({ ...data, date: e.currentTarget.textContent || '' })}
                        className="editable-field"
                      >
                        {data.date}
                      </strong>
                    </div>
                    <div className="meta-item">
                      <label>SỐ BÁO GIÁ</label>
                      <strong
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setData({ ...data, quoteNo: e.currentTarget.textContent || '' })}
                        className="quote-no editable-field"
                      >
                        {data.quoteNo}
                      </strong>
                    </div>
                  </section>

                  <div className="table-container">
                    <table className="quote-table-new">
                      <thead>
                        <tr>
                          <th className="text-center col-no">NO.</th>
                          <th className="col-item">HẠNG MỤC (ITEM)</th>
                          <th className="col-scope">MÔ TẢ CÔNG VIỆC (JOB SCOPE)</th>
                          <th className="text-right col-price">CHI PHÍ (VND)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.groups.map((group, gIdx) => (
                          <tr key={group.id} className="group-row-new">
                            <td className="text-center group-no">
                              {group.id}
                              <button
                                className="delete-group-btn no-print"
                                onClick={() => {
                                  const newGroups = data.groups.filter((_, i) => i !== gIdx);
                                  setData({ ...data, groups: newGroups });
                                }}
                                title="Xóa nhóm này"
                              >×</button>
                            </td>
                            <td className="group-title-cell">
                              <strong
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                  const newGroups = [...data.groups];
                                  newGroups[gIdx].title = e.currentTarget.textContent || '';
                                  setData({ ...data, groups: newGroups });
                                }}
                                className="editable-field"
                              >
                                {group.title}
                              </strong>
                              {group.subtitle && (
                                <span
                                  className="group-subtitle editable-field"
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => {
                                    const newGroups = [...data.groups];
                                    newGroups[gIdx].subtitle = e.currentTarget.textContent || '';
                                    setData({ ...data, groups: newGroups });
                                  }}
                                >
                                  {group.subtitle}
                                </span>
                              )}
                              <button
                                className="clear-subtitle-btn no-print"
                                onClick={() => {
                                  const newGroups = [...data.groups];
                                  newGroups[gIdx].subtitle = newGroups[gIdx].subtitle ? '' : 'Mô tả nhóm';
                                  setData({ ...data, groups: newGroups });
                                }}
                                title={group.subtitle ? "Xóa mô tả" : "Thêm mô tả"}
                              >
                                {group.subtitle ? '−' : '+'}
                              </button>
                            </td>
                            <td className="scope-cell">
                              <ul className="scope-list">
                                {group.items.map((item, iIdx) => (
                                  <li key={iIdx} className="scope-item">
                                    <span
                                      contentEditable
                                      suppressContentEditableWarning
                                      onBlur={(e) => {
                                        const newGroups = [...data.groups];
                                        newGroups[gIdx].items[iIdx].description = e.currentTarget.textContent || '';
                                        setData({ ...data, groups: newGroups });
                                      }}
                                      className="editable-field"
                                    >
                                      {item.description}
                                    </span>
                                    <button
                                      className="delete-item-btn no-print"
                                      onClick={() => {
                                        const newGroups = [...data.groups];
                                        newGroups[gIdx].items = newGroups[gIdx].items.filter((_, i) => i !== iIdx);
                                        setData({ ...data, groups: newGroups });
                                      }}
                                      title="Xóa item này"
                                    >×</button>
                                  </li>
                                ))}
                                <li className="add-item-row no-print">
                                  <button
                                    className="add-item-btn"
                                    onClick={() => {
                                      const newGroups = [...data.groups];
                                      newGroups[gIdx].items.push({
                                        no: newGroups[gIdx].items.length + 1,
                                        description: 'Mô tả mới',
                                        unit: 'Gói',
                                        quantity: 1,
                                        unitPrice: 0,
                                        total: 0
                                      });
                                      setData({ ...data, groups: newGroups });
                                    }}
                                  >+ Thêm item</button>
                                </li>
                              </ul>
                            </td>
                            <td
                              className="text-right price-cell editable-field"
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                const val = parseInt(e.currentTarget.textContent?.replace(/\./g, '').replace(/,/g, '') || '0');
                                const newGroups = [...data.groups];
                                newGroups[gIdx].subtotal = val;
                                if (newGroups[gIdx].items.length > 0) {
                                  newGroups[gIdx].items[0].unitPrice = val;
                                  newGroups[gIdx].items[0].total = val;
                                }
                                const merged = { ...data, groups: newGroups };
                                recalculate(merged);
                                setData(merged);
                              }}
                            >
                              {formatCurrency(group.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button
                      className="add-group-btn no-print"
                      onClick={() => {
                        const newId = String(data.groups.length + 1).padStart(2, '0');
                        const newGroups = [...data.groups, {
                          id: newId,
                          title: 'NHÓM DỊCH VỤ MỚI',
                          subtitle: '',
                          items: [{
                            no: 1,
                            description: 'Mô tả dịch vụ',
                            unit: 'Gói',
                            quantity: 1,
                            unitPrice: 0,
                            total: 0
                          }],
                          subtotal: 0
                        }];
                        setData({ ...data, groups: newGroups });
                      }}
                    >+ Thêm nhóm dịch vụ mới</button>
                  </div>

                  <section className="summary-section">
                    <div className="info-notes">
                      <div className="notes-card">
                        <h3><ShieldCheck size={16} /> GHI CHÚ (NOTES)</h3>
                        <ul>
                          {data.notes.map((note, nIdx) => (
                            <li
                              key={nIdx}
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                const newNotes = [...data.notes];
                                newNotes[nIdx] = e.currentTarget.textContent || '';
                                setData({ ...data, notes: newNotes });
                              }}
                              className="editable-field"
                            >
                              <ChevronRight size={10} /> {note}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="totals-card">
                      <div className="total-line">
                        <span>Tổng giá trị (Total Quote):</span>
                        <strong>{formatCurrency(data.totalQuote)}</strong>
                      </div>
                      <div className="total-line">
                        <span>VAT (10%):</span>
                        <strong>{formatCurrency(data.vat)}</strong>
                      </div>
                      <div className="total-line grand">
                        <span>TỔNG CỘNG THANH TOÁN:</span>
                        <div className="final-price">
                          {formatCurrency(data.grandTotal)} <small>VND</small>
                        </div>
                      </div>
                    </div>
                  </section>

                  <footer className="quote-footer">
                    <div className="payment-box">
                      <h3><CreditCard size={16} /> THÔNG TIN CHUYỂN KHOẢN</h3>
                      <p>Ngân hàng: <strong
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setData({ ...data, bankInfo: { ...data.bankInfo, bankName: e.currentTarget.textContent || '' } })}
                        className="editable-field"
                      >{data.bankInfo.bankName}</strong></p>
                      <p>Số tài khoản: <strong
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setData({ ...data, bankInfo: { ...data.bankInfo, accountNo: e.currentTarget.textContent || '' } })}
                        className="editable-field"
                      >{data.bankInfo.accountNo}</strong></p>
                      <p>Chủ tài khoản: <strong
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setData({ ...data, bankInfo: { ...data.bankInfo, accountName: e.currentTarget.textContent || '' } })}
                        className="editable-field"
                      >{data.bankInfo.accountName}</strong></p>
                    </div>
                    <div className="signatures">
                      <div className="sign-block">
                        <p
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => setData({ ...data, customerRep: { ...data.customerRep, title: e.currentTarget.textContent || '' } })}
                          className="editable-field"
                        >{data.customerRep?.title || 'ĐẠI DIỆN KHÁCH HÀNG'}</p>
                        <div className="sign-space"></div>
                        <strong
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => setData({ ...data, customerRep: { ...data.customerRep, name: e.currentTarget.textContent || '' } })}
                          className="editable-field"
                        >{data.customerRep?.name || '(Ký & ghi rõ họ tên)'}</strong>
                      </div>
                      <div className="sign-block primary">
                        <p
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => setData({ ...data, companyRep: { ...data.companyRep, title: e.currentTarget.textContent || '' } })}
                          className="editable-field"
                        >{data.companyRep?.title || 'ĐẠI DIỆN MODOS'}</p>
                        <div className="sign-space"></div>
                        <strong
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => setData({ ...data, companyRep: { ...data.companyRep, name: e.currentTarget.textContent || '' } })}
                          className="editable-field"
                        >{data.companyRep?.name || 'Nguyễn Văn Đăng'}</strong>
                      </div>
                    </div>
                  </footer>
                </div>
              </div>
            </main>
          </div>
        )
      } />
    </Routes>
  );
}

export default App;
