
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, TransactionType, Asset, AssetType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseReceiptImage = async (base64Image: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: "Phân tích hóa đơn này và trích xuất thông tin JSON. Fields: 'amount' (number only), 'date' (ISO string YYYY-MM-DD if found, else null), 'merchant' (string), 'category' (string, map to nearest: Ăn uống, Di chuyển, Mua sắm, Hóa đơn, Giải trí, Sức khỏe, Giáo dục, Khác), 'note' (string summary)."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            merchant: { type: Type.STRING },
            category: { type: Type.STRING },
            note: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Error parsing receipt:", error);
    throw error;
  }
};

export const autoCategorize = async (note: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Phân loại chi tiêu: "${note}". Chỉ trả về 1 trong các danh mục sau: Ăn uống, Di chuyển, Mua sắm, Hóa đơn, Giải trí, Sức khỏe, Giáo dục, Khác.`,
    });
    return response.text?.trim() || "Khác";
  } catch (error) {
    return "Khác";
  }
};

export const parseVoiceCommand = async (transcript: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Phân tích câu nói tiếng Việt này thành giao dịch tài chính JSON: "${transcript}". 
      Fields: 
      - amount (number, handle 'k', 'nghìn', 'triệu', 'củ'), 
      - category (Map to closest: Ăn uống, Di chuyển, Mua sắm, Hóa đơn, Giải trí, Sức khỏe, Giáo dục, Khác), 
      - type (INCOME nếu là thu nhập/lương/thưởng, EXPENSE nếu là chi tiêu),
      - note (string description).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                amount: { type: Type.NUMBER },
                category: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['INCOME', 'EXPENSE'] },
                note: { type: Type.STRING }
            }
        }
      }
    });
    
    if (response.text) {
        return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
      console.error("Error parsing voice command:", error);
      return null;
  }
};

export const analyzeInvestmentPortfolio = async (assets: Asset[]): Promise<any> => {
    try {
        const assetsJson = JSON.stringify(assets.map(a => ({ name: a.name, type: a.type, value: a.value })));
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Bạn là chuyên gia quản lý gia sản (Wealth Manager). Hãy phân tích danh mục đầu tư sau: ${assetsJson}.
            
            Yêu cầu phân tích:
            1. Tính tỷ lệ Tiền mặt/Tiền gửi (CASH, SAVINGS) so với Tổng tài sản.
            2. Nếu tỷ lệ tiền mặt > 40% và Tổng tài sản > 500 triệu VND: Đưa ra CẢNH BÁO RỦI RO LẠM PHÁT và ĐỀ XUẤT ĐA DẠNG HÓA (Vàng, Chứng khoán, BĐS).
            3. Nếu danh mục quá tập trung vào 1 loại tài sản (ví dụ 90% Crypto): Cảnh báo rủi ro tập trung.
            4. Trả về JSON.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        healthScore: { type: Type.NUMBER, description: "Điểm đa dạng hóa từ 0-100" },
                        cashRatio: { type: Type.NUMBER, description: "Tỷ lệ tiền mặt (0-1)" },
                        summary: { type: Type.STRING, description: "Nhận xét tổng quan ngắn gọn" },
                        warnings: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Các cảnh báo rủi ro quan trọng" },
                        suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Các hành động đề xuất cụ thể" }
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        return null;
    } catch (error) {
        console.error("Error analyzing portfolio:", error);
        return null;
    }
};

// Advanced Financial Expert Persona
export const createFinancialChat = (
    transactions: Transaction[], 
    budgetInfo: { limit: number, spent: number, month: string },
    assets: Asset[] = []
) => {
  const transactionSummary = JSON.stringify(transactions.slice(0, 50)); // Limit context size
  const assetSummary = JSON.stringify(assets);

  const totalAssets = assets.filter(a => a.type !== AssetType.DEBT).reduce((sum, a) => sum + a.value, 0);
  const totalDebt = assets.filter(a => a.type === AssetType.DEBT).reduce((sum, a) => sum + a.value, 0);
  const netWorth = totalAssets - totalDebt;
  
  const context = `
    Vai trò: Bạn là một Chuyên gia Tài chính Cá nhân & Quản lý Gia sản (Wealth Manager) cao cấp.
    
    Ngữ cảnh Dòng tiền (Cashflow - Tháng ${budgetInfo.month}):
    - Ngân sách: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(budgetInfo.limit)}
    - Đã tiêu: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(budgetInfo.spent)}
    
    Ngữ cảnh Tài sản (Net Worth):
    - Tổng tài sản: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAssets)}
    - Tổng nợ: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalDebt)}
    - Giá trị ròng (Net Worth): ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(netWorth)}
    
    Chi tiết Danh mục đầu tư:
    ${assetSummary}
    
    Dữ liệu giao dịch gần đây:
    ${transactionSummary}
    
    Nhiệm vụ:
    1. Phân tích chi tiêu và đưa ra lời khuyên tiết kiệm.
    2. Đánh giá danh mục đầu tư (Assets): Cảnh báo nếu giữ quá nhiều tiền mặt, đề xuất đa dạng hóa (Vàng, Chứng khoán) nếu Net Worth cao.
    3. Nếu có nợ (Debt), ưu tiên khuyên trả nợ.
    4. Trả lời ngắn gọn, sắc sảo, dùng Emoji.
  `;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: context,
    },
  });
};
