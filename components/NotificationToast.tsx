import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationData {
  message: string;
  type: NotificationType;
}

interface Props {
  notification: NotificationData | null;
  onClose: () => void;
}

const NotificationToast: React.FC<Props> = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const getStyles = () => {
      switch (notification.type) {
          case 'success':
              return {
                  container: 'bg-white border-green-100',
                  iconBg: 'bg-green-100 text-green-600',
                  titleColor: 'text-green-700',
                  title: 'Thành công',
                  Icon: CheckCircle2
              };
          case 'error':
              return {
                  container: 'bg-white border-red-100',
                  iconBg: 'bg-red-100 text-red-500',
                  titleColor: 'text-red-600',
                  title: 'Lỗi',
                  Icon: AlertCircle
              };
          case 'info':
          default:
               return {
                  container: 'bg-white border-blue-100',
                  iconBg: 'bg-blue-100 text-blue-500',
                  titleColor: 'text-blue-600',
                  title: 'Thông báo',
                  Icon: Info
              };
      }
  }

  const styles = getStyles();
  const IconComponent = styles.Icon;

  return (
    <div className="fixed top-6 right-6 z-[100] animate-fade-in-down">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-gray-800 ${styles.container}`}>
        <div className={`p-1 rounded-full ${styles.iconBg}`}>
          <IconComponent size={18} />
        </div>
        <div>
            <h4 className={`text-sm font-bold ${styles.titleColor}`}>
                {styles.title}
            </h4>
            <p className="text-xs text-gray-600">{notification.message}</p>
        </div>
        <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;