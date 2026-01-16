import React from 'react';
import {
    Sparkles, Settings, History, Loader2, Upload, FileType, X, Send
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { AIModel, ThinkingLevel, UploadedFile } from '../../gemini';

interface InspectorPanelProps {
    user: User;
    model: AIModel;
    setModel: (m: AIModel) => void;
    thinking: ThinkingLevel;
    setThinking: (t: ThinkingLevel) => void;
    apiKeyStatus: 'idle' | 'checking' | 'valid' | 'invalid';
    apiKey: string;
    messages: { role: 'user' | 'ai', content: string, files?: string[] }[];
    input: string;
    setInput: (s: string) => void;
    loading: boolean;
    files: UploadedFile[];
    handleSend: () => void;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handlePaste: (e: React.ClipboardEvent) => void;
    removeFile: (index: number) => void;
    setShowSettingsModal: (show: boolean) => void;
    fetchQuotesList: () => void;
    setShowQuotesList: (show: boolean) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
    user,
    model,
    setModel,
    thinking,
    setThinking,
    apiKeyStatus,
    apiKey,
    messages,
    input,
    setInput,
    loading,
    files,
    handleSend,
    handleFileUpload,
    handlePaste,
    removeFile,
    setShowSettingsModal,
    fetchQuotesList,
    setShowQuotesList,
    fileInputRef,
    chatEndRef
}) => {
    return (
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
    );
};
