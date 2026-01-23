
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
      <div className="mt-10 mb-10">
        <h2 className="text-[30px] font-bold tracking-tight text-black">정보 입력</h2>
        <p className="text-[15px] text-gray-500 font-medium mt-1">정확한 정보를 입력해 주세요.</p>
      </div>
      
      <div className="flex-1 space-y-4">
        {/* iOS Grouped Style Section */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100 shadow-none">
          <div className="p-4">
            <label className="block text-[12px] font-bold text-[#007AFF] mb-1 uppercase tracking-wider">학생 이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full py-1 bg-transparent text-[17px] font-medium border-none focus:outline-none placeholder-gray-300"
              placeholder="이름을 입력하세요"
            />
          </div>
          <div className="p-4">
            <InputPhone 
              label="학생 전화번호" 
              value={sPhone.value} 
              onChange={(v, valid) => setSPhone({ value: v, valid })} 
              iosStyle
            />
          </div>
          <div className="p-4">
            <InputPhone 
              label="학부모 전화번호" 
              value={pPhone.value} 
              onChange={(v, valid) => setPPhone({ value: v, valid })} 
              iosStyle
            />
          </div>
        </div>
        
        <p className="text-[12px] text-gray-400 px-2 leading-tight">
          입력하신 정보는 셔틀 탑승 확인 및 긴급 연락 시에만 활용되며 안전하게 보관됩니다.
        </p>
      </div>

      <button
        onClick={handleNext}
        disabled={!isFormValid}
        className={`w-full py-4 font-bold text-[17px] rounded-2xl transition-all ${isFormValid ? 'bg-[#007AFF] text-white active:opacity-80' : 'bg-[#C6C6C8] text-white cursor-not-allowed'}`}
      >
        계속하기
      </button>
    </div>
  );
};

export default InfoScreen;
