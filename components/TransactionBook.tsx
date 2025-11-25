
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import TransactionList from './TransactionList';
import { Search, Filter, ArrowDownCircle, ArrowUpCircle, Wallet, Calendar, ArrowUpDown, Download, FileDown, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

type SortOption = 'DATE_DESC' | 'DATE_ASC' | 'AMOUNT_DESC' | 'AMOUNT_ASC';

const TransactionBook: React.FC<Props> = ({ transactions, onDelete, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | TransactionType>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  
  // Date Filters (Default to 1st of current month to today, but effectively optional)
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const [sortBy, setSortBy] = useState<SortOption>('DATE_DESC');

  // Filter Logic
  const filteredData = useMemo(() => {
    return transactions.filter(t => {
      // 1. Search Text
      const matchesSearch = 
        t.note.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.amount.toString().includes(searchTerm);

      // 2. Filter Type
      const matchesType = filterType === 'ALL' || t.type === filterType;

      // 3. Filter Category
      const matchesCategory = filterCategory === 'ALL' || t.category === filterCategory;

      // 4. Date Range
      let matchesDate = true;
      const tDate = new Date(t.date).setHours(0,0,0,0);
      if (startDate) {
          matchesDate = matchesDate && tDate >= new Date(startDate).setHours(0,0,0,0);
      }
      if (endDate) {
          matchesDate = matchesDate && tDate <= new Date(endDate).setHours(0,0,0,0);
      }

      return matchesSearch && matchesType && matchesCategory && matchesDate;
    }).sort((a, b) => {
        // Sorting Logic
        switch (sortBy) {
            case 'DATE_DESC': return new Date(b.date).getTime() - new Date(a.date).getTime();
            case 'DATE_ASC': return new Date(a.date).getTime() - new Date(b.date).getTime();
            case 'AMOUNT_DESC': return b.amount - a.amount;
            case 'AMOUNT_ASC': return a.amount - b.amount;
            default: return 0;
        }
    });
  }, [transactions, searchTerm, filterType, filterCategory, startDate, endDate, sortBy]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
      // Group by day for the chart
      const dataMap: Record<string, number> = {};
      // Create a range of dates if filtered, or just use transaction dates
      filteredData.forEach(t => {
          const date = t.date.split('T')[0];
          const val = t.type === TransactionType.INCOME ? t.amount : -t.amount;
          dataMap[date] = (dataMap[date] || 0) + val;
      });
      
      return Object.entries(dataMap)
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredData]);

  // Calculate totals
  const totalIn = filteredData.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
  const totalOut = filteredData.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIn - totalOut;

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const handleExportFiltered = () => {
      const headers = ['Ngày', 'Loại giao dịch', 'Danh mục', 'Số tiền', 'Ghi chú'];
      const rows = filteredData.map(t => {
          const type = t.type === TransactionType.INCOME ? 'Thu nhập' : 'Chi tiêu';
          const note = `"${t.note.replace(/"/g, '""')}"`; // Escape quotes
          const category = `"${t.category.replace(/"/g, '""')}"`;
          
          return [
              t.date.split('T')[0], 
              type, 
              category, 
              t.amount.toString(), 
              note
          ];
      });

      const csvContent = [
          headers.join(','),
          ...rows.map(e => e.join(','))
      ].join('\n');

      // Add BOM for Excel UTF-8 compatibility
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `mymoney_filtered_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Control Panel */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
                <input
                    type="text"
                    placeholder="Tìm kiếm nội dung, số tiền..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            </div>
            
            {/* Sort & Export */}
            <div className="flex gap-2">
                <div className="relative min-w-[160px]">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="w-full pl-9 pr-8 py-3 appearance-none bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-primary"
                    >
                        <option value="DATE_DESC">Mới nhất trước</option>
                        <option value="DATE_ASC">Cũ nhất trước</option>
                        <option value="AMOUNT_DESC">Tiền nhiều nhất</option>
                        <option value="AMOUNT_ASC">Tiền ít nhất</option>
                    </select>
                    <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
                <button 
                    onClick={handleExportFiltered}
                    className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
                    title="Xuất danh sách này"
                >
                    <FileDown size={20} />
                    <span className="hidden md:inline text-sm font-bold">Xuất</span>
                </button>
            </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Type Tabs */}
          <div className="md:col-span-2 flex p-1 bg-gray-100 rounded-xl">
            <button onClick={() => setFilterType('ALL')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${filterType === 'ALL' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>Tất cả</button>
            <button onClick={() => setFilterType(TransactionType.EXPENSE)} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${filterType === TransactionType.EXPENSE ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500'}`}>Chi tiêu</button>
            <button onClick={() => setFilterType(TransactionType.INCOME)} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${filterType === TransactionType.INCOME ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>Thu nhập</button>
          </div>

          {/* Date Start */}
          <div className="relative">
              <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-primary"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <span className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-gray-400 font-medium">Từ ngày</span>
          </div>

          {/* Date End */}
          <div className="relative">
              <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-primary"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <span className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-gray-400 font-medium">Đến ngày</span>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
             <button
                onClick={() => setFilterCategory('ALL')}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${filterCategory === 'ALL' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
             >
                 Tất cả danh mục
             </button>
             {Object.values(Category).map(cat => (
                 <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${filterCategory === cat ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                 >
                     {cat}
                 </button>
             ))}
        </div>
      </div>

      {/* Summary & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 grid grid-cols-3 lg:grid-cols-1 gap-3">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col justify-center">
                    <span className="text-xs text-emerald-600 font-bold uppercase mb-1 flex items-center gap-1"><ArrowDownCircle size={14} /> Thu nhập</span>
                    <span className="text-lg font-bold text-emerald-700">{formatCurrency(totalIn)}</span>
                </div>
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex flex-col justify-center">
                    <span className="text-xs text-red-500 font-bold uppercase mb-1 flex items-center gap-1"><ArrowUpCircle size={14} /> Chi tiêu</span>
                    <span className="text-lg font-bold text-red-600">{formatCurrency(totalOut)}</span>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col justify-center">
                    <span className="text-xs text-blue-500 font-bold uppercase mb-1 flex items-center gap-1"><Wallet size={14} /> Tương quan</span>
                    <span className="text-lg font-bold text-blue-700">{formatCurrency(balance)}</span>
                </div>
          </div>

          <div className="lg:col-span-2 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                  <TrendingUp size={14} /> Dòng tiền theo ngày (Kết quả lọc)
              </h4>
              <div className="flex-1 min-h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                          <defs>
                              <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                          <XAxis dataKey="date" hide />
                          <Tooltip 
                             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: '12px' }}
                             formatter={(val: number) => formatCurrency(val)}
                             labelFormatter={(label) => `Ngày: ${label}`}
                          />
                          <Area type="monotone" dataKey="value" stroke="#3B82F6" fillOpacity={1} fill="url(#colorVal)" strokeWidth={2} />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* Result List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
          <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400 uppercase">Danh sách giao dịch</span>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{filteredData.length} kết quả</span>
          </div>
         <TransactionList 
            transactions={filteredData} 
            onDelete={onDelete} 
            onEdit={onEdit} 
            emptyMessage={
                searchTerm || filterType !== 'ALL' || startDate 
                ? "Không tìm thấy giao dịch nào khớp với bộ lọc." 
                : "Sổ giao dịch trống."
            }
        />
      </div>
    </div>
  );
};

export default TransactionBook;
