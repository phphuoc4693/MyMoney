
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, SavingsGoal, RecurringBill, Asset, AssetType, Debt, Category, Wallet } from './types';
import { 
    INITIAL_TRANSACTIONS, 
    INITIAL_WALLETS, 
    INITIAL_ASSETS, 
    INITIAL_DEBTS, 
    INITIAL_SAVINGS_GOALS, 
    INITIAL_RECURRING_BILLS, 
    INITIAL_CATEGORY_BUDGETS 
} from './constants';
import TransactionList from './components/TransactionList';
import TransactionBook from './components/TransactionBook';
import RecentTransactions from './components/RecentTransactions';
import AddTransactionModal from './components/AddTransactionModal';
import StatsChart from './components/StatsChart';
import TrendReport from './components/TrendReport';
import BudgetPlanner from './components/BudgetPlanner';
import SavingsGoals from './components/SavingsGoals';
import RecurringBills from './components/RecurringBills';
import InvestmentManager from './components/InvestmentManager';
import DebtManager from './components/DebtManager';
import FinancialTools from './components/FinancialTools';
import Settings from './components/Settings';
import CalendarView from './components/CalendarView';
import NotificationToast, { NotificationData } from './components/NotificationToast';
import PasscodeLock from './components/PasscodeLock';
import WalletManager from './components/WalletManager';
import HarvestSowingReport from './components/HarvestSowingReport';
import UpcomingBillsWidget from './components/UpcomingBillsWidget';
import BillDetailModal from './components/BillDetailModal';
import DailySavingsWidget from './components/DailySavingsWidget';
import SavingsQuickDepositModal from './components/SavingsQuickDepositModal';
import FinancialHealthWidget from './components/FinancialHealthWidget';
import FinancialHealthModal from './components/FinancialHealthModal';
import CashflowForecast from './components/CashflowForecast';
import LoginScreen from './components/LoginScreen';
import JarsWidget from './components/JarsWidget';
import BusinessManager from './components/BusinessManager';

import { 
  Plus, Wallet as WalletIcon, TrendingDown, TrendingUp, Menu, Calendar, 
  ChevronLeft, ChevronRight, Settings as SettingsIcon, Target, PieChart, 
  X, LogOut, User, LayoutDashboard, Trophy, CalendarClock, Briefcase, Eye, EyeOff,
  BookUser, Calculator, CreditCard, Sprout, Store
} from 'lucide-react';

type ViewState = 'dashboard' | 'transactions' | 'report' | 'harvest' | 'budget' | 'wallets' | 'savings' | 'recurring' | 'investment' | 'debt' | 'tools' | 'settings' | 'business';

