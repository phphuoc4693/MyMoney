
import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, RefreshCw, DollarSign, Percent, Activity, AlertTriangle, TrendingDown, ShieldAlert, Clock, ArrowRight, Target, Search, CheckCircle, XCircle, Layers, Sliders, TrendingUp, Scale, Coins, BookOpen, Lightbulb, ShieldCheck } from 'lucide-react';

const FinancialTools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'INTEREST' | 'EXCHANGE' | 'STRESS_TEST' | 'DEAL_ARCHITECT'>('INTEREST');

  // Interest State
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [months, setMonths] = useState('');
  const [interestResult, setInterestResult] = useState<number | null>(null);

  // Exchange State
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  
  // Stress Test State
  const [loanAmount, setLoanAmount] = useState(''); 
  const [loanTermYears, setLoanTermYears] = useState(''); 
  const [rentalIncome, setRentalIncome] = useState('');
  const [emergencyFund, setEmergencyFund] = useState('');
  const [preferentialRate, setPreferentialRate] = useState(''); 
  const [preferentialYears, setPreferentialYears] = useState(''); 
  const [simulatedRate, setSimulatedRate] = useState(12.0);

  // --- DEAL ARCHITECT STATE ---
  const [dealMode, setDealMode] = useState<'INPUT' | 'SIMULATION'>('INPUT');
  
  // Base Inputs
  const [listingPrice, setListingPrice] = useState('');
  const [dealRent, setDealRent] = useState('');
  const [marketCapRate, setMarketCapRate] = useState('4'); // %
  const [personalIncome, setPersonalIncome] = useState('');
  const [oppCost, setOppCost] = useState('6'); // % (Tiết kiệm/Vàng)
  
  // Loan Inputs (Updated for Split Rates)
  const [dealLoanTerm, setDealLoanTerm] = useState('20');
  const [dealLoanRatePref, setDealLoanRatePref] = useState('6.5'); // Ưu đãi
  const [dealLoanTermPref, setDealLoanTermPref] = useState('2'); // Số năm ưu đãi
  const [dealLoanRateFloat, setDealLoanRateFloat] = useState('11.5'); // Thả nổi

  // Simulation Sliders (Initialized in useEffect)
  const [simPrice, setSimPrice] = useState(0);
  const [simLTV, setSimLTV] = useState(70); // % Loan to Value
  const [simExitPrice, setSimExitPrice] = useState(0);

  // Mock rates
  const RATES: Record<string, number> = {
      'USD': 25450,
      'EUR': 27500,
      'JPY': 165,
      'KRW': 18.5,
      'GBP': 32100
  };

  // --- FORMATTING HELPERS ---
  const formatNumber = (val: string) => {
      const clean = val.replace(/\D/g, "");
      return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseNumber = (val: string) => {
      return parseFloat(val.replace(/\./g, "")) || 0;
  };

  const handleFormatInput = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(formatNumber(e.target.value));
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  const formatCompact = (val: number) => {
    if (Math.abs(val) >= 1000000000) return `${(val / 1000000000).toFixed(2)} tỷ`;
    if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(0)} tr`;
    return formatCurrency(val);
  };

  // Init Simulation State when Input changes
  useEffect(() => {
      const price = parseNumber(listingPrice);
      if (price > 0 && simPrice === 0) {
          setSimPrice(price);
          setSimExitPrice(price * 1.15); // Default 15% increase after 3 years
      }
  }, [listingPrice]);

  // --- LOGIC: INTEREST & EXCHANGE ---
  const calculateInterest = () => {
      const p = parseNumber(principal);
      const r = parseFloat(rate);
      const m = parseFloat(months);
      if (p && r && m) {
          setInterestResult(p * (r / 100) * (m / 12));
      }
  };

  // --- LOGIC: STRESS TEST ---
  const stressTestResult = useMemo(() => {
      const P = parseNumber(loanAmount);
      const totalYears = parseFloat(loanTermYears) || 0;
      const income = parseNumber(rentalIncome);
      const fund = parseNumber(emergencyFund);
      const prefRate = parseFloat(preferentialRate) || 0;
      const prefYears = parseFloat(preferentialYears) || 0;
      
      if (P === 0 || totalYears === 0) return null;

      const rPref = prefRate / 100 / 12;
      const nTotalMonths = totalYears * 12;
      
      let paymentPref = rPref > 0 ? P * (rPref * Math.pow(1 + rPref, nTotalMonths)) / (Math.pow(1 + rPref, nTotalMonths) - 1) : P / nTotalMonths;

      const nPrefMonths = Math.min(prefYears * 12, nTotalMonths);
      let balanceAfterPref = rPref > 0 
        ? P * (Math.pow(1 + rPref, nTotalMonths) - Math.pow(1 + rPref, nPrefMonths)) / (Math.pow(1 + rPref, nTotalMonths) - 1)
        : P - (paymentPref * nPrefMonths);

      const nRemainingMonths = nTotalMonths - nPrefMonths;
      const rFloat = simulatedRate / 100 / 12;
      let paymentFloat = 0;
      if (nRemainingMonths > 0) {
          paymentFloat = rFloat > 0 ? balanceAfterPref * (rFloat * Math.pow(1 + rFloat, nRemainingMonths)) / (Math.pow(1 + rFloat, nRemainingMonths) - 1) : balanceAfterPref / nRemainingMonths;
      }

      const netCashflow = income - paymentFloat;
      return {
          paymentPref, paymentFloat, balanceAfterPref, netCashflow,
          isNegative: netCashflow < 0,
          runwayMonths: netCashflow < 0 && Math.abs(netCashflow) > 0 ? fund / Math.abs(netCashflow) : Infinity,
          hasPref: prefYears > 0 && prefYears < totalYears
      };
  }, [loanAmount, loanTermYears, rentalIncome, emergencyFund, preferentialRate, preferentialYears, simulatedRate]);

  // --- LOGIC: THE DEAL ARCHITECT ---
  const dealAnalysis = useMemo(() => {
      const rentMonth = parseNumber(dealRent);
      const capRate = parseFloat(marketCapRate);
      const pIncome = parseNumber(personalIncome);
      const discountRate = parseFloat(oppCost) / 100;
      
      // Split Loan params
      const lRatePref = parseFloat(dealLoanRatePref);
      const lTermPref = parseFloat(dealLoanTermPref);
      const lRateFloat = parseFloat(dealLoanRateFloat);
      const lTotalTerm = parseFloat(dealLoanTerm);

      if (!simPrice || !rentMonth || !capRate) return null;

      // --- LAYER 1: INTRINSIC VALUE ---
      const annualRent = rentMonth * 12;
      const intrinsicValue = annualRent / (capRate / 100);
      const marginOfSafety = intrinsicValue - simPrice;
      const marginPercent = (marginOfSafety / intrinsicValue) * 100;

      // --- LAYER 2: DSCR & LIQUIDITY (SPLIT) ---
      const loanAmount = simPrice * (simLTV / 100);
      const totalMonths = lTotalTerm * 12;
      const prefMonths = lTermPref * 12;

      // 1. PMT Pref
      const rPref = lRatePref / 100 / 12;
      const pmtPref = rPref > 0 
        ? loanAmount * (rPref * Math.pow(1 + rPref, totalMonths)) / (Math.pow(1 + rPref, totalMonths) - 1)
        : loanAmount / totalMonths;

      // Balance after Pref period
      const balanceAfterPref = rPref > 0
        ? loanAmount * (Math.pow(1 + rPref, totalMonths) - Math.pow(1 + rPref, prefMonths)) / (Math.pow(1 + rPref, totalMonths) - 1)
        : loanAmount - (pmtPref * prefMonths);

      // 2. PMT Float
      const remainingMonths = totalMonths - prefMonths;
      const rFloat = lRateFloat / 100 / 12;
      const pmtFloat = (remainingMonths > 0) 
        ? (rFloat > 0 
            ? balanceAfterPref * (rFloat * Math.pow(1 + rFloat, remainingMonths)) / (Math.pow(1 + rFloat, remainingMonths) - 1)
            : balanceAfterPref / remainingMonths)
        : pmtPref;

      const totalIncome = rentMonth + pIncome;
      
      // Use Float PMT for worst-case DSCR check
      const dscr = pmtFloat > 0 ? totalIncome / pmtFloat : 999;
      const dscrPref = pmtPref > 0 ? totalIncome / pmtPref : 999;

      // --- LAYER 3: EFFICIENCY (3 Years Projection) ---
      const downPayment = simPrice - loanAmount;
      const holdingYears = 3;
      const holdingMonths = holdingYears * 12;
      
      // Precise Cashflow Calculation Year by Year
      let currentBalance = loanAmount;
      let totalPaymentsY1 = 0;
      let totalPaymentsY2 = 0;
      let totalPaymentsY3 = 0;

      for(let m=1; m<=holdingMonths; m++) {
          const isPref = m <= prefMonths;
          const currentRate = isPref ? rPref : rFloat;
          // If we just switched to float, we technically need to use the pmtFloat calculated based on balance at switch
          // But for simplicity we use the pmtPref and pmtFloat calculated above
          const monthlyPay = isPref ? pmtPref : pmtFloat;
          
          const interest = currentBalance * currentRate;
          const principal = monthlyPay - interest;
          currentBalance -= principal;

          if (m <= 12) totalPaymentsY1 += monthlyPay;
          else if (m <= 24) totalPaymentsY2 += monthlyPay;
          else totalPaymentsY3 += monthlyPay;
      }

      // Net Cashflows
      const cfY1 = annualRent - totalPaymentsY1;
      const cfY2 = annualRent - totalPaymentsY2;
      const cfY3 = annualRent - totalPaymentsY3;

      // Reversion (Sale)
      const saleProceeds = simExitPrice - currentBalance;
      
      // NPV Calculation
      const npv = -downPayment + 
                  (cfY1 / Math.pow(1 + discountRate, 1)) + 
                  (cfY2 / Math.pow(1 + discountRate, 2)) + 
                  ((cfY3 + saleProceeds) / Math.pow(1 + discountRate, 3));

      // Simple Profit
      const totalProfit = (cfY1 + cfY2 + cfY3) + saleProceeds - downPayment;
      const annualizedReturn = (totalProfit / downPayment) / 3 * 100; 
      const proxyIRR = annualizedReturn; 

      return {
          intrinsicValue, marginOfSafety, marginPercent,
          loanAmount, pmtPref, pmtFloat, dscr, dscrPref,
          downPayment, totalProfit, npv, proxyIRR,
          isDealGood: marginPercent > 0 && dscr > 1.1 && npv > 0,
          hasPref: prefMonths > 0
      };
  }, [simPrice, simLTV, simExitPrice, dealRent, marketCapRate, personalIncome, dealLoanRatePref, dealLoanTermPref, dealLoanRateFloat, dealLoanTerm, oppCost]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
       <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
            <Calculator size={24} />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Tiện ích Tài chính</h2>
            <p className="text-sm text-gray-500">Công cụ tính toán & Giả lập</p>
        </div>
      </div>

      {/* Tools Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <button 
            onClick={() => setActiveTool('INTEREST')}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center sm:block ${activeTool === 'INTEREST' ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
          >
              <Percent size={20} className="text-blue-600 mb-1 sm:mb-2" />
              <span className="font-bold text-gray-800 text-xs sm:text-sm block">Lãi Tiết Kiệm</span>
          </button>
          <button 
            onClick={() => setActiveTool('EXCHANGE')}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center sm:block ${activeTool === 'EXCHANGE' ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
          >
              <RefreshCw size={20} className="text-emerald-600 mb-1 sm:mb-2" />
              <span className="font-bold text-gray-800 text-xs sm:text-sm block">Đổi Ngoại Tệ</span>
          </button>
          <button 
            onClick={() => setActiveTool('STRESS_TEST')}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center sm:block ${activeTool === 'STRESS_TEST' ? 'bg-red-50 border-red-200 ring-1 ring-red-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
          >
              <Activity size={20} className="text-red-600 mb-1 sm:mb-2" />
              <span className="font-bold text-gray-800 text-xs sm:text-sm block">Stress Test</span>
          </button>
          <button 
            onClick={() => setActiveTool('DEAL_ARCHITECT')}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center sm:block ${activeTool === 'DEAL_ARCHITECT' ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
          >
              <Target size={20} className="text-indigo-600 mb-1 sm:mb-2" />
              <span className="font-bold text-gray-800 text-xs sm:text-sm block">Deal Architect</span>
          </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          
          {/* --- EXISTING TOOLS (Hidden logic to keep code concise, assume they exist) --- */}
          {activeTool === 'INTEREST' && (
              <div className="space-y-4 animate-fade-in">
                  <h3 className="font-bold text-gray-800 text-lg mb-4 border-b pb-2">Tính lãi tiết kiệm</h3>
                  {/* ... Interest Logic ... */}
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số tiền gửi (VND)</label>
                      <input type="text" value={principal} onChange={handleFormatInput(setPrincipal)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-blue-500 font-bold text-gray-700" placeholder="100.000.000" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lãi suất (%/năm)</label>
                          <input type="number" value={rate} onChange={e => setRate(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-blue-500" placeholder="6.5" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kỳ hạn (Tháng)</label>
                          <input type="number" value={months} onChange={e => setMonths(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-blue-500" placeholder="12" />
                      </div>
                  </div>
                  <button onClick={calculateInterest} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200">Tính Lãi</button>
                  {interestResult !== null && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                          <p className="text-sm text-blue-600 mb-1">Tiền lãi nhận được:</p>
                          <p className="text-2xl font-bold text-blue-800">{formatCurrency(interestResult)}</p>
                          <p className="text-xs text-gray-500 mt-2">Tổng nhận về: {formatCurrency(parseNumber(principal) + interestResult)}</p>
                      </div>
                  )}
              </div>
          )}

          {activeTool === 'EXCHANGE' && (
              <div className="space-y-4 animate-fade-in">
                  <h3 className="font-bold text-gray-800 text-lg mb-4 border-b pb-2">Quy đổi ngoại tệ</h3>
                  {/* ... Exchange Logic ... */}
                  <div className="flex gap-4">
                      <div className="flex-1">
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số tiền</label>
                           <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-emerald-500" placeholder="100" />
                      </div>
                      <div className="w-32">
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Loại tiền</label>
                           <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-emerald-500">
                                {Object.keys(RATES).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                      </div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col items-center justify-center py-8">
                      <p className="text-gray-500 text-sm mb-2">= Giá trị quy đổi</p>
                      <p className="text-3xl font-bold text-emerald-700">{amount ? formatCurrency(parseFloat(amount) * RATES[currency]) : '0 ₫'}</p>
                      <p className="text-xs text-gray-400 mt-2">Tỷ giá: 1 {currency} ≈ {formatCurrency(RATES[currency])}</p>
                  </div>
              </div>
          )}

          {activeTool === 'STRESS_TEST' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="font-bold text-gray-800 text-lg">Giả lập Lãi suất thả nổi</h3>
                      <div className="bg-red-100 text-red-600 p-1.5 rounded-lg"><ShieldAlert size={20} /></div>
                  </div>
                  <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tổng dư nợ (VND)</label><input type="text" value={loanAmount} onChange={handleFormatInput(setLoanAmount)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-red-500 font-bold text-gray-700" placeholder="2.000.000.000" /></div>
                          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Thời hạn vay (Năm)</label><input type="number" value={loanTermYears} onChange={e => setLoanTermYears(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-red-500" placeholder="20" /></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50 p-3 rounded-xl border border-blue-100">
                          <div><label className="block text-xs font-bold text-blue-600 uppercase mb-1">Lãi ưu đãi (%/năm)</label><input type="number" value={preferentialRate} onChange={e => setPreferentialRate(e.target.value)} className="w-full p-3 bg-white rounded-xl border border-blue-200 outline-none focus:border-blue-500" placeholder="6.0" /></div>
                          <div><label className="block text-xs font-bold text-blue-600 uppercase mb-1">Thời gian ưu đãi (Năm)</label><input type="number" value={preferentialYears} onChange={e => setPreferentialYears(e.target.value)} className="w-full p-3 bg-white rounded-xl border border-blue-200 outline-none focus:border-blue-500" placeholder="2" /></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dòng tiền từ BĐS/Tháng</label><input type="text" value={rentalIncome} onChange={handleFormatInput(setRentalIncome)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-red-500 font-medium" placeholder="15.000.000" /></div>
                          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quỹ dự phòng</label><input type="text" value={emergencyFund} onChange={handleFormatInput(setEmergencyFund)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-red-500 font-medium" placeholder="100.000.000" /></div>
                      </div>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                          <label className="font-bold text-gray-700 flex items-center gap-2"><Activity size={18} className="text-red-500" /> Giả lập lãi thả nổi:</label>
                          <span className="text-2xl font-bold text-red-600 bg-white px-3 py-1 rounded-lg shadow-sm border border-red-100">{simulatedRate.toFixed(1)}%</span>
                      </div>
                      <input type="range" min="0" max="20" step="0.1" value={simulatedRate} onChange={(e) => setSimulatedRate(parseFloat(e.target.value))} className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500" />
                  </div>
                  {stressTestResult && (
                      <div className="space-y-4 animate-fade-in-up">
                          {stressTestResult.hasPref && <div className="flex flex-col sm:flex-row gap-4"><div className="flex-1 bg-blue-50 p-4 rounded-xl border border-blue-100"><p className="text-xs font-bold text-blue-500 uppercase mb-1">Giai đoạn ưu đãi</p><p className="text-xl font-bold text-blue-700">{formatCurrency(stressTestResult.paymentPref)}/tháng</p></div><div className="flex-1 bg-red-50 p-4 rounded-xl border border-red-100"><p className="text-xs font-bold text-red-500 uppercase mb-1">Giai đoạn thả nổi</p><p className="text-xl font-bold text-red-700">{formatCurrency(stressTestResult.paymentFloat)}/tháng</p></div></div>}
                          <div className={`p-4 rounded-xl border-l-4 shadow-sm ${stressTestResult.isNegative ? 'bg-red-50 border-red-500 text-red-800' : 'bg-green-50 border-green-500 text-green-800'}`}>
                              <div className="flex items-start gap-3">
                                  {stressTestResult.isNegative ? <AlertTriangle size={24} className="shrink-0" /> : <DollarSign size={24} className="shrink-0" />}
                                  <div><h4 className="font-bold text-sm uppercase mb-1">{stressTestResult.isNegative ? 'Cảnh báo rủi ro' : 'An toàn'}</h4><p className="text-sm leading-relaxed">{stressTestResult.isNegative ? `Dòng tiền âm ${formatCurrency(Math.abs(stressTestResult.netCashflow))}.` : `Dòng tiền dương ${formatCurrency(stressTestResult.netCashflow)}.`}</p>
                                  {stressTestResult.isNegative && <div className="mt-3 flex items-center gap-2"><Clock size={16} className="text-red-600"/><span className="text-sm font-bold">Chịu được: <span className="text-red-600 text-lg bg-white px-2 rounded border border-red-100">{stressTestResult.runwayMonths.toFixed(1)} tháng</span></span></div>}
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          )}

          {/* --- DEAL ARCHITECT (NEW) --- */}
          {activeTool === 'DEAL_ARCHITECT' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="font-bold text-gray-800 text-lg">The Deal Architect</h3>
                      <div className="flex gap-2">
                          <button 
                            onClick={() => setDealMode('INPUT')} 
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${dealMode === 'INPUT' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:bg-gray-100'}`}
                          >
                              1. Nhập liệu
                          </button>
                          <button 
                            onClick={() => {
                                if(!listingPrice) alert("Vui lòng nhập giá chào bán trước!");
                                else setDealMode('SIMULATION');
                            }} 
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${dealMode === 'SIMULATION' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-100'}`}
                          >
                              2. Mô phỏng
                          </button>
                      </div>
                  </div>

                  {/* MODE 1: INPUT */}
                  {dealMode === 'INPUT' && (
                      <div className="space-y-6 animate-fade-in">
                          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
                              <Layers className="text-indigo-600 shrink-0 mt-1" size={20} />
                              <div className="text-sm text-indigo-800">
                                  <p className="font-bold mb-1">Phễu Thẩm Định Đầu Tư 3 Lớp:</p>
                                  <ul className="list-disc pl-4 space-y-1 opacity-80">
                                      <li><strong>Lớp 1:</strong> Định giá & Biên độ an toàn.</li>
                                      <li><strong>Lớp 2:</strong> Khả năng vay & Trả nợ (Ưu đãi & Thả nổi).</li>
                                      <li><strong>Lớp 3:</strong> Hiệu quả đầu tư (IRR/NPV) so với Vàng/Tiết kiệm.</li>
                                  </ul>
                              </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="space-y-4">
                                  <h4 className="font-bold text-gray-500 text-xs uppercase border-b pb-1">Thông tin tài sản</h4>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Giá chủ nhà chào bán</label>
                                      <input type="text" value={listingPrice} onChange={handleFormatInput(setListingPrice)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 font-bold" placeholder="VD: 5.000.000.000" />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Giá thuê dự kiến (Tháng)</label>
                                      <input type="text" value={dealRent} onChange={handleFormatInput(setDealRent)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-indigo-500" placeholder="VD: 15.000.000" />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Cap Rate thị trường (%)</label>
                                      <input type="number" value={marketCapRate} onChange={e => setMarketCapRate(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-indigo-500" placeholder="4" />
                                  </div>
                              </div>

                              <div className="space-y-4">
                                  <h4 className="font-bold text-gray-500 text-xs uppercase border-b pb-1">Vay & Kỳ vọng</h4>
                                  <div className="grid grid-cols-2 gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
                                      <div>
                                          <label className="block text-xs font-bold text-blue-700 mb-1">Lãi ưu đãi (%)</label>
                                          <input type="number" value={dealLoanRatePref} onChange={e => setDealLoanRatePref(e.target.value)} className="w-full p-2 bg-white rounded-lg border border-blue-200 outline-none focus:border-blue-500" placeholder="6.5" />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-blue-700 mb-1">Trong (Năm)</label>
                                          <input type="number" value={dealLoanTermPref} onChange={e => setDealLoanTermPref(e.target.value)} className="w-full p-2 bg-white rounded-lg border border-blue-200 outline-none focus:border-blue-500" placeholder="2" />
                                      </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                      <div>
                                          <label className="block text-xs font-bold text-gray-700 mb-1">Lãi thả nổi (%)</label>
                                          <input type="number" value={dealLoanRateFloat} onChange={e => setDealLoanRateFloat(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-indigo-500" placeholder="11.5" />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-gray-700 mb-1">Tổng hạn (Năm)</label>
                                          <input type="number" value={dealLoanTerm} onChange={e => setDealLoanTerm(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-indigo-500" placeholder="20" />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Thu nhập cá nhân (để trả nợ)</label>
                                      <input type="text" value={personalIncome} onChange={handleFormatInput(setPersonalIncome)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-indigo-500" placeholder="VD: 30.000.000" />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Chi phí cơ hội / Lãi kỳ vọng (%)</label>
                                      <input type="number" value={oppCost} onChange={e => setOppCost(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-indigo-500" placeholder="6 (Gửi tiết kiệm)" />
                                  </div>
                              </div>
                          </div>
                          
                          <button 
                            onClick={() => setDealMode('SIMULATION')}
                            disabled={!listingPrice}
                            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                              Bắt đầu Mô phỏng <ArrowRight size={20} />
                          </button>
                      </div>
                  )}

                  {/* MODE 2: SIMULATION DASHBOARD */}
                  {dealMode === 'SIMULATION' && dealAnalysis && (
                      <div className="space-y-6 animate-fade-in-up">
                          {/* SLIDERS PANEL */}
                          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-inner">
                              <div className="flex items-center gap-2 mb-4 text-gray-500 text-xs font-bold uppercase">
                                  <Sliders size={14} /> Bảng điều khiển giả lập
                              </div>
                              
                              <div className="space-y-5">
                                  {/* Price Slider */}
                                  <div>
                                      <div className="flex justify-between mb-2">
                                          <label className="text-sm font-bold text-gray-700">Giá Mua Giả Định</label>
                                          <span className="text-indigo-600 font-bold bg-white px-2 py-0.5 rounded border border-indigo-100 shadow-sm">{formatCompact(simPrice)}</span>
                                      </div>
                                      <input 
                                        type="range" 
                                        min={parseNumber(listingPrice) * 0.7} 
                                        max={parseNumber(listingPrice) * 1.1} 
                                        step={10000000}
                                        value={simPrice} 
                                        onChange={e => setSimPrice(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                      />
                                  </div>

                                  {/* Loan Slider */}
                                  <div>
                                      <div className="flex justify-between mb-2">
                                          <label className="text-sm font-bold text-gray-700">Tỷ lệ vay (LTV)</label>
                                          <span className="text-indigo-600 font-bold bg-white px-2 py-0.5 rounded border border-indigo-100 shadow-sm">{simLTV}% ({formatCompact(dealAnalysis.loanAmount)})</span>
                                      </div>
                                      <input 
                                        type="range" min="0" max="80" step="5"
                                        value={simLTV} 
                                        onChange={e => setSimLTV(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                      />
                                  </div>

                                  {/* Exit Price Slider */}
                                  <div>
                                      <div className="flex justify-between mb-2">
                                          <label className="text-sm font-bold text-gray-700">Giá bán sau 3 năm</label>
                                          <span className="text-indigo-600 font-bold bg-white px-2 py-0.5 rounded border border-indigo-100 shadow-sm">{formatCompact(simExitPrice)}</span>
                                      </div>
                                      <input 
                                        type="range" 
                                        min={parseNumber(listingPrice) * 0.8} 
                                        max={parseNumber(listingPrice) * 2} 
                                        step={10000000}
                                        value={simExitPrice} 
                                        onChange={e => setSimExitPrice(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                      />
                                  </div>
                              </div>
                          </div>

                          {/* RESULTS: THE 3 LAYERS */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* LAYER 1 */}
                              <div className={`p-4 rounded-2xl border-2 ${dealAnalysis.marginPercent > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'} transition-colors`}>
                                  <div className="flex items-center gap-2 mb-3">
                                      <div className={`p-1.5 rounded-lg ${dealAnalysis.marginPercent > 0 ? 'bg-emerald-200 text-emerald-700' : 'bg-red-200 text-red-700'}`}>
                                          <Target size={16} />
                                      </div>
                                      <h4 className="font-bold text-sm text-gray-800">1. Định Giá</h4>
                                  </div>
                                  <p className="text-xs text-gray-500 mb-1">Giá trị thực (Intrinsic):</p>
                                  <p className="text-sm font-bold text-gray-800 mb-3">{formatCompact(dealAnalysis.intrinsicValue)}</p>
                                  
                                  <div className="border-t border-gray-200/50 pt-2">
                                      <p className="text-xs text-gray-500">Biên độ an toàn:</p>
                                      <p className={`text-lg font-bold ${dealAnalysis.marginPercent > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                          {dealAnalysis.marginPercent > 0 ? '+' : ''}{dealAnalysis.marginPercent.toFixed(1)}%
                                      </p>
                                  </div>
                              </div>

                              {/* LAYER 2 */}
                              <div className={`p-4 rounded-2xl border-2 ${dealAnalysis.dscr > 1.25 ? 'bg-emerald-50 border-emerald-100' : dealAnalysis.dscr >= 1 ? 'bg-orange-50 border-orange-100' : 'bg-red-50 border-red-100'} transition-colors`}>
                                  <div className="flex items-center gap-2 mb-3">
                                      <div className={`p-1.5 rounded-lg ${dealAnalysis.dscr > 1.25 ? 'bg-emerald-200 text-emerald-700' : 'bg-orange-200 text-orange-700'}`}>
                                          <Scale size={16} />
                                      </div>
                                      <h4 className="font-bold text-sm text-gray-800">2. Thanh Khoản</h4>
                                  </div>
                                  <div className="space-y-1 mb-3">
                                      <div className="flex justify-between text-xs">
                                          <span className="text-gray-500">Ưu đãi:</span>
                                          <span className="font-bold text-blue-600">{formatCurrency(dealAnalysis.pmtPref)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                          <span className="text-gray-500">Thả nổi:</span>
                                          <span className="font-bold text-red-600">{formatCurrency(dealAnalysis.pmtFloat)}</span>
                                      </div>
                                  </div>
                                  
                                  <div className="border-t border-gray-200/50 pt-2">
                                      <p className="text-xs text-gray-500">DSCR (Thả nổi &gt; 1.25):</p>
                                      <p className={`text-lg font-bold ${dealAnalysis.dscr > 1.25 ? 'text-emerald-600' : dealAnalysis.dscr >= 1 ? 'text-orange-600' : 'text-red-600'}`}>
                                          {dealAnalysis.dscr.toFixed(2)}x
                                      </p>
                                  </div>
                              </div>

                              {/* LAYER 3 */}
                              <div className={`p-4 rounded-2xl border-2 ${dealAnalysis.npv > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'} transition-colors`}>
                                  <div className="flex items-center gap-2 mb-3">
                                      <div className={`p-1.5 rounded-lg ${dealAnalysis.npv > 0 ? 'bg-emerald-200 text-emerald-700' : 'bg-red-200 text-red-700'}`}>
                                          <TrendingUp size={16} />
                                      </div>
                                      <h4 className="font-bold text-sm text-gray-800">3. Hiệu Quả</h4>
                                  </div>
                                  <p className="text-xs text-gray-500 mb-1">Lợi nhuận gộp (3 năm):</p>
                                  <p className={`text-sm font-bold ${dealAnalysis.totalProfit > 0 ? 'text-emerald-600' : 'text-red-500'} mb-3`}>
                                      {formatCompact(dealAnalysis.totalProfit)}
                                  </p>
                                  
                                  <div className="border-t border-gray-200/50 pt-2 flex justify-between items-end">
                                      <div>
                                          <p className="text-xs text-gray-500">NPV:</p>
                                          <p className={`font-bold ${dealAnalysis.npv > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCompact(dealAnalysis.npv)}</p>
                                      </div>
                                      <div className="text-right">
                                          <p className="text-xs text-gray-500">IRR:</p>
                                          <p className="text-lg font-bold text-gray-800">{dealAnalysis.proxyIRR.toFixed(1)}%</p>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* VERDICT */}
                          <div className={`p-5 rounded-2xl flex items-start gap-4 ${dealAnalysis.isDealGood ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' : 'bg-white border border-red-100 shadow-sm'}`}>
                              <div className={`p-2 rounded-full shrink-0 ${dealAnalysis.isDealGood ? 'bg-white/20' : 'bg-red-100 text-red-500'}`}>
                                  {dealAnalysis.isDealGood ? <CheckCircle size={32} /> : <XCircle size={32} />}
                              </div>
                              <div>
                                  <h3 className={`text-lg font-bold ${dealAnalysis.isDealGood ? 'text-white' : 'text-gray-800'}`}>
                                      {dealAnalysis.isDealGood ? 'KÈO THƠM! CÓ THỂ CHỐT' : 'RỦI RO CAO! CẦN CÂN NHẮC'}
                                  </h3>
                                  <p className={`text-sm mt-1 ${dealAnalysis.isDealGood ? 'text-emerald-100' : 'text-gray-500'}`}>
                                      {dealAnalysis.isDealGood 
                                        ? `Thương vụ này thỏa mãn cả 3 tiêu chí: Mua rẻ hơn giá trị thực, dòng tiền an toàn trả nợ (kể cả thả nổi), và hiệu quả sinh lời cao hơn ${oppCost}%.`
                                        : `Thương vụ chưa đạt chuẩn. ${dealAnalysis.marginPercent <= 0 ? 'Giá mua còn cao hơn giá trị thực. ' : ''}${dealAnalysis.dscr <= 1.25 ? 'Áp lực trả nợ lớn khi hết ưu đãi. ' : ''}${dealAnalysis.npv <= 0 ? 'Hiệu quả kém hơn gửi tiết kiệm.' : ''}`
                                      }
                                  </p>
                              </div>
                          </div>

                          {/* --- EXPLANATION & PHILOSOPHY SECTION --- */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                              {/* GLOSSARY */}
                              <div className="lg:col-span-2 space-y-4">
                                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                      <BookOpen size={20} className="text-indigo-600"/> Giải thích chỉ số
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                          <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Cap Rate (%)</p>
                                          <p className="text-xs text-gray-600">Tỷ suất vốn hóa = (Tiền thuê/năm) / Giá mua. Dùng để so sánh nhanh lợi suất cho thuê giữa các BĐS.</p>
                                      </div>
                                      <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                          <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Intrinsic Value</p>
                                          <p className="text-xs text-gray-600">Giá trị nội tại. Giá trị thực của tài sản dựa trên dòng tiền nó tạo ra, không phải giá "ảo" thị trường.</p>
                                      </div>
                                      <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                          <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Margin of Safety</p>
                                          <p className="text-xs text-gray-600">Biên độ an toàn. Chênh lệch giữa Giá trị thực và Giá mua. Càng cao càng tốt để bù đắp rủi ro.</p>
                                      </div>
                                      <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                          <p className="text-xs font-bold text-indigo-600 uppercase mb-1">DSCR (Debt Coverage)</p>
                                          <p className="text-xs text-gray-600">Khả năng trả nợ = Thu nhập / Nghĩa vụ nợ. Nếu nhỏ hơn 1.0 nghĩa là bạn đang "lấy mỡ mình rán mình".</p>
                                      </div>
                                      <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                          <p className="text-xs font-bold text-indigo-600 uppercase mb-1">NPV (Net Present Value)</p>
                                          <p className="text-xs text-gray-600">Giá trị hiện tại ròng. Nếu dương nghĩa là đầu tư này sinh lời tốt hơn lãi suất kỳ vọng (Cost of Capital).</p>
                                      </div>
                                  </div>
                              </div>

                              {/* PHILOSOPHY */}
                              <div className="lg:col-span-1 bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex flex-col h-full">
                                  <div className="flex items-center gap-2 mb-3 text-emerald-800 font-bold">
                                      <Lightbulb size={20} /> Góc Triết Lý
                                  </div>
                                  <ul className="space-y-3 text-xs text-emerald-700 flex-1">
                                      <li className="flex items-start gap-2">
                                          <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                                          <span><strong>Quy tắc số 1:</strong> Không bao giờ để mất tiền. (Warren Buffett)</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                          <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                                          <span>Hãy tham lam khi người khác sợ hãi, nhưng chỉ khi có <strong>Biên độ an toàn</strong>.</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                          <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                                          <span>Đừng mua vì hy vọng tăng giá (đầu cơ). Hãy mua vì dòng tiền hiện tại (đầu tư).</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                          <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                                          <span>Lãi suất thả nổi là kẻ thù thầm lặng. Luôn tính toán kịch bản xấu nhất (Stress Test).</span>
                                      </li>
                                  </ul>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          )}
      </div>
    </div>
  );
};

export default FinancialTools;
