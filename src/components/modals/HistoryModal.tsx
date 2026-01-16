import React from 'react';
import { History, Sparkles, ChevronRight } from 'lucide-react';

interface HistoryModalProps {
    quotesList: any[];
    loadQuoteFromList: (quoteData: any) => void;
    setShowQuotesList: (show: boolean) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
    quotesList,
    loadQuoteFromList,
    setShowQuotesList
}) => {
    return (
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
    );
};
