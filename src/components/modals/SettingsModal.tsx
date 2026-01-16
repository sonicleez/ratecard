import React from 'react';
import { Settings, Zap, Upload } from 'lucide-react';

interface SettingsModalProps {
    apiKey: string;
    setApiKey: (s: string) => void;
    apiKeyStatus: 'idle' | 'checking' | 'valid' | 'invalid';
    validateApiKey: () => void;
    saveUserKey: () => void;
    handleLogout: () => void;
    setShowSettingsModal: (show: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    apiKey,
    setApiKey,
    apiKeyStatus,
    validateApiKey,
    saveUserKey,
    handleLogout,
    setShowSettingsModal
}) => {
    return (
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
    );
};
