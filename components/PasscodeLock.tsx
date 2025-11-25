import React, { useState, useEffect } from 'react';
import { Lock, Delete, Unlock } from 'lucide-react';

interface Props {
  savedPin: string;
  onUnlock: () => void;
  onSetPin?: (pin: string) => void; // For setting mode
  mode?: 'UNLOCK' | 'SETUP';
  onCancelSetup?: () => void;
}

const PasscodeLock: React.FC<Props> = ({ savedPin, onUnlock, onSetPin, mode = 'UNLOCK', onCancelSetup }) => {
  const [input, setInput] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const [step, setStep] = useState<'ENTER' | 'CREATE' | 'CONFIRM'>('ENTER');
  const [error, setError] = useState('');

  useEffect(() => {
      if (mode === 'SETUP') {
          setStep('CREATE');
      } else {
          setStep('ENTER');
      }
      setInput('');
      setConfirmInput('');
      setError('');
  }, [mode]);

  const handleNumClick = (num: string) => {
    setError('');
    if (step === 'CONFIRM') {
        if (confirmInput.length < 4) setConfirmInput(prev => prev + num);
    } else {
        if (input.length < 4) setInput(prev => prev + num);
    }
  };

  const handleDelete = () => {
      setError('');
      if (step === 'CONFIRM') {
          setConfirmInput(prev => prev.slice(0, -1));
      } else {
          setInput(prev => prev.slice(0, -1));
      }
  };

  // Check logic
  useEffect(() => {
      // 1. Unlock Mode
      if (mode === 'UNLOCK' && input.length === 4) {
          if (input === savedPin) {
              onUnlock();
          } else {
              setError('Mã PIN không đúng');
              setTimeout(() => setInput(''), 300);
          }
      }

      // 2. Setup Mode - Step 1: Create
      if (mode === 'SETUP' && step === 'CREATE' && input.length === 4) {
          setTimeout(() => {
              setStep('CONFIRM');
          }, 300);
      }

      // 3. Setup Mode - Step 2: Confirm
      if (mode === 'SETUP' && step === 'CONFIRM' && confirmInput.length === 4) {
          if (input === confirmInput) {
              if (onSetPin) onSetPin(input);
          } else {
              setError('Mã xác nhận không khớp');
              setTimeout(() => {
                  setConfirmInput('');
                  // Optional: reset to create step?
              }, 500);
          }
      }
  }, [input, confirmInput, savedPin, mode, step, onUnlock, onSetPin]);

  const renderDots = (val: string) => (
      <div className="flex gap-4 mb-8 justify-center">
          {[0, 1, 2, 3].map(i => (
              <div key={i} className={`w-4 h-4 rounded-full transition-all ${i < val.length ? 'bg-primary scale-110' : 'bg-gray-200'}`}></div>
          ))}
      </div>
  );

  const getTitle = () => {
      if (mode === 'UNLOCK') return 'Nhập mã PIN';
      if (step === 'CREATE') return 'Tạo mã PIN mới';
      return 'Xác nhận mã PIN';
  };

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center animate-fade-in">
      <div className="w-full max-w-xs text-center">
        <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-green-50 text-primary rounded-full flex items-center justify-center">
                {mode === 'UNLOCK' ? <Lock size={32} /> : <Unlock size={32} />}
            </div>
        </div>
        
        <h2 className="text-xl font-bold text-gray-800 mb-2">{getTitle()}</h2>
        <p className="text-sm text-red-500 h-5 mb-4 font-medium">{error}</p>

        {renderDots(step === 'CONFIRM' ? confirmInput : input)}

        <div className="grid grid-cols-3 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button 
                    key={num}
                    onClick={() => handleNumClick(num.toString())}
                    className="w-16 h-16 rounded-full bg-gray-50 text-xl font-bold text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors mx-auto outline-none"
                >
                    {num}
                </button>
            ))}
            <div className="w-16 h-16 flex items-center justify-center mx-auto">
                 {mode === 'SETUP' && onCancelSetup && (
                     <button onClick={onCancelSetup} className="text-sm font-bold text-gray-500 hover:text-gray-800">Hủy</button>
                 )}
            </div>
            <button 
                onClick={() => handleNumClick('0')}
                className="w-16 h-16 rounded-full bg-gray-50 text-xl font-bold text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors mx-auto outline-none"
            >
                0
            </button>
            <button 
                onClick={handleDelete}
                className="w-16 h-16 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors mx-auto outline-none"
            >
                <Delete size={24} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default PasscodeLock;
