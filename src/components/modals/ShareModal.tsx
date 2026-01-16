import React from 'react';
import { Link as LinkIcon, Copy } from 'lucide-react';

interface ShareModalProps {
    shareUrl: string | null;
    copyToClipboard: (text: string) => void;
    setShowShareModal: (show: boolean) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
    shareUrl,
    copyToClipboard,
    setShowShareModal
}) => {
    return (
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
    );
};
