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
    "metaGridColumns": 2,
    "showLogo": true,
    "paperSize": "A4",
    "customCss": ""
  }
}

🎨 STYLE OPTIONS:
- tableStyle: "modern" | "classic" | "minimal" | "executive" | "creative"
- layoutVariant: "standard" | "sidebar" | "compact" | "split"
- metaGridColumns: 2 hoặc 4 (số cột hiển thị thông tin khách hàng, dự án, ngày, số báo giá)
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

🔥 HƯỚNG DẪN CHI TIẾT CHO TỪNG LOẠI THAO TÁC:

📝 XÓA SUBTITLE CỦA NHÓM:
- Nếu user nói "xóa subtitle" hoặc "xóa mô tả nhóm" hoặc "xóa Giai đoạn tiền kỳ"
- Đặt group.subtitle = "" (chuỗi rỗng)
- Ví dụ: groups[0].subtitle = ""

📝 XÓA MỘT ITEM TRONG NHÓM:
- Nếu user nói "xóa item X" hoặc "xóa dòng có mô tả Y"
- Loại bỏ item đó khỏi mảng group.items
- Ví dụ: groups[0].items = groups[0].items.filter(item => item.description !== "X")

📝 XÓA MỘT NHÓM DỊCH VỤ:
- Nếu user nói "xóa nhóm X" hoặc "xóa phần AUDIO ENGINEERING"
- Loại bỏ group đó khỏi mảng groups
- Ví dụ: groups = groups.filter(g => g.title !== "AUDIO ENGINEERING")

📝 THÊM ITEM MỚI:
- Thêm object item mới vào group.items với đầy đủ các trường: no, description, unit, quantity, unitPrice, total

📝 THÊM NHÓM MỚI:
- Thêm object group mới vào mảng groups với đầy đủ: id, title, subtitle, items, subtotal

📝 SỬA GIÁ/SỐ LƯỢNG:
- Cập nhật unitPrice hoặc quantity của item cụ thể
- total sẽ được tính tự động (quantity * unitPrice)

📥 NHẬP DỮ LIỆU MỚI TỪ SPREADSHEET/BẢNG:

🚨 QUAN TRỌNG NHẤT - ĐỌC KỸ:
Khi user gửi danh sách như:
  App feature tutorials | 6 | 7,700,000đ | 46,200,000đ
  Company introduction | 1 | 33,000,000đ | 33,000,000đ
  User behavior | 4 | 8,000,000đ | 32,000,000đ
  Voice talent | 1 | 8,000,000đ | 8,000,000đ

Bạn PHẢI tạo 4 GROUPS riêng biệt (hoặc 4 items trong 1 group), KHÔNG ĐƯỢC gộp thành 1 group với tổng tiền gộp.

✅ ĐÚNG - Tạo nhiều groups/items riêng biệt:
"groups": [
  { "id": "01", "title": "APP FEATURE TUTORIALS", "items": [...], "subtotal": 46200000 },
  { "id": "02", "title": "COMPANY INTRODUCTION", "items": [...], "subtotal": 33000000 },
  { "id": "03", "title": "USER BEHAVIOR", "items": [...], "subtotal": 32000000 },
  { "id": "04", "title": "VOICE TALENT", "items": [...], "subtotal": 8000000 }
]

❌ SAI - KHÔNG BAO GIỜ làm thế này:
"groups": [
  { "id": "01", "title": "VIDEO PRODUCTION SERVICES", "items": [item1, item2, item3, item4], "subtotal": 119200000 }
]

Nguyên tắc:
- Mỗi dòng trong bảng = 1 GROUP riêng biệt (nếu có giá riêng)
- Giữ nguyên CHÍNH XÁC tên mô tả, KHÔNG đổi tên, KHÔNG rút gọn
- Giữ nguyên số lượng, đơn giá, thành tiền như user cung cấp

⚠️ NGUYÊN TẮC BẮT BUỘC:
1. LUÔN trả về updatedQuote đầy đủ với TẤT CẢ các groups.
2. Khi xóa subtitle → đặt = "" (không phải null hoặc undefined).
3. Khi xóa item/group → loại bỏ khỏi mảng, KHÔNG để null.
4. GIỮ NGUYÊN các trường không liên quan đến yêu cầu.
5. Sau khi sửa, các số tổng sẽ được tính lại tự động.
6. KHÔNG BAO GIỜ gộp các dòng riêng lẻ thành 1 nhóm chung.
7. Giữ nguyên CHÍNH XÁC tên mô tả mà user cung cấp.
8. KHÔNG ĐƯỢC thay đổi primaryColor (#FF4D00) và secondaryColor (#1A1A1A) - đây là màu thương hiệu bắt buộc.
9. Giữ bodyFontSize khoảng 12px và headingFontSize khoảng 28px để đảm bảo layout A4.`;




export async function chatWithAI(
    apiKey: string,
    userMessage: string,
    currentData: QuoteData,
    files: UploadedFile[] = [],
    model: AIModel = 'flash',
    thinkingLevel: ThinkingLevel = 'high'
): Promise<AIResponse> {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Use Gemini 3 models (Latest Preview)
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

function mergeQuoteData(current: QuoteData, updated: Partial<QuoteData>): QuoteData {
    const merged = {
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

    // Force brand safety
    if (merged.style) {
        merged.style.primaryColor = '#FF4D00';
        merged.style.secondaryColor = '#1A1A1A';
        // Prevent huge fonts unless requested
        if (merged.style.bodyFontSize > 16) merged.style.bodyFontSize = 12;
        if (merged.style.headingFontSize > 40) merged.style.headingFontSize = 28;
    }

    return merged;
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
