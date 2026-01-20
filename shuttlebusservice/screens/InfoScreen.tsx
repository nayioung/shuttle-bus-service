
import React, { useState } from 'react';
import { UserData } from '../types';
import InputPhone from '../components/InputPhone';

interface InfoScreenProps {
  onNext: (data: Partial<UserData>) => void;
}

const InfoScreen: React.FC<InfoScreenProps> = ({ onNext }) => {
  const [name, setName] = useState('');
  const [sPhone, setSPhone] = useState({ value: '010-', valid: false });
  const [pPhone, setPPhone] = useState({ value: '010-', valid: false });

  const isFormValid = name.trim().length > 0 && sPhone.valid && pPhone.valid;

  const handleNext = () => {
    if (!isFormValid) return;
    onNext({
      studentName: name,
      studentPhone: sPhone.value,
      parentPhone: pPhone.value
    });
  };

  return (
    <div className="flex flex-col min-h-screen p-6 bg-[#F2F2F7] max-w-[420px] mx-auto w-full">
      <h2 className="text-[28px] font-bold mb-10 tracking-tight">회원 정보 입력</h2>
      
      <div className="flex-1 space-y-6">
        <div className="ios-card p-4">
          <label className="block text-[13px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">학생 이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 bg-transparent text-[17px] font-medium border-none focus:outline-none"
            placeholder="이름 입력"
          />
        </div>

        <div className="ios-card p-4">
          <InputPhone 
            label="학생 전화번호" 
            value={sPhone.value} 
            onChange={(v, valid) => setSPhone({ value: v, valid })} 
          />
        </div>

        <div className="ios-card p-4">
          <InputPhone 
            label="학부모 전화번호" 
            value={pPhone.value} 
            onChange={(v, valid) => setPPhone({ value: v, valid })} 
          />
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={!isFormValid}
        className={`w-full py-5 font-bold text-[17px] rounded-2xl transition-all ${isFormValid ? 'bg-[#007AFF] text-white shadow-lg active:opacity-80' : 'bg-gray-300 text-white cursor-not-allowed'}`}
      >
        계속하기
      </button>
    </div>
  );
};

export default InfoScreen;
