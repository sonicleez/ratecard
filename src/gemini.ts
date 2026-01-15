import { GoogleGenerativeAI } from "@google/generative-ai";
import type { QuoteData } from "./types";

export interface AIResponse {
    message: string;
    updatedQuote?: QuoteData;
}

export type AIModel = 'flash' | 'pro';
export type ThinkingLevel = 'low' | 'medium' | 'high' | 'minimal';

export interface UploadedFile {
    name: string;
    type: string;
    data: string;
    preview?: string;
}

const SYSTEM_PROMPT = `Bạn là AI Agent chuyên nghiệp về báo giá dịch vụ sản xuất video và creative services.

🎯 NHIỆM VỤ CHÍNH: Khi user yêu cầu thay đổi, bạn PHẢI trả về updatedQuote chứa DỮ LIỆU ĐẦY ĐỦ đã được sửa đổi.

📊 DỮ LIỆU HIỆN TẠI CỦA BÁO GIÁ:
{DATA}

🔧 CẤU TRÚC DỮ LIỆU (QuoteData):
{
  "quoteNo": "QT-2026-XXX",
  "date": "DD/MM/YYYY",
  "customerName": "Tên khách hàng",
  "companyName": "Tên công ty khách",
  "projectName": "Tên dự án",
  "quoteTitle": "BẢNG BÁO GIÁ",
  "subtitle": "Mô tả ngắn",
  "companyInfo": { "name": "", "taxId": "", "address": "", "email": "", "phone": "" },
  "groups": [
    {
      "id": "01",
      "title": "TÊN NHÓM DỊCH VỤ",
      "subtitle": "Mô tả nhóm",
      "items": [
        { "no": 1, "description": "Mô tả item", "unit": "Gói", "quantity": 1, "unitPrice": 10000000, "total": 10000000 }
      ],
      "subtotal": 10000000
    }
  ],
  "totalQuote": 10000000,
  "vat": 1000000,
  "grandTotal": 11000000,
  "notes": ["Ghi chú 1", "Ghi chú 2"],
  "bankInfo": { "bankName": "", "accountNo": "", "accountName": "" },
  "customerRep": { "title": "ĐẠI DIỆN KHÁCH HÀNG", "name": "" },
  "companyRep": { "title": "ĐẠI DIỆN CÔNG TY", "name": "" },
  "style": {
    "fontFamily": "Inter",
    "headingFont": "Plus Jakarta Sans",
    "bodyFontSize": 12,
    "headingFontSize": 28,
    "primaryColor": "#FF4D00",
    "secondaryColor": "#1A1A1A",
    "accentColor": "#FF7043",
    "textColor": "#1A1A1A",
    "tableStyle": "modern",
    "layoutVariant": "standard",
    "showLogo": true,
    "paperSize": "A4",
    "customCss": ""
  }
}

🎨 STYLE OPTIONS:
- tableStyle: "modern" | "classic" | "minimal" | "executive" | "creative"
- layoutVariant: "standard" | "sidebar" | "compact" | "split"
- customCss: CSS tùy chỉnh, ví dụ: ".quote-header { background: #f5f5f5; }"

📤 CÁCH TRẢ LỜI (BẮT BUỘC THEO ĐÚNG FORMAT):

Khi thực hiện thay đổi:
{
  "message": "✅ Đã thực hiện:\\n• Thay đổi A\\n• Thay đổi B",
  "updatedQuote": { ...toàn bộ QuoteData đã được sửa... }
}

Khi cần hỏi thêm thông tin:
{
  "message": "❓ Tôi cần thêm thông tin:\\n• Câu hỏi 1\\n• Câu hỏi 2"
}

⚠️ QUAN TRỌNG:
1. Nếu user yêu cầu thay đổi gì đó, BẮT BUỘC phải trả về updatedQuote với dữ liệu đầy đủ.
2. Không bao giờ trả về updatedQuote rỗng hoặc thiếu trường.
3. Luôn giữ nguyên các trường không được yêu cầu thay đổi.
4. Khi thay đổi style, copy toàn bộ style hiện tại và chỉ sửa trường cần thiết.
5. Nếu upload ảnh mẫu báo giá, hãy phân tích và tái tạo cấu trúc trong updatedQuote.`;

export async function chatWithAI(
    apiKey: string,
    userMessage: string,
    currentData: QuoteData,
    files: UploadedFile[] = [],
    model: AIModel = 'flash',
    thinkingLevel: ThinkingLevel = 'high'
): Promise<AIResponse> {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Gemini 3 models
    const modelName = model === 'pro'
        ? 'gemini-3-pro-preview'
        : 'gemini-3-flash-preview';

    const temperature = model === 'pro' ? 0.3 : 0.7;

    const aiModel = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
            responseMimeType: "application/json",
            temperature: temperature,
            // @ts-ignore - Gemini 3 thinking config
            thinkingConfig: {
                thinkingLevel: thinkingLevel,
            }
        }
    });

    // Replace placeholder with actual data
    const contextualPrompt = SYSTEM_PROMPT.replace("{DATA}", JSON.stringify(currentData, null, 2));

    const parts: any[] = [{ text: contextualPrompt + "\n\n👤 YÊU CẦU CỦA USER: " + userMessage }];

    // Add uploaded files
    for (const file of files) {
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
            parts.push({
                inlineData: {
                    mimeType: file.type,
                    data: file.data
                }
            });
        }
    }

    console.log('Sending to Gemini:', userMessage);

    const result = await aiModel.generateContent(parts);
    const responseText = result.response.text();

    console.log('Raw Gemini Response:', responseText);

    try {
        const parsed = JSON.parse(responseText) as AIResponse;

        if (parsed.updatedQuote) {
            // Merge with current data to ensure no fields are missing
            parsed.updatedQuote = mergeQuoteData(currentData, parsed.updatedQuote);
            recalculateQuote(parsed.updatedQuote);
        }

        return parsed;
    } catch (e) {
        // Try to extract JSON from markdown code block
        const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[1]) as AIResponse;
                if (parsed.updatedQuote) {
                    parsed.updatedQuote = mergeQuoteData(currentData, parsed.updatedQuote);
                    recalculateQuote(parsed.updatedQuote);
                }
                return parsed;
            } catch { }
        }
        console.error('Failed to parse AI response:', e);
        return { message: responseText };
    }
}

// Merge AI response with current data to ensure completeness
function mergeQuoteData(current: QuoteData, updated: Partial<QuoteData>): QuoteData {
    return {
        ...current,
        ...updated,
        companyInfo: { ...current.companyInfo, ...(updated.companyInfo || {}) },
        bankInfo: { ...current.bankInfo, ...(updated.bankInfo || {}) },
        customerRep: { ...current.customerRep, ...(updated.customerRep || {}) },
        companyRep: { ...current.companyRep, ...(updated.companyRep || {}) },
        style: { ...current.style, ...(updated.style || {}) } as any,
        groups: updated.groups || current.groups,
        notes: updated.notes || current.notes,
    };
}

function recalculateQuote(quote: QuoteData) {
    let totalQuote = 0;
    let itemNo = 1;

    quote.groups.forEach(group => {
        let groupSubtotal = 0;
        group.items.forEach(item => {
            item.no = itemNo++;
            item.total = item.quantity * item.unitPrice;
            groupSubtotal += item.total;
        });
        group.subtotal = groupSubtotal;
        totalQuote += groupSubtotal;
    });

    quote.totalQuote = totalQuote;
    quote.vat = Math.round(totalQuote * 0.1);
    quote.grandTotal = totalQuote + quote.vat;
}
