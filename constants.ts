
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

// --- 1. WALLETS (Clean State) ---
export const INITIAL_WALLETS: Wallet[] = [
  {
    id: 'w1',
    name: 'Tiền mặt',
    type: 'CASH',
    initialBalance: 0,
    currentBalance: 0,
    color: 'from-emerald-500 to-teal-700'
  }
];

// --- 2. ASSETS (Clean State) ---
export const INITIAL_ASSETS: Asset[] = [];

// --- 3. DEBTS (Clean State) ---
export const INITIAL_DEBTS: Debt[] = [];

// --- 4. SAVINGS GOALS (Clean State) ---
export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [];

// --- 5. RECURRING BILLS (Clean State) ---
export const INITIAL_RECURRING_BILLS: RecurringBill[] = [];

// --- 6. INITIAL BUDGETS (Clean State) ---
export const INITIAL_CATEGORY_BUDGETS: Record<string, number> = {};

// --- 7. TRANSACTIONS (Clean State) ---
export const INITIAL_TRANSACTIONS: import('./types').Transaction[] = [];
