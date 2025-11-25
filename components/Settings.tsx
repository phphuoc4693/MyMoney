
import React, { useState, useRef } from 'react';
import { Settings as SettingsIcon, Download, Trash2, Moon, Bell, Shield, Lock, Unlock, User, KeyRound, Upload } from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';

interface Props {
  onExportCSV: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void; // NEW
  onResetData: () => void;
  hasPin: boolean;
  onSetupPin: () => void;
  onRemovePin: () => void;
  isPrivacyMode: boolean;
  togglePrivacy: () => void;
  onShowNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const Settings: React.FC<Props> = ({ 
    onExportCSV, 
    onExportJSON, 
    onImportJSON,
    onResetData, 
    hasPin, 
    onSetupPin, 
    onRemovePin,
    isPrivacyMode,
    togglePrivacy,
    onShowNotification
}) => {
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userName = localStorage.getItem('user_name') || 'Người dùng';
  const userEmail = localStorage.getItem('user_email') || 'admin@moneylover.ai';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (confirm("CẢNH BÁO: Dữ liệu hiện tại sẽ bị ghi đè bởi bản sao lưu này. Bạn có chắc chắn muốn tiếp tục?")) {
              onImportJSON(file);
          }
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-gray-200 text-gray-700 rounded-2xl">
            <SettingsIcon size={24} />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Cài đặt chung</h2>
            <p className="text-sm text-gray-500">Quản lý ứng dụng và bảo mật</p>
        </div>
      </div>

      {/* Account Section */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h3 className="font-bold text-gray-700">Tài khoản</h3>
          </div>
          <div className="p-4 flex items-center justify-between border-b border-gray-100">
             <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                     <User size={24} />
                 </div>
                 <div>
                     <h4 className="font-bold text-gray-800">{userName}</h4>
                     <p className="text-xs text-gray-500">{userEmail}</p>
                 </div>
             </div>
          </div>
          <div className="divide-y divide-gray-100">
              <button 
                onClick={() => setIsChangePassOpen(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                  <div className="flex items-center gap-3 text-gray-700">
                      <KeyRound size={20} />
                      <div>
                          <span className="block font-medium">Đổi mật khẩu</span>
                          <span className="text-xs text-gray-500">Cập nhật mật khẩu đăng nhập</span>
                      </div>
                  </div>
              </button>
          </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h3 className="font-bold text-gray-700">Bảo mật & Riêng tư</h3>
          </div>
          <div className="divide-y divide-gray-100">
               <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 text-gray-700">
                      <Shield size={20} />
                      <div>
                          <span className="block font-medium">Khóa ứng dụng (PIN)</span>
                          <span className="text-xs text-gray-500">{hasPin ? 'Đang bật' : 'Đang tắt'}</span>
                      </div>
                  </div>
                  <button 
                    onClick={hasPin ? onRemovePin : onSetupPin}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${hasPin ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-primary text-white hover:bg-green-700'}`}
                  >
                      {hasPin ? 'Tắt / Xóa PIN' : 'Thiết lập PIN'}
                  </button>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 text-gray-700">
                      {hasPin ? <Lock size={20} /> : <Unlock size={20} />}
                      <div>
                          <span className="block font-medium">Chế độ che số dư</span>
                          <span className="text-xs text-gray-500">Ẩn số tiền khi ở nơi đông người</span>
                      </div>
                  </div>
                  <button 
                    onClick={togglePrivacy}
                    className={`w-11 h-6 rounded-full relative transition-colors ${isPrivacyMode ? 'bg-primary' : 'bg-gray-200'}`}
                  >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${isPrivacyMode ? 'right-0.5' : 'left-0.5'}`}></div>
                  </button>
              </div>
          </div>
      </div>

      {/* General Section */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h3 className="font-bold text-gray-700">Tùy chọn hiển thị</h3>
          </div>
          <div className="divide-y divide-gray-100">
              <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 text-gray-700">
                      <Moon size={20} />
                      <span>Giao diện tối (Dark Mode)</span>
                  </div>
                  <div className="w-11 h-6 bg-gray-200 rounded-full relative cursor-not-allowed opacity-60">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
                  </div>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 text-gray-700">
                      <Bell size={20} />
                      <span>Thông báo nhắc nhở</span>
                  </div>
                  <div className="w-11 h-6 bg-primary rounded-full relative cursor-pointer">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm"></div>
                  </div>
              </div>
          </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h3 className="font-bold text-gray-700">Quản lý dữ liệu</h3>
          </div>
          <div className="divide-y divide-gray-100">
              <button onClick={onExportCSV} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center gap-3 text-gray-700">
                      <Download size={20} className="text-blue-600" />
                      <div>
                          <span className="block font-medium">Xuất ra CSV (Excel)</span>
                          <span className="text-xs text-gray-500">Thích hợp để làm báo cáo</span>
                      </div>
                  </div>
              </button>
              
              <button onClick={onExportJSON} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center gap-3 text-gray-700">
                      <Download size={20} className="text-emerald-600" />
                      <div>
                          <span className="block font-medium">Sao lưu toàn bộ (JSON)</span>
                          <span className="text-xs text-gray-500">Lưu trữ tất cả lịch sử và cài đặt</span>
                      </div>
                  </div>
              </button>

              <button onClick={() => fileInputRef.current?.click()} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center gap-3 text-gray-700">
                      <Upload size={20} className="text-orange-500" />
                      <div>
                          <span className="block font-medium">Khôi phục dữ liệu (Restore)</span>
                          <span className="text-xs text-gray-500">Nhập từ file JSON đã sao lưu</span>
                      </div>
                  </div>
                  <input 
                    type="file" 
                    accept="application/json" 
                    ref={fileInputRef} 
                    className="hidden"
                    onChange={handleFileChange}
                  />
              </button>

              <button onClick={onResetData} className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors text-left group">
                  <div className="flex items-center gap-3 text-red-600">
                      <Trash2 size={20} />
                      <div>
                          <span className="block font-bold">Xóa toàn bộ dữ liệu</span>
                          <span className="text-xs text-red-400 group-hover:text-red-500">Hành động này không thể hoàn tác</span>
                      </div>
                  </div>
              </button>
          </div>
      </div>

      <div className="text-center text-xs text-gray-400 pt-4">
          <p>MyMoney v2.6 (Enterprise Ready)</p>
          <p>Powered by Google Gemini</p>
      </div>

      <ChangePasswordModal 
        isOpen={isChangePassOpen} 
        onClose={() => setIsChangePassOpen(false)}
        onSuccess={(msg) => onShowNotification(msg, 'success')}
      />
    </div>
  );
};

export default Settings;
