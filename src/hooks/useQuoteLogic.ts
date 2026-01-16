import type { QuoteData } from '../types';
import { supabase } from '../supabase';

export const useQuoteLogic = (
    data: QuoteData,
    setData: (d: QuoteData) => void,
    user: any
) => {

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

    const incrementQuoteNo = () => {
        const currentNo = data.quoteNo;
        const match = currentNo.match(/(\d+)$/);
        if (match) {
            const nextNum = parseInt(match[1]) + 1;
            const prefix = currentNo.substring(0, currentNo.length - match[1].length);
            const nextNo = `${prefix}${nextNum.toString().padStart(match[1].length, '0')}`;
            setData({ ...data, quoteNo: nextNo });
        }
    };

    const saveQuotationToDB = async (overrideData?: QuoteData) => {
        if (!user) return;
        const targetData = overrideData || data;

        await supabase.from('quotations').insert({
            user_id: user.id,
            quote_number: targetData.quoteNo,
            quote_data: targetData,
            status: 'downloaded'
        });
    };

    const handlePrint = () => window.print();

    const handleDownloadPDF = async () => {
        const element = document.querySelector('.page-print') as HTMLElement;
        if (!element) return;

        const html2pdf = (await import('html2pdf.js')).default;
        const noPrintElements = element.querySelectorAll('.no-print');
        noPrintElements.forEach(el => (el as HTMLElement).style.display = 'none');

        const opt = {
            margin: [5, 5, 5, 5] as [number, number, number, number],
            filename: `${data.quoteNo || 'BaoGia'}_${data.projectName?.replace(/\s+/g, '_') || 'Quote'}.pdf`,
            image: { type: 'png' as const, quality: 1 },
            html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        await html2pdf().set(opt).from(element).save();
        noPrintElements.forEach(el => (el as HTMLElement).style.display = '');

        await saveQuotationToDB();
        incrementQuoteNo();
    };

    const handleDownloadPNG = async () => {
        const element = document.querySelector('.page-print') as HTMLElement;
        if (!element) return;

        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(element, {
            scale: 3,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const link = document.createElement('a');
        link.download = `${data.quoteNo || 'BaoGia'}_${data.projectName?.replace(/\s+/g, '_') || 'Quote'}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();

        await saveQuotationToDB();
        incrementQuoteNo();
    };

    const handleShare = async (setShareUrl: (url: string) => void, setShowShareModal: (show: boolean) => void) => {
        if (!user) return;

        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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

    return {
        recalculate,
        incrementQuoteNo,
        saveQuotationToDB,
        handlePrint,
        handleDownloadPDF,
        handleDownloadPNG,
        handleShare
    };
};
