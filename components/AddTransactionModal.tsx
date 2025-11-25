
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Category, TransactionType, Transaction, Wallet } from '../types';
import { X, Camera, Loader2, ScanLine, Image as ImageIcon, Trash2, Mic, MicOff, CreditCard, AlertCircle, Plus, Check } from 'lucide-react';
import { parseReceiptImage, autoCategorize, parseVoiceCommand } from '../services/geminiService';
import { INITIAL_WALLETS, EXPENSE_CATEGORIES_GROUPED, INCOME_CATEGORIES_GROUPED } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (t: Omit<Transaction, 'id'>) => void;
  onUpdate?: (id: string, t: Omit<Transaction, 'id'>) => void;
  onDelete?: (id: string) => void;
  initialData?: Transaction | null;
  wallets?: Wallet[];
  categoryBudgets?: Record<string, number>; // NEW: For smart budget context
  transactions?: Transaction[]; // NEW: For smart budget context
  customCategories?: {name: string, type: TransactionType}[];
  onAddCategory?: (name: string, type: TransactionType) => void;
}

// Simple keyword map for smart categorization
const KEYWORD_MAP: Record<string, string> = {
    'grab': Category.TRANSPORT,
    'be': Category.TRANSPORT,
    'xăng': Category.TRANSPORT,
    'phở': Category.FOOD,
    'cơm': Category.FOOD,
    'cafe': Category.FOOD,
    'coffee': Category.FOOD,
    'starbucks': Category.FOOD,
    'bách hóa': Category.GROCERIES,
    'siêu thị': Category.GROCERIES,
    'shopee': Category.SHOPPING,
    'lazada': Category.SHOPPING,
    'tiktok': Category.SHOPPING,
    'điện': Category.BILLS,
    'nước': Category.BILLS,
    'internet': Category.BILLS,
    'wifi': Category.BILLS,
    'netflix': Category.ENTERTAINMENT,
    'cgv': Category.ENTERTAINMENT,
    'thuốc': Category.HEALTH,
    'khám': Category.HEALTH,
    'học phí': Category.EDUCATION,
    'sách': Category.EDUCATION,
    'lương': Category.SALARY,
    'du lịch': Category.TRAVEL,
    'khách sạn': Category.TRAVEL,
    'son': Category.BEAUTY,
    'spa': Category.BEAUTY,
    'cắt tóc': Category.BEAUTY,
};

