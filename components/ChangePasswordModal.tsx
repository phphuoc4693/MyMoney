
import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const ChangePasswordModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const currentStoredPass = localStorage.getItem('user_password') || '123456';

    if (oldPass !== currentStoredPass) {
        setError('Mật khẩu hiện tại không đúng.');
        return;
    }

    if (newPass.length < 6) {
        setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
        return;
    }

    if (newPass !== confirmPass) {
        setError('Mật khẩu xác nhận không khớp.');
        return;
    }

    // Save new password
    localStorage.setItem('user_password', newPass);
    onSuccess('Đổi mật khẩu thành công!');
    
    // Reset and close
    setOldPass('');
    setNewPass('');
    setConfirmPass('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Đổi Mật Khẩu</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
                <div className="p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> {error}
                </div>
            )}

            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mật khẩu hiện tại</label>
                <div className="relative">
                    <input 
                        type={showOld ? "text" : "password"}
                        value={oldPass}
                        onChange={(e) => setOldPass(e.target.value)}
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary pr-10 transition-colors"
                        placeholder="Nhập mật khẩu cũ"
                        autoFocus
                    />
                    <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mật khẩu mới</label>
                <div className="relative">
                    <input 
                        type={showNew ? "text" : "password"}
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary pr-10 transition-colors"
                        placeholder="Ít nhất 6 ký tự"
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Xác nhận mật khẩu mới</label>
                <input 
                    type={showNew ? "text" : "password"}
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary transition-colors"
                    placeholder="Nhập lại mật khẩu mới"
                />
            </div>

            <button 
                type="submit"
                className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 mt-2"
            >
                <CheckCircle2 size={18} /> Lưu Thay Đổi
            </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
