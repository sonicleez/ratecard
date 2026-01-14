import type { QuoteData } from './types';

export const initialQuoteData: QuoteData = {
    quoteNo: 'QT-2026-001',
    date: '14/01/2026',
    customerName: 'ANH TUẤT - [TÊN CÔNG TY]',
    companyName: '',
    projectName: 'APP LAUNCH CAMPAIGN 2026',
    quoteTitle: 'BẢNG BÁO GIÁ',
    subtitle: 'DỊCH VỤ SẢN XUẤT VIDEO MARKETING & AI VISUAL',
    companyInfo: {
        name: 'CÔNG TY CỔ PHẦN MODOS',
        taxId: '0319333677',
        address: 'Số 2 Trương Quốc Dung, P.8, Q. Phú Nhuận, TP.HCM',
        email: 'info@modos.space',
        phone: '0559 139 749',
    },
    customerRep: {
        title: 'ĐẠI DIỆN KHÁCH HÀNG',
        name: '',
    },
    companyRep: {
        title: 'ĐẠI DIỆN MODOS',
        name: 'Lê Hải Đăng',
    },
    groups: [
        {
            id: '01',
            title: 'CREATIVE & SCRIPT',
            subtitle: 'Giai đoạn lập kế hoạch',
            items: [
                { no: 1, description: 'Phát triển kịch bản (Script) 11 Video', unit: 'Gói', quantity: 1, unitPrice: 15000000, total: 15000000 },
                { no: 2, description: 'Biên tập lời bình (Voice-off)', unit: 'Gói', quantity: 1, unitPrice: 0, total: 0 },
                { no: 3, description: 'Storyboard định hướng hình ảnh', unit: 'Gói', quantity: 1, unitPrice: 0, total: 0 },
            ],
            subtotal: 15000000,
        },
        {
            id: '02',
            title: 'VISUAL ASSETS & AI R&D',
            subtitle: 'Thiết kế và Công nghệ AI',
            items: [
                { no: 4, description: 'Vẽ minh họa (Illustration) & Icon set', unit: 'Gói', quantity: 1, unitPrice: 30000000, total: 30000000 },
                { no: 5, description: 'Huấn luyện Model AI nhân vật đại diện', unit: 'Gói', quantity: 1, unitPrice: 0, total: 0 },
                { no: 6, description: 'Thiết kế bối cảnh ảo (Environment)', unit: 'Gói', quantity: 1, unitPrice: 0, total: 0 },
            ],
            subtotal: 30000000,
        },
        {
            id: '03',
            title: 'PRODUCTION & ANIMATION',
            subtitle: 'Giai đoạn sản xuất kịch bản',
            items: [
                { no: 7, description: '06 Video App (Motion Graphic)', unit: 'Gói', quantity: 1, unitPrice: 65000000, total: 65000000 },
                { no: 8, description: '04 Video Human AI (VFX/Editing)', unit: 'Gói', quantity: 1, unitPrice: 0, total: 0 },
                { no: 9, description: '01 Video Intro Tổng quan (Premium)', unit: 'Gói', quantity: 1, unitPrice: 0, total: 0 },
            ],
            subtotal: 65000000,
        },
        {
            id: '04',
            title: 'AUDIO ENGINEERING',
            subtitle: 'Âm thanh và Hậu kỳ',
            items: [
                { no: 10, description: 'Voice Talent (Giọng thật chuyên nghiệp)', unit: 'Gói', quantity: 1, unitPrice: 15000000, total: 15000000 },
                { no: 11, description: 'Mua bản quyền nhạc nền (BGM)', unit: 'Gói', quantity: 1, unitPrice: 0, total: 0 },
                { no: 12, description: 'Thiết kế tiếng động (Sound Design)', unit: 'Gói', quantity: 1, unitPrice: 0, total: 0 },
            ],
            subtotal: 15000000,
        },
    ],
    totalQuote: 125000000,
    vat: 12500000,
    grandTotal: 137500000,
    notes: [
        'Báo giá có hiệu lực trong vòng 15 ngày.',
        'Tiến độ thanh toán: 50% tạm ứng - 30% sau demo - 20% nghiệm thu.',
        'Hiệu chỉnh (Revision): Tối đa 03 lần/video.',
    ],
    bankInfo: {
        bankName: 'VCB HCM Chi Nhánh Tân Định',
        accountNo: '1063709595',
        accountName: 'CT CP MODOS',
    },
    style: {
        fontFamily: 'Inter',
        headingFont: 'Plus Jakarta Sans',
        bodyFontSize: 12,
        headingFontSize: 28,
        primaryColor: '#FF4D00',
        accentColor: '#FF7043',
        textColor: '#1A1A1A',
        tableStyle: 'modern',
        showLogo: true,
        paperSize: 'A4',
    },
};
