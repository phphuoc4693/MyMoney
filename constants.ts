
import { Category, TransactionType, Wallet, Asset, AssetType, Debt, SavingsGoal, RecurringBill } from './types';
import { 
  Utensils, Bus, ShoppingBag, Receipt, Clapperboard, 
  HeartPulse, GraduationCap, Banknote, Gift, CircleDashed, TrendingUp,
  Home, Scissors, Plane, ShieldCheck, HeartHandshake, Percent, ShoppingCart, Tag,
  CircleDollarSign, Briefcase, BookOpen, Gamepad, Heart, Store, Package
} from 'lucide-react';

// Mapping Icon
export const CATEGORY_ICONS: Record<string, any> = {
  [Category.FOOD]: Utensils,
  [Category.GROCERIES]: ShoppingCart,
  [Category.TRANSPORT]: Bus,
  [Category.HOUSING]: Home,
  [Category.BILLS]: Receipt,
  [Category.HEALTH]: HeartPulse,
  [Category.EDUCATION]: GraduationCap,
  
  [Category.SHOPPING]: ShoppingBag,
  [Category.ENTERTAINMENT]: Clapperboard,
  [Category.BEAUTY]: Scissors,
  [Category.TRAVEL]: Plane,
  [Category.GIVING]: HeartHandshake,
  
  [Category.INSURANCE]: ShieldCheck,
  [Category.LOAN_INTEREST]: Percent,
  
  [Category.SALARY]: Banknote,
  [Category.BONUS]: Gift,
  [Category.SELLING]: Store,
  [Category.BUSINESS_COST]: Package,
  [Category.INVESTMENT_RETURN]: TrendingUp,
  [Category.OTHER]: CircleDashed,
};

// Mapping Colors
export const CATEGORY_COLORS: Record<string, string> = {
  [Category.FOOD]: 'bg-orange-100 text-orange-600',
  [Category.GROCERIES]: 'bg-amber-100 text-amber-600',
  [Category.TRANSPORT]: 'bg-blue-100 text-blue-600',
  [Category.HOUSING]: 'bg-cyan-100 text-cyan-600',
  [Category.BILLS]: 'bg-red-100 text-red-600',
  [Category.HEALTH]: 'bg-green-100 text-green-600',
  [Category.EDUCATION]: 'bg-indigo-100 text-indigo-600',
  
  [Category.SHOPPING]: 'bg-pink-100 text-pink-600',
  [Category.ENTERTAINMENT]: 'bg-purple-100 text-purple-600',
  [Category.BEAUTY]: 'bg-rose-100 text-rose-600',
  [Category.TRAVEL]: 'bg-sky-100 text-sky-600',
  [Category.GIVING]: 'bg-lime-100 text-lime-600',
  
  [Category.INSURANCE]: 'bg-teal-100 text-teal-600',
  [Category.LOAN_INTEREST]: 'bg-gray-100 text-gray-600',
  [Category.BUSINESS_COST]: 'bg-slate-100 text-slate-600',
  
  [Category.SALARY]: 'bg-emerald-100 text-emerald-600',
  [Category.BONUS]: 'bg-yellow-100 text-yellow-600',
  [Category.SELLING]: 'bg-violet-100 text-violet-600',
  [Category.INVESTMENT_RETURN]: 'bg-teal-100 text-teal-600',
  [Category.OTHER]: 'bg-gray-100 text-gray-600',
};

// Grouped Categories for Dropdown
export const EXPENSE_CATEGORIES_GROUPED = {
    "Chi phí Thiết yếu": [
        Category.FOOD,
        Category.GROCERIES,
        Category.TRANSPORT,
        Category.HOUSING,
        Category.BILLS,
        Category.HEALTH
    ],
    "Cá nhân & Hưởng thụ": [
        Category.SHOPPING,
        Category.ENTERTAINMENT,
        Category.BEAUTY,
        Category.TRAVEL
    ],
    "Giáo dục": [Category.EDUCATION],
    "Từ thiện": [Category.GIVING],
    "Kinh doanh": [Category.BUSINESS_COST],
    "Tài chính": [
        Category.INSURANCE,
        Category.LOAN_INTEREST,
        Category.INVESTMENT_LOSS,
        Category.OTHER
    ]
};

