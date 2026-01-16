import React from 'react';
import {
    MapPin, Mail, Phone, ShieldCheck, CreditCard, ChevronRight
} from 'lucide-react';
import type { QuoteData } from '../../types';
import { formatCurrency } from '../../utils';
import logoImg from '../../assets/logo.png';

interface QuoteDocumentProps {
    data: QuoteData;
    setData: (data: QuoteData) => void;
    scale: number;
    recalculate: (quote: QuoteData) => void;
}

export const QuoteDocument: React.FC<QuoteDocumentProps> = ({
    data,
    setData,
    scale,
    recalculate
}) => {
    return (
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
                        >{data.companyInfo?.name}</h3>
                        <p><MapPin size={10} />
                            <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => setData({ ...data, companyInfo: { ...data.companyInfo, address: e.currentTarget.textContent || '' } })}
                                className="editable-field"
                            >{data.companyInfo?.address}</span>
                        </p>
                        <p><Mail size={10} />
                            <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => setData({ ...data, companyInfo: { ...data.companyInfo, email: e.currentTarget.textContent || '' } })}
                                className="editable-field"
                            >{data.companyInfo?.email}</span> | <Phone size={10} />
                            <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => setData({ ...data, companyInfo: { ...data.companyInfo, phone: e.currentTarget.textContent || '' } })}
                                className="editable-field"
                            >{data.companyInfo?.phone}</span>
                        </p>
                        <p>MST:
                            <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => setData({ ...data, companyInfo: { ...data.companyInfo, taxId: e.currentTarget.textContent || '' } })}
                                className="editable-field"
                            >{data.companyInfo?.taxId}</span>
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
                        {data.quoteTitle}
                    </h1>
                    <p className="quote-subtitle">{data.subtitle}</p>
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
                                <th className="text-center col-qty">S.LƯỢNG</th>
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
                                    <td className="text-center qty-cell">
                                        <span
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const val = parseInt(e.currentTarget.textContent || '1') || 1;
                                                const newData = { ...data, groups: [...data.groups] };
                                                if (newData.groups[gIdx].items.length > 0) {
                                                    newData.groups[gIdx].items = [...newData.groups[gIdx].items];
                                                    newData.groups[gIdx].items[0] = { ...newData.groups[gIdx].items[0], quantity: val };
                                                }
                                                recalculate(newData);
                                                setData(newData);
                                            }}
                                            className="editable-field"
                                        >
                                            {group.items[0]?.quantity || 1}
                                        </span>
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
                            <strong className="final-price">
                                {formatCurrency(data.grandTotal)} VND
                            </strong>
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
        </div >
    );
};