const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!localStorage.getItem('is_logged_in'));
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    if (saved) {
        try { return JSON.parse(saved); } catch (e) { return INITIAL_TRANSACTIONS; }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [wallets, setWallets] = useState<Wallet[]>(() => {
      const saved = localStorage.getItem('wallets');
      if (saved) {
          try { return JSON.parse(saved); } catch (e) { return INITIAL_WALLETS; }
      }
      return INITIAL_WALLETS;
  });

  const [budget, setBudget] = useState<number>(() => {
      const saved = localStorage.getItem('budget');
      return saved ? parseFloat(saved) : 0; 
  });

  const [monthlyIncome, setMonthlyIncome] = useState<string>(() => {
      return localStorage.getItem('planned_income') || '0'; 
  });

  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>(() => {
      const saved = localStorage.getItem('categoryBudgets');
      if (saved) {
          try { return JSON.parse(saved); } catch (e) { return INITIAL_CATEGORY_BUDGETS; }
      }
      return INITIAL_CATEGORY_BUDGETS;
  });

  // Custom Categories State
  const [customCategories, setCustomCategories] = useState<{name: string, type: TransactionType}[]>(() => {
      const saved = localStorage.getItem('customCategories');
      if (saved) {
          try { return JSON.parse(saved); } catch (e) { return []; }
      }
      return [];
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
      const saved = localStorage.getItem('savingsGoals');
      if (saved) {
          try { return JSON.parse(saved); } catch (e) { return INITIAL_SAVINGS_GOALS; }
      }
      return INITIAL_SAVINGS_GOALS;
  });

  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>(() => {
      const saved = localStorage.getItem('recurringBills');
      if (saved) {
          try { return JSON.parse(saved); } catch (e) { return INITIAL_RECURRING_BILLS; }
      }
      return INITIAL_RECURRING_BILLS;
  });

  const [assets, setAssets] = useState<Asset[]>(() => {
      const saved = localStorage.getItem('assets');
      if (saved) {
          try { return JSON.parse(saved); } catch (e) { return INITIAL_ASSETS; }
      }
      return INITIAL_ASSETS;
  });

  const [debts, setDebts] = useState<Debt[]>(() => {
      const saved = localStorage.getItem('debts');
      if (saved) {
          try { return JSON.parse(saved); } catch (e) { return INITIAL_DEBTS; }
      }
      return INITIAL_DEBTS;
  });

  // Security State
  const [pin, setPin] = useState<string | null>(() => localStorage.getItem('app_pin'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!localStorage.getItem('app_pin'));
  const [showPinSetup, setShowPinSetup] = useState(false);

  // App UI State
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [currentMonth, setCurrentMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [tempBudget, setTempBudget] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationData | null>(null);
  
  // Widget Modal States
  const [selectedBill, setSelectedBill] = useState<RecurringBill | null>(null);
  const [selectedDailyGoal, setSelectedDailyGoal] = useState<SavingsGoal | null>(null); 
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false); 

  // Privacy State
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(false);

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => { localStorage.setItem('transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('wallets', JSON.stringify(wallets)); }, [wallets]);
  useEffect(() => { localStorage.setItem('budget', budget.toString()); }, [budget]);
  useEffect(() => { localStorage.setItem('categoryBudgets', JSON.stringify(categoryBudgets)); }, [categoryBudgets]);
  useEffect(() => { localStorage.setItem('customCategories', JSON.stringify(customCategories)); }, [customCategories]);
  useEffect(() => { localStorage.setItem('savingsGoals', JSON.stringify(savingsGoals)); }, [savingsGoals]);
  useEffect(() => { localStorage.setItem('recurringBills', JSON.stringify(recurringBills)); }, [recurringBills]);
  useEffect(() => { localStorage.setItem('assets', JSON.stringify(assets)); }, [assets]);
  useEffect(() => { localStorage.setItem('debts', JSON.stringify(debts)); }, [debts]);
  useEffect(() => { localStorage.setItem('planned_income', monthlyIncome); }, [monthlyIncome]);

  // --- HELPER FUNCTIONS ---
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      setNotification({ message, type });
  };

  // Auth Handlers
  const handleLogin = () => {
      setIsLoggedIn(true);
      // Reset authentication to require PIN if set
      if (pin) setIsAuthenticated(false); 
      showNotification("Đăng nhập thành công!");
  };

  const handleLogout = () => {
      if (confirm("Bạn có chắc muốn đăng xuất?")) {
          localStorage.removeItem('is_logged_in');
          setIsLoggedIn(false);
          setCurrentView('dashboard');
          setIsSidebarOpen(false);
          showNotification("Đã đăng xuất.", "info");
      }
  };

  // Wallet Handlers
  const addWallet = (wallet: Wallet) => {
      setWallets(prev => [...prev, wallet]);
      showNotification("Đã thêm tài khoản mới");
  };

  const updateWallet = (id: string, data: Partial<Wallet>) => {
      setWallets(prev => prev.map(w => w.id === id ? { ...w, ...data } : w));
      showNotification("Đã cập nhật tài khoản");
  };

  const deleteWallet = (id: string) => {
      if (transactions.some(t => t.walletId === id)) {
          showNotification("Không thể xóa ví đã có giao dịch!", "error");
          return;
      }
      setWallets(prev => prev.filter(w => w.id !== id));
      showNotification("Đã xóa ví");
  };

  // Transaction Handlers
  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = { ...t, id: Date.now().toString(), walletId: t.walletId || wallets[0]?.id };
    setTransactions(prev => [newTransaction, ...prev]);
    showNotification("Đã lưu giao dịch thành công!");
  };

  const updateTransaction = (id: string, updatedData: Omit<Transaction, 'id'>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
    setEditingTransaction(null);
    showNotification("Đã cập nhật giao dịch!");
  };

  const deleteTransaction = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
        setTransactions(prev => prev.filter(t => t.id !== id));
        showNotification("Đã xóa giao dịch.", "info");
    }
  };

  // Category Handler
  const addCustomCategory = (name: string, type: TransactionType) => {
      if (Object.values(Category).includes(name as any) || customCategories.some(c => c.name === name)) {
          showNotification("Danh mục này đã tồn tại", "error");
          return;
      }
      setCustomCategories(prev => [...prev, { name, type }]);
      showNotification("Đã thêm danh mục mới");
  };

  // Other Handlers
  const handleUpdateCategoryBudget = (category: string, amount: number) => {
      setCategoryBudgets(prev => ({ ...prev, [category]: amount }));
      showNotification(`Đã đặt ngân sách cho ${category}`);
  };

  const addSavingsGoal = (goal: Omit<SavingsGoal, 'id'>) => {
      setSavingsGoals(prev => [...prev, { ...goal, id: Date.now().toString() }]);
      showNotification("Đã thêm mục tiêu tiết kiệm!");
  };

  const deleteSavingsGoal = (id: string) => {
      setSavingsGoals(prev => prev.filter(g => g.id !== id));
      showNotification("Đã xóa mục tiêu.");
  };

  // Updated Deposit to accept walletId
  const depositSavings = (goalId: string, amount: number, walletId?: string) => {
      setSavingsGoals(prev => prev.map(g => g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g));
      const goalName = savingsGoals.find(g => g.id === goalId)?.name || 'Tiết kiệm';
      addTransaction({
          amount: amount,
          type: TransactionType.EXPENSE,
          category: 'Tiết kiệm',
          note: `Nạp tiết kiệm: ${goalName}`,
          date: new Date().toISOString(),
          walletId: walletId || wallets[0]?.id
      });
      showNotification("Đã nạp tiền vào mục tiêu!");
  };

  const withdrawSavings = (goalId: string, amount: number) => {
      setSavingsGoals(prev => prev.map(g => g.id === goalId ? { ...g, currentAmount: Math.max(0, g.currentAmount - amount) } : g));
      const goalName = savingsGoals.find(g => g.id === goalId)?.name || 'Tiết kiệm';
      addTransaction({
          amount: amount,
          type: TransactionType.INCOME,
          category: 'Tiết kiệm',
          note: `Rút từ mục tiêu: ${goalName}`,
          date: new Date().toISOString(),
          walletId: wallets[0]?.id
      });
      showNotification("Đã rút tiền từ mục tiêu!");
  };

  const addRecurringBill = (bill: Omit<RecurringBill, 'id'>) => {
      setRecurringBills(prev => [...prev, { ...bill, id: Date.now().toString() }]);
      showNotification("Đã thêm hóa đơn định kỳ");
  };

  const updateRecurringBill = (id: string, updatedBill: Partial<RecurringBill>) => {
      setRecurringBills(prev => prev.map(b => b.id === id ? { ...b, ...updatedBill } : b));
      showNotification("Đã cập nhật hóa đơn");
  };

  const deleteRecurringBill = (id: string) => {
      setRecurringBills(prev => prev.filter(b => b.id !== id));
      showNotification("Đã xóa hóa đơn");
  };

  const payRecurringBill = (bill: RecurringBill, walletId?: string) => {
      addTransaction({
          amount: bill.amount,
          type: TransactionType.EXPENSE,
          category: bill.category,
          note: `Thanh toán ${bill.name}`,
          date: new Date().toISOString(),
          walletId: walletId || wallets[0]?.id
      });
      showNotification("Đã thanh toán hóa đơn!");
  };

  const addAsset = (asset: Omit<Asset, 'id' | 'lastUpdated'>) => {
      setAssets(prev => [...prev, { ...asset, id: Date.now().toString(), lastUpdated: new Date().toISOString() }]);
      showNotification("Đã thêm tài sản mới");
  };

  const updateAsset = (id: string, update: Partial<Asset>) => {
      setAssets(prev => prev.map(a => a.id === id ? { ...a, ...update } : a));
      showNotification("Cập nhật tài sản thành công");
  };

  const deleteAsset = (id: string) => {
      if (confirm("Xóa tài sản này?")) {
          setAssets(prev => prev.filter(a => a.id !== id));
          showNotification("Đã xóa tài sản");
      }
  };

  const addDebt = (debt: Omit<Debt, 'id' | 'isPaid'>) => {
      setDebts(prev => [...prev, { ...debt, id: Date.now().toString(), isPaid: false }]);
      if (debt.type === 'LEND') {
           addTransaction({
               amount: debt.amount,
               type: TransactionType.EXPENSE,
               category: 'Cho vay',
               note: `Cho ${debt.person} vay`,
               date: new Date().toISOString(),
               walletId: wallets[0]?.id
           });
      } else {
           addTransaction({
               amount: debt.amount,
               type: TransactionType.INCOME,
               category: 'Đi vay',
               note: `Vay từ ${debt.person}`,
               date: new Date().toISOString(),
               walletId: wallets[0]?.id
           });
      }
      showNotification("Đã thêm khoản nợ và tạo giao dịch!");
  };

  const settleDebt = (debt: Debt) => {
      setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, isPaid: true } : d));
      if (debt.type === 'LEND') {
          addTransaction({
              amount: debt.amount,
              type: TransactionType.INCOME,
              category: 'Thu nợ',
              note: `Thu nợ từ ${debt.person}`,
              date: new Date().toISOString(),
              walletId: wallets[0]?.id
          });
      } else {
          addTransaction({
              amount: debt.amount,
              type: TransactionType.EXPENSE,
              category: 'Trả nợ',
              note: `Trả nợ cho ${debt.person}`,
              date: new Date().toISOString(),
              walletId: wallets[0]?.id
          });
      }
      showNotification("Đã hoàn tất khoản nợ!");
  };

  const deleteDebt = (id: string) => {
      if(confirm("Xóa khoản ghi nhớ này?")) {
          setDebts(prev => prev.filter(d => d.id !== id));
          showNotification("Đã xóa");
      }
  };

  const handleSetPin = (newPin: string) => {
      localStorage.setItem('app_pin', newPin);
      setPin(newPin);
      setShowPinSetup(false);
      showNotification("Đã cài đặt mã PIN bảo vệ");
  };

  const handleRemovePin = () => {
      if (confirm("Bạn có chắc muốn xóa mã PIN bảo vệ?")) {
          localStorage.removeItem('app_pin');
          setPin(null);
          showNotification("Đã xóa mã PIN");
      }
  };

  const handleUnlock = () => {
      setIsAuthenticated(true);
  };

  const handleResetData = () => {
      if (confirm("CẢNH BÁO: Hành động này sẽ xóa sạch mọi dữ liệu! Bạn có chắc không?")) {
          localStorage.clear();
          // Reset state to initial constants
          setTransactions(INITIAL_TRANSACTIONS);
          setWallets(INITIAL_WALLETS);
          setAssets(INITIAL_ASSETS);
          setDebts(INITIAL_DEBTS);
          setSavingsGoals(INITIAL_SAVINGS_GOALS);
          setRecurringBills(INITIAL_RECURRING_BILLS);
          setCategoryBudgets(INITIAL_CATEGORY_BUDGETS);
          setBudget(0);
          setMonthlyIncome('0');
          setCustomCategories([]);
          
          showNotification("Đã reset về dữ liệu mặc định.");
          window.location.reload();
      }
  };

  const handleExportCSV = () => {
    // Define headers
    const headers = ['Ngày', 'Giờ', 'Loại giao dịch', 'Danh mục', 'Số tiền (VND)', 'Tài khoản/Ví', 'Ghi chú'];
    
    // Format rows
    const rows = transactions.map(t => {
        const dateObj = new Date(t.date);
        const date = dateObj.toLocaleDateString('vi-VN'); // DD/MM/YYYY
        const time = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const type = t.type === TransactionType.INCOME ? 'Thu nhập' : 'Chi tiêu';
        const walletName = wallets.find(w => w.id === t.walletId)?.name || 'Không xác định';
        
        // Escape quotes for CSV safety
        const note = `"${t.note.replace(/"/g, '""')}"`;
        const category = `"${t.category.replace(/"/g, '""')}"`;
        
        return [date, time, type, category, t.amount.toString(), walletName, note];
    });

    // Combine headers and rows
    const csvContent = [
        headers.join(','), 
        ...rows.map(e => e.join(','))
    ].join('\n');

    // Add BOM for Excel UTF-8 compatibility
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mymoney_full_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification("Đã xuất file Excel (CSV) thành công!");
  };

  const handleExportJSON = () => {
      const data = { transactions, wallets, budget, categoryBudgets, savingsGoals, recurringBills, assets, debts, customCategories, monthlyIncome, exportDate: new Date().toISOString() };
      const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = "moneylover_backup.json";
      link.click();
      showNotification("Đã tạo file sao lưu JSON");
  }

  const handleImportJSON = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              const data = JSON.parse(content);
              
              // Basic validation
              if (!data.transactions || !data.wallets) {
                  showNotification("File không hợp lệ!", "error");
                  return;
              }

              // Restore Data to LocalStorage
              if(data.transactions) localStorage.setItem('transactions', JSON.stringify(data.transactions));
              if(data.wallets) localStorage.setItem('wallets', JSON.stringify(data.wallets));
              if(data.budget) localStorage.setItem('budget', data.budget.toString());
              if(data.categoryBudgets) localStorage.setItem('categoryBudgets', JSON.stringify(data.categoryBudgets));
              if(data.savingsGoals) localStorage.setItem('savingsGoals', JSON.stringify(data.savingsGoals));
              if(data.recurringBills) localStorage.setItem('recurringBills', JSON.stringify(data.recurringBills));
              if(data.assets) localStorage.setItem('assets', JSON.stringify(data.assets));
              if(data.debts) localStorage.setItem('debts', JSON.stringify(data.debts));
              if(data.customCategories) localStorage.setItem('customCategories', JSON.stringify(data.customCategories));
              if(data.monthlyIncome) localStorage.setItem('planned_income', data.monthlyIncome);

              showNotification("Khôi phục dữ liệu thành công! Đang tải lại...");
              setTimeout(() => window.location.reload(), 1500);

          } catch (err) {
              console.error(err);
              showNotification("Lỗi khi đọc file!", "error");
          }
      };
      reader.readAsText(file);
  };

  const navigateTo = (view: ViewState) => {
      setCurrentView(view);
      setIsSidebarOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const filteredTransactions = useMemo(() => {
      return transactions.filter(t => t.date.startsWith(currentMonth));
  }, [transactions, currentMonth]);

  const totalIncome = filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
  const totalBalance = totalIncome - totalExpense;
  
  const formatCurrency = (val: number) => {
      if (isPrivacyMode) return '******';
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  }

  // 1. Check Login
  if (!isLoggedIn) {
      return <LoginScreen onLogin={handleLogin} />;
  }

  // 2. Check PIN (if exists)
  if (!isAuthenticated && pin) {
      return <PasscodeLock savedPin={pin} onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24 md:pb-10 animate-fade-in">
      <NotificationToast notification={notification} onClose={() => setNotification(null)} />
      
      {showPinSetup && (
          <PasscodeLock 
            savedPin="" 
            mode="SETUP" 
            onSetPin={handleSetPin} 
            onUnlock={() => {}} 
            onCancelSetup={() => setShowPinSetup(false)}
          />
      )}

      {/* Sidebar Overlay */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isSidebarOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsSidebarOpen(false)} />
        <div className={`absolute top-0 left-0 bottom-0 w-[280px] bg-white shadow-2xl transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6 flex flex-col h-full overflow-y-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">{localStorage.getItem('user_name') || 'Người dùng Pro'}</h3>
                        <p className="text-xs text-gray-500">{localStorage.getItem('user_email') || 'pro@moneylover.ai'}</p>
                    </div>
                </div>
                <nav className="space-y-2 flex-1">
                    <button onClick={() => navigateTo('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'dashboard' ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}><LayoutDashboard size={20} /> Tổng quan</button>
                    <button onClick={() => navigateTo('transactions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'transactions' ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}><WalletIcon size={20} /> Sổ giao dịch</button>
                    <button onClick={() => navigateTo('wallets')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'wallets' ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}><CreditCard size={20} /> Tài khoản & Ví</button>
                    <button onClick={() => navigateTo('harvest')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'harvest' ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}><Sprout size={20} /> Gieo & Gặt (Report)</button>
                    <button onClick={() => navigateTo('report')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'report' ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}><PieChart size={20} /> Báo cáo xu hướng</button>
                    <button onClick={() => navigateTo('budget')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'budget' ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}><Target size={20} /> Kế hoạch ngân sách</button>
                    <button onClick={() => navigateTo('business')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'business' ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}><Store size={20} /> Quản lý kinh doanh</button>
                    
                    <div className="pt-2 pb-2"><p className="px-4 text-xs font-bold text-gray-400 uppercase mb-2">Đầu tư & Tích lũy</p>
                         <button onClick={() => navigateTo('investment')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'investment' ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}><Briefcase size={20} /> Quản lý đầu tư</button>
                        <button onClick={() => navigateTo('savings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'savings' ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}><Trophy size={20} /> Mục tiêu tiết kiệm</button>
                        <button onClick={() => navigateTo('recurring')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'recurring' ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}><CalendarClock size={20} /> Hóa đơn định kỳ</button>
                        <button onClick={() => navigateTo('debt')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'debt' ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}><BookUser size={20} /> Sổ nợ</button>
                    </div>
                    <div className="pt-2 pb-2"><div className="h-px bg-gray-100 w-full" /></div>
                    <button onClick={() => navigateTo('tools')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'tools' ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}><Calculator size={20} /> Tiện ích</button>
                    <button onClick={() => navigateTo('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'settings' ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}><SettingsIcon size={20} /> Cài đặt chung</button>
                </nav>
                <div className="mt-auto pt-6 border-t border-gray-100">
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-colors"
                    >
                        <LogOut size={20} /> Đăng xuất
                    </button>
                </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white sticky top-0 z-30 border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 hover:text-primary rounded-full transition-colors"><Menu size={24} /></button>
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('dashboard')}>
                    <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-2 rounded-xl shadow-sm shadow-green-100 hidden sm:block"><WalletIcon className="text-white" size={20} /></div>
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight hidden sm:block">MyMoney</h1>
                </div>
            </div>
            {['dashboard', 'transactions', 'budget', 'business'].includes(currentView) && (
                <div className="flex items-center bg-gray-100 rounded-full px-1 p-1 border border-gray-200 shadow-inner">
                    <button onClick={() => {
                        const d = new Date(currentMonth + "-01"); d.setMonth(d.getMonth() - 1);
                        setCurrentMonth(d.toISOString().slice(0, 7));
                    }} className="p-1.5 hover:bg-white hover:shadow-sm rounded-full transition-all text-gray-600"><ChevronLeft size={18} /></button>
                    <button onClick={() => setIsCalendarOpen(true)} className="px-3 flex items-center gap-2 text-sm font-semibold text-gray-700 min-w-[130px] justify-center hover:bg-white hover:shadow-sm rounded-full py-1 transition-all">
                        <Calendar size={14} className="text-primary" />
                        {`Tháng ${new Date(currentMonth + "-01").getMonth() + 1} / ${new Date(currentMonth + "-01").getFullYear()}`}
                    </button>
                    <button onClick={() => {
                        const d = new Date(currentMonth + "-01"); d.setMonth(d.getMonth() + 1);
                        setCurrentMonth(d.toISOString().slice(0, 7));
                    }} className="p-1.5 hover:bg-white hover:shadow-sm rounded-full transition-all text-gray-600"><ChevronRight size={18} /></button>
                </div>
            )}
            <div className="flex gap-1">
                <button onClick={() => setIsPrivacyMode(!isPrivacyMode)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                    {isPrivacyMode ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
                <button onClick={() => navigateTo('settings')} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><SettingsIcon size={24} /></button>
            </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {currentView === 'dashboard' && (
            <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Financial Health Widget (New) */}
                  <div className="md:col-span-1">
                      <FinancialHealthWidget 
                        transactions={filteredTransactions} // For current month indicators
                        allTransactions={transactions} // For historical average indicators
                        budget={budget} 
                        assets={assets} 
                        debts={debts}
                        isPrivacyMode={isPrivacyMode}
                        onOpenDetails={() => setIsHealthModalOpen(true)}
                      />
                  </div>
                  
                  {/* Total Balance Card */}
                  <div className="md:col-span-2 bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-2xl p-6 shadow-lg shadow-gray-200 flex flex-col justify-between relative overflow-hidden">
                     <div className="absolute -right-6 -top-6 p-4 opacity-10 rotate-12"><WalletIcon size={140} /></div>
                    <div>
                        <p className="text-gray-400 text-sm font-medium mb-1 flex items-center gap-2"><Calendar size={14} /> {`Tháng ${new Date(currentMonth + "-01").getMonth() + 1} / ${new Date(currentMonth + "-01").getFullYear()}`}</p>
                        <h2 className="text-3xl font-bold tracking-tight">{formatCurrency(totalBalance)}</h2>
                        <p className="text-xs text-gray-400 mt-1">Số dư trong kỳ</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-6 relative z-10">
                        <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                            <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold mb-1 uppercase"><TrendingUp size={12} /> Thu nhập</div>
                            <p className="font-semibold text-sm">{formatCurrency(totalIncome)}</p>
                        </div>
                        <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                            <div className="flex items-center gap-1 text-red-400 text-xs font-bold mb-1 uppercase"><TrendingDown size={12} /> Chi tiêu</div>
                            <p className="font-semibold text-sm">{formatCurrency(totalExpense)}</p>
                        </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 order-2 lg:order-1 space-y-6">
                    <RecentTransactions 
                        transactions={filteredTransactions} 
                        onDelete={deleteTransaction} 
                        onEdit={(t) => { setEditingTransaction(t); setIsModalOpen(true); }} 
                        onViewAll={() => navigateTo('transactions')}
                        isPrivacyMode={isPrivacyMode}
                    />
                    {/* Cashflow Forecast (New) */}
                    <CashflowForecast 
                        transactions={filteredTransactions} 
                        recurringBills={recurringBills} 
                        budget={budget} 
                        isPrivacyMode={isPrivacyMode}
                    />
                  </div>
                  <div className="lg:col-span-5 space-y-6 order-1 lg:order-2">
                    {/* Upcoming Bills Widget */}
                    <UpcomingBillsWidget 
                        bills={recurringBills} 
                        transactions={transactions}
                        onOpenBill={(bill) => setSelectedBill(bill)}
                        isPrivacyMode={isPrivacyMode}
                    />

                    {/* Daily Savings Widget */}
                    <DailySavingsWidget 
                        goals={savingsGoals} 
                        onOpenGoal={(goal) => setSelectedDailyGoal(goal)}
                        isPrivacyMode={isPrivacyMode}
                    />
                    
                    {/* JARS System Widget - Placed above Analysis Chart */}
                    <JarsWidget 
                        transactions={filteredTransactions}
                        monthlyIncome={parseFloat(monthlyIncome) || 0}
                        currentMonth={currentMonth}
                        isPrivacyMode={isPrivacyMode}
                    />

                    <StatsChart 
                        transactions={filteredTransactions} 
                        allTransactions={transactions} 
                        currentMonth={currentMonth}
                        budget={budget}
                        isPrivacyMode={isPrivacyMode} 
                    />
                  </div>
                </div>
            </>
        )}

        {currentView === 'transactions' && (
            <div className="max-w-4xl mx-auto">
                 <div className="flex items-center gap-2 mb-6"><button onClick={() => navigateTo('dashboard')} className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"><ChevronLeft size={20} /></button><h2 className="text-2xl font-bold text-gray-800">Sổ Giao Dịch</h2></div>
                 <TransactionBook transactions={transactions} onDelete={deleteTransaction} onEdit={(t) => { setEditingTransaction(t); setIsModalOpen(true); }} />
            </div>
        )}
        {currentView === 'report' && <div className="max-w-4xl mx-auto"><div className="flex items-center gap-2 mb-6"><button onClick={() => navigateTo('dashboard')} className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"><ChevronLeft size={20} /></button><h2 className="text-2xl font-bold text-gray-800">Báo Cáo</h2></div><TrendReport transactions={transactions} /></div>}
        
        {/* WALLETS & HARVEST */}
        {currentView === 'wallets' && (
            <div className="max-w-5xl mx-auto">
                 <div className="flex items-center gap-2 mb-6"><button onClick={() => navigateTo('dashboard')} className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"><ChevronLeft size={20} /></button><h2 className="text-2xl font-bold text-gray-800">Tài Khoản</h2></div>
                 <WalletManager 
                    wallets={wallets} 
                    transactions={transactions} 
                    onAddWallet={addWallet} 
                    onUpdateWallet={updateWallet} 
                    onDeleteWallet={deleteWallet} 
                    onAddTransaction={addTransaction} 
                    isPrivacyMode={isPrivacyMode}
                />
            </div>
        )}
        {currentView === 'harvest' && (
            <div className="max-w-5xl mx-auto">
                 <div className="flex items-center gap-2 mb-6"><button onClick={() => navigateTo('dashboard')} className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"><ChevronLeft size={20} /></button><h2 className="text-2xl font-bold text-gray-800">Phân Tích Gieo & Gặt</h2></div>
                 <HarvestSowingReport 
                    transactions={transactions} 
                    onAllocatedSavings={(amt) => { addSavingsGoal({ name: 'Tiết kiệm từ lợi nhuận', targetAmount: amt * 10, currentAmount: amt, deadline: '', color: 'bg-blue-500', icon: 'PiggyBank' }); showNotification('Đã tạo mục tiêu tiết kiệm mới từ lợi nhuận'); }}
                    onAllocatedInvestment={(amt) => { addAsset({ name: 'Tái đầu tư lợi nhuận', type: AssetType.FUND, value: amt, initialValue: amt, note: 'Trích từ lợi nhuận tháng' }); showNotification('Đã thêm vào danh mục đầu tư'); }}
                 />
            </div>
        )}

        {currentView === 'business' && (
            <div className="max-w-5xl mx-auto">
                 <div className="flex items-center gap-2 mb-6"><button onClick={() => navigateTo('dashboard')} className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"><ChevronLeft size={20} /></button><h2 className="text-2xl font-bold text-gray-800">Quản Lý Kinh Doanh</h2></div>
                 <BusinessManager 
                    transactions={transactions}
                    onAddTransaction={addTransaction}
                    onEditTransaction={(t) => { setEditingTransaction(t); setIsModalOpen(true); }}
                    onDeleteTransaction={deleteTransaction}
                    isPrivacyMode={isPrivacyMode}
                 />
            </div>
        )}

        {currentView === 'budget' && (
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2 mb-6">
                    <button onClick={() => navigateTo('dashboard')} className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"><ChevronLeft size={20} /></button>
                    <h2 className="text-2xl font-bold text-gray-800">Lập Kế Hoạch</h2>
                </div>
                <BudgetPlanner 
                    transactions={transactions} 
                    categoryBudgets={categoryBudgets} 
                    onUpdateBudget={handleUpdateCategoryBudget} 
                    currentMonth={currentMonth}
                    monthlyIncome={monthlyIncome}
                    onIncomeChange={setMonthlyIncome}
                    customCategories={customCategories}
                />
            </div>
        )}
        {currentView === 'savings' && (
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2 mb-6">
                    <button onClick={() => navigateTo('dashboard')} className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"><ChevronLeft size={20} /></button>
                    <h2 className="text-2xl font-bold text-gray-800">Mục Tiêu Tiết Kiệm</h2>
                </div>
                <SavingsGoals 
                    goals={savingsGoals} 
                    onAddGoal={addSavingsGoal} 
                    onDeleteGoal={deleteSavingsGoal} 
                    onDeposit={(id, amount) => depositSavings(id, amount, wallets[0]?.id)}
                    onWithdraw={withdrawSavings}
                />
            </div>
        )}
        {currentView === 'recurring' && (
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2 mb-6">
                    <button onClick={() => navigateTo('dashboard')} className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"><ChevronLeft size={20} /></button>
                    <h2 className="text-2xl font-bold text-gray-800">Hóa Đơn Định Kỳ</h2>
                </div>
                <RecurringBills 
                    bills={recurringBills} 
                    transactions={transactions} 
                    onAddBill={addRecurringBill} 
                    onDeleteBill={deleteRecurringBill} 
                    onPayBill={payRecurringBill} 
                    onUpdateBill={updateRecurringBill} 
                />
            </div>
        )}
        {currentView === 'investment' && <div className="max-w-5xl mx-auto"><div className="flex items-center gap-2 mb-6"><button onClick={() => navigateTo('dashboard')} className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"><ChevronLeft size={20} /></button><h2 className="text-2xl font-bold text-gray-800">Quản Lý Đầu Tư</h2></div><InvestmentManager assets={assets} onAddAsset={addAsset} onUpdateAsset={updateAsset} onDeleteAsset={deleteAsset} isPrivacyMode={isPrivacyMode} /></div>}
        {currentView === 'debt' && <div className="max-w-4xl mx-auto"><div className="flex items-center gap-2 mb-6"><button onClick={() => navigateTo('dashboard')} className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"><ChevronLeft size={20} /></button><h2 className="text-2xl font-bold text-gray-800">Sổ Nợ</h2></div><DebtManager debts={debts} onAddDebt={addDebt} onDeleteDebt={deleteDebt} onSettleDebt={settleDebt} /></div>}
        {currentView === 'tools' && <div className="max-w-4xl mx-auto"><div className="flex items-center gap-2 mb-6"><button onClick={() => navigateTo('dashboard')} className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"><ChevronLeft size={20} /></button><h2 className="text-2xl font-bold text-gray-800">Tiện ích</h2></div><FinancialTools /></div>}
        
        {currentView === 'settings' && (
             <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2 mb-6">
                    <button onClick={() => navigateTo('dashboard')} className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-800">Cài Đặt</h2>
                 </div>
                 <Settings 
                    onExportCSV={handleExportCSV} 
                    onExportJSON={handleExportJSON}
                    onImportJSON={handleImportJSON} // Pass new handler
                    onResetData={handleResetData}
                    hasPin={!!pin}
                    onSetupPin={() => setShowPinSetup(true)}
                    onRemovePin={handleRemovePin}
                    isPrivacyMode={isPrivacyMode}
                    togglePrivacy={() => setIsPrivacyMode(!isPrivacyMode)}
                    onShowNotification={(msg, type) => showNotification(msg, type)}
                 />
             </div>
        )}
      </main>
      
      {/* Floating Action Button (Add Transaction) */}
      <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-40">
        <button
          onClick={() => setIsModalOpen(true)}
          className="h-16 w-16 bg-primary text-white rounded-full shadow-xl shadow-green-300 flex items-center justify-center hover:scale-105 hover:-translate-y-1 transition-all duration-300 active:scale-95 group"
        >
          <Plus size={32} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }}
        onSave={addTransaction}
        onUpdate={updateTransaction}
        onDelete={deleteTransaction}
        initialData={editingTransaction}
        wallets={wallets}
        categoryBudgets={categoryBudgets} // Passed for smart input
        transactions={filteredTransactions} // Passed for smart input context
        customCategories={customCategories}
        onAddCategory={addCustomCategory}
      />

      <BillDetailModal 
        isOpen={!!selectedBill}
        onClose={() => setSelectedBill(null)}
        bill={selectedBill}
        onPay={payRecurringBill}
        wallets={wallets}
      />
      
      {/* NEW: Quick Savings Deposit Modal */}
      <SavingsQuickDepositModal 
        isOpen={!!selectedDailyGoal}
        onClose={() => setSelectedDailyGoal(null)}
        goal={selectedDailyGoal}
        onDeposit={depositSavings}
        wallets={wallets}
      />

      {/* NEW: Financial Health Modal - Passed filteredTransactions for current month, allTransactions for history avg */}
      <FinancialHealthModal 
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        transactions={filteredTransactions}
        allTransactions={transactions}
        budget={budget}
        assets={assets}
        debts={debts}
        isPrivacyMode={isPrivacyMode}
      />

      <CalendarView 
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        currentMonth={currentMonth}
        onMonthChange={(d) => {
             const date = new Date(currentMonth + "-01");
             date.setMonth(date.getMonth() + d);
             setCurrentMonth(date.toISOString().slice(0, 7));
        }}
        transactions={transactions}
        onDelete={deleteTransaction}
        onEdit={(t) => { setEditingTransaction(t); setIsModalOpen(true); }}
      />

      {isBudgetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3"><Target size={24} /></div>
                    <h3 className="text-xl font-bold text-gray-800">Tổng Ngân Sách Tháng</h3>
                  </div>
                  <div className="relative mb-6">
                    <input type="number" value={tempBudget} onChange={(e) => setTempBudget(e.target.value)} className="w-full border-2 border-gray-200 rounded-2xl p-4 text-2xl font-bold text-center focus:border-primary focus:ring-0 outline-none transition-colors text-gray-800" placeholder="0" autoFocus />
                    <span className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400 font-medium">VND</span>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setIsBudgetModalOpen(false)} className="flex-1 py-3.5 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Hủy bỏ</button>
                      <button onClick={() => { setBudget(parseFloat(tempBudget) || 0); setIsBudgetModalOpen(false); showNotification("Đã cập nhật ngân sách"); }} className="flex-1 py-3.5 text-white font-bold bg-primary rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all">Xác nhận</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