export const INCOME_CATEGORIES_GROUPED = {
    "Thu nhập Chính": [Category.SALARY, Category.BONUS],
    "Kinh doanh & Bán hàng": [Category.SELLING],
    "Thu nhập Khác": [Category.INVESTMENT_RETURN, Category.OTHER]
};

// JARS Definition
export const JARS_SYSTEM = [
    { 
        id: 'NEC', 
        name: 'Nhu cầu thiết yếu', 
        pct: 0.55, 
        color: 'bg-blue-500', 
        textColor: 'text-blue-600', 
        bgLight: 'bg-blue-50',
        icon: CircleDollarSign, 
        desc: 'Ăn uống, sinh hoạt',
        categories: [...EXPENSE_CATEGORIES_GROUPED["Chi phí Thiết yếu"]]
    },
    { 
        id: 'LTSS', 
        name: 'Tiết kiệm dài hạn', 
        pct: 0.10, 
        color: 'bg-emerald-500', 
        textColor: 'text-emerald-600',
        bgLight: 'bg-emerald-50',
        icon: Briefcase,
        desc: 'Mục tiêu lớn (Nhà, Xe)',
        categories: [] 
    },
    { 
        id: 'EDUC', 
        name: 'Giáo dục', 
        pct: 0.10, 
        color: 'bg-indigo-500', 
        textColor: 'text-indigo-600',
        bgLight: 'bg-indigo-50',
        icon: BookOpen,
        desc: 'Phát triển bản thân',
        categories: [Category.EDUCATION]
    },
    { 
        id: 'PLAY', 
        name: 'Hưởng thụ', 
        pct: 0.10, 
        color: 'bg-pink-500', 
        textColor: 'text-pink-600',
        bgLight: 'bg-pink-50',
        icon: Gamepad, 
        desc: 'Nuông chiều bản thân',
        categories: [...EXPENSE_CATEGORIES_GROUPED["Cá nhân & Hưởng thụ"]]
    },
    { 
        id: 'FFA', 
        name: 'Tự do tài chính', 
        pct: 0.10, 
        color: 'bg-purple-500', 
        textColor: 'text-purple-600',
        bgLight: 'bg-purple-50',
        icon: TrendingUp,
        desc: 'Đầu tư sinh lời',
        categories: [...EXPENSE_CATEGORIES_GROUPED["Tài chính"], Category.BUSINESS_COST]
    },
    { 
        id: 'GIVE', 
        name: 'Cho đi', 
        pct: 0.05, 
        color: 'bg-orange-500', 
        textColor: 'text-orange-600',
        bgLight: 'bg-orange-50',
        icon: Heart,
        desc: 'Từ thiện, biếu tặng',
        categories: [Category.GIVING]
    },
];

// --- 1. WALLETS (Efficient User Profile) ---
export const INITIAL_WALLETS: Wallet[] = [
  {
    id: 'w1',
    name: 'Tiền mặt',
    type: 'CASH',
    initialBalance: 2500000,
    currentBalance: 2500000,
    color: 'from-emerald-500 to-teal-700'
  },
  {
    id: 'w2',
    name: 'Techcombank (Chính)',
    type: 'BANK',
    initialBalance: 45000000, // Operating account
    currentBalance: 45000000,
    color: 'from-red-500 to-rose-700',
    bankName: 'TCB',
    accountNumber: '1903...8888',
    description: 'Nhận lương & Chi tiêu chính'
  },
  {
    id: 'w3',
    name: 'VIB Credit',
    type: 'CREDIT',
    initialBalance: -5200000, // Current debt
    currentBalance: -5200000,
    creditLimit: 50000000,
    color: 'from-orange-500 to-red-600',
    bankName: 'VIB',
    accountNumber: '5130...9999',
    description: 'Thẻ tín dụng hoàn tiền'
  },
  {
    id: 'w4',
    name: 'Momo',
    type: 'E-WALLET',
    initialBalance: 850000,
    currentBalance: 850000,
    color: 'from-pink-500 to-fuchsia-700',
    description: 'Thanh toán nhỏ lẻ'
  }
];

