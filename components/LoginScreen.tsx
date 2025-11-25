import React, { useState } from 'react';
import { Wallet, Mail, Lock, ArrowRight, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface Props {
  onLogin: () => void;
}

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isRegister) {
        // Register Logic
        if (!email || !password || !name) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }
        // Save to local storage simulation
        localStorage.setItem('user_email', email);
        localStorage.setItem('user_password', password);
        localStorage.setItem('user_name', name);
        setSuccess('Đăng ký thành công! Hãy đăng nhập.');
        setTimeout(() => setIsRegister(false), 1500);
    } else {
        // Login Logic
        const savedEmail = localStorage.getItem('user_email') || 'admin@moneylover.ai';
        const savedPass = localStorage.getItem('user_password') || '123456';

        if (email === savedEmail && password === savedPass) {
            // Set session
            localStorage.setItem('is_logged_in', 'true');
            onLogin();
        } else {
            setError('Email hoặc mật khẩu không chính xác');
        }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in">
        
        {/* Left Side (Hero) - Hidden on mobile if desired, or kept as top banner */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-green-600 to-emerald-700 p-8 flex-col justify-between text-white">
             <div>
                 <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm mb-6">
                     <Wallet size={28} />
                 </div>
                 <h1 className="text-3xl font-bold mb-2">MyMoney</h1>
                 <p className="text-green-100 text-sm">Quản lý tài chính thông minh với sự trợ giúp của AI.</p>
             </div>
             <div className="text-xs text-green-200">
                 © 2024 Financial App
             </div>
        </div>

        {/* Right Side (Form) */}
        <div className="w-full md:w-1/2 p-8">
             <div className="md:hidden flex items-center gap-2 mb-8">
                 <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white">
                     <Wallet size={20} />
                 </div>
                 <h1 className="text-xl font-bold text-gray-800">MyMoney</h1>
             </div>

             <h2 className="text-2xl font-bold text-gray-800 mb-1">{isRegister ? 'Tạo tài khoản' : 'Chào mừng trở lại'}</h2>
             <p className="text-sm text-gray-500 mb-6">
                 {isRegister ? 'Bắt đầu hành trình tài chính của bạn' : 'Đăng nhập để tiếp tục quản lý'}
             </p>

             {error && (
                 <div className="mb-4 p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> {error}
                 </div>
             )}
             
             {success && (
                 <div className="mb-4 p-3 bg-green-50 text-green-600 text-xs font-bold rounded-xl flex items-center gap-2">
                     <CheckCircle2 size={14} /> {success}
                 </div>
             )}

             <form onSubmit={handleSubmit} className="space-y-4">
                 {isRegister && (
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Họ tên</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 transition-colors"
                                placeholder="Nguyễn Văn A"
                            />
                        </div>
                     </div>
                 )}

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 transition-colors"
                            placeholder="example@email.com"
                        />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Mật khẩu</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 pl-10 pr-10 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 transition-colors"
                            placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                 </div>

                 <button 
                    type="submit"
                    className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 group"
                 >
                     {isRegister ? 'Đăng Ký Ngay' : 'Đăng Nhập'} 
                     <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                 </button>
             </form>

             <div className="mt-6 text-center">
                 <p className="text-sm text-gray-500">
                     {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'} {' '}
                     <button 
                        onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }}
                        className="font-bold text-green-600 hover:underline"
                     >
                         {isRegister ? 'Đăng nhập' : 'Đăng ký miễn phí'}
                     </button>
                 </p>
                 {!isRegister && (
                     <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                         <p>Tài khoản Demo: <strong>admin@moneylover.ai</strong></p>
                         <p>Mật khẩu: <strong>123456</strong></p>
                     </div>
                 )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;