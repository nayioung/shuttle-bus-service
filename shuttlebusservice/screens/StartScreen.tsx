
import React from 'react';
import { UserRole } from '../types';

interface StartScreenProps {
  onSelect: (role: UserRole) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-10 bg-white max-w-[420px] mx-auto w-full border-x border-gray-100">
      <div className="text-center mb-24">
        {/* 앱 명칭 변경: 셔틀 라이브 -> 셔틀 로그 */}
        <h1 className="text-[34px] font-bold mb-2 tracking-tight">셔틀 로그</h1>
        <p className="text-[15px] font-medium text-gray-400">당신의 신분을 선택해주세요</p>
      </div>

      <div className="w-full space-y-4">
        {[
          { label: '학생', role: UserRole.STUDENT, disabled: false },
          { label: '학부모', role: UserRole.PARENT, disabled: false },
          { label: '기사 (준비중)', role: UserRole.DRIVER, disabled: true },
        ].map((item) => (
          <button
            key={item.role}
            onClick={() => !item.disabled && onSelect(item.role)}
            disabled={item.disabled}
            className={`w-full py-5 text-[20px] font-bold rounded-2xl border transition-all 
              ${item.disabled 
                ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' 
                : 'bg-white text-black border-black/10 shadow-sm active:bg-black active:text-white active:scale-[0.98]'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      
      {/* 앱 명칭 변경: Shuttle Live -> Shuttle Log */}
      <p className="mt-20 text-[12px] text-gray-400 font-medium">© 2026 Shuttle Log Service</p>
    </div>
  );
};

export default StartScreen;