// --- 2. ASSETS (Diversified Portfolio) ---
export const INITIAL_ASSETS: Asset[] = [
    {
        id: 'a1',
        name: 'Sổ tiết kiệm Online',
        type: AssetType.SAVINGS,
        value: 150000000,
        initialValue: 150000000,
        lastUpdated: new Date().toISOString(),
        note: 'Quỹ dự phòng khẩn cấp (6 tháng)'
    },
    {
        id: 'a2',
        name: 'Vàng SJC',
        type: AssetType.GOLD,
        value: 85000000, // 1 chỉ ~ 8.5tr
        initialValue: 72000000, // Mua lúc 7.2tr
        quantity: 10,
        buyPrice: 7200000,
        currentPrice: 8500000,
        lastUpdated: new Date().toISOString(),
        note: 'Tích trữ dài hạn'
    },
    {
        id: 'a3',
        name: 'Cổ phiếu FPT',
        type: AssetType.STOCK,
        value: 65000000,
        initialValue: 50000000,
        lastUpdated: new Date().toISOString(),
        note: 'Đầu tư tăng trưởng'
    },
    {
        id: 'a4',
        name: 'Chứng chỉ quỹ VCBF',
        type: AssetType.FUND,
        value: 32000000,
        initialValue: 30000000,
        lastUpdated: new Date().toISOString(),
        note: 'Tích sản hàng tháng'
    }
];

// --- 3. DEBTS (Healthy Debt Profile) ---
export const INITIAL_DEBTS: Debt[] = [
    {
        id: 'd1',
        person: 'Tuấn Anh (Bạn)',
        amount: 5000000,
        type: 'LEND',
        isPaid: false,
        dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        note: 'Cho mượn đóng học phí'
    }
];

// --- 4. SAVINGS GOALS ---
export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [
    {
        id: 'g1',
        name: 'Nâng cấp Macbook M3',
        targetAmount: 45000000,
        currentAmount: 20000000,
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString(), // 4 months from now
        color: 'bg-gray-800',
        icon: 'Laptop',
        image: ''
    },
    {
        id: 'g2',
        name: 'Du lịch Nhật Bản',
        targetAmount: 60000000,
        currentAmount: 15000000,
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 8)).toISOString(),
        color: 'bg-pink-500',
        icon: 'Plane',
        image: ''
    }
];

// --- 5. RECURRING BILLS ---
export const INITIAL_RECURRING_BILLS: RecurringBill[] = [
    { id: 'b1', name: 'Internet VNPT', amount: 240000, category: Category.BILLS, dueDay: 10 },
    { id: 'b2', name: 'Điện lực EVN', amount: 1200000, category: Category.BILLS, dueDay: 15 },
    { id: 'b3', name: 'Netflix Premium', amount: 260000, category: Category.ENTERTAINMENT, dueDay: 5 },
    { id: 'b4', name: 'Phí Gym California', amount: 800000, category: Category.HEALTH, dueDay: 1 },
    { id: 'b5', name: 'Gói Apple One', amount: 180000, category: Category.BILLS, dueDay: 20 },
];

// --- 6. INITIAL BUDGETS (Effective User) ---
export const INITIAL_CATEGORY_BUDGETS: Record<string, number> = {
    [Category.FOOD]: 4500000,
    [Category.TRANSPORT]: 1500000,
    [Category.SHOPPING]: 2000000,
    [Category.BILLS]: 2000000,
    [Category.ENTERTAINMENT]: 1500000,
    [Category.EDUCATION]: 1000000, // Books/Courses
    [Category.GIVING]: 1000000, // Parents/Charity
};

