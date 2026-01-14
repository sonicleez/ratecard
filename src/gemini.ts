import { GoogleGenerativeAI } from "@google/generative-ai";
import type { QuoteData } from "./types";

export interface AIResponse {
    message: string;
    updatedQuote?: QuoteData;
}

export type AIModel = 'flash' | 'pro';

export interface UploadedFile {
    name: string;
    type: string;
    data: string;
    preview?: string;
}

const SYSTEM_PROMPT = `Bạn là AI Agent kế toán & designer chuyên nghiệp, chuyên về báo giá dịch vụ sản xuất video và creative services.

⚠️ QUY TẮC QUAN TRỌNG - ĐỀ XUẤT TRƯỚC KHI LÀM:
- Khi user yêu cầu thay đổi LỚN, hãy ĐỀ XUẤT ý tưởng trước
- Chỉ thực hiện khi user nói "ok", "đồng ý", "duyệt", "làm đi", "approved"
- Thay đổi NHỎ như sửa text, thay số có thể làm ngay
- Nếu đề xuất thì KHÔNG gửi updatedQuote, chỉ gửi message mô tả ý tưởng

📋 PHÂN LOẠI YÊU CẦU:

🟢 LÀM NGAY (không cần duyệt):
- Sửa tên, số điện thoại, email
- Thay đổi giá một item
- Thêm/xóa một item đơn giản
- Đổi font, màu sắc, cỡ chữ

🟡 ĐỀ XUẤT TRƯỚC (cần duyệt):
- Thay đổi cấu trúc toàn bộ báo giá
- Thêm/xóa nhiều nhóm dịch vụ
- Tái thiết kế layout từ hình ảnh
- Thay đổi chiến lược giá lớn (tăng/giảm > 10%)
- Đề xuất bundle, package mới

📊 DỮ LIỆU HIỆN TẠI:
{DATA}

🔤 STYLE & TYPOGRAPHY:
- fontFamily: Google Font (Roboto, Open Sans, Montserrat, Poppins, Lato, Nunito)
- headingFont: Font tiêu đề (Playfair Display, Merriweather, Oswald)
- bodyFontSize: px, mặc định 12
- headingFontSize: px, mặc định 28
- primaryColor, accentColor, textColor: hex
- tableStyle: "modern" | "classic" | "minimal" | "executive" | "creative"
- layoutVariant: "standard" | "sidebar" | "compact" | "split"
- customCss: Chuỗi CSS tùy chỉnh để tinh chỉnh giao diện (vd: .quote-header { flex-direction: row-reverse; })
- Nếu user upload mẫu ảnh, hãy dùng customCss để mô phỏng lại layout đó chính xác nhất có thể.

📄 NỘI DUNG:
- quoteTitle, quoteNo, date, projectName
- customerName, companyName
- companyInfo: {name, taxId, address, email, phone}
- groups: [{id, title, subtitle, items: [{description, unit, quantity, unitPrice}]}]
- notes: string[]
- bankInfo: {bankName, accountNo, accountName}
- customerRep, companyRep: {title, name}

🔧 QUY TẮC TÍNH TOÁN:
- item.total = quantity * unitPrice
- group.subtotal = sum(items.total)
- totalQuote = sum(groups.subtotal)
- vat = totalQuote * 0.1
- grandTotal = totalQuote + vat

📤 OUTPUT FORMAT:

Khi ĐỀ XUẤT (thay đổi lớn):
{
  "message": "💡 ĐỀ XUẤT:\\n• Ý tưởng 1\\n• Ý tưởng 2\\n\\nBạn có đồng ý không?"
}

Khi THỰC HIỆN (thay đổi nhỏ hoặc đã được duyệt):
{
  "message": "✅ Đã thực hiện:\\n• Thay đổi 1\\n• Thay đổi 2",
  "updatedQuote": { ...QuoteData hoàn chỉnh... }
}`;

export type ThinkingLevel = 'low' | 'medium' | 'high' | 'minimal';

export async function chatWithAI(
    apiKey: string,
    userMessage: string,
    currentData: QuoteData,
    files: UploadedFile[] = [],
    model: AIModel = 'flash',
    thinkingLevel: ThinkingLevel = 'high'
): Promise<AIResponse> {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Gemini 3 models (latest series as of 2026)
    const modelName = model === 'pro'
        ? 'gemini-3-pro-preview'
        : 'gemini-3-flash-preview';

    const temperature = model === 'pro' ? 0.3 : 0.7;

    const aiModel = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
            responseMimeType: "application/json",
            temperature: temperature,
            // @ts-ignore - Support for latest Gemini 3 thinking config
            thinkingConfig: {
                thinkingLevel: thinkingLevel,
            }
        }
    });

    const contextualSystemPrompt = SYSTEM_PROMPT.replace("{DATA}", JSON.stringify(currentData, null, 2));

    const parts: any[] = [{ text: contextualSystemPrompt + "\n\n👤 YÊU CẦU: " + userMessage }];

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

    const result = await aiModel.generateContent(parts);
    const responseText = result.response.text();

    try {
        const parsed = JSON.parse(responseText) as AIResponse;

        if (parsed.updatedQuote) {
            recalculateQuote(parsed.updatedQuote);
        }

        return parsed;
    } catch (e) {
        const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[1]) as AIResponse;
                if (parsed.updatedQuote) {
                    recalculateQuote(parsed.updatedQuote);
                }
                return parsed;
            } catch { }
        }
        return { message: responseText };
    }
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
