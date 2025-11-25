
export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME'
}

export enum Category {
  // --- CHI TIÊU THIẾT YẾU (NEEDS) ---
  FOOD = 'Ăn uống',
  TRANSPORT = 'Di chuyển',
  HOUSING = 'Nhà cửa', // Thuê nhà, sửa chữa
  BILLS = 'Hóa đơn & Tiện ích', // Điện, nước, net
  HEALTH = 'Sức khỏe',
  EDUCATION = 'Giáo dục',
  GROCERIES = 'Đi chợ/Siêu thị',

  // --- CHI TIÊU CÁ NHÂN / HƯỞNG THỤ (WANTS) ---
  SHOPPING = 'Mua sắm',
  ENTERTAINMENT = 'Giải trí',
  BEAUTY = 'Làm đẹp',
  TRAVEL = 'Du lịch',
  GIVING = 'Hiếu hỉ/Từ thiện',
  
  // --- TÀI CHÍNH (FINANCIAL) ---
  INSURANCE = 'Bảo hiểm',
  LOAN_INTEREST = 'Trả lãi vay',
  INVESTMENT_LOSS = 'Lỗ đầu tư',

  // --- KINH DOANH (BUSINESS) ---
  BUSINESS_COST = 'Chi phí Kinh doanh', // Vốn nhập hàng, vận hành

  // --- THU NHẬP ---
  SALARY = 'Lương',
  BONUS = 'Thưởng',
  SELLING = 'Bán hàng/Kinh doanh',
  INVESTMENT_RETURN = 'Lợi nhuận đầu tư',
  OTHER = 'Khác'
}

export enum AssetType {
  CASH = 'Tiền mặt',
  SAVINGS = 'Sổ tiết kiệm',
  STOCK = 'Cổ phiếu/Chứng khoán',
  CRYPTO = 'Tiền mã hóa',
  REAL_ESTATE = 'Bất động sản',
  GOLD = 'Vàng/Bạc',
  FUND = 'Chứng chỉ quỹ',
  DEBT = 'Nợ/Khoản vay', // Liability
  OTHER = 'Tài sản khác'
}

export interface Wallet {
  id: string;
  name: string;
  type: 'CASH' | 'BANK' | 'CREDIT' | 'E-WALLET';
  initialBalance: number;
  currentBalance: number; // Calculated dynamically
  creditLimit?: number; // For Credit Cards
  color: string;
  icon?: string;
  accountNumber?: string;
  bankName?: string;
  description?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  value: number; // Current market value (Total)
  initialValue: number; // Cost basis (Total)
  note?: string;
  lastUpdated: string;
  // Extended fields for Gold/Stock
  quantity?: number; // Số lượng (VD: 5 chỉ, 100 cổ phiếu)
  buyPrice?: number; // Giá mua trên một đơn vị
  currentPrice?: number; // Giá thị trường hiện tại trên một đơn vị
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category | string;
  date: string; // ISO string
  note: string;
  walletId?: string; // Link transaction to a specific wallet
}

export interface ReceiptData {
  amount?: number;
  date?: string;
  category?: string;
  items?: string[];
  merchant?: string;
  note?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Budget {
  amount: number;
  currency: string;
}

export interface CategoryBudget {
    category: string;
    limit: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
  icon: string;
  image?: string; // Base64 image string
}

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  category: Category | string;
  dueDay: number; // Day of month (1-31)
}

export interface Debt {
  id: string;
  person: string; // Name of person lending/borrowing
  amount: number;
  type: 'LEND' | 'BORROW'; // LEND: Mình cho vay (Asset), BORROW: Mình đi vay (Liability)
  dueDate?: string;
  note?: string;
  isPaid: boolean;
}