// --- REALISTIC MOCK DATA GENERATOR (Efficient User, No Rent) ---
const generateMockTransactions = () => {
    const transactions = [];
    const today = new Date();
    
    // 6 Months History
    for (let i = 0; i < 6; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // 1. Monthly Salary (Income: 25M on the 5th - Techcombank)
        transactions.push({
            id: `sal-${i}`,
            amount: 25000000,
            type: TransactionType.INCOME,
            category: Category.SALARY,
            date: new Date(year, month, 5, 9, 0, 0).toISOString(),
            note: `Lương tháng ${month + 1}`,
            walletId: 'w2'
        });

        // 2. Side Hustle / Business (Income: ~3M on the 20th - Cash/Momo)
        transactions.push({
            id: `side-${i}`,
            amount: 3000000 + Math.floor(Math.random() * 1000000),
            type: TransactionType.INCOME,
            category: Category.SELLING, // Business Revenue
            date: new Date(year, month, 20, 14, 0, 0).toISOString(),
            note: 'Doanh thu bán hàng online',
            walletId: 'w2'
        });

        // 3. Business Cost (Import goods)
        transactions.push({
            id: `cost-${i}`,
            amount: 1000000 + Math.floor(Math.random() * 500000),
            type: TransactionType.EXPENSE,
            category: Category.BUSINESS_COST,
            date: new Date(year, month, 10, 10, 0, 0).toISOString(),
            note: 'Nhập hàng về bán',
            walletId: 'w2'
        });

        // 4. Investment (DCA: 5M to Stocks/Fund on the 6th)
        transactions.push({
            id: `invest-${i}`,
            amount: 5000000,
            type: TransactionType.EXPENSE,
            category: Category.OTHER, // Transfer out actually
            note: 'Chuyển tiền đầu tư tích sản (DCA)',
            date: new Date(year, month, 6, 10, 0, 0).toISOString(),
            walletId: 'w2'
        });

        // 5. Savings Goal (2M to Savings Goal on the 6th)
        transactions.push({
            id: `save-${i}`,
            amount: 2000000,
            type: TransactionType.EXPENSE,
            category: Category.OTHER,
            note: 'Nạp quỹ mua xe',
            date: new Date(year, month, 6, 10, 30, 0).toISOString(),
            walletId: 'w2'
        });

        // 6. Contribution to Parents (Instead of Rent: 3M on the 1st)
        transactions.push({
            id: `family-${i}`,
            amount: 3000000,
            type: TransactionType.EXPENSE,
            category: Category.GIVING,
            date: new Date(year, month, 1, 19, 0, 0).toISOString(),
            note: 'Biếu bố mẹ sinh hoạt phí',
            walletId: 'w2'
        });

        // 7. Daily Expenses (Food, Transport - mostly Credit Card & Momo)
        for (let d = 1; d <= Math.min(daysInMonth, i === 0 ? today.getDate() : 31); d++) {
            if (Math.random() > 0.7) continue; // Skip some days

            // Food (Credit Card for points or Cash)
            const isCredit = Math.random() > 0.5;
            const foodCost = 45000 + Math.floor(Math.random() * 50000);
            transactions.push({
                id: `food-${i}-${d}`,
                amount: foodCost,
                type: TransactionType.EXPENSE,
                category: Category.FOOD,
                date: new Date(year, month, d, 12, 30, 0).toISOString(),
                note: Math.random() > 0.5 ? 'Ăn trưa văn phòng' : 'Ăn tối',
                walletId: isCredit ? 'w3' : 'w1'
            });

            // Coffee (Momo)
            if (Math.random() > 0.6) {
                transactions.push({
                    id: `cafe-${i}-${d}`,
                    amount: 35000 + Math.floor(Math.random() * 20000),
                    type: TransactionType.EXPENSE,
                    category: Category.FOOD,
                    date: new Date(year, month, d, 9, 0, 0).toISOString(),
                    note: 'Cà phê sáng',
                    walletId: 'w4'
                });
            }

            // Transport (Grab - Credit Card)
            if (Math.random() > 0.8) {
                transactions.push({
                    id: `trans-${i}-${d}`,
                    amount: 65000,
                    type: TransactionType.EXPENSE,
                    category: Category.TRANSPORT,
                    date: new Date(year, month, d, 18, 0, 0).toISOString(),
                    note: 'GrabCar đi làm',
                    walletId: 'w3'
                });
            }
        }

        // 8. Occasional Shopping (Shopee - Credit Card)
        if (Math.random() > 0.4) {
             transactions.push({
                id: `shop-${i}`,
                amount: 500000 + Math.floor(Math.random() * 1000000),
                type: TransactionType.EXPENSE,
                category: Category.SHOPPING,
                date: new Date(year, month, 15 + Math.floor(Math.random() * 10), 20, 0, 0).toISOString(),
                note: 'Mua sắm Shopee (Sách, Quần áo)',
                walletId: 'w3'
            });
        }
        
        // 9. Education (Self-improvement)
        if (i % 2 === 0) { // Every 2 months
             transactions.push({
                id: `edu-${i}`,
                amount: 800000,
                type: TransactionType.EXPENSE,
                category: Category.EDUCATION,
                date: new Date(year, month, 12, 10, 0, 0).toISOString(),
                note: 'Mua khóa học Online / Sách',
                walletId: 'w3'
            });
        }
    }
    return transactions;
};

export const INITIAL_TRANSACTIONS = generateMockTransactions();
