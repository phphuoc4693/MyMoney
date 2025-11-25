
import React, { useState, useMemo, useEffect } from 'react';
import { Asset, AssetType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Plus, TrendingUp, TrendingDown, Briefcase, Coins, Home, Trash2, Edit3, X, PieChart as PieIcon, Layers, Target, ChevronDown, ChevronRight, Calculator, Sparkles, AlertTriangle, Lightbulb, ShieldCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { analyzeInvestmentPortfolio } from '../services/geminiService';

interface Props {
  assets: Asset[];
  onAddAsset: (asset: Omit<Asset, 'id' | 'lastUpdated'>) => void;
  onUpdateAsset: (id: string, asset: Partial<Asset>) => void;
  onDeleteAsset: (id: string) => void;
  isPrivacyMode?: boolean;
}

const ASSET_COLORS: Record<string, string> = {
  [AssetType.CASH]: '#10B981', // Emerald
  [AssetType.SAVINGS]: '#3B82F6', // Blue
  [AssetType.STOCK]: '#8B5CF6', // Purple
  [AssetType.CRYPTO]: '#F59E0B', // Amber
  [AssetType.REAL_ESTATE]: '#EC4899', // Pink
  [AssetType.GOLD]: '#EAB308', // Yellow
  [AssetType.FUND]: '#06B6D4', // Cyan
  [AssetType.DEBT]: '#EF4444', // Red
  [AssetType.OTHER]: '#6B7280', // Gray
};

const ASSET_ICONS: Record<string, any> = {
  [AssetType.CASH]: Briefcase,
  [AssetType.SAVINGS]: Layers,
  [AssetType.STOCK]: TrendingUp,
  [AssetType.CRYPTO]: Coins,
  [AssetType.REAL_ESTATE]: Home,
  [AssetType.GOLD]: Layers, 
  [AssetType.FUND]: TrendingUp,
  [AssetType.DEBT]: TrendingDown,
  [AssetType.OTHER]: Briefcase,
};

// Assets that use Quantity * Unit Price logic
const UNIT_BASED_ASSETS = [AssetType.GOLD, AssetType.STOCK, AssetType.CRYPTO, AssetType.FUND];

type Tab = 'PORTFOLIO' | 'ANALYSIS';

interface AssetGroup {
    assets: Asset[];
    total: number;
    initial: number;
    profit: number;
    roi: number;
}

const InvestmentManager: React.FC<Props> = ({ assets, onAddAsset, onUpdateAsset, onDeleteAsset, isPrivacyMode = false }) => {
  const [activeTab, setActiveTab] = useState<Tab>('PORTFOLIO');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
      [AssetType.STOCK]: true,
      [AssetType.CRYPTO]: true,
      [AssetType.REAL_ESTATE]: true,
      [AssetType.SAVINGS]: true,
      [AssetType.GOLD]: true,
      [AssetType.FUND]: true
  });
  
  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // Form State
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [assetForm, setAssetForm] = useState<{
      name: string, 
      type: AssetType, 
      value: string, 
      initialValue: string,
      quantity: string,
      buyPrice: string,
      currentPrice: string
  }>({
      name: '', type: AssetType.STOCK, value: '', initialValue: '', quantity: '', buyPrice: '', currentPrice: ''
  });

  // Auto-calculate totals when Quantity/Price changes for Unit-based assets
  useEffect(() => {
      if (UNIT_BASED_ASSETS.includes(assetForm.type)) {
          const qty = parseFloat(assetForm.quantity) || 0;
          const buy = parseFloat(assetForm.buyPrice) || 0;
          const curr = parseFloat(assetForm.currentPrice) || 0;

          if (qty > 0) {
              // Only auto-update total values if unit inputs are valid
              // We update state but avoid infinite loop if simple toggle
              setAssetForm(prev => ({
                  ...prev,
                  initialValue: buy > 0 ? (qty * buy).toString() : prev.initialValue,
                  value: curr > 0 ? (qty * curr).toString() : prev.value
              }));
          }
      }
  }, [assetForm.quantity, assetForm.buyPrice, assetForm.currentPrice, assetForm.type]);

  // --- CALCULATIONS ---
  const totalAssets = assets.filter(a => a.type !== AssetType.DEBT).reduce((sum, a) => sum + a.value, 0);
  const totalInvested = assets.filter(a => a.type !== AssetType.DEBT).reduce((sum, a) => sum + a.initialValue, 0);
  const totalLiabilities = assets.filter(a => a.type === AssetType.DEBT).reduce((sum, a) => sum + a.value, 0);
  const netWorth = totalAssets - totalLiabilities;
  
  const totalProfit = totalAssets - totalInvested;
  const roi = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  // Group Assets
  const groupedAssets = useMemo(() => {
      const groups: Record<string, AssetGroup> = {};
      
      assets.forEach(asset => {
          if (!groups[asset.type]) {
              groups[asset.type] = { assets: [], total: 0, initial: 0, profit: 0, roi: 0 };
          }
          groups[asset.type].assets.push(asset);
          groups[asset.type].total += asset.value;
          groups[asset.type].initial += asset.initialValue;
      });

      // Calculate Group ROI
      Object.keys(groups).forEach(type => {
          const g = groups[type];
          g.profit = g.total - g.initial;
          g.roi = g.initial > 0 ? (g.profit / g.initial) * 100 : 0;
      });

      return groups;
  }, [assets]);

  // Top Movers
  const movers = useMemo(() => {
      return [...assets]
        .filter(a => a.type !== AssetType.DEBT && a.initialValue > 0)
        .map(a => ({
            ...a,
            profit: a.value - a.initialValue,
            roi: ((a.value - a.initialValue) / a.initialValue) * 100
        }))
        .sort((a, b) => b.roi - a.roi);
  }, [assets]);

  const topGainers = movers.slice(0, 3);
  const topLosers = movers.filter(m => m.roi < 0).sort((a, b) => a.roi - b.roi).slice(0, 3);

  // Milestone Calculation (Gamification)
  const nextMilestone = useMemo(() => {
      if (netWorth < 100000000) return 100000000; // 100tr
      if (netWorth < 500000000) return 500000000; // 500tr
      if (netWorth < 1000000000) return 1000000000; // 1 Ty
      if (netWorth < 2000000000) return 2000000000; // 2 Ty
      if (netWorth < 5000000000) return 5000000000; // 5 Ty
      if (netWorth < 10000000000) return 10000000000; // 10 Ty
      return Math.ceil(netWorth / 10000000000) * 10000000000 + 10000000000;
  }, [netWorth]);

  const milestonePercent = Math.min(100, Math.max(0, (netWorth / nextMilestone) * 100));

  // --- HELPERS ---
  const toggleGroup = (type: string) => {
      setExpandedGroups(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const formatCurrency = (val: number) => {
      if (isPrivacyMode) return '******';
      if (val >= 1000000000) return `${(val / 1000000000).toFixed(2)} tỷ`;
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)} tr`;
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  }

  const formatCurrencyFull = (val: number) => {
      if (isPrivacyMode) return '******';
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  }

  // --- FORM HANDLERS ---
  const openAddModal = () => {
      setEditingAssetId(null);
      setAssetForm({ 
          name: '', type: AssetType.STOCK, value: '', initialValue: '', quantity: '', buyPrice: '', currentPrice: '' 
      });
      setIsModalOpen(true);
  }

  const openEditModal = (asset: Asset) => {
      setEditingAssetId(asset.id);
      setAssetForm({
          name: asset.name,
          type: asset.type,
          value: asset.value.toString(),
          initialValue: asset.initialValue.toString(),
          quantity: asset.quantity?.toString() || '',
          buyPrice: asset.buyPrice?.toString() || '',
          currentPrice: asset.currentPrice?.toString() || '',
      });
      setIsModalOpen(true);
  }

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const assetData: any = {
          name: assetForm.name,
          type: assetForm.type,
          value: parseFloat(assetForm.value) || 0,
          initialValue: parseFloat(assetForm.initialValue) || parseFloat(assetForm.value) || 0,
          lastUpdated: new Date().toISOString(),
      };

      if (UNIT_BASED_ASSETS.includes(assetForm.type)) {
          assetData.quantity = parseFloat(assetForm.quantity) || 0;
          assetData.buyPrice = parseFloat(assetForm.buyPrice) || 0;
          assetData.currentPrice = parseFloat(assetForm.currentPrice) || 0;
      }

      if (editingAssetId) {
          onUpdateAsset(editingAssetId, assetData);
      } else {
          onAddAsset(assetData);
      }
      
      setIsModalOpen(false);
  };

  const handleAiAnalysis = async () => {
      setIsAnalyzing(true);
      const result = await analyzeInvestmentPortfolio(assets);
      setAiResult(result);
      setIsAnalyzing(false);
  };

  // Chart Data
  const allocationData = useMemo(() => {
      return Object.entries(groupedAssets)
        .filter(([type]) => type !== AssetType.DEBT)
        .map(([type, data]) => ({ name: type, value: (data as AssetGroup).total }))
        .sort((a, b) => b.value - a.value);
  }, [groupedAssets]);

  // Mock Growth Data
  const historyData = useMemo(() => {
    const data = [];
    let current = netWorth;
    for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        data.unshift({
            month: `T${date.getMonth() + 1}`,
            value: i === 0 ? netWorth : current * (1 - (Math.random() * 0.05 * (Math.random() > 0.4 ? 1 : -1)))
        });
        current = data[0].value * 0.98;
    }
    return data;
  }, [netWorth]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
             <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                <Briefcase size={24} />
             </div>
             <div>
                 <h2 className="text-2xl font-bold text-gray-800">Danh Mục Đầu Tư</h2>
                 <p className="text-sm text-gray-500">Kiểm soát tài sản & Nợ</p>
             </div>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl self-end">
             <button 
                onClick={() => setActiveTab('PORTFOLIO')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'PORTFOLIO' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
                 <Layers size={16} /> Danh mục
             </button>
             <button 
                onClick={() => setActiveTab('ANALYSIS')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'ANALYSIS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
                 <PieIcon size={16} /> Phân tích
             </button>
        </div>
      </div>

      {/* Net Worth Card & Milestone */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-gradient-to-r from-gray-900 to-indigo-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <div className="relative z-10">
                  <h3 className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2">Tổng Giá Trị Tài Sản Ròng (Net Worth)</h3>
                  <div className="flex items-end gap-3 mb-6">
                      <h1 className="text-4xl font-bold">{formatCurrencyFull(netWorth)}</h1>
                      {roi !== 0 && (
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold mb-1.5 ${roi >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {roi >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                              {roi.toFixed(1)}%
                          </div>
                      )}
                  </div>

                  {/* Milestone Progress */}
                  <div>
                      <div className="flex justify-between text-xs font-bold mb-2">
                          <span className="text-indigo-300 flex items-center gap-1"><Target size={14}/> Cột mốc tiếp theo</span>
                          <span className="text-white">{formatCurrency(nextMilestone)}</span>
                      </div>
                      <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden border border-white/10">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transition-all duration-1000 relative"
                            style={{ width: `${milestonePercent}%` }}
                          >
                              <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                          </div>
                      </div>
                      <p className="text-[10px] text-indigo-300 mt-2 text-right">Còn {formatCurrency(nextMilestone - netWorth)} để đạt mốc</p>
                  </div>
              </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-3">
              <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-center h-[48%] relative overflow-hidden">
                  <div className="absolute -right-2 -bottom-2 text-emerald-50 opacity-50"><TrendingUp size={60} /></div>
                  <span className="text-xs text-gray-500 font-bold uppercase">Tổng Lợi Nhuận</span>
                  <span className={`text-xl font-bold ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {totalProfit > 0 ? '+' : ''}{formatCurrency(totalProfit)}
                  </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-center h-[48%] relative overflow-hidden">
                  <div className="absolute -right-2 -bottom-2 text-red-50 opacity-50"><TrendingDown size={60} /></div>
                  <span className="text-xs text-gray-500 font-bold uppercase">Tổng Nợ Phải Trả</span>
                  <span className="text-xl font-bold text-red-500">{formatCurrency(totalLiabilities)}</span>
              </div>
          </div>
      </div>

      {/* TAB: PORTFOLIO (Grouped List) */}
      {activeTab === 'PORTFOLIO' && (
          <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                   <h3 className="text-lg font-bold text-gray-800">Chi tiết danh mục</h3>
                   <button 
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md"
                    >
                        <Plus size={18} /> Thêm tài sản
                   </button>
              </div>

              {Object.keys(groupedAssets).length === 0 && (
                   <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400">
                       <Briefcase size={48} className="mx-auto mb-3 opacity-50" />
                       <p>Danh mục trống. Hãy thêm tài sản đầu tiên!</p>
                   </div>
              )}

              {Object.entries(groupedAssets).sort((a, b) => (b[1] as AssetGroup).total - (a[1] as AssetGroup).total).map(([type, groupData]) => {
                  const group = groupData as AssetGroup;
                  const isExpanded = expandedGroups[type];
                  const Icon = ASSET_ICONS[type] || Briefcase;
                  const isDebt = type === AssetType.DEBT;

                  return (
                      <div key={type} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all">
                          {/* Group Header */}
                          <div 
                            className="p-4 bg-gray-50/50 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleGroup(type)}
                          >
                              <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${isDebt ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                      <Icon size={20} />
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-gray-800">{type}</h4>
                                      <p className="text-xs text-gray-500">{group.assets.length} tài sản</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-4">
                                  <div className="text-right hidden sm:block">
                                      <span className={`block font-bold ${isDebt ? 'text-red-500' : 'text-gray-800'}`}>
                                          {formatCurrency(group.total)}
                                      </span>
                                      {!isDebt && (
                                          <span className={`text-xs ${group.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                              {group.profit >= 0 ? '+' : ''}{group.profit > 0 ? formatCurrency(group.profit) : '0đ'} ({group.roi.toFixed(1)}%)
                                          </span>
                                      )}
                                  </div>
                                  {isExpanded ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                              </div>
                          </div>

                          {/* Group Items */}
                          {isExpanded && (
                              <div className="divide-y divide-gray-50">
                                  {group.assets.map(asset => {
                                      const profit = asset.value - asset.initialValue;
                                      const percent = asset.initialValue > 0 ? (profit / asset.initialValue) * 100 : 0;
                                      
                                      return (
                                          <div key={asset.id} className="p-4 flex items-center justify-between hover:bg-gray-50 group/item transition-colors cursor-pointer" onClick={() => openEditModal(asset)}>
                                              <div className="pl-2 border-l-2 border-transparent group-hover/item:border-indigo-500 transition-all">
                                                  <h5 className="font-bold text-gray-700 text-sm">{asset.name}</h5>
                                                  {UNIT_BASED_ASSETS.includes(asset.type) && asset.quantity ? (
                                                       <p className="text-xs text-indigo-500 font-medium flex items-center gap-1">
                                                           <Calculator size={10} />
                                                           {asset.quantity} {asset.type === AssetType.GOLD ? 'chỉ' : 'CP'} • {formatCurrency(asset.value/asset.quantity)}/đơn vị
                                                       </p>
                                                  ) : (
                                                       <p className="text-xs text-gray-400">Vốn: {formatCurrency(asset.initialValue)}</p>
                                                  )}
                                              </div>
                                              <div className="flex items-center gap-4">
                                                   <div className="text-right">
                                                       <p className={`font-bold text-sm ${isDebt ? 'text-red-500' : 'text-gray-800'}`}>
                                                            {formatCurrency(asset.value)}
                                                       </p>
                                                       {!isDebt && (
                                                            <p className={`text-xs font-medium ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                {percent > 0 ? '+' : ''}{percent.toFixed(1)}%
                                                            </p>
                                                       )}
                                                   </div>
                                                   <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                       <button 
                                                          onClick={(e) => { e.stopPropagation(); openEditModal(asset); }}
                                                          className="p-1.5 bg-gray-100 text-indigo-600 rounded hover:bg-indigo-100"
                                                       >
                                                           <Edit3 size={14} />
                                                       </button>
                                                       <button 
                                                          onClick={(e) => { e.stopPropagation(); onDeleteAsset(asset.id); }}
                                                          className="p-1.5 bg-gray-100 text-red-500 rounded hover:bg-red-100"
                                                       >
                                                           <Trash2 size={14} />
                                                       </button>
                                                   </div>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          )}
                      </div>
                  );
              })}
          </div>
      )}

      {/* TAB: ANALYSIS */}
      {activeTab === 'ANALYSIS' && (
          <div className="space-y-6 animate-fade-in">
              
              {/* Top Movers Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
                      <h4 className="text-sm font-bold text-emerald-700 uppercase mb-3 flex items-center gap-2">
                          <TrendingUp size={16} /> Top Gainers
                      </h4>
                      <div className="space-y-2">
                          {topGainers.length > 0 ? topGainers.map(m => (
                              <div key={m.id} className="flex justify-between items-center p-2 bg-emerald-50/50 rounded-lg">
                                  <span className="text-sm font-medium text-gray-700">{m.name}</span>
                                  <span className="text-sm font-bold text-emerald-600">+{m.roi.toFixed(1)}%</span>
                              </div>
                          )) : <p className="text-xs text-gray-400 italic">Chưa có tài sản sinh lời</p>}
                      </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm">
                      <h4 className="text-sm font-bold text-red-700 uppercase mb-3 flex items-center gap-2">
                          <TrendingDown size={16} /> Top Losers
                      </h4>
                      <div className="space-y-2">
                          {topLosers.length > 0 ? topLosers.map(m => (
                              <div key={m.id} className="flex justify-between items-center p-2 bg-red-50/50 rounded-lg">
                                  <span className="text-sm font-medium text-gray-700">{m.name}</span>
                                  <span className="text-sm font-bold text-red-600">{m.roi.toFixed(1)}%</span>
                              </div>
                          )) : <p className="text-xs text-gray-400 italic">Chưa có tài sản thua lỗ</p>}
                      </div>
                  </div>
              </div>

              {/* AI Advisor Banner */}
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                  
                  {!aiResult ? (
                      <div className="flex justify-between items-center relative z-10">
                          <div>
                              <h3 className="text-lg font-bold flex items-center gap-2"><Sparkles size={20} /> AI Wealth Advisor</h3>
                              <p className="text-indigo-100 text-sm mt-1 max-w-md">
                                  Phân tích sức khỏe danh mục đầu tư, cảnh báo rủi ro lạm phát và gợi ý đa dạng hóa tài sản.
                              </p>
                          </div>
                          <button 
                            onClick={handleAiAnalysis}
                            disabled={isAnalyzing}
                            className="px-5 py-2.5 bg-white text-indigo-600 font-bold rounded-xl shadow-md hover:bg-indigo-50 transition-all disabled:opacity-70 flex items-center gap-2"
                          >
                              {isAnalyzing ? (
                                  <><div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> Đang phân tích...</>
                              ) : (
                                  <>Bắt đầu Phân Tích <ChevronRight size={16} /></>
                              )}
                          </button>
                      </div>
                  ) : (
                      <div className="relative z-10">
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles size={20} /> Kết Quả Phân Tích</h3>
                                  <p className="text-indigo-100 text-sm">{aiResult.summary}</p>
                              </div>
                              <div className="text-right">
                                  <span className="block text-xs font-bold uppercase opacity-70">Điểm Đa Dạng Hóa</span>
                                  <span className={`text-3xl font-bold ${aiResult.healthScore >= 80 ? 'text-emerald-300' : aiResult.healthScore >= 50 ? 'text-yellow-300' : 'text-red-300'}`}>
                                      {aiResult.healthScore}/100
                                  </span>
                              </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                  <h4 className="text-xs font-bold uppercase text-yellow-300 mb-2 flex items-center gap-1">
                                      <AlertTriangle size={12} /> Cảnh báo Rủi ro
                                  </h4>
                                  <ul className="space-y-1">
                                      {aiResult.warnings.map((w: string, i: number) => (
                                          <li key={i} className="text-xs flex items-start gap-2">
                                              <span className="mt-1 w-1 h-1 bg-yellow-300 rounded-full shrink-0"></span> {w}
                                          </li>
                                      ))}
                                      {aiResult.warnings.length === 0 && <li className="text-xs opacity-70">Không có cảnh báo rủi ro lớn.</li>}
                                  </ul>
                              </div>
                              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                  <h4 className="text-xs font-bold uppercase text-emerald-300 mb-2 flex items-center gap-1">
                                      <Lightbulb size={12} /> Đề xuất Hành động
                                  </h4>
                                  <ul className="space-y-1">
                                      {aiResult.suggestions.map((s: string, i: number) => (
                                          <li key={i} className="text-xs flex items-start gap-2">
                                              <ShieldCheck size={12} className="shrink-0 mt-0.5 text-emerald-300"/> {s}
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          </div>
                          
                          <button onClick={() => setAiResult(null)} className="mt-4 text-xs text-white/70 hover:text-white underline">
                              Phân tích lại
                          </button>
                      </div>
                  )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Allocation Chart */}
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-2">Cơ cấu tài sản</h3>
                      <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={allocationData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {allocationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={ASSET_COLORS[entry.name] || '#9CA3AF'} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        formatter={(value: number) => formatCurrencyFull(value)} 
                                    />
                                </PieChart>
                          </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center mt-4">
                          {allocationData.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-xs bg-gray-50 px-2 py-1 rounded-md">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ASSET_COLORS[item.name] || '#9CA3AF' }}></div>
                                  <span className="text-gray-600 font-medium">{item.name}</span>
                                  <span className="text-gray-400">({((item.value / totalAssets) * 100).toFixed(1)}%)</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Growth Chart (Mock) */}
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-2">Tăng trưởng (6 tháng)</h3>
                      <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={historyData}>
                                    <defs>
                                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        formatter={(value: number) => formatCurrencyFull(value)}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                      </div>
                      <div className="mt-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-xs text-indigo-800 flex gap-2 items-start">
                           <TrendingUp size={16} className="shrink-0 mt-0.5" />
                           <p>Tài sản của bạn đang có xu hướng tăng trưởng ổn định. Hãy tiếp tục tái đầu tư lợi nhuận để tận dụng lãi kép.</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

       {/* Add/Edit Asset Modal */}
       {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
                      <h3 className="font-bold text-gray-800">{editingAssetId ? 'Chỉnh Sửa Tài Sản' : 'Thêm Tài Sản Mới'}</h3>
                      <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                  </div>
                  
                  <div className="overflow-y-auto p-6">
                      <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên tài sản</label>
                              <input 
                                required
                                value={assetForm.name}
                                onChange={e => setAssetForm({...assetForm, name: e.target.value})}
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="VD: Vàng SJC, VCB Stock..."
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Loại tài sản</label>
                              <div className="relative">
                                  <select 
                                    value={assetForm.type}
                                    onChange={e => setAssetForm({...assetForm, type: e.target.value as AssetType})}
                                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                  >
                                      {Object.values(AssetType).map(t => (
                                          <option key={t} value={t}>{t}</option>
                                      ))}
                                  </select>
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                  </div>
                              </div>
                          </div>

                          {/* Conditional Logic for Unit-based Assets */}
                          {UNIT_BASED_ASSETS.includes(assetForm.type) ? (
                              <div className="space-y-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                  <div className="flex items-center gap-2 text-indigo-700 text-sm font-bold mb-2">
                                      <Calculator size={16} />
                                      Tính theo Số lượng
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                          Số lượng ({assetForm.type === AssetType.GOLD ? 'Chỉ' : 'Đơn vị/CP'})
                                      </label>
                                      <input 
                                        type="number"
                                        required
                                        step="any"
                                        value={assetForm.quantity}
                                        onChange={e => setAssetForm({...assetForm, quantity: e.target.value})}
                                        className="w-full p-3 bg-white rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="VD: 5"
                                      />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giá mua (Đơn vị)</label>
                                          <input 
                                            type="number"
                                            required
                                            value={assetForm.buyPrice}
                                            onChange={e => setAssetForm({...assetForm, buyPrice: e.target.value})}
                                            className="w-full p-3 bg-white rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Lúc mua"
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giá hiện tại (Đơn vị)</label>
                                          <input 
                                            type="number"
                                            required
                                            value={assetForm.currentPrice}
                                            onChange={e => setAssetForm({...assetForm, currentPrice: e.target.value})}
                                            className="w-full p-3 bg-white rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Thị trường"
                                          />
                                      </div>
                                  </div>
                                  <div className="flex justify-between text-xs text-gray-600 pt-2 border-t border-indigo-200">
                                      <span>Tổng vốn: <strong>{formatCurrencyFull(parseFloat(assetForm.initialValue) || 0)}</strong></span>
                                      <span>Tổng hiện tại: <strong>{formatCurrencyFull(parseFloat(assetForm.value) || 0)}</strong></span>
                                  </div>
                              </div>
                          ) : (
                            // Standard Input for other assets (Real Estate, Cash)
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giá trị hiện tại</label>
                                    <input 
                                        type="number"
                                        required
                                        value={assetForm.value}
                                        onChange={e => setAssetForm({...assetForm, value: e.target.value})}
                                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vốn gốc (Để tính lời/lỗ)</label>
                                    <input 
                                        type="number"
                                        value={assetForm.initialValue}
                                        onChange={e => setAssetForm({...assetForm, initialValue: e.target.value})}
                                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Bằng giá trị hiện tại"
                                    />
                                </div>
                            </div>
                          )}

                          <div className="pt-2">
                            <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]">
                                {editingAssetId ? 'Cập Nhật Tài Sản' : 'Lưu Tài Sản Mới'}
                            </button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default InvestmentManager;