const AddTransactionModal: React.FC<Props> = ({ 
    isOpen, onClose, onSave, onUpdate, onDelete, initialData, 
    wallets = INITIAL_WALLETS, 
    categoryBudgets = {}, 
    transactions = [],
    customCategories = [],
    onAddCategory
}) => {
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>(Category.FOOD);
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [walletId, setWalletId] = useState<string>(wallets[0]?.id || '');
  
  const [isScanning, setIsScanning] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // New Category UI State
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Load initial data if editing
  useEffect(() => {
    if (isOpen && initialData) {
      setAmount(initialData.amount.toString());
      setCategory(initialData.category);
      setNote(initialData.note);
      setDate(initialData.date.split('T')[0]);
      setType(initialData.type);
      setWalletId(initialData.walletId || wallets[0]?.id || '');
      setPreviewImage(null);
    } else if (isOpen && !initialData) {
      resetForm();
    }
  }, [isOpen, initialData, wallets]);

  // Smart Categorization on Note Change
  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setNote(val);
      
      // Check for keywords
      const lowerVal = val.toLowerCase();
      for (const [key, cat] of Object.entries(KEYWORD_MAP)) {
          if (lowerVal.includes(key)) {
              setCategory(cat);
              break;
          }
      }
  };

  // Smart Budget Context Logic
  const budgetContext = useMemo(() => {
      if (type === TransactionType.INCOME) return null;
      
      const limit = categoryBudgets[category] || 0;
      if (limit === 0) return null;

      const spent = transactions
        .filter(t => t.category === category && t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const remaining = limit - spent;
      const currentAmount = parseFloat(amount) || 0;
      const finalRemaining = remaining - currentAmount;

      return { limit, spent, remaining, finalRemaining };
  }, [category, amount, categoryBudgets, transactions, type]);

  // Merge Standard Groups with Custom Categories
  const filteredCustomCategories = useMemo(() => {
      return customCategories.filter(c => c.type === type);
  }, [customCategories, type]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const transactionData = {
      amount: parseFloat(amount) || 0,
      category,
      note: note || category,
      date: new Date(date).toISOString(),
      type,
      walletId
    };

    if (initialData && onUpdate) {
      onUpdate(initialData.id, transactionData);
    } else {
      onSave(transactionData);
    }
    
    resetForm();
    onClose();
  };

  const handleDelete = () => {
      if (initialData && onDelete) {
          onDelete(initialData.id);
          onClose();
      }
  }

  const resetForm = () => {
    setAmount('');
    setCategory(Category.FOOD);
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
    setType(TransactionType.EXPENSE);
    setWalletId(wallets[0]?.id || '');
    setPreviewImage(null);
    setIsCreatingCategory(false);
  };

  const handleCreateCategory = () => {
      if (newCatName.trim() && onAddCategory) {
          onAddCategory(newCatName.trim(), type);
          setCategory(newCatName.trim());
          setNewCatName('');
          setIsCreatingCategory(false);
      }
  };

  // Voice Input Handler
  const toggleListening = () => {
      if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
          return;
      }

      // Initialize Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
          alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
          return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = async (event: any) => {
          const transcript = event.results[0][0].transcript;
          setNote(transcript); // Temporary show transcript
          setIsScanning(true); // Show loading spinner
          
          try {
              const data = await parseVoiceCommand(transcript);
              if (data) {
                  if (data.amount) setAmount(data.amount.toString());
                  if (data.category) {
                       const matchedCat = Object.values(Category).find(c => c === data.category) || Category.OTHER;
                       setCategory(matchedCat);
                  }
                  if (data.note) setNote(data.note);
                  if (data.type) setType(data.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE);
              }
          } catch (err) {
              console.error(err);
          } finally {
              setIsScanning(false);
          }
      };

      recognitionRef.current = recognition;
      recognition.start();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result?.toString();
        if (base64String) {
            setPreviewImage(base64String);
            // Remove header for API
            const rawBase64 = base64String.split(',')[1];
            const data = await parseReceiptImage(rawBase64);
            if (data) {
                if (data.amount) setAmount(data.amount.toString());
                if (data.category) {
                    const matchedCat = Object.values(Category).find(c => c === data.category) || Category.OTHER;
                    setCategory(matchedCat);
                }
                if (data.note) setNote(data.note);
                else if (data.merchant) setNote(data.merchant);
                
                if (data.date) {
                    const parsedDate = new Date(data.date);
                    if (!isNaN(parsedDate.getTime())) {
                        setDate(parsedDate.toISOString().split('T')[0]);
                    }
                }
                setType(TransactionType.EXPENSE); 
            }
        }
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setIsScanning(false);
      alert('Không thể đọc hóa đơn. Vui lòng thử lại.');
    }
  };

  const handleAutoCat = async () => {
      if (!note) return;
      const cat = await autoCategorize(note);
      const matchedCat = Object.values(Category).find(c => c.toLowerCase() === cat.toLowerCase());
      if (matchedCat) setCategory(matchedCat);
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-100 flex justify-between items-center text-white ${type === TransactionType.INCOME ? 'bg-primary' : 'bg-red-500'} transition-colors duration-300`}>
          <h2 className="text-lg font-bold">{initialData ? 'Sửa Giao Dịch' : 'Giao Dịch Mới'}</h2>
          <div className="flex items-center gap-2">
            {initialData && (
                <button onClick={handleDelete} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
                    <Trash2 size={20} />
                </button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
                <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar relative">
            {/* AI Scanning Overlay */}
            {isScanning && (
                <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-primary mb-3" size={48} />
                    <p className="font-bold text-gray-600">AI đang xử lý...</p>
                </div>
            )}

          {/* Scan Button / Preview */}
          {!initialData && (
            <div className="mb-6 grid grid-cols-2 gap-3">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="py-3 bg-gray-50 text-gray-600 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:bg-gray-100 hover:border-primary hover:text-primary transition-all group"
              >
                <Camera size={24} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">Quét hóa đơn</span>
              </button>

              <button 
                onClick={toggleListening}
                className={`py-3 rounded-xl border border-dashed flex flex-col items-center justify-center gap-1 transition-all group ${
                    isListening 
                    ? 'bg-red-50 border-red-400 text-red-500 animate-pulse' 
                    : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-blue-500 hover:text-blue-500'
                }`}
              >
                {isListening ? <MicOff size={24} /> : <Mic size={24} className="group-hover:scale-110 transition-transform" />}
                <span className="text-xs font-semibold">{isListening ? 'Đang nghe...' : 'Nói để nhập'}</span>
              </button>
            </div>
          )}
          
          {previewImage && (
                 <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-32 mb-4 flex items-center justify-center group">
                    <img src={previewImage} alt="Receipt" className="w-full h-full object-contain" />
                    <button 
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition-colors"
                    >
                        <X size={16} />
                    </button>
                 </div>
          )}

          <form id="add-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Type Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType(TransactionType.EXPENSE)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${type === TransactionType.EXPENSE ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Chi tiêu
              </button>
              <button
                type="button"
                onClick={() => setType(TransactionType.INCOME)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${type === TransactionType.INCOME ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Thu nhập
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Số tiền</label>
              <div className="relative group">
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className={`w-full text-3xl font-bold border-b-2 outline-none py-2 bg-transparent placeholder-gray-200 transition-colors ${
                      type === TransactionType.INCOME ? 'text-primary border-gray-200 focus:border-primary' : 'text-red-500 border-gray-200 focus:border-red-500'
                  }`}
                />
                <span className="absolute right-0 bottom-3 text-gray-400 font-medium text-lg">VND</span>
              </div>
              
              {/* Smart Budget Context */}
              {budgetContext && (
                  <div className={`mt-2 text-xs flex items-center gap-1 ${budgetContext.finalRemaining < 0 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                      <AlertCircle size={12} />
                      {budgetContext.finalRemaining < 0 
                        ? `Cảnh báo: Sẽ vượt ngân sách ${formatCurrency(Math.abs(budgetContext.finalRemaining))}` 
                        : `Còn lại trong ngân sách: ${formatCurrency(budgetContext.finalRemaining)}`}
                  </div>
              )}
            </div>

            {/* Wallet Selector */}
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Tài khoản / Ví</label>
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <CreditCard size={18} />
                    </div>
                    <select
                        value={walletId}
                        onChange={(e) => setWalletId(e.target.value)}
                        className="w-full p-3.5 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-opacity-50 outline-none appearance-none text-gray-700 font-medium transition-all hover:bg-gray-100"
                        style={{ borderColor: type === TransactionType.INCOME ? 'var(--color-primary)' : 'transparent' }}
                    >
                        {wallets.map((w) => (
                            <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                </div>
            </div>

            {/* Note with Smart Categorization */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Ghi chú</label>
              <div className="relative">
                <input
                  type="text"
                  value={note}
                  onBlur={handleAutoCat}
                  onChange={handleNoteChange}
                  placeholder="Ví dụ: Cà phê Starbucks"
                  className="w-full p-3.5 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-opacity-50 outline-none transition-all"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <ImageIcon size={18} />
                </div>
                <button 
                    type="button" 
                    onClick={handleAutoCat} 
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-primary hover:bg-white rounded-lg transition-all"
                    title="AI Tự động phân loại"
                >
                    <ScanLine size={18} />
                </button>
              </div>
            </div>

            {/* Category Grouped Selector with ADD Button */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Danh mục</label>
              <div className="flex gap-2">
                  <div className="relative flex-1">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-opacity-50 outline-none appearance-none text-gray-700 font-medium transition-all hover:bg-gray-100"
                        style={{ borderColor: type === TransactionType.INCOME ? 'var(--color-primary)' : 'transparent' }}
                      >
                        {/* Standard Categories */}
                        {type === TransactionType.EXPENSE ? (
                            Object.entries(EXPENSE_CATEGORIES_GROUPED).map(([group, cats]) => (
                                <optgroup key={group} label={group}>
                                    {cats.map(c => <option key={c} value={c}>{c}</option>)}
                                </optgroup>
                            ))
                        ) : (
                             Object.entries(INCOME_CATEGORIES_GROUPED).map(([group, cats]) => (
                                <optgroup key={group} label={group}>
                                    {cats.map(c => <option key={c} value={c}>{c}</option>)}
                                </optgroup>
                            ))
                        )}
                        
                        {/* Custom Categories */}
                        {filteredCustomCategories.length > 0 && (
                            <optgroup label="Danh mục tùy chỉnh">
                                {filteredCustomCategories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </optgroup>
                        )}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                    className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                    title="Thêm danh mục mới"
                  >
                      <Plus size={20} />
                  </button>
              </div>

              {/* Create Category Inline Form */}
              {isCreatingCategory && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200 animate-fade-in flex gap-2 items-center">
                      <input 
                         value={newCatName}
                         onChange={(e) => setNewCatName(e.target.value)}
                         className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-primary"
                         placeholder="Tên danh mục mới..."
                         autoFocus
                      />
                      <button 
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={!newCatName.trim()}
                        className="p-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-green-700 transition-colors"
                      >
                          <Check size={18} />
                      </button>
                  </div>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Ngày giao dịch</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-opacity-50 outline-none text-gray-700 font-medium"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button
            type="submit"
            form="add-form"
            className={`w-full py-3.5 font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-white ${
                type === TransactionType.INCOME 
                ? 'bg-primary hover:bg-green-700 shadow-green-200' 
                : 'bg-red-500 hover:bg-red-600 shadow-red-200'
            }`}
          >
            {initialData ? 'Cập Nhật' : 'Lưu Giao Dịch'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;
