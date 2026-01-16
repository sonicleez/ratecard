import React from 'react';
import { Share2, Image as ImageIcon, Download, Printer } from 'lucide-react';
import { QuoteDocument } from './QuoteDocument';
import { QuoteData } from '../../types';

interface PreviewPanelProps {
    data: QuoteData;
    setData: (d: QuoteData) => void;
    scale: number;
    previewRef: React.RefObject<HTMLDivElement>;
    handleShare: () => void;
    handleDownloadPNG: () => void;
    handleDownloadPDF: () => void;
    handlePrint: () => void;
    recalculate: (quote: QuoteData) => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
    data,
    setData,
    scale,
    previewRef,
    handleShare,
    handleDownloadPNG,
    handleDownloadPDF,
    handlePrint,
    recalculate
}) => {
    return (
        <main className="preview-panel" ref={previewRef}>
            <div className="floating-actions no-print">
                <button onClick={handleShare} className="action-btn secondary">
                    <Share2 size={18} />
                    <span>Chia sẻ Link</span>
                </button>
                <button onClick={handleDownloadPNG} className="action-btn secondary">
                    <ImageIcon size={18} />
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

            <QuoteDocument
                data={data}
                setData={setData}
                scale={scale}
                recalculate={recalculate}
            />
        </main>
    );
};
