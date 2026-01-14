import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from './supabase';
import { formatCurrency } from './utils';
import { MapPin, Mail, Phone, ChevronRight } from 'lucide-react';
import type { QuoteData } from './types';
import './App.css';

export const PublicQuote: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [data, setData] = useState<QuoteData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchQuote = async () => {
            if (!token) return;

            const { data: quote, error } = await supabase
                .from('quotations')
                .select('quote_data, view_count')
                .eq('public_token', token)
                .single();

            if (error || !quote) {
                setError('Báo giá không tồn tại hoặc đã bị gỡ bỏ.');
                setLoading(false);
                return;
            }

            setData(quote.quote_data as QuoteData);
            setLoading(false);

            // Increment view count
            await supabase
                .from('quotations')
                .update({ view_count: (quote.view_count || 0) + 1 })
                .eq('public_token', token);
        };

        fetchQuote();
    }, [token]);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="animate-spin" style={{ width: 40, height: 40, border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                <p>Đang tải báo giá...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="loading-screen">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="preview-panel" style={{ background: '#121212', minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div
                className={`quote-wrapper ${data.style?.tableStyle || 'modern'}`}
                style={{
                    fontFamily: data.style?.fontFamily || 'Inter',
                    fontSize: `${data.style?.bodyFontSize || 12}px`,
                    color: data.style?.textColor || '#1A1A1A',
                    background: 'white',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                } as React.CSSProperties}
            >
                <div className="page-print">
                    <header className="quote-header">
                        <div className="brand-section">
                            <img src="/src/assets/logo.png" alt="MODOS Logo" className="brand-logo" />
                        </div>
                        <div className="company-details">
                            <h3>{data.companyInfo?.name || 'CÔNG TY CỔ PHẦN MODOS'}</h3>
                            <p><MapPin size={10} /> {data.companyInfo?.address}</p>
                            <p><Mail size={10} /> {data.companyInfo?.email} | <Phone size={10} /> {data.companyInfo?.phone}</p>
                            <p>MST: {data.companyInfo?.taxId}</p>
                        </div>
                    </header>

                    <div className="title-area">
                        <h1>BẢNG BÁO GIÁ</h1>
                        <p className="subtitle">{data.subtitle || 'DỊCH VỤ SẢN XUẤT VIDEO MARKETING & AI VISUAL'}</p>
                    </div>

                    <div className="meta-grid-new">
                        <div className="meta-item">
                            <label>KÍNH GỬI KHÁCH HÀNG</label>
                            <strong>{data.customerName}</strong>
                        </div>
                        <div className="meta-item">
                            <label>DỰ ÁN</label>
                            <strong>{data.projectName}</strong>
                        </div>
                        <div className="meta-item">
                            <label>NGÀY BÁO GIÁ</label>
                            <strong>{data.date}</strong>
                        </div>
                        <div className="meta-item">
                            <label>SỐ BÁO GIÁ</label>
                            <div className="quote-badge-new">{data.quoteNo}</div>
                        </div>
                    </div>

                    <div className="quote-table-container">
                        <table className="quote-table-new">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}>NO.</th>
                                    <th style={{ width: '250px' }}>HẠNG MỤC (ITEMS)</th>
                                    <th>MÔ TẢ CÔNG VIỆC (JOB SCOPE)</th>
                                    <th style={{ width: '120px' }}>CHI PHÍ (VND)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.groups.map((group, gIdx) => (
                                    <tr key={gIdx} className="group-row-new">
                                        <td className="text-center group-no">
                                            {(gIdx + 1).toString().padStart(2, '0')}
                                        </td>
                                        <td className="group-title-cell">
                                            <strong>{group.title}</strong>
                                            <div className="group-subtitle">{group.subtitle}</div>
                                        </td>
                                        <td className="scope-cell">
                                            <ul className="scope-list">
                                                {group.items.map((item, iIdx) => (
                                                    <li key={iIdx}>
                                                        {item.description}
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td className="text-right price-cell">
                                            {formatCurrency(group.subtotal)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <section className="summary-section">
                        <div className="info-notes">
                            <div className="notes-card">
                                <h3>GHI CHÚ (NOTES)</h3>
                                <ul>
                                    {data.notes.map((note, nIdx) => (
                                        <li key={nIdx}>
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
                            <h3>THÔNG TIN CHUYỂN KHOẢN</h3>
                            <p>Ngân hàng: <strong>{data.bankInfo.bankName}</strong></p>
                            <p>Số tài khoản: <strong>{data.bankInfo.accountNo}</strong></p>
                            <p>Chủ tài khoản: <strong>{data.bankInfo.accountName}</strong></p>
                        </div>
                        <div className="signatures">
                            <div className="sign-block">
                                <p>{data.customerRep?.title || 'ĐẠI DIỆN KHÁCH HÀNG'}</p>
                                <div className="sign-space"></div>
                                <strong>{data.customerRep?.name || '(Ký & ghi rõ họ tên)'}</strong>
                            </div>
                            <div className="sign-block primary">
                                <p>{data.companyRep?.title || 'ĐẠI DIỆN MODOS'}</p>
                                <div className="sign-space"></div>
                                <strong>{data.companyRep?.name || 'Nguyễn Văn Đăng'}</strong>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
};
